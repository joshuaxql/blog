---
title: "Pi 终端配置指南：从零搭建一个顺手 AI 编程环境"
date: "2026-07-28"
summary: "记录我的 Pi 终端配置过程，包括模型选择、插件安装、rtk 省 token、MCP 服务器、子智能体等，希望对入手 Pi 的朋友有所参考。"
tags: ["Tutorial", "Agent"]
---

之前一直用 VS Code + GitHub Copilot 写代码，老实说也挺顺手。但自从在 Opencode 里用了 Oh My OpenAgent 之后，发现"终端里的 AI agent"这个范式确实有它独到的地方 —— 不用切窗口、上下文干净、agent 可以自己跑 shell 命令验证结果。后来在 B 站刷到 Pi，了解到它是极简 AI agent 设计时，支持 extension + skill 的插件体系，果断入坑。

踩了两天坑，终于配到满意。记录一下，给自己备忘，也给想入坑的朋友一个参考。

# 为什么选 Pi

市面上终端 AI 工具有好几款。Opencode 成熟稳定，Claude Code 能力强但贵，Codex 开着开着会话就崩。Pi 吸引我的是两点：

1. **开源**。采用MIT开源协议，不会像cc那样偷偷改日期格式恶心我们。
2. **插件体系**。Pi 本身功能很精简，可以通过社区大量的 extension 进行拓展，来实现适合自己的agent。

# 第一步：安装 Pi

Pi 是个 npm 全局包，前提是装了 Node.js 和 Git。

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

装完跑一下 `pi --help`，确认能启动。Windows 用户注意——Pi 依赖 bash shell，如果没有的话先装 Git for Windows。

# 第二步：kickstart.pi 打底

Pi 装好之后什么都还没有——没有模型、没有主题、没有插件。如果从零开始摸索，光看文档就能花半天。

这里推荐 [kickstart.pi](https://github.com/orionpax1997/kickstart.pi)，一个给 Pi 设计的"配置起点"。它的思路很简单：**每个文件都短小且有注释，每个决定都解释为什么这么做，但不替你做决定**。你拿到的是文档和安装指引，具体装什么、配什么，自己按需来。

我把仓库 clone 到临时目录，用 `cp -an` 把文档拷到 `~/.pi/agent/`，已有的配置文件不动：

```bash
repo_dir="$(mktemp -d)"
git clone https://github.com/orionpax1997/kickstart.pi "$repo_dir"
cp -an "$repo_dir"/. ~/.pi/agent/
rm -rf "$repo_dir"
```

# 第三步：配模型

Pi 启动时会引导你选 provider 和 model，但我习惯直接改 `~/.pi/agent/settings.json`。

我的主力是 Opencode Go 线路，默认模型选 `deepseek-v4-pro`，日常编码速度和智商比较均衡。轻量任务（搜代码、简单脚本）用 `deepseek-v4-flash`，复杂架构规划上 `glm-5.2`。

```json
{
  "defaultProvider": "opencode-go",
  "defaultModel": "deepseek-v4-pro",
  "defaultThinkingLevel": "max"
}
```

另外在 `auth.json` 里加了 DeepSeek 的 API Key 做备用。哪天订阅过期了也不至于没法用。

# 第四步：装插件

Pi 的插件用 `pi install` 安装，本质上就是在 `~/.pi/agent/npm/package.json` 里加依赖。我装了这些：

| 插件 | 作用 |
| :--- | :--- |
| `pi-web-access` | 网页搜索（Pi 原生支持，不需要 MCP） |
| `pi-cache-optimizer` | 缓存优化，省 token |
| `pi-mcp-adapter` | MCP 桥，让 Pi 能调用 MCP 服务器 |
| `pi-open-tui` | 终端美化：动画 logo、状态栏、telemetry |
| `@firstpick/pi-themes-bundle` | 十六套终端配色 |
| `@tintinweb/pi-subagents` | 子智能体系统 |
| `@juicesharp/rpiv-ask-user-question` | 选项式交互 UI |
| `@juicesharp/rpiv-todo` | 任务清单追踪 |

安装命令：

```bash
pi install npm:pi-web-access
pi install npm:pi-cache-optimizer
pi install npm:pi-mcp-adapter
pi install npm:pi-open-tui
pi install npm:@firstpick/pi-themes-bundle
pi install npm:@tintinweb/pi-subagents
pi install npm:@juicesharp/rpiv-ask-user-question
pi install npm:@juicesharp/rpiv-todo
```

# 第五步：rtk 省 token

[kickstart.pi](https://github.com/orionpax1997/kickstart.pi) 里唯一推荐**全局安装**的就是 rtk。它的作用很直观：把冗长的 shell 命令输出压缩成紧凑格式。比如 `git status` 的输出本来好几十行，rtk 改写之后只保留最关键的信息。整个过程是透明的——你敲的还是原来的命令，但发给模型的 token 少了一大截。

rtk 实际上是一个 Rust 写的命令行工具，Pi 只是通过 extension 调用它。安装过程在 kickstart.pi 的文档里，一条命令搞定：

```bash
rtk init --agent pi --global
```

这条命令会在 `~/.pi/agent/extensions/rtk.ts` 生成一个扩展文件。原理不复杂：用 Pi 的 `tool_call` 事件拦截 `bash` 工具调用，把命令传给 `rtk rewrite` 处理，返回精简版本。

重启 Pi 或用 `/reload` 加载后，跑一个啰嗦的命令就能验证效果。像我这种一个会话跑几十个命令的人，这个插件省下的 token 不是小数目。

# 第六步：MCP 服务器

虽然 Pi 本身不依赖 MCP，但整个 agent 生态的工具几乎都是 MCP 协议。通过 `pi-mcp-adapter` 桥接之后，大部分 MCP 服务器都能用。

我目前只装了 `context7`，用来查库和框架的最新文档：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "lifecycle": "lazy"
    }
  }
}
```

两个设置要点：
- `lifecycle: "lazy"` 表示用到才启动，不浪费资源
- 高频搜索类 MCP（比如 exa）可以设 `"eager"`，让 Pi 启动时就建立连接，第一次搜索不用等

kickstart.pi 推荐装三个：exa（网页搜索）、context7（库文档）、searchcode（公开代码搜索）。我因为已经装了 `pi-web-access` 做网页搜索，就暂时没加 exa 和 searchcode，按需再补。

# 第七步：子智能体

`@tintinweb/pi-subagents` 给 Pi 加上了类似 Claude Code 的子智能体能力——主 agent 可以派生子 agent 去独立执行任务，每个子 agent 有自己的模型、系统提示和思考等级。

我设了三个子智能体，分别对应不同场景：

| 智能体 | 模型 | 用途 |
| :--- | :--- | :--- |
| Explore | `deepseek-v4-flash` | 快速搜索代码、定位符号 |
| Plan | `glm-5.2` | 架构设计、实现方案 |
| general-purpose | `deepseek-v4-pro` | 复杂多步骤任务 |

子智能体的定义文件放在 `~/.pi/agent/agents/`，格式是带 frontmatter 的 markdown。以 Explore 为例：

```markdown
---
name: Explore
description: Fast read-only search agent for locating code, files, and symbols
model: opencode-go/deepseek-v4-flash
---

