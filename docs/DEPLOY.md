# 云端部署说明（作业 1.4 可选项，+15 分 · 已完成）

> **已完成部署**：公网地址
> <https://wbapp-cgfofqfgwxxgtvkfj8jdqi.app.workbuddy.host/?sharecode=STHYHDZQYE>
> （WorkBuddy 静态托管，非 localhost），证据截图 `assets/screen_online.png`。
> 博客第 1 节与第 5.6 节已同步标注访问地址与托管方式。
>
> 作业要求「部署在云服务器，如华为云 / 阿里云」，localhost 链接不计分；本项目采用公网静态托管。
> 下文方案 A / B 是「改用自己的云服务器或其他静态托管平台」的替代做法，供后续扩展参考。

本项目是纯静态站点（只有 `index.html` / `css/` / `js/` / `vendor/`），
没有构建步骤、没有后端、没有环境变量，**把仓库文件放到任意能对外提供 HTTP 的服务器即可运行**。

## 方案 A：云服务器 + Nginx（最贴合题意）

以华为云 ECS / 阿里云 ECS（Ubuntu 22.04）为例：

```bash
# 1. 登录云服务器，安装 Nginx
sudo apt update && sudo apt install -y nginx

# 2. 创建站点目录
sudo mkdir -p /var/www/addressbook

# 3. 在本机（Windows Git Bash）上传文件，只传运行所需的静态资源
cd C:/Users/10445/Desktop/联系人
scp -r index.html css js vendor 用户名@服务器公网IP:/tmp/addressbook/
# 然后在服务器上：
sudo mv /tmp/addressbook/* /var/www/addressbook/
sudo chown -R www-data:www-data /var/www/addressbook
```

新建 `/etc/nginx/sites-available/addressbook`：

```nginx
server {
    listen 80;
    server_name 你的域名或公网IP;

    root /var/www/addressbook;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(css|js|png|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/css application/javascript text/html;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/addressbook /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

最后在云控制台**安全组放行 80 端口**（HTTPS 可用 Let's Encrypt `certbot --nginx` 追加）。
浏览器访问 `http://公网IP/` 验证：能打开页面、能新建联系人、能导出 Excel、刷新后数据仍在。

> 数据存在浏览器 `localStorage`，不同设备之间不共享；这是纯静态方案的固有限制，
> 博客里应如实说明，不要写成「多端同步」。

## 方案 B：静态托管（更快取得公网链接）

任选其一，把仓库 push 到 GitHub 后导入即可，几分钟内有 HTTPS 公网地址：

| 平台 | 构建命令 | 发布目录 |
| --- | --- | --- |
| GitHub Pages | 无 | `/`（仓库根目录） |
| Cloudflare Pages | 无 | `/` |
| Vercel / Netlify | 无 | `/` |

三者都不需要 `npm install`，也不需要改代码。若平台要求「框架预设」，选 **Other / Static**。

## 部署后已同步更新的位置

1. `blog/博客-通讯录.md` 第 1 节「在线访问地址」已填公网 URL；
2. 新增第 5.6 节「云端部署：公网可访问」，附 `assets/screen_online.png` 实拍页面；
3. `README.md` 顶部与「云端部署」章节已给出在线预览地址。

> 截图为通过公网链接真实打开的页面渲染结果。若老师要求看到浏览器地址栏，
> 用普通浏览器打开上面的公网地址自行截一张即可，无需修改仓库内容。

## 验证清单

- [ ] 公网地址可直接打开（不是 `localhost` / `127.0.0.1`）
- [ ] 新建 / 编辑 / 删除联系人正常
- [ ] 星标收藏与「收藏」筛选正常
- [ ] 导出 `.xlsx` 能下载且 Excel 可打开
- [ ] 用 `docs/通讯录示例.xlsx` 导入能预览并写入
- [ ] 刷新页面后数据仍在（localStorage 生效）
