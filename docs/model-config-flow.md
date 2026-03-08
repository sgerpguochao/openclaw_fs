# OpenClaw 模型接入与配置保存流程详解

## 一、整体架构概述

OpenClaw 的模型配置涉及三个主要组件：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Control UI (前端)                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ui/src/ui/controllers/models.ts                                │   │
│  │ - loadModelsConfigFromGateway()  加载模型配置                   │   │
│  │ - saveModelsConfigToGateway()    保存模型配置                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket: config.set
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Gateway (后端 WebSocket)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ src/gateway/server-methods/config.ts                           │   │
│  │ - config.get     读取配置                                        │   │
│  │ - config.set    写入配置 (会触发 Gateway 重启)                  │   │
│  │ - config.patch  补丁更新                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 读写配置文件
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         配置文件 (JSON)                                 │
│  openclaw.gateway-dev.json                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、模型配置保存流程

### 2.1 Control UI 保存配置 (ui/src/ui/controllers/models.ts)

当你点击 Save 按钮时，流程如下：

```typescript
// ui/src/ui/controllers/models.ts - saveModelsConfigToGateway()

export async function saveModelsConfigToGateway(state, config) {
  // 1. 先保存到 localStorage (作为备份)
  localStorage.setItem("openclaw-model-config", JSON.stringify(config));

  // 2. 获取当前完整配置 (目的是保留 gateway 设置)
  const existingConfig = await state.client.request("config.get", {});

  // 3. 获取配置哈希 (用于并发控制)
  const configSnapshot = await state.client.request("config.get", { path: "." });
  const baseHash = configSnapshot?.hash;

  // 4. 构造新配置，保留 gateway 设置
  await state.client.request("config.set", {
    raw: JSON.stringify({
      models: { /* 新模型配置 */ },
      agents: { /* Agent 配置 */ },
      gateway: {
        // 保留原有 gateway 设置
        ...existingConfig.gateway,
        controlUi: {
          // 关键：保留 controlUi 设置
          ...gatewayControlUi,
        }
      }
    }),
    baseHash
  });
}
```

### 2.2 问题：gateway 配置被覆盖

**问题根源**：Control UI 发送的 `config.set` 请求只包含部分配置（models、agents），而不包含完整的 gateway 配置。

```typescript
// 问题代码分析
await state.client.request("config.set", {
  raw: JSON.stringify({
    models: { /* 只有模型配置 */ },
    agents: { /* 只有 Agent 配置 */ },
    gateway: {
      // 这里传递的是完整对象，会覆盖原有配置！
      controlUi: { /* 覆盖原有设置 */ }
    }
  })
});
```

### 2.3 Gateway 写入配置 (src/gateway/server-methods/config.ts)

```typescript
// src/gateway/server-methods/config.ts

"config.set": async ({ params, respond }) => {
  // 1. 读取当前配置文件快照
  const { snapshot, writeOptions } = await readConfigFileSnapshotForWrite();

  // 2. 验证配置
  const parsed = parseValidateConfigFromRawOrRespond(params, "config.set", snapshot, respond);
  if (!parsed) return;

  // 3. 写入配置文件 (这里是完全覆盖！)
  await writeConfigFile(parsed.config, writeOptions);

  // 4. 响应成功后，触发 Gateway 重启
  // Gateway 会读取新的配置文件
}
```

---

## 三、Gateway 配置加载与重启机制

### 3.1 配置加载时机

Gateway 启动时会读取配置文件：

```typescript
// src/gateway/server-runtime-config.ts

export async function resolveGatewayRuntimeConfig(params) {
  // 检查 Control UI 配置
  const controlUiEnabled = params.cfg.gateway?.controlUi?.enabled ?? true;
  const dangerouslyAllowHostHeaderOriginFallback =
    params.cfg.gateway?.controlUi?.dangerouslyAllowHostHeaderOriginFallback === true;

  // 关键检查：非本地访问必须配置 allowedOrigins 或开启 fallback
  if (
    controlUiEnabled &&
    !isLoopbackHost(bindHost) &&
    controlUiAllowedOrigins.length === 0 &&
    !dangerouslyAllowHostHeaderOriginFallback  // ← 这里会失败！
  ) {
    throw new Error(
      "non-loopback Control UI requires gateway.controlUi.allowedOrigins " +
      "(set explicit origins), or set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true"
    );
  }
}
```

### 3.2 配置变更触发重启

当 Control UI 调用 `config.set` 后：

```
Control UI                    Gateway                      配置文件
    │                           │                              │
    │──── config.set -------->│                              │
    │                           │                              │
    │                           │──── writeConfigFile() ----->│ (覆盖文件)
    │                           │                              │
    │                           │ (检测到配置变更)              │
    │                           │                              │
    │                           │──── SIGUSR1 (重启) -------->│
    │                           │                              │
    │                           │ (读取配置文件)               │
    │                           │                              │
    │<--- 响应成功 ------------│                              │
    │                           │                              │
    │                           │ (启动新进程)                │
    │                           │                              │
    │                           │ 读取配置 ─────────────────>│ (此时 gateway 可能已被覆盖)
    │                           │                              │
    │                           │ ❌ 启动失败！               │
```

---

## 四、关键配置项说明

### 4.1 gateway.controlUi 配置

