# 代码规范（Code Style Guide）

本项目为「通讯录 Address Book」（软件工程课程作业）。为保证代码可读、可维护，
所有提交到仓库的代码需遵守以下约定。

## 1. 总体原则

- **KISS**：能用 20 行写清楚的逻辑，不引入框架与构建工具。
- **单一职责**：一个文件只做一件事，一个函数只做一件事。
- **无副作用优先**：数据层（`js/store.js`）、转换层（`js/excel.js`）不直接操作 DOM。
- **可离线运行**：不依赖 CDN，第三方库全部放在 `vendor/` 下随仓库提交。

## 2. 目录与文件命名

| 类型 | 规则 | 示例 |
| --- | --- | --- |
| 目录 | 全小写 | `docs/`, `test/` |
| JS 文件 | 小写单词 | `store.js`, `excel.js` |
| CSS 文件 | 小写单词 | `style.css` |
| 文档 | 中文名或英文小写 | `博客-通讯录.md` |
| 图片 | 小写 + 下划线 | `screen_list.png` |

## 3. JavaScript 规范

### 3.1 语法

- 使用 ES2015+ 语法；统一 `const` / `let`，禁止 `var`。
- 字符串统一使用**单引号**，模板字符串仅用于拼接 HTML 片段。
- 缩进 2 个空格，禁止 Tab；语句末尾加分号。
- 每个文件用 IIFE 包裹并显式挂载到全局，避免变量泄漏：

```js
(function (global) {
  'use strict';
  // ...
  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
```

### 3.2 命名

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| 变量 / 函数 | 小驼峰 | `filteredContacts`、`renderList` |
| 常量 | 全大写下划线 | `STORAGE_KEY`、`TYPE_KEYS` |
| 私有函数 | `_` 前缀或模块内不导出 | `_splitValues` |
| DOM id | 小驼峰 | `id="btnExport"` |
| 事件委托标记 | `data-act="xxx"` | `data-act="toggle-star"` |

### 3.3 函数

- 单个函数不超过 50 行，超出则拆分。
- 参数超过 3 个时改用对象传参。
- 对外函数写 JSDoc，说明参数与返回值。

```js
/**
 * 把联系人数组转换成二维表（供 Excel 导出使用）
 * @param {Array<Object>} contacts 联系人数组
 * @returns {{header: string[], rows: string[][]}}
 */
function buildTable(contacts) { /* ... */ }
```

### 3.4 错误处理

- 用户可感知的错误必须给出中文提示（toast / 弹窗），禁止静默失败。
- `JSON.parse`、`localStorage`、文件读取等易错点必须 `try / catch`。
- 不允许使用 `alert()`、`console.log()` 作为产品级提示。

## 4. HTML 规范

- 使用语义化标签：`header / main / aside / section / ul / button`。
- 缩进 2 空格，属性使用双引号。
- 所有按钮必须有明确文案或 `aria-label`；表单控件必须有 `<label>` 或 `aria-label`。
- 禁止行内事件绑定（`onclick="..."`），统一在 `app.js` 中通过事件委托注册。

## 5. CSS 规范

- 采用「块 + 元素」两段式类名：`.contact-item`、`.ci-name`。
- 禁止行内样式，动态色值通过 CSS 变量注入（如头像配色）。
- 颜色、圆角、阴影统一使用 `:root` 上的设计变量，禁止散落魔法值。
- 选择器嵌套不超过 3 层。

```css
:root {
  --color-primary: #3b6ef6;
  --radius-md: 10px;
}
```

## 6. Git 规范

采用 Conventional Commits：

```
<type>(<scope>): <中文简述>
```

| type | 含义 |
| --- | --- |
| feat | 新功能 |
| fix | 缺陷修复 |
| docs | 文档 |
| style | 格式（不影响逻辑） |
| refactor | 重构 |
| test | 测试 |
| chore | 构建 / 工具 |

示例：

- `feat(store): 增加联系人本地存储与导入合并策略`
- `feat(excel): 支持多联系方式列导出与往返解析`
- `docs(blog): 补充功能实现思路与 PSP 表`

分支约定：

- `main`：可运行、可发布的主分支。
- `feature/*`：功能分支，完成后通过 Pull Request 合入 `main`。

## 7. 提交前自检清单

- [ ] 浏览器控制台无报错。
- [ ] `node test/excel.spec.js` 全部通过。
- [ ] 新增功能已在博客「功能实现思路」中补充说明。
- [ ] 无调试代码、无 `console.log`。
