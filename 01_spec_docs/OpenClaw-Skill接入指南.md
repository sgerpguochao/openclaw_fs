# OpenClaw Skill 接入指南

本文档详细介绍 OpenClaw 中 Skill（技能）的多种接入方式，并重点说明本次 Tavily Search 接入所采用的方案。

---

## 一、Skill 概述

在 OpenClaw 中，**Skill** 是一种让 AI Agent 具备特定能力的技术手段。根据实现方式不同，可以分为两类：

| 类型 | 注册方式 | 调用方式 | 适用场景 |
|------|----------|----------|----------|
| **Plugin Tool** | `api.registerTool()` | Agent 直接调用（函数调用） | 需要精确参数控制、类型安全、API 封装 |
| **Workspace Skill** | SKILL.md 文件 | `/command` 文本调用或自然语言触发 | 需要自然语言描述、多步骤复杂操作 |

---

## 二、Skill 接入方式详解

### 2.1 方式一：Plugin Tool（插件工具）

这种方式注册的 Skill 会被 Agent 直接作为函数调用，类似于传统意义上的工具函数。

#### 适用场景

- 需要精确参数控制
- 需要类型安全
- 需要直接返回结构化数据
- 需要封装外部 API/SDK 能力

#### 实现步骤

1. **创建 Skill 文件**

```typescript
// extensions/<plugin>/src/my-skill.ts
import { Type } from "@sinclair/typebox";

export const MySkillSchema = Type.Object({
  action: Type.Union([
    Type.Literal("action1"),
    Type.Literal("action2"),
  ]),
  param1: Type.String(),
});

export function registerMySkill(api: OpenClawPluginApi, config: MyConfig) {
  // 根据配置决定是否注册
  if (!config.tools?.mySkill) {
    return;
  }

  api.registerTool(
    (ctx) => {
      const defaultAccountId = ctx.agentAccountId;
      return {
        name: "my_skill",
        label: "My Skill",
        description: "Description of what this skill does",
        parameters: MySkillSchema,
        async execute(_toolCallId, params) {
          // 实现逻辑
          return { success: true, data: "result" };
        },
      };
    },
    { optional: true }
  );
}
```

2. **在 Plugin 注册函数中调用**

```typescript
// extensions/<plugin>/src/channel.ts
import { registerMySkill } from "./my-skill.js";

export function createChannelPlugin(config: MyConfig): ChannelPlugin {
  return {
    id: "mychannel",
    // ... 其他配置
    register(api: OpenClawPluginApi) {
      api.registerChannel(this);
      registerMySkill(api, config);  // 注册 Skill
    },
  };
}
```

3. **配置 openclaw.plugin.json**

```json
{
  "id": "my-skill",
  "name": "My Custom Skill",
  "description": "A custom skill description",
  "configSchema": {
    "type": "object",
    "properties": {}
  }
}
```

#### 核心文件

| 文件 | 说明 |
|------|------|
| `src/plugins/types.ts` | Plugin Tool 注册 API 定义 |
| `src/plugins/tools.ts` | Plugin Tool 加载逻辑 |
| `extensions/<plugin>/src/*.ts` | 具体 Skill 实现 |

---

### 2.2 方式二：Workspace Skill（工作区技能）

这种方式注册的 Skill 通过 `/command` 文本调用或自然语言描述触发，Skill 的能力定义在 SKILL.md 文件中。

#### 适用场景

- 需要自然语言描述
- 需要 LLM 理解后自行构造参数
- 需要多步骤复杂操作
- 需要灵活的工具调用方式

#### 实现步骤

1. **创建 Skill 目录和 SKILL.md**

```
skills/
└── my-skill/
    └── SKILL.md
```

2. **编写 SKILL.md**

```markdown
---
name: my-skill
description: "Description of what this skill does. Use when: user wants to..."
emoji: 🔧
requires:
  bins:
    - curl
  env:
    - MY_API_KEY
---

# My Skill

## When to Use

✅ **USE this skill when:**
- User wants to do X
- User asks about Y

❌ **DON'T use this skill when:**
- User wants to do Z

## Commands

### Basic Usage

```bash
curl -s "https://api.example.com/search?q=$1"
```

### Advanced Usage

```bash
curl -s "https://api.example.com/search" \
  -H "Authorization: Bearer $MY_API_KEY" \
  -d '{"query": "'$1'"}'
```

## Configuration

Set the API key:

```bash
export MY_API_KEY="your-api-key"
```
```

#### SKILL.md Frontmatter 规范

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | Skill 名称（必需） |
| `description` | string | Skill 描述（必需） |
| `emoji` | string | 表情图标 |
| `command-dispatch` | string | 命令分发方式，可选 `tool` |
| `toolName` | string | 当 command-dispatch=tool 时指定工具名 |
| `requires.bins` | string[] | 依赖的系统命令 |
| `requires.env` | string[] | 依赖的环境变量 |

#### 核心文件

