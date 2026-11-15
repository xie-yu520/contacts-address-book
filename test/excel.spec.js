/**
 * excel.spec.js —— Excel 导入导出往返测试
 *
 * 运行：node test/excel.spec.js
 * 依赖：node 原生 vm 模块，无需安装任何依赖
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const FILES = ['vendor/xlsx.full.min.js', 'js/store.js', 'js/excel.js'];

/* ------------------------------------------------------------------ */
/* 搭建一个最小浏览器环境                                              */
/* ------------------------------------------------------------------ */
const sandbox = {
  console: console,
  Date: Date,
  Math: Math,
  JSON: JSON,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  structuredClone: structuredClone
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

FILES.forEach(function (file) {
  const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
});

const { Store, ExcelIO, XLSX } = sandbox;

/* ------------------------------------------------------------------ */
/* 断言工具                                                            */
/* ------------------------------------------------------------------ */
let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  \u2713 ' + name);
  } catch (error) {
    failures.push({ name: name, message: error.message });
    console.log('  \u2717 ' + name + ' -> ' + error.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || '断言失败');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error((message || '值不相等') + '：期望 ' + expected + '，实际 ' + actual);
  }
}

/* ------------------------------------------------------------------ */
/* 测试数据                                                            */
/* ------------------------------------------------------------------ */
const SAMPLE = [
  {
    name: '张伟',
    starred: true,
    company: '华为',
    note: '师兄',
    methods: [
      { type: 'phone', value: '13800138000' },
      { type: 'phone', value: '0755-12345678' },
      { type: 'email', value: 'zhangwei@huawei.com' },
      { type: 'wechat', value: 'zhangwei_hw' }
    ]
  },
  {
    name: '李静',
    starred: false,
    company: '腾讯',
    note: '',
    methods: [
      { type: 'email', value: 'lijing@tencent.com' },
      { type: 'address', value: '深圳市南山区科技园, 3 号楼' }
    ]
  },
  {
    name: '王浩然',
    starred: false,
    company: '',
    note: '',
    methods: [{ type: 'phone', value: '13700137000' }]
  }
].map(function (item) {
  return Store.normalizeContact(item);
});

/* ------------------------------------------------------------------ */
/* 用例                                                                */
/* ------------------------------------------------------------------ */
console.log('\n[1] 导出表结构');

check('固定列在前，联系方式列在后', function () {
  const table = ExcelIO.buildTable(SAMPLE);
  const header = table.header;
  assertEqual(header.slice(0, 4).join(','), '姓名,收藏,公司,备注');
  assert(header.indexOf('手机1') > 3, '应存在「手机1」列');
  assert(header.indexOf('手机2') > 3, '两个手机号时应展开「手机2」列');
  assertEqual(header.indexOf('邮箱') > 3, true);
});

check('一人一行，行数 = 联系人数 + 表头', function () {
  const table = ExcelIO.buildTable(SAMPLE);
  assertEqual(table.rows.length, SAMPLE.length + 1);
  assertEqual(table.rows[1][0], '张伟');
});

check('收藏列导出为「是 / 否」', function () {
  const table = ExcelIO.buildTable(SAMPLE);
  assertEqual(table.rows[1][1], '是');
  assertEqual(table.rows[2][1], '否');
});

check('同一联系人的多个手机号落在不同列', function () {
  const table = ExcelIO.buildTable(SAMPLE);
  const header = table.header;
  const i1 = header.indexOf('手机1');
  const i2 = header.indexOf('手机2');
  assertEqual(table.rows[1][i1], '13800138000');
  assertEqual(table.rows[1][i2], '0755-12345678');
});

check('只有一个值的类型不带序号', function () {
  const table = ExcelIO.buildTable(SAMPLE);
  assert(table.header.indexOf('微信') !== -1, '微信列不应带序号');
  assertEqual(table.header.indexOf('微信1'), -1);
});

console.log('\n[2] 导入解析');

check('表头别名与乱序列可识别', function () {
  const rows = [
    ['Phone', 'Name', '邮箱', '星标'],
    ['13800138000', '张三', 'zhangsan@fzu.edu.cn', 'Y']
  ];
  const result = ExcelIO.rowsToContacts(rows);
  assertEqual(result.contacts.length, 1);
  const contact = result.contacts[0];
  assertEqual(contact.name, '张三');
  assertEqual(contact.starred, true);
  assertEqual(contact.methods.length, 2);
  assertEqual(contact.methods[0].type, 'phone');
});

check('单元格内的多个值按分隔符拆分', function () {
  const rows = [
    ['姓名', '手机', '邮箱'],
    ['李四', '13900000000；13600000000、13500000000', 'a@b.com | c@d.com']
  ];
  const contact = ExcelIO.rowsToContacts(rows).contacts[0];
  const phones = contact.methods.filter(function (m) { return m.type === 'phone'; });
  const emails = contact.methods.filter(function (m) { return m.type === 'email'; });
  assertEqual(phones.length, 3);
  assertEqual(emails.length, 2);
});

