# joshuaxql blog

这是一个基于 Cloudflare Workers 的博客项目。

当前实现方式：

- `blog/*.md` 是博客源文件
- 构建时扫描 markdown，生成文章数据
- `worker.mjs` 提供 `/api/posts` 和 `/api/posts/:slug`
- `index.html`、`blog.html`、`post.html` 作为前端页面
- `dist/` 和 `.generated/` 都是构建产物，不需要手动维护

注意：
这个项目现在不是“运行时扫描 blog 文件夹”。
部署到 Cloudflare 后，文章数据是在构建时生成的。
所以你新增文章后，需要重新触发一次构建部署。

## 目录说明

- `blog/`
  博客 markdown 文件目录，一个 `.md` 文件就是一篇博客。
- `index.html`
  主页。
- `blog.html`
  归档页。
- `post.html`
  单篇文章页。
- `server.js`
  构建期文章解析逻辑。
- `build.js`
  构建脚本，负责扫描 `blog/*.md` 并生成部署产物。
- `worker.mjs`
  Cloudflare Worker 入口。
- `wrangler.jsonc`
  Cloudflare Worker 配置。
- `cursor.css` / `cursor.js`
  光标样式和交互逻辑。

## 本地开发

先安装依赖：

```powershell
npm install
```

启动本地预览：

```powershell
npm start
```

这条命令会先执行构建，再启动 `wrangler dev`。

如果你只想单独构建：

```powershell
npm run build
```

## 博客格式

每篇文章放在 `blog/` 目录下，使用 markdown 文件。

推荐格式：

````md
---
title: "文章标题"
date: "2026-05-13"
summary: "一句话摘要。"
tags: ["Tag1", "Tag2"]
---

# 一级标题

正文内容。

## 小节标题

更多内容。

```python
print("code block")
```

公式示例：$E = mc^2$

块级公式：

$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
````

建议遵守这些规则：

- `title`、`date`、`summary`、`tags` 都写上
- `date` 使用 `YYYY-MM-DD`
- 代码块尽量写语言名，比如 `python`、`js`、`bash`、`yaml`
- 正文里的 `##`、`###`、`####` 会自动生成右侧目录

## 部署到 Cloudflare

这个项目适合部署到 `Cloudflare Workers Builds`。

### 1. 推送到 GitHub

把源码推到 GitHub 仓库。

需要提交的内容：

- `blog/`
- `index.html`
- `blog.html`
- `post.html`
- `cursor.css`
- `cursor.js`
- `build.js`
- `server.js`
- `worker.mjs`
- `wrangler.jsonc`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `README.md`

不要提交：

- `node_modules/`
- `dist/`
- `.generated/`
- `.wrangler/`

### 2. 在 Cloudflare 创建 Worker

在 Cloudflare 控制台里连接你的 GitHub 仓库，选择这个项目。

构建配置填写：

- `Build command`
  `npm run build`
- `Deploy command`
  `npm run deploy:ci`
- `Root directory`
  留空，或者填仓库根目录

如果 Cloudflare 让你选生产分支，通常用：

- `main`

### 3. Worker 名称

当前 `wrangler.jsonc` 里默认是：

```json
"name": "joshuaxql-blog"
```

如果你想改部署后的 Worker 名称，直接改这个值。

### 4. 首次部署

Cloudflare 会在构建时执行：

1. `npm run build`
2. `npm run deploy:ci`

构建完成后，页面就会部署上线。

## 更新博客时要做什么

以后每次新增博客，流程是固定的：

1. 在 `blog/` 目录下新建一个 `.md`
2. 写好 front matter 和正文
3. 本地预览检查
4. 提交并推送到 GitHub
5. 等 Cloudflare 自动重新构建部署

最短流程就是：

1. 新建或修改 `blog/*.md`
2. 本地执行 `npm start`
3. 确认页面正常后执行 `git add .`、`git commit`、`git push`
4. 等 Cloudflare 自动部署完成

也就是：

```powershell
npm start
```

确认本地没问题后：

```powershell
git add .
git commit -m "add new post"
git push
```

推送后 Cloudflare 会自动重新部署。

如果你只是改已有文章，不是新增文章，流程完全一样。

如果你不走 GitHub 自动部署，也可以在本地直接执行：

```powershell
npm run deploy
```

这会先构建，再用 Wrangler 直接发布到 Cloudflare。

## 修改页面样式或功能时要做什么

如果你修改的是这些文件：

- `index.html`
- `blog.html`
- `post.html`
- `cursor.css`
- `cursor.js`
- `worker.mjs`
- `server.js`
- `build.js`

流程和更新博客一样：

1. 本地跑 `npm start`
2. 检查页面和接口
3. 提交
4. 推送
5. 等 Cloudflare 自动部署

## 常用命令

安装依赖：

```powershell
npm install
```

本地开发：

```powershell
npm start
```

只构建：

```powershell
npm run build
```

手动部署到 Cloudflare：

```powershell
npm run deploy
```

注意：
手动部署需要你本地已经完成 Wrangler 登录，或者配置了 Cloudflare 认证信息。

## 当前已实现的正文能力

- Markdown 渲染
- LaTeX 数学公式
- 代码高亮
- 自动目录跳转
- 单篇文章上下篇导航
- 自定义光标效果

## 备注

如果你发现：

- 新文章没有显示
- 代码高亮没有更新
- 目录没变化

先检查是否已经重新执行构建或重新部署。
因为这个项目的文章数据是在构建时生成的，不是线上实时扫目录。
