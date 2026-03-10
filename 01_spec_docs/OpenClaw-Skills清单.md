# OpenClaw Skills 技能清单

本文档整理了所有已集成到项目中的 Skills，包括能力说明、可用状态、依赖配置等信息。

---

## 一、已安装 Skills 总览

| 序号 | Skill 名称 | 能力说明 | 可用状态 | 需要配置 |
|------|------------|----------|----------|----------|
| 1 | weather | 天气查询 | ✅ 可用 | 无需 API Key |
| 2 | tavily-search | 网络搜索 | ✅ 可用 | TAVILY_API_KEY ✅ 已配置 |
| 3 | summarize | URL/文件摘要 | ⚠️ 需安装 CLI | summarize CLI |
| 4 | markdown-converter | 文档转 Markdown | ⚠️ 需安装 CLI | uvx markitdown |
| 5 | agent-browser | 浏览器自动化 | ✅ 已测试 | agent-browser ✅ 已安装 |
| 6 | skill-finder-cn | 技能搜索 | ✅ 可用 | clawhub ✅ 已安装 |
| 7 | skill-vetter | 技能安全审查 | ✅ 可用 | 无需配置 |
| 8 | self-improving | 自我改进 | ✅ 可用 | 无需配置 |
| 9 | nano-pdf | PDF 编辑 | ⚠️ 需安装 CLI | nano-pdf CLI |
| 10 | word-docx | Word 文档处理 | ✅ 可用 | 无需配置 |
| 11 | powerpoint-pptx | PPT 文档处理 | ✅ 可用 | python3 |
| 12 | frontend-design-ultimate | 前端设计 | ✅ 可用 | 无需配置 |
| 13 | vercel-platform | Vercel 部署 | ⚠️ 需安装 CLI | vercel CLI |
| 14 | data-analyst | 数据分析 | ✅ 可用 | 无需配置 |
| 15 | agent-browser | 浏览器控制 | ✅ 已测试 | ✅ 已安装 |
| 16 | using-superpowers | 技能调用指南 | ✅ 可用 | 无需配置 |
| 17 | xurl | X (Twitter) API | ⚠️ 需配置 | X API Key |
| 18 | notion | Notion 集成 | ⚠️ 需配置 | Notion API Key |
| 19 | obsidian | Obsidian 笔记 | ✅ 可用 | 无需配置 |
| 20 | github | GitHub 操作 | ⚠️ 需配置 | gh CLI + auth |
| 21 | slack | Slack 集成 | ⚠️ 需配置 | channels.slack 配置 |
| 22 | discord | Discord 集成 | ⚠️ 需配置 | channels.discord 配置 |
| 23 | spotify-player | Spotify 控制 | ⚠️ 需配置 | Spotify 账号 |
| 24 | 1password | 1Password 集成 | ⚠️ 需配置 | 1Password CLI |

---

## 二、Skills 详细说明

### 2.1 开箱即用（无需配置）

#### 1. weather - 天气查询
- **能力**: 获取当前天气和天气预报
- **依赖**: curl
- **状态**: ✅ 可直接使用
- **命令**: `curl wttr.in/London`

#### 2. skill-vetter - 技能安全审查
- **能力**: AI Agent 安全审查协议，安装第三方技能前进行安全检查
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 3. self-improving - 自我改进
- **能力**: 自我反思、自我批评、持续学习
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 4. word-docx - Word 文档
- **能力**: Word 文档结构、样式、兼容性知识
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 5. powerpoint-pptx - PPT 文档
- **能力**: PPTX 文件结构、图表、设计知识
- **依赖**: python3
- **状态**: ✅ 可直接使用

#### 6. frontend-design-ultimate - 前端设计
- **能力**: React + Tailwind + shadcn/ui 前端开发
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 7. data-analyst - 数据分析
- **能力**: 数据可视化、SQL 查询、报表生成
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 8. using-superpowers - 技能使用指南
- **能力**: 指导如何查找和使用技能
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 9. obsidian - Obsidian 笔记
- **能力**: Obsidian  vaults 操作和自动化
- **依赖**: 无
- **状态**: ✅ 可直接使用

#### 10. session-logs - 会话日志
- **能力**: 搜索和分析会话历史
- **依赖**: jq, rg
- **状态**: ⚠️ 需安装 jq, rg

---

### 2.2 已配置（需安装依赖）

