# 通讯录 Address Book —— 软件工程（FZU–MU）课程作业博客

> 本文是软件工程（FZU–MU）课程作业记录。项目是一个**纯前端、零构建**的通讯录应用，
> 实现了收藏联系人、多联系方式、Excel 导入导出，并已发布到公网。
> 源码、提交历史、PR、Release、运行截图与完整演示视频均可在线查看，文中所有链接均为公网地址。

## 作业描述

| Item | Content |
| --- | --- |
| Course for This Assignment | Software Engineering (FZU–MU) |
| Team Name | 个人项目（Individual）—— 谢宇城 |
| Submission Blog | [CSDN · 832401224谢宇城](https://blog.csdn.net/2406_88072814) |
| Assignment Requirements | 实现一个通讯录应用：① 支持收藏联系人与快捷访问；② 一位联系人可关联多种联系方式；③ 支持导出/导入 Excel（一人一行、一类信息一列）；④ 页面风格良好。需建立 GitHub 仓库（提交次数 ≥ 3）并提交博客。 |
| Objectives of This Assignment | 走完一个完整的小型软件生命周期：需求拆解 → 模块划分 → 编码实现 → 测试验证 → 文档与版本发布，练习前后端数据建模、文件格式互转与 Git 协作流程。 |
| Other References | [SheetJS 文档](https://docs.sheetjs.com/)、[MDN Web Docs](https://developer.mozilla.org/)、[Conventional Commits](https://www.conventionalcommits.org/) |

## 目录

@[TOC](目录)

---

## 1. 项目地址

| 类型 | 地址 |
| --- | --- |
| GitHub 仓库 | [`https://github.com/xie-yu520/contacts-address-book`](https://github.com/xie-yu520/contacts-address-book) |
| 代码规范 | [`docs/CODE_STYLE.md`](https://github.com/xie-yu520/contacts-address-book/blob/main/docs/CODE_STYLE.md) |
| 在线访问地址 | [`103.236.97.121:33555`](http://103.236.97.121:33555)（云服务器 ECS，非 localhost，对应作业 1.4） |
| 演示视频 | [`assets/demo.mp4`](https://github.com/xie-yu520/contacts-address-book/blob/main/assets/demo.mp4)（43 秒完整运行演示，可直接提交） |
| 发布执行记录 | [`docs/SUBMIT.md`](https://github.com/xie-yu520/contacts-address-book/blob/main/docs/SUBMIT.md)（push / PR / Release 实际执行记录） |
| 示例数据 | [`docs/通讯录示例.xlsx`](https://github.com/xie-yu520/contacts-address-book/raw/main/docs/通讯录示例.xlsx)（可直接用于测试「导入」） |

**本地运行**

```bash
git clone https://github.com/xie-yu520/contacts-address-book.git
cd contacts-address-book
# 方式一：直接双击 index.html
# 方式二：起一个静态服务器
python -m http.server 8080   # 打开 http://localhost:8080
```

项目为纯前端实现，**没有构建步骤**：不需要 `npm install`，不依赖 CDN，克隆后即可运行。

## 2. 需求分析与功能清单

把作业要求逐条拆成可验收的功能点，并标注在代码中的落点：

| 编号 | 要求 | 实现要点 | 对应代码 |
| --- | --- | --- | --- |
| 1.1 | 收藏联系人（25 分） | 星标切换、收藏置顶排序、独立「收藏」标签页、收藏数量实时统计 | `store.js: toggleStar / sortContacts`、`app.js: renderList` |
| 1.2 | 多联系方式（10 分） | 一位联系人挂载 N 条联系方式，支持 6 种类型与任意增删 | `store.js: normalizeContact`、`app.js: methodRowHtml` |
| 1.3 | 导入导出（25 分） | 导出动态列展开；导入表头别名识别、多值拆分、去重合并预览 | `excel.js: buildTable / rowsToContacts / parseHeader` |
| — | 页面风格（10 分） | 设计变量体系、卡片化两栏布局、空状态、Toast、响应式、快捷键 | `css/style.css` |
| — | 代码规范（10 分） | 三层单向依赖、JSDoc 注释、Conventional Commits | [`docs/CODE_STYLE.md`](https://github.com/xie-yu520/contacts-address-book/blob/main/docs/CODE_STYLE.md) |

除必做项外，额外补充了：全局搜索、一键复制联系方式、导入前预览、导入模板下载、
快捷键（`Ctrl/⌘ + K` 搜索、`Ctrl/⌘ + S` 保存、`Esc` 取消）与移动端适配。

## 3. 模块设计

先划分模块再动手写代码，避免所有逻辑堆在一个 `app.js` 里。整体是三层单向依赖：

![模块分层与数据流](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/architecture.png)

> 图为模块分层与数据流：`index.html` → 视图层 → 转换层 → 数据层 → `localStorage`，
> SheetJS 仅被转换层调用。整体是**三层单向依赖**，下层不反向依赖上层。

| 模块 | 职责 | 对外接口 | 是否依赖 DOM |
| --- | --- | --- | --- |
| `store.js` | 领域模型、字段清洗、增删改查、收藏、搜索、导入合并、持久化 | `Store.init/add/update/remove/toggleStar/query/mergeImported` | 否 |
| `excel.js` | 联系人 ⇄ 二维表互转、表头解析、文件读写 | `ExcelIO.buildTable/rowsToContacts/readFile/exportContacts` | 否（仅 `readFile` 用浏览器 File API） |
| `app.js` | 渲染、事件委托、界面状态机 | 无（自执行） | 是 |

**这样分层的好处**：数据层和转换层不碰 DOM，可以直接在 Node 里跑单元测试
（见第 6 节），不必为了测一个导出函数去启动浏览器。

## 4. 功能实现思路

### 4.1 数据模型：为什么用「联系方式数组」

需求 1.2 要求「一位联系人可关联多个联系方式」，如果按 `phone`、`email`、`phone2` 这样
平铺成字段，类型一多就爆炸且无法扩展。因此把联系方式抽成独立实体：

```json
{
  "id": "c_lq2x9a",
  "name": "陈思远",
  "company": "阿里巴巴集团",
  "note": "实习内推联系人",
  "starred": true,
  "methods": [
    { "id": "m_1", "type": "phone",   "value": "136 0013 6003" },
    { "id": "m_2", "type": "phone",   "value": "0591-2286 6003" },
    { "id": "m_3", "type": "email",   "value": "chensy@alibaba-inc.com" },
    { "id": "m_4", "type": "address", "value": "浙江省杭州市余杭区文一西路 969 号" }
  ],
  "createdAt": 1762700000000,
  "updatedAt": 1762900000000
}
```

`type` 取值为 `phone / email / wechat / qq / address / other` 六种，由 `TYPES` 常量统一维护，
界面的类型下拉框、徽章配色、Excel 表头全部从这一处派生 —— 以后要加「传真」，只改一个数组。

所有外部数据入口（Excel、localStorage、表单草稿）都经过同一个 `normalizeContact()`：

- 字段统一 `trim`，`null/undefined` 归一为空串；
- 丢弃值为空的联系方式；
- 同一联系人内 `type + value` 去重；
- 姓名与联系方式同时为空则判定为无效数据丢弃；
- 补齐 `id`、`createdAt`、`updatedAt`。

**一个入口做校验**，比在每个调用点各写一遍更不容易漏。

### 4.2 收藏联系人

收藏是最简单的需求，但要做顺，需要三处联动：

1. **状态**：`contact.starred` 布尔字段；
2. **排序**：`sortContacts()` 始终把收藏项排在最前，其次按姓名（`localeCompare('zh-Hans-CN')` 实现中文拼音序）：

```js
function sortContacts(list) {
  return list.slice().sort(function (a, b) {
    if (a.starred !== b.starred) return a.starred ? -1 : 1;   // 收藏置顶
    const byName = a.name.localeCompare(b.name, 'zh-Hans-CN'); // 中文按拼音
    if (byName !== 0) return byName;
    return b.updatedAt - a.updatedAt;
  });
}
```

3. **筛选**：`query({ filter: 'starred' })` 只返回收藏项，标签页上的数字实时刷新。

交互上，列表每一项右侧与详情页标题旁都有星标按钮，点击后 `toggleStar()` →
重新渲染 → 计数、排序、标签页同时更新，不需要手动刷新任何东西。

这里踩过一个小坑：**取消收藏后列表会立刻重排**，如果用「点击第 1 项」的脚本测试，
第二次点到的其实是另一位联系人。所以列表项的事件全部用 `data-id` 定位，
而不是依赖位置索引 —— 这也让事件委托实现得更干净。

### 4.3 多联系方式

编辑态下，「联系方式」是一个可增删的列表：每行 = 类型下拉框 + 输入框 + 删除按钮。

- **新增**：点击「+ 添加一项」追加一行并自动聚焦输入框；
- **删除**：只剩一行时不删除，而是清空内容，避免出现零输入框的尴尬状态；
- **占位提示联动**：切换类型时更新提示文案（手机 → `138 0013 8000`，地址 → `省 / 市 / 区 + 详细地址`）；
- **保存**：提交时读取所有行的值，过滤掉空值后交给 `Store`，由 `normalizeContact` 再去一次重。

详情态按类型显示彩色字母徽章（手 / 邮 / 微 / Q / 址 / 他），鼠标悬停即可复制该条内容，
省去「长按选中再复制」的麻烦。

### 4.4 导出 Excel：动态列展开

作业要求「一人一行，一类信息一列」。真正的难点是：**列数不固定** ——
有人 1 个手机号，有人 3 个。解决方案是「按本批数据的最大数量展开」：

```js
function planColumns(contacts) {
  const max = {};                       // 统计每种类型最多出现几次
  Store.TYPE_KEYS.forEach(k => { max[k] = 0; });
  contacts.forEach(c => {
    const counter = {};
    c.methods.forEach(m => { counter[m.type] = (counter[m.type] || 0) + 1; });
    Store.TYPE_KEYS.forEach(k => { if ((counter[k] || 0) > max[k]) max[k] = counter[k]; });
  });

  const columns = [];
  Store.TYPE_KEYS.forEach(key => {
    let count = max[key];
    if (count === 0 && (key === 'phone' || key === 'email')) count = 1;  // 基础列始终保留
    for (let i = 0; i < count; i += 1) {
      const label = count > 1 ? Store.typeLabel(key) + (i + 1) : Store.typeLabel(key);
      columns.push({ type: key, index: i, label: label });
    }
  });
  return columns;
}
```

于是 6 位联系人导出后的表头是：

| 姓名 | 收藏 | 公司 | 备注 | 手机1 | 手机2 | 邮箱 | 微信 | QQ | 地址 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 陈思远 | 是 | 阿里巴巴集团 | 实习内推联系人 | 136 0013 6003 | 0591-2286 6003 | chensy@alibaba-inc.com |  |  | 浙江省杭州市… |
| 刘佳 | 否 | 自由职业 |  |  |  | liujia.design@qq.com | liujia_design |  |  |

只有一个人有多个手机号时才会出现「手机2」；某类型没人填就不生成该列（手机、邮箱除外，保证基础列稳定）。

写出文件用 SheetJS 的 `aoa_to_sheet`（二维数组 → 工作表），并做了三件事提升可用性：
设置列宽、冻结首行式的自动筛选（`!autofilter`）、文件名带时间戳 `通讯录_20261115_2012.xlsx`。

> **前导零陷阱**：手机号如果在 Excel 里被当成数字，`013800138000` 会变成 `13800138000`。
> 这里所有单元格都以**字符串**写入工作表（`aoa_to_sheet` 对 string 生成文本型单元格），
> 导入时用 `sheet_to_json({ raw: false })` 读格式化后的文本，两端都不会丢字符。

### 4.5 导入 Excel：表头识别与合并策略

导入分三步：**解析 → 预览 → 写入**。

**第一步：表头识别。**
用户手里的 Excel 未必用我的表头，因此先把表头文本标准化（去空格、去冒号、转小写），
再用正则把「末尾数字」拆出来，最后查别名表：

```js
const TYPE_ALIASES = {
  phone: ['手机', '手机号', '电话', '联系电话', 'phone', 'mobile', 'tel'],
  email: ['邮箱', '邮件', '电子邮箱', 'email', 'mail'],
  // ...
};

function parseHeader(raw) {
  const text = String(raw).replace(/\s+/g, '').replace(/[:：]/g, '').toLowerCase();
  const matched = text.match(/^(.*?)(\d+)?$/);   // 「手机2」→ base=手机, index=1
  const base = matched[1];
  const index = matched[2] ? Math.max(0, parseInt(matched[2], 10) - 1) : 0;
  // 查 FIELD_ALIASES / TYPE_ALIASES，命中即返回 { kind, type|field, index }
}
```

这样 `手机`、`手机2`、`Phone`、`电话` 都能落到正确的列，**列顺序随意、多余列自动忽略**。
找不到「姓名」列时直接抛错并提示用户下载模板，而不是导进去一堆脏数据。

**第二步：单元格多值拆分。**
一个格里写 `138…；139…` 很常见，按 `; ； 、 |` 拆开；但**地址列不拆**，
因为「省、市、区」里本来就有顿号。这类「规则要有例外」的细节，不写下来下次一定忘。

**第三步：合并策略。**
导入最容易出问题的是「重复导入」。`mergeImported()` 定义了三档：

| 情况 | 处理 | 计入 |
| --- | --- | --- |
| 通讯录里没有同名联系人 | 新增一条 | `added` |
| 同名，且带来的联系方式**全部已存在** | 跳过（重复数据） | `skipped` |
| 同名，但带有新的联系方式/公司 | 合并进已有联系人，只补缺失项 | `merged` |

写入前会弹出预览：解析到多少条、跳过多少行无效数据、前 8 条长什么样，
用户确认后才真正落库 —— 避免「点错了文件，通讯录被污染」这种不可逆操作。

![导入预览](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/screen_import.png)

### 4.6 页面风格与交互细节

视觉上没有堆组件，而是先定一套设计变量（颜色、圆角、阴影、字体），再统一引用：

```css
:root {
  --primary: #3b63f6;
  --primary-weak: #eef2ff;
  --border: #e6eaf2;
  --radius-md: 12px;
  --shadow-1: 0 1px 2px rgba(20, 27, 45, 0.05);
}
```

具体落到界面上的点：

- **两栏卡片布局**：左侧 342px 联系人列表 + 右侧详情/编辑区，主次分明；
- **头像自动配色**：对姓名做哈希取 8 套柔和色板之一，列表不会一片灰；
- **空状态**：列表为空、搜索无结果、未选中联系人各有独立文案，不留白屏；
- **移动端**：≤780px 自动切单栏，点联系人进入详情、左上角返回；≤560px 顶栏改为两行，搜索框独占一行；
- **无障碍**：所有按钮有 `aria-label`，编辑区 `label for` 关联，`Esc` / `Ctrl+S` 等快捷键；
- **反馈**：所有增删改、复制、导入导出都有 Toast 提示，不弹 `alert`。

## 5. 程序运行截图与视频

### 5.1 主界面：列表 + 详情，收藏置顶

![主界面](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/screen_home.png)

图中「陈思远 / 李静 / 张伟」三位被收藏的联系人排在最前，姓名右侧为实心星标；
详情区展示 4 条不同类型的联系方式（两个手机号 + 邮箱 + 地址），可逐条复制。

### 5.2 新建 / 编辑：多联系方式动态增删

![编辑界面](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/screen_edit.png)

### 5.3 导入预览：先看后写

![导入预览](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/screen_import.png)

### 5.4 移动端适配

![移动端适配](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/screen_mobile.png)

> 图为 390px 窄屏下的单栏布局：列表与详情拆成两级，顶栏搜索框独占一行。

### 5.5 运行视频

仓库内附完整演示视频 [`assets/demo.mp4`](https://github.com/xie-yu520/contacts-address-book/blob/main/assets/demo.mp4)（43 秒，1280×800，H.264，约 750 KB）。
视频由真实浏览器逐帧录制，底部字幕标注每一步，全程无剪辑、无模拟数据：

| 时间轴 | 演示内容 |
| --- | --- |
| 00:00–00:06 | 载入示例数据，展示列表 + 详情两栏布局 |
| 00:06–00:18 | 查看多条联系方式、收藏联系人（一键星标、自动置顶）、「收藏」标签页筛选、全局搜索 |
| 00:18–00:27 | 新建联系人，逐条添加手机 / 邮箱 / 微信三种联系方式，勾选收藏并保存 |
| 00:27–00:36 | 导出 Excel；把刚导出的文件重新导入，先看解析预览，确认后展示同名去重不产生重复数据 |
| 00:36–00:43 | 390px 窄屏下的移动端单栏适配 |

**在线观看 / 下载**：[GitHub 仓库中的 demo.mp4](https://github.com/xie-yu520/contacts-address-book/blob/main/assets/demo.mp4)（页面内可直接预览，也可点 Download 下载）；[直链下载](https://github.com/xie-yu520/contacts-address-book/raw/main/assets/demo.mp4)。

> CSDN 正文不便内嵌本地 MP4，因此以仓库文件作为可核验的视频证据。
> 如需站内播放，可在 CSDN 编辑器「插入视频」中上传同一文件，再把生成的链接补到 5.5 节。

### 5.6 云端部署：公网可访问

![线上运行截图](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/screen_online.png)

作业 1.4 的可选加分项：把纯静态站点部署到云服务器 `103.236.97.121:33555`
（无需构建、无需后端），浏览器直接打开[在线地址](http://103.236.97.121:33555)即可使用。
部署时把 `index.html`、`css/`、`js/`、`vendor/` 上传到服务器，由 Nginx 监听 `33555` 端口对外提供静态文件；
上图为项目在公网环境运行的实拍页面，顶栏、搜索、导入/导出、收藏与详情均正常。
数据仍保存在浏览器 `localStorage`，因此不同设备之间不共享 —— 这是纯静态方案的固有限制，如实说明。
部署命令、Nginx 配置与验证清单见 [`docs/DEPLOY.md`](https://github.com/xie-yu520/contacts-address-book/blob/main/docs/DEPLOY.md)。

## 6. 测试与验证

Excel 是最容易出错的部分（格式、表头、编码、往返一致性），因此单独抽出来做了自动化测试：
`test/excel.spec.js` 用 Node 原生 `vm` 加载 `store.js` + `excel.js`，**不需要安装任何依赖**：

```bash
$ node test/excel.spec.js

[1] 导出表结构
  ✓ 固定列在前，联系方式列在后
  ✓ 一人一行，行数 = 联系人数 + 表头
  ✓ 收藏列导出为「是 / 否」
  ✓ 同一联系人的多个手机号落在不同列
  ✓ 只有一个值的类型不带序号
[2] 导入解析
  ✓ 表头别名与乱序列可识别
  ✓ 单元格内的多个值按分隔符拆分
  ✓ 地址列不拆分（保留逗号与顿号）
  ✓ 空行忽略，无效行计入 skipped
  ✓ 缺少姓名列时报错
  ✓ 收藏列的多种写法都能识别
[3] 往返一致性（导出 → xlsx 二进制 → 导入）
  ✓ 导出再由导入还原，联系人数量与内容一致
[4] 导入合并策略
  ✓ 同名同资料判为重复并跳过
  ✓ 同名但补充新联系方式时合并为一条
  ✓ 收藏状态与查询过滤

通过 15 项，失败 0 项
```

其中第 3 组是关键：**导出 → 写成真实 xlsx 二进制 → 再读回来**，逐字段比对姓名、公司、备注、
收藏状态与联系方式集合。这样「导出能用但导不回来」的问题在提交前就会被发现。

界面部分另外做了交互回归（新建、收藏、筛选、搜索、删除二次确认、空状态），
并逐屏检查了 1440px 与 390px 两种宽度下的排版。

## 7. GitHub 提交历史

![GitHub 提交历史截图](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/git_commits.png)

> 截图取自
> [`github.com/xie-yu520/contacts-address-book/commits/main`](https://github.com/xie-yu520/contacts-address-book/commits/main)，
> 可见 PR #1 的合并记录、每条提交的作者 `xie-yu520` 与时间、以及 `Verified` 签名标记。
> [本地 git log 汇总图](https://cdn.jsdelivr.net/gh/xie-yu520/contacts-address-book@main/assets/git_log_summary.png) 另给出发布阶段的分层提交与贡献者统计。

按提交时间正序，核心开发阶段的 7 次提交如下（hash 为 push 后的真实短 hash）：

| # | Hash | 提交信息 | 涉及模块 |
| --- | --- | --- | --- |
| 1 | `277a6ec` | `chore: 初始化仓库与代码规范` | 目录结构、`docs/CODE_STYLE.md` |
| 2 | `42c8d49` | `feat(store): 联系人数据模型与本地存储层` | `js/store.js` |
| 3 | `9c52840` | `feat(excel): Excel 导入导出与往返解析` | `js/excel.js`、`test/`、`vendor/` |
| 4 | `9b75e87` | `feat(ui): 两栏界面、收藏筛选与多联系方式编辑` | `index.html`、`css/`、`js/app.js` |
| 5 | `052d477` | `docs: 补充 README、部署说明、示例数据与作业博客` | `README.md`、`blog/`、`assets/` |
| 6 | `daad6c2` | `chore: 忽略本地工作区缓存目录` | `.gitignore` |
| 7 | `f2674e9` | `docs: 新增 CHANGELOG 并标记 1.0.0 版本内容` | `CHANGELOG.md`、`v1.0.0` 标签 |

之后还有「补齐发布材料」「回填仓库地址与部署证据」「同步提交材料」等文档提交，
以及 `Merge pull request #1` 的合并提交，完整列表以上方 GitHub Commits 页为准。
提交遵循 Conventional Commits，且**每次功能提交都对应一个可运行的阶段**（自底向上：
规范 → 数据层 → 转换层 → 视图层 → 文档 → 发版），而不是最后一次性 `git add .`。

**贡献者提交数**（GitHub Commits 页 / `git shortlog -sn --all`，个人项目只有一位贡献者）：

| 贡献者 | 提交数 | 占比 | 承担内容 |
| --- | --- | --- | --- |
| 谢宇城（xie-yu520） | 全部（10 余次） | 100% | 需求分析、模块设计、三层编码、样式、测试、文档与发版 |

分支与版本：`main` → 从 `main` 拉出 `release/v1.0.0` → 打 `v1.0.0` 标签 →
由 `release/v1.0.0` 向 `main` 发起
[Pull Request #1](https://github.com/xie-yu520/contacts-address-book/pull/1) 并合并 →
发布 [Release v1.0.0](https://github.com/xie-yu520/contacts-address-book/releases/tag/v1.0.0)。
提交作者邮箱使用 GitHub 官方 noreply 地址，因此每条提交都能正确归属到本人账号。
全过程见 [`docs/SUBMIT.md`](https://github.com/xie-yu520/contacts-address-book/blob/main/docs/SUBMIT.md)。

## 8. 开发过程中遇到的问题与解决

**① 导出的列数不固定，怎么写表头？**
最初想固定 6 列（手机/邮箱/微信/QQ/地址/其他），但一个联系人可能有 3 个手机号，塞在一个格里
就没法「一类信息一列」。于是改成先统计本批数据每种类型的最大出现次数，再动态展开
`手机1/手机2/…`；只有一列时不带序号，保持表头简洁。这段逻辑抽成纯函数 `planColumns()`，
单独测了「两个手机号 → 出现手机2」「只有一个微信号 → 微信列不带序号」。

**② 手机号变科学计数法 / 丢前导零。**
用数字类型写单元格时，`013800138000` 会变成 `13800138000`，长号码还会显示成 `1.38E+11`。
解决：导出时统一按字符串写入（文本型单元格），导入时用 `raw: false` 取格式化文本，
保证号码「原样进出」。测试里专门放了一个 `0755-12345678` 这种带区号横线的号码来兜底。

**③ 地址被拆成了好几段。**
多值拆分的分隔符里包含顿号「、」，而中文地址天然带顿号（`福建省、福州市`），
一拆就散。最后给地址列加了豁免：`address` 类型整体作为一个值处理。这件事提醒我：
**通用规则一定要先想例外**。

**④ 重复导入导致通讯录翻倍。**
第一版直接 `push` 新数据，同一个文件导入两次就有两份。改为三档合并策略
（同名同资料跳过 / 同名补新信息 / 否则新增），并在导入前弹预览告诉用户
「新增几条、合并几条、跳过几条」，让结果可预期。

**⑤ 取消收藏后列表重排，星标点错人。**
列表按「收藏优先」排序，取消收藏的瞬间该联系人会跳到后面，如果交互依赖索引就会错位。
把所有列表项操作改成基于 `data-id` 的事件委托后问题消失，同时顺带解决了「重新渲染后
事件监听失效」的问题 —— 事件绑在容器上，不绑在会被替换掉的行上。

## 9. PSP 表

| PSP 2.1 | 阶段 | 预估耗时（min） | 实际耗时（min） |
| --- | --- | --- | --- |
| Planning | 计划：拆解作业要求、确定技术方案 | 20 | 25 |
| Analysis | 需求分析：功能清单与验收标准 | 25 | 30 |
| Design | 设计：模块划分、数据模型、接口定义 | 40 | 45 |
| Design Review | 设计评审：自查分层是否合理、是否可测试 | 15 | 10 |
| Coding | 编码：`store.js` 数据层 | 60 | 75 |
| Coding | 编码：`excel.js` 转换层（导出/导入/模板） | 100 | 130 |
| Coding | 编码：`app.js` 视图层与交互 | 120 | 145 |
| Coding | 编码：`style.css` 页面样式与响应式 | 100 | 125 |
| Code Review | 代码检查：命名、注释、重复逻辑提取 | 20 | 20 |
| Test | 测试：单元测试 + 交互回归 + 多分辨率检查 | 70 | 95 |
| Documentation | 文档：README、代码规范、博客 | 90 | 110 |
| Postmortem | 复盘：问题记录与后续计划 | 15 | 15 |
| **合计** | | **675** | **825** |

实际比预估多约 2.5 小时，主要超在 Excel 导入的边界情况（表头别名、多值拆分、去重策略）
和移动端排版调试上 —— 这两块在动手前低估了复杂度。

## 10. 分工与贡献度

本次为**个人项目**，从需求分析、设计、编码、测试到文档均由本人独立完成。

| 成员 | 学号 | 承担内容 | 贡献度 |
| --- | --- | --- | --- |
| 谢宇城 | `832401224` | 全部：需求分析、模块设计、数据层/转换层/视图层编码、样式、测试、文档 | 100 |

## 11. 总结与后续改进

做完这个作业，最大的收获不是「会写一个通讯录」，而是三件具体的事：

1. **先分层再写代码**。数据层不碰 DOM，才可能在 Node 里几秒钟跑完 15 个用例；
   如果没有这层隔离，Excel 的往返一致性根本没法自动验证。
2. **边界情况才是工作量**。主流程（增删改查）半天就写完了，剩下的时间全花在
   表头别名、多值拆分、重复导入、前导零这些「用户一定会遇到但文档不会写」的地方。
3. **可预期 > 聪明**。导入前先预览、删除前二次确认、失败给中文提示 —— 这类设计不炫技，
   但明显降低了误操作成本。

后续可以继续做的方向：

- **账号体系与多端同步**：1.4 的云服务器部署已完成，下一步是接后端把 `localStorage`
  换成数据库，配合登录实现多端同步（目前数据在浏览器本地，不同设备不共享）；
- **联系人分组与标签**：目前只有「收藏」一个维度，可以扩展成多标签；
- **导入冲突让用户选**：现在同名是「自动合并」，可以做成对比界面让用户逐条决定保留哪边；
- **CSV 编码兼容**：目前 CSV 依赖浏览器按 UTF-8 解析，GBK 编码的 CSV 会乱码，
  可以引入编码探测后统一转码。

---

## 附：参考资料

- [SheetJS 文档](https://docs.sheetjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [语义化版本 SemVer](https://semver.org/lang/zh-CN/)
- 课程作业要求说明：Software Engineering (FZU–MU)

> 本文为课程作业记录，源码与全部素材见上方 GitHub 仓库。
