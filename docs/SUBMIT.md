# 提交前操作清单 Submit Checklist

> 截止时间：**2026-11-17 23:59**。博客发布后需要审核，请至少提前一天发布。
>
> 本仓库目前**只在本地**，代码、文档、测试、截图、提交历史图、演示视频都已备齐，
> 剩下的都是在 GitHub / 博客平台上必须由本人账号完成的操作。按顺序做完即可交作业。

## 0. 三个占位符（全文替换即可）

打开 `blog/博客-通讯录.md`，全文搜索并替换：

| 占位符 | 换成 | 出现位置 |
| --- | --- | --- |
| `xie-yu520` | 你的 GitHub 用户名 | 第 1 节仓库地址、`git clone` 命令、第 7 节截图说明 |
| `YOUR_STUDENT_ID` | 你的学号 | 第 10 节贡献度表（PSP 表不需要学号） |
| `YOUR_VIDEO_URL` | 演示视频的在线链接 | 第 5.5 节 |

> 如果暂时拿不到视频链接，可以先删掉这一行并保留仓库内的
> `assets/demo.mp4` 作为本地证据，但评分项里「完整运行视频」最好还是贴在线链接。

`https://wbapp-cgfofqfgwxxgtvkfj8jdqi.app.workbuddy.host/?sharecode=STHYHDZQYE` 只在做第 1.4 节云端部署时才需要；不做可选项就保持「未部署」的说法。

## 1. 修正提交作者邮箱（**push 之前做**）

当前本地提交的作者邮箱是占位值 `xieyucheng@users.noreply.github.com`。
如果不改，GitHub 可能不把这些提交计入你的贡献者统计，第 7 节的「每人提交数」就对不上。

仓库还没 push，现在改历史没有任何副作用。在项目根目录执行：

```bash
# 换成你 GitHub 账号绑定的邮箱（或 GitHub 提供的 noreply 邮箱）
git config user.name  "谢宇城"
git config user.email "你的GitHub绑定邮箱"

# 一次性重写本机所有提交的作者/提交者信息
git filter-branch -f --env-filter '
  export GIT_AUTHOR_NAME="谢宇城"
  export GIT_AUTHOR_EMAIL="你的GitHub绑定邮箱"
  export GIT_COMMITTER_NAME="谢宇城"
  export GIT_COMMITTER_EMAIL="你的GitHub绑定邮箱"
' -- --all

# annotated tag 的 tagger 不会被重写，删掉重建
git tag -d v1.0.0
git tag -a v1.0.0 -m "1.0.0 - 通讯录首个发布版本：收藏、多联系方式、Excel 导入导出" release/v1.0.0

# 核对
git log --all --pretty=format:'%h %an <%ae> %s' | head -10
```

> Windows Git Bash 下若 `filter-branch` 提示 `FILTER_BRANCH_SQUELCH_WARNING`，
> 在命令前加 `FILTER_BRANCH_SQUELCH_WARNING=1` 再执行一次即可。
>
> 若这一步执行失败，可以**跳过**：直接去 GitHub「Settings → Emails」把
> `xieyucheng@users.noreply.github.com` 对应的真实邮箱加进账号，
> 或在博客里注明提交使用的是 noreply 邮箱。功能评分不受影响，只影响贡献者统计。

## 2. 建 GitHub 仓库并 push

1. 打开 <https://github.com/new>，仓库名建议 `contacts-address-book`，**不要**勾选
   「Add a README / .gitignore / license」，否则本地与远端会产生冲突。
2. 回到本地执行：

```bash
git remote add origin https://github.com/xie-yu520/contacts-address-book.git
git branch -M main

git push -u origin main
git push origin release/v1.0.0
git push origin v1.0.0
```

3. 打开 `https://github.com/xie-yu520/contacts-address-book/commits/main` 确认
   **至少 7 个提交都在、作者都显示成你本人**（含「补齐发布材料」提交共 8 次）。
   `git shortlog -sn --all` 应该只输出一位贡献者，且全部提交都归本人。