| 文件 | 说明 |
|------|------|
| `src/agents/skills/types.ts` | Skill 类型定义 |
| `src/agents/skills/workspace.ts` | Skill 工作区加载逻辑 |
| `src/agents/skills/bundled-dir.ts` | 内置 Skill 目录解析 |
| `skills/*/SKILL.md` | Skill 定义文件 |

---

### 2.3 方式三：Plugin 内嵌 Workspace Skill

在已有 Plugin 中嵌入 Workspace Skill，让 Skill 与 Channel 一起加载。

#### 实现步骤

1. **在 Plugin 中添加 skills 目录**

```
extensions/feishu/
├── skills/
│   ├── feishu-doc/
│   │   └── SKILL.md
│   └── feishu-wiki/
│       └── SKILL.md
├── openclaw.plugin.json
└── src/
    └── channel.ts
```

2. **配置 openclaw.plugin.json**

```json
{
  "id": "feishu",
  "channels": ["feishu"],
  "skills": ["./skills"]
}
```

---

### 2.4 方式四：添加新的 Web Search Provider

如果需要将新的搜索服务（如 Tavily）作为 `web_search` 工具的原生 provider，需要修改核心代码。

#### 实现步骤

1. **修改 `src/agents/tools/web-search.ts`**

```typescript
// 添加 Tavily provider 支持
function resolveSearchProvider(search?: WebSearchConfig): (typeof SEARCH_PROVIDERS)[number] {
  // ... 现有逻辑 ...
  
  // 添加 Tavily 自动检测
  if (resolveTavilyApiKey(search)) {
    return "tavily";
  }
  
  return "brave"; // 默认
}
```

2. **添加 Tavily 搜索实现**

```typescript
async function runTavilySearchApi(params: TavilySearchParams) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: params.apiKey,
      query: params.query,
      search_depth: params.searchDepth || "basic",
      max_results: params.maxResults || 5,
    }),
  });
  return response.json();
}
```

3. **在配置中添加 provider 选项**

在 `src/config/types.tools.ts` 中添加 tavily 配置。

---

## 三、本次接入方案：Tavily Search

### 3.1 采用方案

本次接入采用 **方式二：Workspace Skill**，具体为在 `skills/` 目录下创建 Tavily Search Skill。

### 3.2 实施步骤

#### 步骤 1：创建 Skill 目录

```bash
mkdir -p skills/tavily-search
```

#### 步骤 2：编写 SKILL.md

详细定义 Skill 的使用方式、参数、示例等。参见 `skills/tavily-search/SKILL.md`。

#### 步骤 3：配置 API Key

在 `start.sh` 中添加环境变量：

```bash
export TAVILY_API_KEY="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"
```

### 3.3 配置文件位置

| 文件 | 说明 |
|------|------|
| `skills/tavily-search/SKILL.md` | Skill 定义文件 |
| `start.sh` | 启动脚本（API Key 环境变量） |

### 3.4 使用方式

1. **自然语言触发**: 描述需要搜索的内容，Agent 会根据 SKILL.md 中的描述调用 Tavily API
2. **命令触发**: 如果启用 native skills，可使用 `/tavily-search` 命令

### 3.5 方案优势

- **无需修改核心代码**: 只需添加 SKILL.md 文件
- **快速部署**: Skill 文件放在 `skills/` 目录后自动加载
- **灵活调用**: Agent 可以根据自然语言描述自主决定如何调用

### 3.6 方案局限

- **调用方式受限**: 通过 curl 调用，不如原生 Tool 直接
- **参数控制**: 依赖 Agent 理解 SKILL.md 后构造参数
- **无类型安全**: 不如 Plugin Tool 有严格的类型检查

---

## 四、配置参考

### 4.1 全局 Skill 配置

在 `openclaw.gateway-dev.json` 中：

```json
{
  "commands": {
    "native": "auto",
    "nativeSkills": "auto"
  }
}
```

| 配置项 | 说明 | 可选值 |
|--------|------|--------|
| `native` | 是否注册原生命令 | `"auto"`, `true`, `false` |
| `nativeSkills` | 是否注册 Skill 命令 | `"auto"`, `true`, `false` |

### 4.2 Skill 加载目录

OpenClaw 会从以下目录加载 Skills：

1. **内置 Skills**: `openclaw/skills/`
2. **工作区 Skills**: `<workspace>/skills/`
3. **Plugin Skills**: `<plugin>/skills/`

---

## 五、总结

| 接入方式 | 复杂度 | 调用方式 | 适用场景 |
|----------|--------|----------|----------|
| Plugin Tool | 高 | 函数调用 | 需要精确控制、类型安全 |
| Workspace Skill | 低 | 命令/自然语言 | 快速接入、灵活调用 |
| Plugin 内嵌 Skill | 中 | 命令/自然语言 | 与 Channel 紧密集成 |
| Web Search Provider | 高 | 工具调用 | 需要作为原生工具 |

**本次选择 Workspace Skill 方案**，是因为：
1. 实现简单，无需修改核心代码
2. 部署快速，添加文件即可生效
3. 足够灵活，能够满足当前搜索需求