check('地址列不拆分（保留逗号与顿号）', function () {
  const rows = [
    ['姓名', '地址'],
    ['王五', '北京市海淀区中关村大街 1 号, 3 号楼']
  ];
  const contact = ExcelIO.rowsToContacts(rows).contacts[0];
  assertEqual(contact.methods.length, 1);
  assertEqual(contact.methods[0].value, '北京市海淀区中关村大街 1 号, 3 号楼');
});

check('空行忽略，无效行计入 skipped', function () {
  const rows = [
    ['姓名', '手机'],
    ['', ''],           // 空行：忽略
    ['', '13800138000'], // 无名但有号码：保留
    ['', '']             // 空行：忽略
  ];
  const result = ExcelIO.rowsToContacts(rows);
  assertEqual(result.contacts.length, 1);
  assertEqual(result.skipped, 0);
});

check('缺少姓名列时报错', function () {
  let message = '';
  try {
    ExcelIO.rowsToContacts([['手机', '邮箱'], ['13800138000', 'a@b.com']]);
  } catch (error) {
    message = error.message;
  }
  assert(message.indexOf('姓名') !== -1, '错误信息应提示缺少姓名列');
});

check('收藏列的多种写法都能识别', function () {
  const rows = [
    ['姓名', '收藏'],
    ['A', '是'],
    ['B', '★'],
    ['C', 'no'],
    ['D', '']
  ];
  const list = ExcelIO.rowsToContacts(rows).contacts;
  assertEqual(list[0].starred, true);
  assertEqual(list[1].starred, true);
  assertEqual(list[2].starred, false);
  assertEqual(list[3].starred, false);
});

console.log('\n[3] 往返一致性（导出 → xlsx 二进制 → 导入）');

check('导出再由导入还原，联系人数量与内容一致', function () {
  const workbook = ExcelIO.buildWorkbook(SAMPLE);
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const parsed = ExcelIO.parseWorkbook(buffer);

  assertEqual(parsed.contacts.length, SAMPLE.length, '联系人数量');
  assertEqual(parsed.skipped, 0, '不应有跳过的行');

  SAMPLE.forEach(function (origin, i) {
    const restored = parsed.contacts[i];
    assertEqual(restored.name, origin.name, '姓名');
    assertEqual(restored.company, origin.company, '公司');
    assertEqual(restored.note, origin.note, '备注');
    assertEqual(restored.starred, origin.starred, origin.name + ' 的收藏状态');

    const sig = function (c) {
      return c.methods.map(function (m) { return m.type + ':' + m.value; }).sort().join('|');
    };
    assertEqual(sig(restored), sig(origin), origin.name + ' 的联系方式');
  });
});

console.log('\n[4] 导入合并策略');

check('同名同资料判为重复并跳过', function () {
  Store.clear();
  Store.mergeImported(SAMPLE.slice(0, 1));
  const report = Store.mergeImported(SAMPLE.slice(0, 1));
  assertEqual(report.added, 0);
  assertEqual(report.skipped, 1);
  assertEqual(Store.count(), 1);
});

check('同名但补充新联系方式时合并为一条', function () {
  Store.clear();
  Store.mergeImported(SAMPLE.slice(0, 1));
  const extra = Store.normalizeContact({
    name: '张伟',
    company: '华为',
    methods: [{ type: 'phone', value: '19900000000' }]
  });
  const report = Store.mergeImported([extra]);
  assertEqual(report.merged, 1);
  assertEqual(Store.count(), 1);
  const contact = Store.all()[0];
  assertEqual(contact.methods.length, 5);
});

check('收藏状态与查询过滤', function () {
  Store.clear();
  Store.mergeImported(SAMPLE);
  const starred = Store.query({ filter: 'starred' });
  assertEqual(starred.length, 1);
  assertEqual(starred[0].name, '张伟');

  const searched = Store.query({ keyword: 'tencent' });
  assertEqual(searched.length, 1);
  assertEqual(searched[0].name, '李静');

  const toggled = Store.toggleStar(searched[0].id);
  assertEqual(toggled, true);
  assertEqual(Store.query({ filter: 'starred' }).length, 2);
});

/* ------------------------------------------------------------------ */
/* 汇总                                                                */
/* ------------------------------------------------------------------ */
console.log('\n----------------------------------------');
console.log('通过 ' + passed + ' 项，失败 ' + failures.length + ' 项');
if (failures.length) {
  failures.forEach(function (f) { console.log('  FAIL: ' + f.name + ' -> ' + f.message); });
  process.exit(1);
}
console.log('全部用例通过 \u2713');
