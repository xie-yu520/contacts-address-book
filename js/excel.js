/**
 * excel.js —— 转换层
 *
 * 职责：
 *   1. 把联系人数组「拍平」成二维表（一人一行、一类信息一列）
 *   2. 把 Excel / CSV 读取出的二维表还原成联系人数组
 *   3. 基于 SheetJS 完成浏览器端的文件读写与模板生成
 *
 * 约束：本文件不直接操作 DOM；除文件读写外均为纯函数，可在 Node 中测试。
 */
(function (global) {
  'use strict';

  const XLSX = global.XLSX;
  const Store = global.Store;

  /** 固定在前面的四个普通字段的中文表头 */
  const FIXED_HEADERS = ['姓名', '收藏', '公司', '备注'];

  /** 普通字段的表头别名（全部转小写比对） */
  const FIELD_ALIASES = {
    name: ['姓名', '名字', '名称', '联系人', '联系人姓名', 'name', 'fullname', 'full-name'],
    starred: ['收藏', '星标', '常用', '是否收藏', 'favorite', 'favourite', 'starred', 'star'],
    company: ['公司', '单位', '组织', '学校', 'company', 'organization', 'org'],
    note: ['备注', '说明', '描述', 'note', 'remark', 'memo', 'comment']
  };

  /** 联系方式类型的表头别名 */
  const TYPE_ALIASES = {
    phone: ['手机', '手机号', '手机号码', '电话', '电话号码', '联系电话', '联系方式', 'phone', 'mobile', 'tel', 'telephone', 'cell'],
    email: ['邮箱', '邮件', '电子邮箱', '电子邮件', 'email', 'mail', 'e-mail'],
    wechat: ['微信', '微信号', 'wechat', 'weixin', 'wx'],
    qq: ['qq', 'qq号', 'qq号码'],
    address: ['地址', '住址', '通信地址', 'address', 'addr'],
    other: ['其他', '其它', '其他联系方式', '链接', '网址', 'other', 'link', 'url']
  };

  const MULTI_VALUE_SEPARATORS = /[;；、|\n\r]+/;
  const TRUE_WORDS = ['是', '有', 'y', 'yes', 'true', '1', '★', '✓', '√'];

  /* ------------------------------------------------------------------ */
  /* 工具函数                                                            */
  /* ------------------------------------------------------------------ */

  function cellText(value) {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  /** 是否为空行（全部单元格为空） */
  function isEmptyRow(row) {
    return !row || row.every(function (cell) { return cellText(cell) === ''; });
  }

  /** 解析「收藏」列 */
  function parseBoolean(value) {
    const text = cellText(value).toLowerCase();
    if (!text) return false;
    return TRUE_WORDS.indexOf(text) !== -1;
  }

  /**
   * 把一个单元格拆成多个值。
   * 地址列不拆分（地址里本身就有逗号、顿号）。
   */
  function splitValues(raw, type) {
    const text = cellText(raw);
    if (!text) return [];
    if (type === 'address') return [text];
    return text
      .split(MULTI_VALUE_SEPARATORS)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  /** 表头 → 描述对象；无法识别返回 null */
  function parseHeader(raw) {
    const text = cellText(raw).replace(/\s+/g, '').replace(/[:：]/g, '').toLowerCase();
    if (!text) return null;

    const matched = text.match(/^(.*?)(\d+)?$/);
    const base = (matched[1] || '').toLowerCase();
    const index = matched[2] ? Math.max(0, parseInt(matched[2], 10) - 1) : 0;

    const fieldKeys = Object.keys(FIELD_ALIASES);
    for (let i = 0; i < fieldKeys.length; i += 1) {
      if (FIELD_ALIASES[fieldKeys[i]].indexOf(base) !== -1) {
        return { kind: 'field', field: fieldKeys[i], index: index };
      }
    }

    const typeKeys = Object.keys(TYPE_ALIASES);
    for (let i = 0; i < typeKeys.length; i += 1) {
      if (TYPE_ALIASES[typeKeys[i]].indexOf(base) !== -1) {
        return { kind: 'method', type: typeKeys[i], index: index };
      }
    }

    return null;
  }

  /* ------------------------------------------------------------------ */
  /* 导出：联系人 → 二维表                                                */
  /* ------------------------------------------------------------------ */

  /**
   * 计算需要的联系方式列。
   * 某类型最多出现 n 次就展开 n 列（手机1、手机2…），只有一列时不带序号。
   * 手机、邮箱作为基础列始终保留。
   */
  function planColumns(contacts) {
    const max = {};
    Store.TYPE_KEYS.forEach(function (key) { max[key] = 0; });

    contacts.forEach(function (contact) {
      const counter = {};
      contact.methods.forEach(function (method) {
        counter[method.type] = (counter[method.type] || 0) + 1;
      });
      Store.TYPE_KEYS.forEach(function (key) {
        if ((counter[key] || 0) > max[key]) max[key] = counter[key];
      });
    });

    const columns = [];
    Store.TYPE_KEYS.forEach(function (key) {
      let count = max[key];
      if (count === 0 && (key === 'phone' || key === 'email')) count = 1;
      for (let i = 0; i < count; i += 1) {
        const label = count > 1 ? Store.typeLabel(key) + (i + 1) : Store.typeLabel(key);
        columns.push({ type: key, index: i, label: label });
      }
    });
    return columns;
  }

  /**
   * 生成导出用的二维表
   * @param {Array<Object>} contacts
   * @returns {{header: string[], rows: Array<Array<string>>}}
   */
  function buildTable(contacts) {
    const list = Array.isArray(contacts) ? contacts : [];
    const columns = planColumns(list);
    const header = FIXED_HEADERS.concat(columns.map(function (c) { return c.label; }));

    const rows = list.map(function (contact) {
      const bucket = {};
      Store.TYPE_KEYS.forEach(function (key) { bucket[key] = []; });
      contact.methods.forEach(function (method) {
        if (bucket[method.type]) bucket[method.type].push(method.value);
      });

      return [
        contact.name || '',
        contact.starred ? '是' : '否',
        contact.company || '',
        contact.note || ''
      ].concat(columns.map(function (column) {
        return bucket[column.type][column.index] || '';
      }));
    });

    return { header: header, rows: [header].concat(rows) };
  }

  /** 生成工作簿对象（不触发下载，便于测试） */
  function buildWorkbook(contacts) {
    if (!XLSX) throw new Error('Excel 组件未加载');

    const table = buildTable(contacts);
    const sheet = XLSX.utils.aoa_to_sheet(table.rows);
    const methodWidth = 22;

    sheet['!cols'] = table.header.map(function (title, i) {
      if (i === 0) return { wch: 12 };
      if (i === 1) return { wch: 8 };
      if (i === 2) return { wch: 24 };
      if (i === 3) return { wch: 30 };
      return { wch: methodWidth };
    });
    sheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: table.rows.length - 1, c: table.header.length - 1 }
      })
    };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '通讯录');
    return workbook;
  }

  /** 生成默认文件名：通讯录_20261115_2012.xlsx */
  function defaultFileName(prefix) {
    const now = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const stamp = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) +
      '_' + pad(now.getHours()) + pad(now.getMinutes());
    return (prefix || '通讯录') + '_' + stamp + '.xlsx';
  }

  /**
   * 导出并触发浏览器下载
   * @param {Array<Object>} contacts
   * @param {string} [fileName]
   */
  function exportContacts(contacts, fileName) {
    const workbook = buildWorkbook(contacts);
    XLSX.writeFile(workbook, fileName || defaultFileName('通讯录'));
  }

  /* ------------------------------------------------------------------ */
  /* 导入：二维表 → 联系人                                               */
  /* ------------------------------------------------------------------ */

  /**
   * 二维表 → 联系人数组
   * @param {Array<Array>} rows 包含表头的二维数组
   * @returns {{contacts: Array<Object>, skipped: number, total: number}}
   */
  function rowsToContacts(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error('文件内容为空');
    }

    const map = rows[0].map(parseHeader);
    const nameColumn = map.findIndex(function (item) { return item && item.field === 'name'; });
    if (nameColumn === -1) {
      throw new Error('未找到「姓名」列，请使用导出的文件或模板作为表头');
    }

    const columnOf = function (field) {
      return map.findIndex(function (item) { return item && item.field === field; });
    };
    const companyColumn = columnOf('company');
    const noteColumn = columnOf('note');
    const starredColumn = columnOf('starred');

    const contacts = [];
    let skipped = 0;
    let total = 0;

    for (let r = 1; r < rows.length; r += 1) {
      const row = rows[r];
      if (isEmptyRow(row)) continue; // 空行直接忽略，不计入统计

      total += 1;
      const name = cellText(row[nameColumn]);
      const bucket = {};
      Store.TYPE_KEYS.forEach(function (key) { bucket[key] = []; });

      map.forEach(function (desc, columnIndex) {
        if (!desc || desc.kind !== 'method') return;
        splitValues(row[columnIndex], desc.type).forEach(function (value) {
          if (bucket[desc.type].indexOf(value) === -1) bucket[desc.type].push(value);
        });
      });

      const methods = [];
      Store.TYPE_KEYS.forEach(function (key) {
        bucket[key].forEach(function (value) {
          methods.push({ type: key, value: value });
        });
      });

      if (!name && !methods.length) {
        skipped += 1;
        continue;
      }

      contacts.push({
        name: name,
        company: companyColumn >= 0 ? cellText(row[companyColumn]) : '',
        note: noteColumn >= 0 ? cellText(row[noteColumn]) : '',
        starred: starredColumn >= 0 ? parseBoolean(row[starredColumn]) : false,
        methods: methods
      });
    }

    return { contacts: contacts, skipped: skipped, total: total };
  }

  /** 解析工作簿二进制内容 */
  function parseWorkbook(buffer) {
    if (!XLSX) throw new Error('Excel 组件未加载');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('文件中没有工作表');

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false
    });
    return rowsToContacts(rows);
  }

  /**
   * 读取用户选择的文件
   * @param {File} file
   * @returns {Promise<{contacts: Array<Object>, skipped: number, total: number}>}
   */
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }
      if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
        reject(new Error('仅支持 .xlsx / .xls / .csv 格式'));
        return;
      }

      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          resolve(parseWorkbook(event.target.result));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('文件解析失败'));
        }
      };
      reader.onerror = function () { reject(new Error('文件读取失败')); };
      reader.readAsArrayBuffer(file);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 导入模板                                                            */
  /* ------------------------------------------------------------------ */

  /** 生成并下载导入模板（含两行示例） */
  function downloadTemplate() {
    if (!XLSX) throw new Error('Excel 组件未加载');

    const header = ['姓名', '收藏', '公司', '备注', '手机1', '手机2', '邮箱', '微信', 'QQ', '地址', '其他'];
    const samples = [
      ['张三', '是', '福州大学', '示例数据，可直接删除', '13800000000', '0591-22860000', 'zhangsan@fzu.edu.cn', 'zhangsan_wx', '10001', '福建省福州市闽侯县大学城', ''],
      ['李四', '否', '示例公司', '', '13900000000', '', 'lisi@example.com', 'lisi_wx', '', '', '个人主页 https://example.com']
    ];

    const sheet = XLSX.utils.aoa_to_sheet([header].concat(samples));
    sheet['!cols'] = header.map(function (title, i) { return { wch: i === 0 ? 12 : 22 }; });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '导入模板');
    XLSX.writeFile(workbook, '通讯录导入模板.xlsx');
  }

  global.ExcelIO = {
    buildTable: buildTable,
    planColumns: planColumns,
    buildWorkbook: buildWorkbook,
    rowsToContacts: rowsToContacts,
    parseWorkbook: parseWorkbook,
    parseHeader: parseHeader,
    splitValues: splitValues,
    readFile: readFile,
    exportContacts: exportContacts,
    downloadTemplate: downloadTemplate,
    defaultFileName: defaultFileName
  };
})(typeof window !== 'undefined' ? window : globalThis);