#### 11. tavily-search - 网络搜索
- **能力**: 使用 Tavily API 进行网络搜索
- **依赖**: TAVILY_API_KEY
- **配置状态**: ✅ 已配置（在 start.sh 中）
- **测试**: ✅ 可用

#### 12. skill-finder-cn - 技能搜索
- **能力**: 搜索和发现 ClawHub Skills
- **依赖**: clawhub
- **配置状态**: ✅ 已安装
- **测试**: ✅ 可用

#### 13. agent-browser - 浏览器自动化
- **能力**: 浏览器导航、点击、输入、截图
- **依赖**: agent-browser, node, npm
- **配置状态**: ✅ 已安装
- **测试**: ✅ 已测试通过

#### 14. summarize - URL/文件摘要
- **能力**: 总结 URLs、本地文件、YouTube
- **依赖**: summarize CLI
- **安装命令**: `brew install steipete/tap/summarize`
- **状态**: ⚠️ 需手动安装

#### 15. markdown-converter - 文档转换
- **能力**: PDF/Word/Excel 转 Markdown
- **依赖**: uvx markitdown
- **安装命令**: `uvx markitdown`
- **状态**: ⚠️ 需手动安装

#### 16. nano-pdf - PDF 编辑
- **能力**: 使用自然语言指令编辑 PDF
- **依赖**: nano-pdf
- **安装命令**: `uv install nano-pdf`
- **状态**: ⚠️ 需手动安装

---

### 2.3 需额外配置

#### 17. vercel-platform - Vercel 部署
- **能力**: Vercel 平台部署和管理
- **依赖**: vercel CLI
- **配置**: 需要 Vercel 账号登录
- **状态**: ⚠️ 需安装并登录

#### 18. notion - Notion 集成
- **能力**: Notion 页面和数据库操作
- **依赖**: Notion API Key
- **配置**: 需要 Notion Integration Token
- **状态**: ⚠️ 需配置

#### 19. github - GitHub 操作
- **能力**: Issues、PRs、CI 运行监控
- **依赖**: gh CLI + auth
- **配置**: 需要 `gh auth login`
- **状态**: ⚠️ 需配置

#### 20. slack - Slack 集成
- **能力**: Slack 消息控制
- **依赖**: channels.slack 配置
- **配置**: 需要 Slack Bot Token
- **状态**: ⚠️ 需配置

#### 21. discord - Discord 集成
- **能力**: Discord 消息控制
- **依赖**: channels.discord 配置
- **配置**: 需要 Discord Bot Token
- **状态**: ⚠️ 需配置

#### 22. xurl - X (Twitter) API
- **能力**: 发送推文、搜索、读取帖子
- **依赖**: X API Key
- **配置**: 需要 Twitter Developer Account
- **状态**: ⚠️ 需配置

#### 23. 1password - 1Password 集成
- **能力**: 1Password CLI 操作
- **依赖**: 1Password CLI (op)
- **配置**: 需要 1Password 账号
- **状态**: ⚠️ 需配置

#### 24. spotify-player - Spotify 控制
- **能力**: Spotify 播放控制
- **依赖**: Spotify 账号
- **配置**: 需要 Spotify API 权限
- **状态**: ⚠️ 需配置

---

## 三、环境变量配置

已在 `start.sh` 中配置的环境变量：

```bash
# 模型 API
export DASHSCOPE_API_KEY="sk-sp-c9fc8058dd184f5eb6cf560b04a900b2"

# Firecrawl (网页抓取)
export FIRECRAWL_API_KEY="fc-64f6dddeef4e4e56a482b1e9d5435949"

# Tavily (网络搜索)
export TAVILY_API_KEY="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"
```

---

## 四、已安装的全局 CLI 工具

| 工具 | 版本 | 用途 |
|------|------|------|
| clawhub | v0.7.0 | 技能搜索/安装 |
| agent-browser | - | 浏览器自动化 |
| npm/node | v24.13.0 | Node.js 环境 |

---

## 五、使用统计

- **总计 Skills**: 65+
- **开箱即用**: ~10
- **需安装依赖**: ~6
- **需额外配置**: ~10

---

## 六、测试通过的 Skills

| Skill | 测试时间 | 结果 |
|-------|----------|------|
| agent-browser | 2026-03-10 | ✅ 通过 |

---

*最后更新: 2026-03-10*
