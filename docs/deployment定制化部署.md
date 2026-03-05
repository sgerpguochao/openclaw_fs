# OpenClaw 本地部署指南

本文档详细介绍如何在 Linux 服务器上从源码部署 OpenClaw 项目。

## 环境要求

| 依赖项 | 版本要求 | 说明 |
|--------|----------|------|
| **Node.js** | ≥ 22.12.0 | 推荐使用 Node 22+ |
| **pnpm** | 10.23.0 | 项目包管理器 |
| **Git** | 任意版本 | 代码版本管理 |

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/sgerpguochao/openclaw_fs.git
cd openclaw_fs
```

### 2. 安装依赖

```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm@10.23.0

# 安装项目依赖
pnpm install
```

### 3. 构建项目

```bash
pnpm build
```

> **注意**: 首次构建时需要创建 A2UI bundle 占位文件:
> ```bash
> echo '// A2UI placeholder bundle' > src/canvas-host/a2ui/a2ui.bundle.js
> echo 'placeholder_hash_for_development' > src/canvas-host/a2ui/.bundle.hash
> ```

### 4. 配置 Gateway

```bash
# 设置允许跨域访问 (远程访问需要)
pnpm openclaw config set gateway.controlUi.allowedOrigins '["http://你的IP:5173","http://你的IP:18789"]'

# 允许非安全上下文认证 (HTTP 访问需要)
pnpm openclaw config set gateway.controlUi.allowInsecureAuth true

# 禁用设备认证 (远程访问需要)
pnpm openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true

# 允许 Host header 源回退
pnpm openclaw config set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback true
```

### 5. 启动服务

```bash
# 使用启停脚本
./start.sh   # 启动 Gateway + Control UI
./stop.sh    # 停止所有服务
```

## 详细配置说明

### 配置文件位置

配置文件位于 `~/.openclaw/openclaw.json`

### 完整配置示例

```json
{
  "gateway": {
    "controlUi": {
      "allowedOrigins": [
        "http://117.50.174.50:5173",
        "http://117.50.174.50:18789",
        "http://10.60.30.145:5173",
        "http://10.60.30.145:18789",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:18789"
      ],
      "dangerouslyAllowHostHeaderOriginFallback": true,
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true
    },
    "auth": {
      "mode": "token",
      "token": "你的网关令牌"
    }
  }
}
```

### 配置项说明

| 配置项 | 说明 | 值 |
|--------|------|-----|
| `gateway.controlUi.allowedOrigins` | 允许的跨域来源 | 数组，包含所有可能访问的 URL |
| `gateway.controlUi.allowInsecureAuth` | 允许非安全上下文认证 | `true` |
| `gateway.controlUi.dangerouslyDisableDeviceAuth` | 禁用设备认证 | `true` |
| `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | 允许 Host header 源回退 | `true` |
| `gateway.auth.token` | 网关认证令牌 | 自定义令牌 |

### 网关令牌

网关令牌用于 Control UI 连接认证。可以在配置文件中设置：

```bash
# 生成随机令牌
openssl rand -hex 16

# 或在启动脚本中通过环境变量设置
export OPENCLAW_GATEWAY_TOKEN="你的令牌"
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| **Gateway** | 18789 | 后端服务，支持 WebSocket 连接 |
| **Control UI** | 5173 | 前端 Web 界面 (Vite 开发服务器) |

## 访问地址

假设服务器 IP 为 `117.50.174.50`:

| 服务 | 访问地址 |
|------|----------|
| **Gateway** | `http://117.50.174.50:18789` |
| **Control UI** | `http://117.50.174.50:5173` |

## Control UI 连接配置

在浏览器中访问 Control UI 后，需要配置以下连接信息：

| 字段 | 值 |
|------|-----|
| **WebSocket URL** | `ws://117.50.174.50:18789/apps/openclaw` |
| **网关令牌** | 配置的令牌 |
| **默认会话密钥** | `main` |

## 启停脚本说明

### start.sh

启动脚本会依次启动：
1. Gateway (后端)
2. Control UI (前端)

```bash
./start.sh
```

输出示例：
```
============================================
OpenClaw 启动完成!
============================================

Gateway (后端):
  - 本地: http://127.0.0.1:18789
  - 局域网: http://10.60.30.145:18789
  - 外网: http://117.50.174.50:18789

Control UI (前端):
  - 本地: http://127.0.0.1:5173
  - 局域网: http://10.60.30.145:5173
  - 外网: http://117.50.174.50:5173
```

### stop.sh

停止脚本会：
1. 停止 Gateway 进程
2. 停止 Control UI 进程
3. 清理可能残留的浏览器控制进程

```bash
./stop.sh
```

### 查看日志

```bash
# 查看 Gateway 日志
tail -f /tmp/openclaw/openclaw-2026-03-05.log

# 查看 Control UI 日志
tail -f /tmp/openclaw/openclaw-ui-2026-03-05.log
```

## 手动启动 (不使用脚本)

### 1. 启动 Gateway

```bash
export OPENCLAW_GATEWAY_TOKEN="你的令牌"
pnpm openclaw gateway --port 18789 --bind lan --allow-unconfigured --force --verbose
```

### 2. 启动 Control UI

```bash
cd ui
pnpm dev
```

## 常见问题

### Q1: 外网无法访问?

检查以下几点：
1. 服务器防火墙是否开放了 18789 和 5173 端口
2. 如果是通过 NAT 端口映射，确认端口已正确映射
3. 配置文件中是否设置了 `allowedOrigins`

### Q2: 连接报错 "origin not allowed"?

需要在配置中添加允许的 origin:
```bash
pnpm openclaw config set gateway.controlUi.allowedOrigins '["http://你的IP:端口"]'
```

### Q3: 连接报错 "control ui requires device identity"?

需要禁用设备认证:
```bash
pnpm openclaw config set gateway.controlUi.dangerouslyDisableDeviceAuth true
```

### Q4: 连接报错 "gateway token mismatch"?

确认配置文件中 `gateway.auth.token` 与 Control UI 中输入的令牌一致。

## 生产环境建议

1. **使用 HTTPS**: 生产环境建议配置 HTTPS 访问
2. **安全令牌**: 使用强随机令牌，不要使用简单密码
3. **限制 origins**: 只添加必要的 allowedOrigins
4. **定期更新**: 关注项目更新，及时升级版本

## 相关文档

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [GitHub 仓库](https://github.com/sgerpguochao/openclaw_fs)
