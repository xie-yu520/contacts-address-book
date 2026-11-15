/**
 * store.js —— 数据层
 *
 * 职责：
 *   1. 定义联系人 / 联系方式的领域模型（含规范化与校验）
 *   2. 提供增删改查、收藏、搜索、统计
 *   3. 负责 localStorage 持久化与导入时的合并策略
 *
 * 约束：本文件不操作 DOM，可被 Node 直接引用做单元测试。
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'addressbook.contacts.v1';

  /** 支持的联系方式类型。key 用于存储，label 用于界面与 Excel 表头 */
  const TYPES = [
    { key: 'phone', label: '手机', short: '手' },
    { key: 'email', label: '邮箱', short: '邮' },
    { key: 'wechat', label: '微信', short: '微' },
    { key: 'qq', label: 'QQ', short: 'Q' },
    { key: 'address', label: '地址', short: '址' },
    { key: 'other', label: '其他', short: '他' }
  ];

  const TYPE_KEYS = TYPES.map(function (t) { return t.key; });
  const TYPE_INDEX = TYPE_KEYS.reduce(function (acc, key, i) {
    acc[key] = i;
    return acc;
  }, {});

  const TYPE_LABEL = TYPES.reduce(function (acc, t) {
    acc[t.key] = t.label;
    return acc;
  }, {});

  const TYPE_SHORT = TYPES.reduce(function (acc, t) {
    acc[t.key] = t.short;
    return acc;
  }, {});

  /** 生成短唯一 id */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function typeLabel(key) {
    return TYPE_LABEL[key] || '其他';
  }

  function typeShort(key) {
    return TYPE_SHORT[key] || '他';
  }

  function isType(key) {
    return Object.prototype.hasOwnProperty.call(TYPE_INDEX, key);
  }

  /** 深拷贝，优先使用结构化克隆 */
  function clone(value) {
    if (typeof global.structuredClone === 'function') {
      return global.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  /** 去掉首尾空白，并把 null / undefined 归一为空串 */
  function str(value) {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  /** 构造一条规范的联系方式 */
  function createMethod(type, value) {
    return {
      id: uid('m'),
      type: isType(type) ? type : 'other',
      value: str(value)
    };
  }

  /** 把任意来源（Excel / localStorage / 草稿）的数据规范成联系人对象 */
  function normalizeContact(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const name = str(raw.name);
    const rawMethods = Array.isArray(raw.methods) ? raw.methods : [];
    const seen = {};
    const methods = [];

    rawMethods.forEach(function (item) {
      if (!item) return;
      const type = isType(item.type) ? item.type : 'other';
      const value = str(item.value);
      if (!value) return;
      const signature = type + ':' + value;
      if (seen[signature]) return; // 同一联系人内不允许重复的联系方式
      seen[signature] = true;
      methods.push({ id: str(item.id) || uid('m'), type: type, value: value });
    });

    // 姓名与联系方式都为空，视为无效数据
    if (!name && !methods.length) return null;

    const timestamp = Number(raw.createdAt) || Date.now();
    return {
      id: str(raw.id) || uid('c'),
      name: name || '(未命名)',
      company: str(raw.company),
      note: str(raw.note),
      starred: raw.starred === true || raw.starred === 'true' || raw.starred === 1,
      methods: methods,
      createdAt: timestamp,
      updatedAt: Number(raw.updatedAt) || timestamp
    };
  }

  /* ------------------------------------------------------------------ */
  /* 持久化                                                              */
  /* ------------------------------------------------------------------ */

  let persistent = true;

  function readStorage() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      persistent = false;
      return null;
    }
  }

  function writeStorage(list) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      persistent = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* 内部状态                                                            */
  /* ------------------------------------------------------------------ */

  let contacts = [];

  function persist() {
    writeStorage(contacts);
  }

  function find(id) {
    return contacts.find(function (c) { return c.id === id; }) || null;
  }

  /** 排序：收藏优先，其次按姓名（中文按拼音序） */
  function sortContacts(list) {
    return list.slice().sort(function (a, b) {
      if (a.starred !== b.starred) return a.starred ? -1 : 1;
      const byName = a.name.localeCompare(b.name, 'zh-Hans-CN');
      if (byName !== 0) return byName;
      return b.updatedAt - a.updatedAt;
    });
  }

  /** 判断联系方式集合是否完全一致（忽略顺序） */
  function methodSignature(methods) {
    return methods
      .map(function (m) { return m.type + ':' + m.value; })
      .sort()
      .join('|');
  }

  /** a 是否已包含 b 的全部联系方式 */
  function containsAll(target, incoming) {
    const owned = {};
    target.methods.forEach(function (m) { owned[m.type + ':' + m.value] = true; });
    return incoming.every(function (m) { return owned[m.type + ':' + m.value] === true; });
  }

  /* ------------------------------------------------------------------ */
  /* 对外 API                                                            */
  /* ------------------------------------------------------------------ */

  const Store = {
    TYPES: TYPES,
    TYPE_KEYS: TYPE_KEYS,

    typeLabel: typeLabel,
    typeShort: typeShort,
    uid: uid,
    clone: clone,
    createMethod: createMethod,
    normalizeContact: normalizeContact,

    /** 是否成功写入 localStorage，用于界面提示 */
    isPersistent: function () { return persistent; },

    /**
     * 读取数据；首次运行时写入示例数据，方便直接体验各项功能
     * @returns {Array<Object>} 联系人列表
     */
    init: function () {
      const stored = readStorage();
      if (stored) {
        contacts = stored
          .map(function (raw) { return normalizeContact(raw); })
          .filter(Boolean);
      } else {
        contacts = Store.seed();
        persist();
      }
      return Store.all();
    },

    /** 首次运行使用的示例数据 */
    seed: function () {
      const now = Date.now();
      const raw = [
        {
          name: '张伟', company: '华为技术有限公司', starred: true,
          note: '实验室师兄，负责嵌入式方向',
          methods: [['phone', '138 0013 8000'], ['email', 'zhangwei@huawei.com'], ['wechat', 'zhangwei_hw']]
        },
        {
          name: '李静', company: '腾讯科技（深圳）', starred: true,
          note: '甲方对接人，工作日下午联系',
          methods: [['phone', '139 0013 9001'], ['email', 'lijing@tencent.com'], ['qq', '283746501']]
        },
        {
          name: '王浩然', company: '福州大学 计算机学院',
          note: '同班同学，一起做课程项目',
          methods: [['phone', '137 0013 7002'], ['wechat', 'wanghr_fzu'], ['email', 'wanghr@fzu.edu.cn']]
        },
        {
          name: '陈思远', company: '阿里巴巴集团', starred: true,
          note: '实习内推联系人',
          methods: [['phone', '136 0013 6003'], ['phone', '0591-2286 6003'], ['email', 'chensy@alibaba-inc.com'], ['address', '浙江省杭州市余杭区文一西路 969 号']]
        },
        {
          name: '刘佳', company: '自由职业',
          methods: [['wechat', 'liujia_design'], ['email', 'liujia.design@qq.com']]
        },
        {
          name: '赵晓萌', company: '中国移动福建分公司',
          note: '家里宽带业务员',
          methods: [['phone', '135 0013 5004'], ['address', '福建省福州市鼓楼区五四路 136 号']]
        }
      ];

      return raw.map(function (item, i) {
        return normalizeContact({
          id: 'seed_' + (i + 1),
          name: item.name,
          company: item.company,
          note: item.note,
          starred: !!item.starred,
          methods: item.methods.map(function (pair) { return createMethod(pair[0], pair[1]); }),
          createdAt: now - (raw.length - i) * 86400000,
          updatedAt: now - (raw.length - i) * 3600000
        });
      });
    },

    /** @returns {Array<Object>} 排好序的完整列表（深拷贝） */
    all: function () {
      return sortContacts(contacts).map(clone);
    },

    get: function (id) {
      const found = find(id);
      return found ? clone(found) : null;
    },

    count: function () {
      return contacts.length;
    },

    /**
     * 按关键字与筛选条件查询
     * @param {{keyword?: string, filter?: 'all'|'starred'}} query
     */
    query: function (query) {
      const keyword = str(query && query.keyword).toLowerCase();
      const filter = (query && query.filter) || 'all';

      const result = contacts.filter(function (c) {
        if (filter === 'starred' && !c.starred) return false;
        if (!keyword) return true;
        const haystack = [c.name, c.company, c.note]
          .concat(c.methods.map(function (m) { return m.value + ' ' + typeLabel(m.type); }))
          .join(' ')
          .toLowerCase();
        return haystack.indexOf(keyword) !== -1;
      });

      return sortContacts(result).map(clone);
    },

    /** 新建联系人，返回创建后的对象 */
    add: function (data) {
      const contact = normalizeContact(
        Object.assign({}, data, { id: uid('c'), createdAt: Date.now(), updatedAt: Date.now() })
      );
      if (!contact) throw new Error('联系人数据不合法');
      contacts.push(contact);
      persist();
      return clone(contact);
    },

    /** 更新联系人（局部字段），返回更新后的对象 */
    update: function (id, patch) {
      const index = contacts.findIndex(function (c) { return c.id === id; });
      if (index === -1) throw new Error('联系人不存在：' + id);

      const next = normalizeContact(
        Object.assign({}, contacts[index], patch, { id: id, updatedAt: Date.now() })
      );
      contacts[index] = next;
      persist();
      return clone(next);
    },

    remove: function (id) {
      const before = contacts.length;
      contacts = contacts.filter(function (c) { return c.id !== id; });
      if (contacts.length !== before) persist();
      return before !== contacts.length;
    },

    /** 切换收藏状态，返回切换后的值 */
    toggleStar: function (id) {
      const target = find(id);
      if (!target) throw new Error('联系人不存在：' + id);
      target.starred = !target.starred;
      target.updatedAt = Date.now();
      persist();
      return target.starred;
    },

    /** 统计信息 */
    stats: function () {
      const starred = contacts.filter(function (c) { return c.starred; }).length;
      const methods = contacts.reduce(function (sum, c) { return sum + c.methods.length; }, 0);
      return { total: contacts.length, starred: starred, methods: methods };
    },

    /**
     * 批量导入：同名且联系方式已全部存在 → 跳过；同名但存在新信息 → 合并；否则新增
     * @param {Array<Object>} incoming 已规范化的联系人数组
     * @returns {{added: number, merged: number, skipped: number}}
     */
    mergeImported: function (incoming) {
      const report = { added: 0, merged: 0, skipped: 0 };

      incoming.forEach(function (item) {
        const normalized = normalizeContact(item);
        if (!normalized) {
          report.skipped += 1;
          return;
        }

        const sameName = contacts.filter(function (c) { return c.name === normalized.name; });

        if (!sameName.length) {
          contacts.push(normalized);
          report.added += 1;
          return;
        }

        const duplicated = sameName.some(function (c) {
          return containsAll(c, normalized.methods) && c.company === normalized.company;
        });
        if (duplicated) {
          report.skipped += 1;
          return;
        }

        const target = sameName[0];
        normalized.methods.forEach(function (method) {
          const exists = target.methods.some(function (m) {
            return m.type === method.type && m.value === method.value;
          });
          if (!exists) {
            target.methods.push(createMethod(method.type, method.value));
          }
        });
        target.company = target.company || normalized.company;
        target.note = target.note || normalized.note;
        target.starred = target.starred || normalized.starred;
        target.updatedAt = Date.now();
        report.merged += 1;
      });

      persist();
      return report;
    },

    /** 清空全部数据（界面提供二次确认） */
    clear: function () {
      contacts = [];
      persist();
    },

    /** 恢复示例数据 */
    resetDemo: function () {
      contacts = Store.seed();
      persist();
      return Store.all();
    }
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