## 3. 发版本 + 发起 Pull Request

作业清单要求「Release a version and initiate a pull request」：

1. GitHub 仓库页 → **Pull requests → New pull request**：
   base 选 `main`，compare 选 `release/v1.0.0`，标题写
   `release: v1.0.0 发布（收藏 / 多联系方式 / Excel 导入导出）`，正文复制
   `CHANGELOG.md` 里 1.0.0 的内容 → **Create pull request**。
2. 合并这个 PR（Merge pull request）。
3. **Releases → Draft a new release**：Tag 选已有的 `v1.0.0`，标题 `v1.0.0`，
   说明粘贴 `CHANGELOG.md` 内容，可附上 `docs/通讯录示例.xlsx` → **Publish release**。

> PR 合并后 `main` 与 `release/v1.0.0` 内容一致，提交历史保留全部 8 次提交，
> 满足「commit times ≥ 3」。

## 4. 替换提交历史截图（可选但建议）

`assets/git_commits.png` 是**本地 `git log --all` 渲染出的真实提交历史图**
（v1.0.0 发布阶段快照），push 之前就能放进博客，已包含 7 次提交、分支/标签与贡献者统计。
若老师要求看到 GitHub 页面，请再截一张
`https://github.com/xie-yu520/contacts-address-book/commits/main`
覆盖 `assets/git_commits.png`（博客里的引用路径不用改）。

## 5. 上传演示视频

`assets/demo.mp4` 是仓库内自带的完整演示（约 1 分钟）：
载入示例 → 收藏与筛选 → 搜索 → 新建联系人并添加多种联系方式 → 编辑 →
导出 Excel → 用导出文件重新导入并展示去重 → 移动端响应式。

上传到 B 站 / 腾讯视频 / 网盘后，把链接填进博客第 5.5 节的 `YOUR_VIDEO_URL`。
如果平台不接受 MP4，可直接在博客里说明「视频文件见仓库 `assets/demo.mp4`」。

## 6. 发布博客

1. 把 `blog/博客-通讯录.md` 的正文复制到博客平台（CSDN / 博客园 / 知乎专栏等），
   **Markdown 排版**，注意把相对图片链接改成图床地址：
   `assets/screen_home.png`、`screen_edit.png`、`screen_import.png`、
   `screen_mobile.png`、`git_commits.png` 共 5 张，都在 `assets/` 里。
2. 确认首部的**作业描述表**、**目录**、**PSP 表**都在。
3. **提前发布**（发布后需审核），把博客链接填到作业系统。
4. 作业要求的「个人博客记录」：每个人都要单独提交自己的博客，个人项目提交一份即可。

## 7. 可选加分：云端部署（+15）

作业 1.4 要求部署到云服务器（localhost 链接不算）。当前博客按「不做可选项」撰写。
如果临时决定要拿这 15 分，可让助手把本项目发布成一个公网可访问的静态站点，
拿到链接后替换博客里的 `https://wbapp-cgfofqfgwxxgtvkfj8jdqi.app.workbuddy.host/?sharecode=STHYHDZQYE`，并把第 12 节自查表中
「云端部署」一行改成 ✅、把第 11 节「后续改进」里对应的说法同步改掉。
`docs/DEPLOY.md` 里另有自建云服务器 / 对象存储的两套方案。

## 8. 交作业前最后核对

| ✅ | 检查项 |
| --- | --- |
| ☐ | `node test/excel.spec.js` → 15 项全过 |
| ☐ | 博客 3 个占位符全部替换，无 `YOUR_` 残留 |
| ☐ | GitHub 仓库链接、代码规范链接可打开 |
| ☐ | 提交历史 ≥ 3 次，作者显示本人，贡献者统计正确 |
| ☐ | PR 已创建、Release v1.0.0 已发布 |
| ☐ | 5 张截图 + 演示视频链接都能访问 |
| ☐ | 作业描述表、目录、PSP 表、贡献度、评分自查齐全 |
| ☐ | 博客在 **11-17 23:59 前**发布，且已预留审核时间 |
