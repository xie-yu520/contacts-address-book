# 云端部署说明（作业 1.4 可选项，+15 分）

> **部署目标**：云服务器 `103.236.97.121`，对外端口 `33555`
> 访问地址：<http://103.236.97.121:33555>（非 localhost）
> 方式：ECS + Nginx 提供静态文件；运行截图 `assets/screen_online.png`。
>
> 作业要求「部署在云服务器，如华为云 / 阿里云」，localhost 链接不计分。
> 服务器登录凭据由云服务商提供，**仅本人保管，切勿写入公开仓库或博客**。

本项目是纯静态站点（只有 `index.html` / `css/` / `js/` / `vendor/`），
没有构建步骤、没有后端、没有环境变量，**把运行所需文件放到任意能对外提供 HTTP 的服务器即可运行**。

## 方案 A：云服务器 + Nginx 监听 33555（本次采用）

> 国内云服务器的 `80` / `443` 端口通常要求域名完成 ICP 备案，未备案时会返回云厂商的
> 「网站无法访问」拦截页。因此本次改用非标端口 `33555` 对外提供服务，
> 同时需要在云控制台**安全组放行 TCP 33555**。

```bash
# 1. 用云服务商提供的 SSH 凭据登录服务器，安装 Nginx
sudo yum install -y nginx          # CentOS 7
# 或：sudo apt update && sudo apt install -y nginx   # Ubuntu

# 2. 在本机（Windows Git Bash）打包上传，只传运行所需的静态资源
cd C:/Users/10445/Desktop/联系人
scp -P <SSH端口> -r index.html css js vendor <用户名>@103.236.97.121:/tmp/addressbook/
# 服务器上：
sudo mkdir -p /var/www/addressbook
sudo mv /tmp/addressbook/* /var/www/addressbook/
sudo chown -R nginx:nginx /var/www/addressbook    # Ubuntu 用 www-data:www-data
```

新建 `/etc/nginx/conf.d/addressbook.conf`：

```nginx
server {
    listen 33555;
    server_name 103.236.97.121;

    root /var/www/addressbook;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(css|js|png|svg|ico)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    gzip on;
    gzip_types text/css application/javascript text/html;
}
```

```bash
sudo nginx -t && sudo systemctl enable --now nginx
sudo firewall-cmd --add-port=33555/tcp --permanent 2>/dev/null && sudo firewall-cmd --reload
```

浏览器访问 `http://103.236.97.121:33555/` 验证：能打开页面、能新建联系人、能导出 Excel、刷新后数据仍在。

> 若服务器已有 Web 服务占用 80 端口，可保留不动，只新增上面的 `33555` server 块。
> 数据存在浏览器 `localStorage`，不同设备之间不共享；这是纯静态方案的固有限制，
> 博客里应如实说明，不要写成「多端同步」。

## 方案 B：静态托管（备选，最快取得公网链接）

任选其一，把仓库 push 到 GitHub 后导入即可，几分钟内有 HTTPS 公网地址：

| 平台 | 构建命令 | 发布目录 |
| --- | --- | --- |
| GitHub Pages | 无 | `/`（仓库根目录） |
| Cloudflare Pages | 无 | `/` |
| Vercel / Netlify | 无 | `/` |

三者都不需要 `npm install`，也不需要改代码。若平台要求「框架预设」，选 **Other / Static**。

## 部署后已同步更新的位置

1. 两个博客版本第 1 节「在线访问地址」与第 5.6 节「云端部署」均已指向该云服务器；
2. `README.md` 顶部在线体验链接与「云端部署」章节；
3. `docs/SUBMIT.md` 提交状态清单中的云端部署条目。

> 若老师要求看到浏览器地址栏，用普通浏览器打开 `http://103.236.97.121:33555/`
> 自行截一张覆盖 `assets/screen_online.png` 即可，博客里的引用路径无需改动。

## 常见问题排查

| 现象 | 原因与处理 |
| --- | --- |
| 打开 `http://103.236.97.121/` 显示「网站无法访问 / 未备案」 | 国内云厂商对 80 端口的默认拦截页，改用非标端口 `33555`，或完成域名备案 |
| 访问 `33555` 连接被重置 / 超时 | Nginx 未启动，或安全组 / 系统防火墙未放行 TCP 33555；用 `ss -lntp \| grep 33555` 与控制台安全组核对 |
| SSH 认证失败 | 确认云控制台提供的**用户名**与登录方式（密码 / 密钥），部分镜像默认用户不是 `root` |
| 页面能开但导出 Excel 报错 | 检查 `vendor/xlsx.full.min.js` 是否随其它静态文件一起上传 |
| 刷新后数据丢失 | 正常现象：数据存在浏览器 localStorage，换浏览器 / 无痕模式不会共享 |

## 验证清单

- [ ] 公网地址可直接打开（不是 `localhost` / `127.0.0.1`）
- [ ] 安全组已放行 TCP `33555`，`ss -lntp` 中 Nginx 正在监听
- [ ] 新建 / 编辑 / 删除联系人正常
- [ ] 星标收藏与「收藏」筛选正常
- [ ] 导出 `.xlsx` 能下载且 Excel 可打开
- [ ] 用 `docs/通讯录示例.xlsx` 导入能预览并写入
- [ ] 刷新页面后数据仍在（localStorage 生效）
