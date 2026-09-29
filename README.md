# Joshua 的博客

使用 **Hexo + Butterfly + Cloudflare Pages**，正式地址为 **https://joshuaxql.com**。

## 本地开发

使用 Node.js 22 LTS（与 `.node-version` 一致）：

```bash
npm ci
npm run server
```

访问 http://localhost:4000。生成静态站点：

```bash
npm run build
```

构建产物位于 `public/`。

## 发布到 Cloudflare Pages

### 1. 上传到 GitHub

在 GitHub 创建空仓库，然后在本目录执行（替换仓库地址）：

```bash
git init
git add .
git commit -m "Set up Hexo Butterfly blog"
git branch -M main
git remote add origin https://github.com/joshuaxql/YOUR_REPOSITORY.git
git push -u origin main
```

提交源码和 `package-lock.json` 即可，`public/` 与 `node_modules/` 已忽略。

### 2. 创建 Pages 项目

Cloudflare 控制台 → **Workers & Pages** → **Create application** → **Pages** → **Import an existing Git repository**，连接上述仓库。

| 项目 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 框架预设 | `Hexo` |
| 构建命令 | `npm run build` |
| 构建输出目录 | `public` |
| 根目录 | 留空（仓库根目录） |
| 环境变量 | `NODE_VERSION=22` |

保存并部署，先通过 Cloudflare 分配的 `*.pages.dev` 地址验证站点。以后推送到 `main` 会自动构建发布，无需执行 `hexo deploy`，也无需在仓库保存 Cloudflare API Token。

### 3. 绑定 joshuaxql.com

1. 将 `joshuaxql.com` 添加到创建 Pages 项目的同一个 Cloudflare 账户。
2. 在域名注册商处，将 NS 修改为 Cloudflare 为该域名分配的两个名称服务器，等待 Cloudflare 显示域名已激活。
3. 打开 Pages 项目 → **Custom domains** → **Set up a domain**，输入 `joshuaxql.com`。
4. 按提示确认 DNS 记录，由 Cloudflare 创建指向实际 `<项目名>.pages.dev` 的记录。若根域名已有冲突记录，核对用途后再调整。
5. 等待域名与 HTTPS 证书状态变为 Active，访问 https://joshuaxql.com。
6. 在域名的 **SSL/TLS → Edge Certificates** 中启用 **Always Use HTTPS**。

根域名绑定 Pages 需要使用 Cloudflare 名称服务器。务必先在 Pages 中添加自定义域名，仅手工创建 CNAME 不能完成绑定。

如果还需要 `www.joshuaxql.com`，在 Pages 中同样添加该域名，然后在 Cloudflare Redirect Rules 中将 `www` 的请求以 301 重定向到 `https://joshuaxql.com`，保留路径与查询参数。

## 写作与配置

```bash
npx hexo new "文章标题"
```

编辑生成的 `source/_posts/文章标题.md`，可使用以下文章头：

```yaml
---
title: 文章标题
date: 2026-09-29 12:00:00
updated: 2026-09-29 12:00:00
tags:
  - 技术
categories:
  - 学习笔记
description: 一句话摘要
---
```

- `_config.yml`：站点名称、作者、域名、语言与生成器。
- `_config.butterfly.yml`：导航、头像、封面、搜索、深色模式等主题选项。
- `source/about/index.md`：个人介绍。
- `source/img/`：本站头像、图标和封面。
- `source/_posts/hello-world.md`：Hexo 原始示例文章，发布前可自行编辑或移除。
- `/search.xml`、`/sitemap.xml`、`/atom.xml`：构建时自动生成。
- `source/_headers`：Cloudflare Pages 响应头配置，构建时原样复制。

Butterfly 5.7.0 已通过 npm 锁定安装，Cloudflare 构建不依赖主题 Git 子模块。本机原有 `themes/butterfly/` 保留并已加入忽略列表；Hexo 在本地会优先使用该目录，新的克隆与 Cloudflare 则使用 npm 中的主题。请将个性化配置放在根目录 `_config.butterfly.yml`，避免直接修改主题源码。

## 验证上线

- 首页、归档、标签、分类、关于页面可以打开。
- 搜索“博客”能找到文章，深色模式可切换。
- `/404.html` 存在；随机不存在的路径应返回 404。
- `/robots.txt` 与 `/sitemap.xml` 中的域名为 `https://joshuaxql.com`。

参考：[Cloudflare Hexo 部署指南](https://developers.cloudflare.com/pages/framework-guides/deploy-a-hexo-site/) · [自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/) · [Butterfly 文档](https://butterfly.js.org/)
