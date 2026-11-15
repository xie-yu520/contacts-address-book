# 提交状态与剩余清单 Submit Status

> 作业截止：**2026-11-17 23:59**。博客发布后需要审核，请至少提前一天发布。
>
> 本文件记录已完成的发布动作，以及**只剩一件必须由本人完成的事：发布博客**。

## 1. 已完成（本机 + 已登录的 GitHub 账号）

| 项目 | 结果 |
| --- | --- |
| 代码与文档 | `index.html` / `css/` / `js/` 三层实现、`test/excel.spec.js`、README、代码规范、作业博客、PSP 表 |
| 提交作者邮箱 | 已统一为 GitHub 官方 noreply 地址 `286552973+xie-yu520@users.noreply.github.com`，Commits 页显示 `Verified` 且归属本人 |
| GitHub 仓库 | <https://github.com/xie-yu520/contacts-address-book>（公开，默认分支 `main`） |
| 提交历史 | 10 余次提交（每次文档更新都会增加，以 GitHub Commits 页实时数字为准），全部由 `xie-yu520` 提交；`main`、`release/v1.0.0` 分支与 `v1.0.0` 标签均已 push |
| Pull Request | [#1 release: v1.0.0 发布](https://github.com/xie-yu520/contacts-address-book/pull/1)（release → main），**已合并** |
| 版本发布 | [Release v1.0.0](https://github.com/xie-yu520/contacts-address-book/releases/tag/v1.0.0)，附 `CHANGELOG.md` 说明与 `docs/通讯录示例.xlsx` |
| 演示视频 | `assets/demo.mp4`，43 秒真实浏览器录制，覆盖收藏 / 多联系方式 / 搜索 / 导出 / 重新导入去重 / 移动端 |
| 提交历史截图 | `assets/git_commits.png`（真实 GitHub Commits 页）+ `assets/git_log_summary.png`（本地 git log 汇总） |
| 测试 | `node test/excel.spec.js` → **15 项全通过**；文档相对链接 0 断裂 |
| 博客占位符 | GitHub 用户名 `xie-yu520`、学号 `832401224` 均已填真实值 |
| CSDN 发布版 | [`blog/CSDN-发布版.md`](../blog/CSDN-发布版.md)：图片改公网 CDN、mermaid 改架构图、目录改 `@[TOC]`、相对链接改绝对地址、无占位符，可直接粘贴发布 |
| 模块架构图 | `assets/architecture.png`（替代 CSDN 不渲染的 mermaid 流程图） |
| 发布指引 | [`blog/CSDN-发布指引.md`](../blog/CSDN-发布指引.md)：标题/摘要/标签、图片对照表、裂图排查、发布后检查清单 |

## 2. 仍需本人完成（只剩 1 件：发布博客）

### ① 视频链接 —— 已处理，无需再填

CSDN 发布版 5.5 节已把 `YOUR_VIDEO_URL` 换成 GitHub 上可在线预览 / 下载的
`assets/demo.mp4` 链接，作业要求的「完整运行视频」证据已具备。

- 仓库归档版 `blog/博客-通讯录.md` 仍保留占位符，供其他博客平台（博客园 / 知乎等）使用；
  若用归档版发布，按 5.5 节说明替换成视频链接或直接删掉该行；
- 可选：把 MP4 传到 B 站 / CSDN 视频，再用编辑器「插入视频」补到 5.5 节，不影响提交。

### ② 提前发布博客（**唯一必做**）

1. 打开 [CSDN 创作中心](https://mp.csdn.net/) → 写博客 → 切到 **Markdown 编辑器**；
2. 全选复制 [`blog/CSDN-发布版.md`](../blog/CSDN-发布版.md) 正文粘贴进去
   （或用「导入 Markdown 文件」直接选它），**不要复制 `博客-通讯录.md`**；
3. 按 [`blog/CSDN-发布指引.md`](../blog/CSDN-发布指引.md) 填标题、摘要、标签、分类、封面；
4. 确认 `@[TOC]` 生成了目录、8 张图片正常显示、作业描述表 / PSP 表 / 贡献度都在；
5. **提前发布**（发布后需审核，建议 11-16），把文章链接填到作业系统；个人项目提交一份即可。

> 若外链图片被 CSDN 拦截，点编辑器的「一键转存」或按发布指引第 3 节逐张上传 `assets/` 里的图。

## 3. 环境备忘（以后 push 遇到网络错误时）

本机代理端口**会随网络环境变化**：先后出现过 `28266` 对 `github.com` 返回 502、
`7890` 可用、`7890` 关闭后直连恢复可用。遇到 `Failed to connect ... over proxy` /
`schannel` / 502 时，按下面顺序试：

```bash
cd C:/Users/10445/Desktop/联系人
TOKEN=$(gh auth token)
AUTH=$(printf 'x-access-token:%s' "$TOKEN" | base64 -w0)
HDR="AUTHORIZATION: basic $AUTH"

# A. 优先：直连（不走代理）—— 2026-11-15 最后一次成功用的就是这条
git -c http.proxy= -c https.proxy= -c http.extraHeader="$HDR" -c http.version=HTTP/1.1 push origin main

# B. 直连失败：改用当前环境变量里的代理端口
PORT=$(echo "$HTTPS_PROXY" | grep -oE '[0-9]+$')
git -c http.proxy="http://127.0.0.1:$PORT" -c http.extraHeader="$HDR" -c http.version=HTTP/1.1 push origin main
```

先用 `curl --noproxy '*' -o /dev/null -w '%{http_code}' https://github.com` 判断直连是否通。
失败是代理端口问题，不是账号或权限问题；`gh` CLI 已登录 `xie-yu520` 且具备 `repo` 权限。

## 4. 交作业前最后核对

| ✅ | 检查项 |
| --- | --- |
| ☑ | `node test/excel.spec.js` → 15 项全过 |
| ☑ | 博客中的 GitHub 地址、学号均为真实值 |
| ☑ | 提交次数 ≥ 3，作者归属本人，贡献者统计正确 |
| ☑ | GitHub 提交历史截图已放进博客第 7 节 |
| ☑ | PR #1 已创建并合并、Release v1.0.0 已发布 |
| ☑ | 作业描述表、目录、PSP 表、贡献度齐全 |
| ☑ | 视频证据可用（CSDN 发布版已用 GitHub `demo.mp4` 链接替换占位符） |
| ☑ | CSDN 发布版与发布指引已备好，正文无 `YOUR_` 占位符、无本地相对路径 |
| ☐ | 博客在 **11-17 23:59 前**发布，且已预留审核时间 |
