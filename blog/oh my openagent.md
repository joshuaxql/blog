---
title: "Oh My OpenAgent（Oh My Opencode）安装与配置指南"
date: "2026-05-25"
summary: "Oh My OpenAgent 使用总结与配置分享。"
tags: ["Tutorial", "Agent"]
---

# 为什么要用 Oh My OpenAgent？

我用过 Claude、GPT，也用过国产的 DeepSeek、GLM、MiniMax 等顶级大模型，它们各有千秋。
有没有办法扬长避短呢？Oh My OpenAgent 给出了答案：把不同的任务分配给擅长的模型，简单任务由便宜好用的模型完成，复杂任务则交给顶级模型处理。

# 安装 Opencode

要使用 Oh My OpenAgent，需先安装 [Opencode](https://opencode.ai/)。推荐通过 npm 安装，请确保电脑上已安装 [Node.js](https://nodejs.org/zh-cn)。

```powershell
npm i -g opencode-ai
```

运行以下命令验证是否安装成功：

```powershell
opencode
```

然后输入 `/connect` 连接你订阅的模型提供商。

# 安装 Oh My OpenAgent

在 Opencode 中输入以下提示词，让 Opencode 自动帮你下载安装：

```
按照以下说明安装和配置 oh-my-opencode：
https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/refs/heads/master/docs/guide/installation.md
```

# 配置 Oh My OpenAgent

Oh My OpenAgent 内置了多个子智能体，下面是每个智能体的详细介绍：

| 类别                | 智能体                | 角色定位   | 推荐模型                              | 职责描述                                                         |
| :------------------ | :-------------------- | :--------- | :------------------------------------ | :--------------------------------------------------------------- |
| **核心智囊 (Core)** | **Sisyphus**          | 主编排器   | claude-opus-4-7 / kimi-k2.6 / glm-5.1 | 团队总指挥，负责拆解任务、分配工作、管理进度，确保彻底完成。     |
|                     | **Hephaestus**        | 深度工作者 | gpt-5.5                               | 正牌工匠，擅长端到端执行跨文件复杂开发任务，代码质量高。         |
|                     | **Oracle**            | 架构顾问   | claude-opus-4-7 / kimi-k2.6 / glm-5.1 | 只读 AI 架构师，用于代码审查、复杂调试与架构决策。               |
|                     | **Librarian**         | 研究员     | minimax-m2.7 / deepseek-v4-flash      | 负责多仓库分析、文档查询和开源实现调研。                         |
|                     | **Explore**           | 代码搜索员 | minimax-m2.7 / deepseek-v4-flash      | 快速搜索代码库，进行上下文感知的代码查找。                       |
|                     | **Multimodal-Looker** | 视觉专家   | gemini-3.1-pro                        | 分析图像、PDF、图表等多模态内容以提取信息。                      |

以下是我的个人配置（我订阅了 ChatGPT Plus、Opencode Go 和 GitHub Copilot 教育版）：
```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
  "default_run_agent": "sisyphus",
  "agents": {
    "sisyphus": {
      "model": "opencode-go/glm-5.1",
      "variant": "high"
    },
    "hephaestus": {
      "model": "openai/gpt-5.5",
      "variant": "medium"
    },
    "oracle": {
      "model": "opencode-go/glm-5.1",
      "variant": "high"
    },
    "explore": {
      "model": "opencode-go/deepseek-v4-flash"
    },
    "librarian": {
      "model": "opencode-go/deepseek-v4-flash"
    },
    "multimodal-looker": {
      "model": "github-copilot/gemini-3.1-pro-preview",
      "variant": "high"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "github-copilot/gemini-3.1-pro-preview",
      "variant": "high"
    },
    "ultrabrain": {
      "model": "openai/gpt-5.5",
      "variant": "xhigh"
    },
    "deep": {
      "model": "opencode-go/glm-5.1",
      "variant": "high"
    },
    "artistry": {
      "model": "github-copilot/gemini-3.1-pro-preview",
      "variant": "high"
    },
    "quick": {
      "model": "opencode-go/deepseek-v4-flash"
    },
    "unspecified-low": {
      "model": "opencode-go/deepseek-v4-flash"
    },
    "unspecified-high": {
      "model": "opencode-go/glm-5.1",
      "variant": "max"
    },
    "writing": {
      "model": "opencode-go/deepseek-v4-pro",
      "variant": "high"
    }
  }
}
```

# 使用 Oh My OpenAgent

### 魔法词（Modes）

在提示词中直接包含以下关键词即可激活对应模式：

| 关键词 | 说明 |
| :--- | :--- |
| `ultrawork` 或 `ulw` | 全编排模式，自动调用子智能体，不完成不停止 |
| `search` | 聚焦网络和文档搜索 |
| `analyze` | 深度分析模式 |
| `team` | 启用 Team Mode 多智能体并行协作（需先开启配置） |
| `hyperplan` | 启动 5 个对抗性审查者帮你拆解方案 |

### 斜杠命令（Slash Commands）

| 命令 | 说明 |
| :--- | :--- |
| `/start-work` | 召唤 Prometheus 采访你，制定计划后自动执行 |
| `/init-deep` | 在项目中自动生成多级 `AGENTS.md` 文件 |
| `/ralph-loop` | 自指循环，持续工作直到 100% 完成 |
| `/ulw-loop` | `ultrawork` 模式下的循环变体 |
| `/refactor` | LSP + AST-grep + 测试驱动的智能重构 |
| `/handoff` | 生成详细的上下文摘要，用于在新建会话中继续工作 |
| `/remove-ai-slops` | 清除最近改动中的 AI 代码异味 |
| `/cancel-ralph` | 停止正在运行的 Ralph 循环 |
| `/stop-continuation` | 停止循环 + 待办续推 |

### 使用技巧

- **懒人模式**：只需在提示词中包含 `ulw`，Sisyphus 会自动分析代码库、调研模式、实现功能、验证结果，直到做完为止。
- **精准模式**：按 **Tab** 键进入 Prometheus 规划模式，回答他的问题形成验证过的方案，然后运行 `/start-work` 交给 Atlas 执行。
- **分类路由**：Sisyphus 会根据任务类型自动路由——`visual-engineering` 走 Gemini，`ultrabrain` 走 GPT-5.5，`quick` 走快速便宜模型，无需手动指定。
- **团队模式**：在配置中开启 `team_mode.enabled: true` 后，Sisyphus 可以创建最多 8 个并行成员，实时在 tmux 中可视化协作进度。
- **内置技能**：`playwright`（浏览器自动化）、`git-master`（原子提交与变基）、`frontend`（前端开发）、`review-work`（代码审查）等技能会在任务匹配时自动加载。

更多详细使用指南，请前往 [oh-my-openagent GitHub 仓库](https://github.com/code-yeongyu/oh-my-openagent) 查看。

# 结语

希望你能借助这个 AI 团队，做出自己意想不到的惊艳成果。