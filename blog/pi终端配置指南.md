---
title: "Pi 终端配置指南：从零搭建一个顺手 AI 编程环境"
date: "2026-07-28"
summary: "记录我的 Pi 终端配置过程，包括模型选择、插件安装、rtk 省 token、子智能体等，希望对入手 Pi 的朋友有所参考。"
tags: ["Tutorial", "Agent"]
---

之前一直用 VS Code + GitHub Copilot 写代码，老实说也挺顺手。但自从在 Opencode 里用了 Oh My OpenAgent 之后，发现"多agent"这个范式确实有它独到的地方。后来在 B 站刷到 Pi，了解到它是极简 AI agent 设计时，支持 extension + skill 的插件体系，果断入坑。

踩了两天坑，终于配到满意。记录一下，给自己备忘，也给想入坑的朋友一个参考。

# 为什么选 Pi

市面上终端 AI 工具有好几款。Opencode 成熟但有很多bug，Claude Code 能力强但贵而且喜欢做小动作，Codex harness能力不太行。Pi 吸引我的是三点：

1. **开源**。采用MIT开源协议，不会像cc那样偷偷改日期格式恶心我们。
2. **精简**。Pi 的系统提示和工具定义加起来不到 1000 个 token，默认只提供四个tool
3. **生态**。可以通过社区大量的 extension 进行拓展，来实现适合自己的agent。

# 第一步：安装 Pi

Pi 是个 npm 全局包，前提是装了 Node.js 和 Git。

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

装完跑一下 `pi --help`，确认能启动。Windows 用户注意——Pi 依赖 bash shell，如果没有的话先装 Git for Windows，然后在`~/.pi/agent/settings.json`加入

```json
{
  "shellPath": "...\\Git\\bin\\bash.exe"
}
```

# 第二步：配模型

Pi 启动时会引导你选 provider 和 model，但我习惯直接改 `~/.pi/agent/settings.json`。

我的主力是 Codex 线路，默认模型选 `gpt-5.6-terra`，日常编码速度和智商比较均衡。轻量任务（搜代码、简单脚本）用 `gpt-5.6-luna`，复杂架构规划上 `gpt-5.6-sol`。

```json
{
  "defaultProvider": "openai-codex",
  "defaultModel": "gpt-5.6-terra",
  "defaultThinkingLevel": "high"
}
```

另外在 `auth.json` 里加了 DeepSeek 的 API Key 做备用。哪天订阅触发了也不至于没法用。

# 第三步：装插件

Pi 的插件用 `pi install` 安装，本质上就是在 `~/.pi/agent/npm/package.json` 里加依赖。我装了这些：

| 插件 | 作用 |
| :--- | :--- |
| `pi-web-access` | 网页搜索（Pi 原生支持，不需要 MCP） |
| `pi-powerline-footer` | Powerline风格的状态栏 |
| `pi-tool-display` | opencode风格显示工具调用 |
| `pi-rewind` | 回退对话和文件 |
| `pi-cache-optimizer` | 缓存优化，省 token |
| `@tintinweb/pi-subagents` | 子智能体系统 |
| `@juicesharp/rpiv-todo` | 任务清单追踪 |

安装命令：

```bash
pi install npm:pi-web-access
pi install npm:pi-powerline-footer
pi install npm:pi-tool-display
pi install npm:pi-rewind
pi install npm:pi-cache-optimizer
pi install npm:@tintinweb/pi-subagents
pi install npm:@juicesharp/rpiv-todo
```

注：pi-powerline-footer插件会有一个启动弹窗，可以在`~/.pi/agent/settings.json`加入

```json
{
  "quietStartup": true
}
```

# 第四步：rtk 省 token

rtk的作用很直观：把冗长的 shell 命令输出压缩成紧凑格式。比如 `git status` 的输出本来好几十行，rtk 改写之后只保留最关键的信息。整个过程是透明的——你敲的还是原来的命令，但发给模型的 token 少了一大截。

rtk 实际上是一个 Rust 写的命令行工具，Pi 只是通过 extension 调用它。

安装rtk可以通过winget

```bash
winget install --id=rtk-ai.rtk -e
```

```bash
rtk init --agent pi --global
```

这条命令会在 `~/.pi/agent/extensions/rtk.ts` 生成一个扩展文件。原理不复杂：用 Pi 的 `tool_call` 事件拦截 `bash` 工具调用，把命令传给 `rtk rewrite` 处理，返回精简版本。

重启 Pi 或用 `/reload` 加载后，跑一个啰嗦的命令就能验证效果。像我这种一个会话跑几十个命令的人，这个插件省下的 token 不是小数目。

# 第五步：子智能体

`@tintinweb/pi-subagents` 给 Pi 加上了类似 Claude Code 的子智能体能力——主 agent 可以派生子 agent 去独立执行任务，每个子 agent 有自己的模型、系统提示和思考等级。

我设了两个子智能体，分别对应不同场景：

| 智能体 | 模型 | 用途 |
| :--- | :--- | :--- |
| Explore | `gpt-5.6-luna` | 快速搜索代码、定位符号 |
| Plan | `gpt-5.6-sol` | 架构设计、实现方案 |

子智能体的定义文件放在 `~/.pi/agent/agents/`，格式是带 frontmatter 的 markdown。以 Explore 为例：

```markdown
---
name: Explore
description: Fast read-only search agent for locating code, files, and symbols
model: openai-codex/gpt-5.6-luna
---

You are a fast, read-only search agent...
```

这样主 agent 遇到"帮我找一下这个函数在哪里定义的"这种问题，就会自动派 Explore 去查，又快又便宜。

# 最终的配置文件一览

配完之后，`~/.pi/agent/` 的结构大概是这样：

```
~/.pi/agent/
├── AGENTS.md                  # 全局规则
├── auth.json                  # API Key
├── settings.json              # 主配置（provider/model/theme/plugins）
├── agents/                    # 子智能体定义
│   ├── Explore.md
│   └── Plan.md
├── extensions/
│   └── rtk.ts                 # rtk 省 token 扩展
├── npm/                       # 插件目录
│   └── node_modules/
└── sessions/                  # 会话记录
```

# 总结

整个配置下来花了两三个小时，但换来的体验对得起这个时间。现在在终端里 `pi` 一把梭，从搜代码到写功能到调试，全在一个会话里完成。
如果你也在用 Pi 或者准备入坑，推荐先读一遍我的配置过程，再结合自己的需求做加减。配置这件事，别人给的只是参考，自己调出来的才顺手。
