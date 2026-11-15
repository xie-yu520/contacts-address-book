# 通讯录 Address Book

> 软件工程（FZU–MU）课程作业 · 个人项目
> 一个**纯前端、零构建**的通讯录应用：支持收藏联系人、多联系方式、Excel 导入导出。
> 在线体验：<https://wbapp-cgfofqfgwxxgtvkfj8jdqi.app.workbuddy.host/?sharecode=STHYHDZQYE>

![HTML5](https://img.shields.io/badge/HTML5-CSS3-JavaScript-blue)
![build](https://img.shields.io/badge/build-none-success)
![storage](https://img.shields.io/badge/storage-localStorage-orange)

![界面预览](assets/screen_home.png)

## 功能一览

| 功能 | 说明 | 对应作业要求 |
| --- | --- | --- |
| ⭐ 收藏联系人 | 列表内一键星标；收藏项置顶，另有「收藏」标签页单独筛选 | 1.1 Bookmark Contacts（25 分） |
| 📇 多联系方式 | 一位联系人可挂任意条手机 / 邮箱 / 微信 / QQ / 地址 / 其他，可增删改 | 1.2 Multiple Contact Methods（10 分） |
| 📤 导出 Excel | 一人一行、一类信息一列，同类多值自动展开为「手机1、手机2…」 | 1.3 Import & Export（25 分） |
| 📥 导入 Excel | 读取 .xlsx / .xls / .csv，自动识别中英文表头、去重与合并 | 1.3 Import & Export（25 分） |
| 🔍 即时搜索 | 姓名 / 公司 / 备注 / 任意联系方式全文匹配 | 页面风格（10 分） |
| 💾 本地持久化 | localStorage 自动保存，刷新、关闭浏览器都不丢数据 | — |

## 快速开始

**方式一：直接打开**

双击 `index.html` 即可，无需服务器、无需 `npm install`、无需联网。

**方式二：本地静态服务器（推荐）**

```bash
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> Excel 读写依赖 [SheetJS](https://sheetjs.com/)，已随仓库放在 `vendor/` 下，
> 因此完全离线可用，不依赖 CDN。

## 目录结构

```
联系人/
├── index.html              # 页面骨架（唯一入口）
├── css/style.css           # 设计变量 + 全部样式
├── js/
│   ├── store.js            # 数据层：模型、校验、localStorage、导入合并策略
│   ├── excel.js            # 转换层：联系人 ⇄ 二维表（导入导出的核心）
│   └── app.js              # 视图层：渲染、事件委托、交互状态
├── vendor/xlsx.full.min.js # SheetJS（Excel 读写库）
├── test/excel.spec.js      # Excel 往返测试（node 运行，无第三方依赖）
├── docs/
│   ├── CODE_STYLE.md       # 代码规范
│   ├── DEPLOY.md           # 云端部署说明（可选项 1.4）
│   ├── SUBMIT.md           # 提交前清单：push / PR / Release / 发博客
│   └── 通讯录示例.xlsx      # 可直接用于体验「导入」的示例文件
├── blog/
│   ├── 博客-通讯录.md       # 作业博客（仓库归档版）
│   ├── CSDN-发布版.md       # CSDN 专用版：公网图床 / @[TOC] / 绝对链接，可直接粘贴发布
│   ├── CSDN-发布指引.md     # 标题摘要标签、图片对照表、发布后检查清单
│   └── CSDN-预览.html       # 发布效果预览页（浏览器直接打开）
├── assets/                 # 5 张界面/部署截图 + 2 张提交历史图 + 架构图 + demo.mp4
├── CHANGELOG.md            # 版本发布说明
└── README.md
```

依赖方向是单向的：`app.js → excel.js → store.js`。数据层与转换层都不操作 DOM，
因此可以脱离浏览器单独测试。

## 测试

```bash
node test/excel.spec.js
```

覆盖：导出表头展开、导入表头别名识别、单元格多值拆分、无效行跳过、
导入合并策略（去重 / 合并 / 新增），以及「导出 → xlsx 二进制 → 导入」的往返一致性。

## Excel 文件格式

导出的表头形如：

```
姓名 | 收藏 | 公司 | 备注 | 手机1 | 手机2 | 邮箱 | 微信 | QQ | 地址
```

- 一类联系方式有多个值时展开为 `手机1 / 手机2`；只有一个值时列名为 `手机`。
- 导入时表头支持中英文别名（`姓名/name`、`手机/电话/phone`、`邮箱/email` …），
  列顺序可以任意调整，多余的列会被忽略。
- 同一单元格内可用 `;`、`；`、`、`、`|` 分隔多个值（地址列不拆分）。
- 「收藏」列接受 `是/否`、`Y/N`、`1/0`、`★`。

## 文档

- [代码规范](docs/CODE_STYLE.md)
- [作业博客（归档版）](blog/博客-通讯录.md)
- [CSDN 发布版博客](blog/CSDN-发布版.md) · [CSDN 发布指引](blog/CSDN-发布指引.md) · [发布效果预览](blog/CSDN-预览.html)
- [提交前操作清单](docs/SUBMIT.md)（GitHub push / PR / Release / 博客发布）
- [云端部署说明（1.4 可选项）](docs/DEPLOY.md)
- [完整运行演示视频](assets/demo.mp4) · [GitHub 提交历史截图](assets/git_commits.png) · [本地 git log 汇总图](assets/git_log_summary.png)

## 云端部署（作业 1.4，+15 分 · 已完成）

在线地址：<https://wbapp-cgfofqfgwxxgtvkfj8jdqi.app.workbuddy.host/?sharecode=STHYHDZQYE>
（公网静态托管，非 localhost；[部署证据截图](assets/screen_online.png)）。

本项目零构建、纯静态，已将运行所需文件发布为公网可访问的页面。自建云服务器 / 对象存储 /
GitHub Pages 的替代方案与 Nginx 配置见 [docs/DEPLOY.md](docs/DEPLOY.md)。
数据保存在浏览器 `localStorage`，不同设备之间不共享。

## License

课程作业，仅供学习交流。