You are a fast, read-only search agent...
```

这样主 agent 遇到"帮我找一下这个函数在哪里定义的"这种问题，就会自动派 Explore 去查，又快又便宜。

# 第八步：美化

我是个颜控，终端不好看用着不舒服。两个美化插件：

**pi-open-tui** 给 Pi 加了三样东西：
- 顶部的彩色动画 Pi logo（16 帧，看着很舒服）
- 底部的状态栏：当前目录、git 分支和状态、模型名、token 计数、耗时、费用
- 圆角编辑器

用 `/open-tui` 命令可以逐个开关这些模块。

**pi-themes-bundle** 装了十六套配色。我选了 One Dark，跟 VS Code 主题一致，看着不违和。

在 `settings.json` 里设一下就行：

```json
{
  "theme": "one-dark/one-dark"
}
```

# 第九步：AGENTS.md

最后一步是写 `AGENTS.md`，相当于给 Pi 的 system prompt。我写得比较克制，就两条：

```markdown
# 全局规则
- 终端使用 git bash
- 始终用中文回复用户
```

**全局文件**放在 `~/.pi/agent/AGENTS.md`，每个会话都会加载。项目级的放在项目根目录，会覆盖全局设置——适合写项目结构、技术栈、编码规范这些。

# 最终的配置文件一览

配完之后，`~/.pi/agent/` 的结构大概是这样：

```
~/.pi/agent/
├── AGENTS.md                  # 全局规则
├── auth.json                  # API Key
├── mcp.json                   # MCP 服务器配置
├── settings.json              # 主配置（provider/model/theme/plugins）
├── open-tui.json              # TUI 美化设置
├── agents/                    # 子智能体定义
│   ├── Explore.md
│   ├── Plan.md
│   └── general-purpose.md
├── extensions/
│   └── rtk.ts                 # rtk 省 token 扩展
├── npm/                       # 插件目录
│   └── node_modules/
└── sessions/                  # 会话记录
```

# 总结

Pi 的配置过程本质上是回答三个问题：**用什么模型、加什么能力、好不好看**。kickstart.pi 帮你把这三个问题的答案准备好了，但它不代劳——你还是要读文档、做选择、改配置。

整个配置下来花了两三个小时，但换来的体验对得起这个时间。现在在终端里 `pi` 一把梭，从搜代码到写功能到调试，全在一个会话里完成。

如果你也在用 Pi 或者准备入坑，推荐先读一遍 [kickstart.pi 中文文档](https://github.com/orionpax1997/kickstart.pi/blob/main/README.zh-cn.md)，再结合自己的需求做加减。配置这件事，别人给的只是参考，自己调出来的才顺手。
