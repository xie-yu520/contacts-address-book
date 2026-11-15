# 提交状态与剩余清单 Submit Status

> 作业截止：**2026-11-17 23:59**。博客发布后需要审核，请至少提前一天发布。
>
> 本文件记录已完成的发布动作，以及**只剩两件必须由本人完成的事**。

## 1. 已完成（本机 + 已登录的 GitHub 账号）

| 项目 | 结果 |
| --- | --- |
| 代码与文档 | `index.html` / `css/` / `js/` 三层实现、`test/excel.spec.js`、README、代码规范、作业博客、PSP 表 |
| 提交作者邮箱 | 已统一为 GitHub 官方 noreply 地址 `286552973+xie-yu520@users.noreply.github.com`，Commits 页显示 `Verified` 且归属本人 |
| GitHub 仓库 | <https://github.com/xie-yu520/contacts-address-book>（公开，默认分支 `main`） |
| 提交历史 | 10 余次提交，全部由 `xie-yu520` 提交；`main`、`release/v1.0.0` 分支与 `v1.0.0` 标签均已 push |
| Pull Request | [#1 release: v1.0.0 发布](https://github.com/xie-yu520/contacts-address-book/pull/1)（release → main），**已合并** |
| 版本发布 | [Release v1.0.0](https://github.com/xie-yu520/contacts-address-book/releases/tag/v1.0.0)，附 `CHANGELOG.md` 说明与 `docs/通讯录示例.xlsx` |
| 云端部署（+15） | 公网地址 <https://wbapp-cgfofqfgwxxgtvkfj8jdqi.app.workbuddy.host/?sharecode=STHYHDZQYE>（非 localhost），证据 `assets/screen_online.png` |
| 演示视频 | `assets/demo.mp4`，43 秒真实浏览器录制，覆盖收藏 / 多联系方式 / 搜索 / 导出 / 重新导入去重 / 移动端 |
| 提交历史截图 | `assets/git_commits.png`（真实 GitHub Commits 页）+ `assets/git_log_summary.png`（本地 git log 汇总） |
| 测试 | `node test/excel.spec.js` → **15 项全通过**；文档相对链接 0 断裂 |
| 博客占位符 | GitHub 用户名 `xie-yu520`、学号 `832401224`、在线访问地址均已填真实值 |

## 2. 仍需本人完成（只剩 2 件）

### ① 上传演示视频并填链接

打开 `blog/博客-通讯录.md` 第 5.5 节，把 `YOUR_VIDEO_URL` 换成 B 站 / 腾讯视频 / 网盘的在线链接。

- 若博客平台支持 HTML5 视频，也可以**直接删掉「视频在线地址」那一行**，
  保留仓库内 `assets/demo.mp4` 作为证据（视频标签已写在博客里）；
- 这是全文唯一剩下的占位符，替换后搜索 `YOUR_` 应为 0 结果。

### ② 提前发布博客

1. 把 `blog/博客-通讯录.md` 正文复制到 CSDN / 博客园 / 知乎专栏等，使用 **Markdown 排版**；
2. 把相对图片链接改成图床地址，`assets/` 下共 7 个素材：
   `screen_home.png`、`screen_edit.png`、`screen_import.png`、`screen_mobile.png`、
   `screen_online.png`、`git_commits.png`、`git_log_summary.png`；
3. 确认首部的**作业描述表**、**目录**、**PSP 表**、贡献度与评分自查都在；
4. **提前发布**（发布后需审核），把博客链接填到作业系统；个人项目提交一份博客即可。

## 3. 环境备忘（以后 push 遇到网络错误时）

本机系统代理 `http://127.0.0.1:28266` 对 `github.com` 返回 `CONNECT tunnel failed, 502`，
但 `api.github.com` 与本机 `7890` 端口可用。若 `git push` 报 `schannel` / 502，改用：

```bash
cd C:/Users/10445/Desktop/联系人
TOKEN=$(gh auth token)
AUTH=$(printf 'x-access-token:%s' "$TOKEN" | base64 -w0)

git -c http.proxy=http://127.0.0.1:7890 \
    -c http.extraHeader="AUTHORIZATION: basic $AUTH" \
    -c http.version=HTTP/1.1 push origin main
```

> 首次失败是代理端口问题，不是账号或权限问题；`gh` CLI 已登录 `xie-yu520` 且具备 `repo` 权限。

## 4. 交作业前最后核对

| ✅ | 检查项 |
| --- | --- |
| ☑ | `node test/excel.spec.js` → 15 项全过 |
| ☑ | 博客中的 GitHub 地址、学号、公网访问地址均为真实值 |
| ☑ | 提交次数 ≥ 3，作者归属本人，贡献者统计正确 |
| ☑ | GitHub 提交历史截图已放进博客第 7 节 |
| ☑ | PR #1 已创建并合并、Release v1.0.0 已发布 |
| ☑ | 云端部署公网地址可访问（作业 1.4 加分项） |
| ☑ | 作业描述表、目录、PSP 表、贡献度、评分自查齐全 |
| ☐ | 视频在线链接已填（或已删掉该行） |
| ☐ | 博客在 **11-17 23:59 前**发布，且已预留审核时间 |