```json
{
  "gateway": {
    "controlUi": {
      // 允许使用 Host header 作为 origin (解决外网访问问题)
      "dangerouslyAllowHostHeaderOriginFallback": true,

      // 允许非安全上下文访问 (HTTP)
      "allowInsecureAuth": true,

      // 禁用设备认证 (允许外网访问)
      "dangerouslyDisableDeviceAuth": true,

      // 允许的来源 (可选，如果开启 fallback 可以不配置)
      "allowedOrigins": [
        "http://117.50.174.50:5173",
        "http://117.50.174.50:18789"
      ]
    }
  }
}
```

### 4.2 配置项详细说明

| 配置项 | 类型 | 说明 |
|--------|------|------|
| `dangerouslyAllowHostHeaderOriginFallback` | boolean | 允许使用 Host header 作为 WebSocket origin，用于非本地访问 |
| `allowInsecureAuth` | boolean | 允许非安全上下文 (HTTP) 访问 Control UI |
| `dangerouslyDisableDeviceAuth` | boolean | 禁用设备身份验证，允许外网直接访问 |
| `allowedOrigins` | array | 允许的 WebSocket _origin 来源列表 |

---

## 五、问题解决方案

### 5.1 问题现象

1. 在 Control UI 中配置模型
2. 点击 Save 保存
3. Gateway 显示 `disconnected (1006): no reason`
4. 查看日志：`Gateway failed to start: non-loopback Control UI requires gateway.controlUi...`

### 5.2 问题原因

1. Control UI 调用 `config.set` 保存模型配置
2. Gateway 写入配置文件时，**只写入 UI 发送的部分配置**，导致 `gateway` 字段被覆盖
3. Gateway 尝试重启，读取被覆盖的配置
4. 配置中缺少 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
5. Gateway 启动失败

### 5.3 解决方案

#### 方案 A：修改 Control UI 代码 (推荐)

在 `ui/src/ui/controllers/models.ts` 的 `saveModelsConfigToGateway` 函数中，保留原有的 gateway 配置：

```typescript
// 确保 gateway 配置被保留
const gatewayControlUi = (existingConfig.gateway as Record<string, unknown>)?.controlUi;

await state.client.request("config.set", {
  raw: JSON.stringify({
    models: { /* 新模型配置 */ },
    agents: { /* Agent 配置 */ },
    gateway: {
      ...((existingConfig.gateway as Record<string, unknown>) || {}),
      controlUi: gatewayControlUi || {
        dangerouslyAllowHostHeaderOriginFallback: true,
        allowInsecureAuth: true,
        dangerouslyDisableDeviceAuth: true,
      }
    }
  })
});
```

#### 方案 B：使用 start.sh 守护进程 (当前方案)

修改 `start.sh`，添加配置守护功能：

1. **启动前检查**：确保配置包含 gateway 设置
2. **运行时监控**：每 0.3 秒检查配置文件
3. **自动修复**：检测到配置被覆盖时立即修复
4. **自动重启**：Gateway 停止时自动重启

```bash
# 核心守护逻辑
while true; do
  sleep 0.3

  # 检查配置是否被覆盖
  CURRENT_MD5=$(md5sum "$CONFIG_FILE")

  if [ "$CURRENT_MD5" != "$LAST_MD5" ]; then
    # 立即修复配置
    fix_config
  fi

  # 检查 Gateway 是否在运行
  if ! pgrep -f "openclaw-gateway" > /dev/null; then
    # 检查是否是配置问题
    if grep -q "requires gateway.controlUi" "$LOG_FILE"; then
      fix_config
      start_gateway
    fi
  fi
done
```

---

## 六、相关文件索引

### 6.1 前端 (Control UI)

| 文件路径 | 说明 |
|---------|------|
| `ui/src/ui/controllers/models.ts` | 模型配置加载和保存逻辑 |
| `ui/src/ui/views/models.ts` | 模型配置 UI 视图 |
| `ui/src/ui/app-render.ts` | 主应用渲染，包含模型配置入口 |

### 6.2 后端 (Gateway)

| 文件路径 | 说明 |
|---------|------|
| `src/gateway/server-methods/config.ts` | config.get / config.set / config.patch 实现 |
| `src/gateway/server-runtime-config.ts` | 运行时配置解析和验证 |
| `src/config/io.ts` | 配置文件读写操作 |
| `src/config/types.gateway.ts` | Gateway 配置类型定义 |

### 6.3 配置文件

| 文件路径 | 说明 |
|---------|------|
| `openclaw.gateway-dev.json` | 开发环境 Gateway 配置文件 |
| `start.sh` | 启动脚本 (包含配置守护) |

---

## 七、调试技巧

### 7.1 查看 Gateway 日志

```bash
tail -f /tmp/openclaw/openclaw-2026-03-08.log
```

### 7.2 查找配置相关错误

```bash
grep -i "config\|gateway.controlUi\|error" /tmp/openclaw/openclaw-2026-03-08.log | tail -50
```

### 7.3 检查配置文件

```bash
cat openclaw.gateway-dev.json | jq .
```

### 7.4 查看 Gateway 进程

```bash
ps aux | grep openclaw-gateway
```

---

## 八、总结

1. **问题本质**：Control UI 保存配置时发送的是**部分配置**，会覆盖整个配置文件，导致 gateway 配置丢失
2. **Gateway 重启机制**：配置变更后会自动重启，但重启时需要读取完整的 gateway 配置
3. **解决方案**：通过守护进程实时监控和修复配置，确保 Gateway 始终能读到正确的配置
