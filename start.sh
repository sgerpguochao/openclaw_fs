#!/bin/bash
# OpenClaw Gateway + Control UI 启动脚本

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 配置参数
PORT=18789
UI_PORT=5173
BIND_ADDR="0.0.0.0"
LOG_FILE="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
UI_LOG_FILE="/tmp/openclaw/openclaw-ui-$(date +%Y-%m-%d).log"
GATEWAY_TOKEN="683a6d04df0c1d33a3d2ccbd26dc5b93"

# 设置环境变量 (供 Gateway 使用)
export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"
export DASHSCOPE_API_KEY="sk-sp-c9fc8058dd184f5eb6cf560b04a900b2"
# 使用项目内 Gateway 配置，解决 non-loopback 下 Control UI 需 allowedOrigins 的启动失败
export OPENCLAW_CONFIG_PATH="$SCRIPT_DIR/openclaw.gateway-dev.json"

# 获取本机 IP
HOST_IP=$(hostname -I | awk '{print $1}')

# 确保日志目录存在
mkdir -p /tmp/openclaw

# ========== 启动 Gateway ==========
echo "启动 OpenClaw Gateway..."
echo "  绑定地址: $BIND_ADDR"
echo "  端口: $PORT"
echo "  日志文件: $LOG_FILE"

# 检查 Gateway 是否已运行
if pgrep -f "run-node.mjs gateway" > /dev/null 2>&1; then
    echo "Gateway 已在运行中，跳过启动"
else
    pnpm openclaw gateway --port $PORT --bind lan --allow-unconfigured --force --verbose > "$LOG_FILE" 2>&1 &
    sleep 3
    
    if ! pgrep -f "run-node.mjs gateway" > /dev/null 2>&1; then
        echo "Gateway 启动失败，请查看日志: $LOG_FILE"
        exit 1
    fi
    echo "Gateway 启动成功! PID: $(pgrep -f 'run-node.mjs gateway')"
fi

# ========== 启动 Control UI ==========
echo ""
echo "启动 Control UI..."
echo "  端口: $UI_PORT"
echo "  日志文件: $UI_LOG_FILE"

# 检查 UI 是否已运行
if lsof -i :$UI_PORT > /dev/null 2>&1; then
    echo "Control UI 已在运行中，跳过启动"
else
    cd "$SCRIPT_DIR/ui"
    pnpm dev > "$UI_LOG_FILE" 2>&1 &
    cd "$SCRIPT_DIR"
    sleep 3
    
    if ! lsof -i :$UI_PORT > /dev/null 2>&1; then
        echo "Control UI 启动失败，请查看日志: $UI_LOG_FILE"
        exit 1
    fi
    echo "Control UI 启动成功!"
fi

# ========== 输出访问信息 ==========
echo ""
echo "============================================"
echo "OpenClaw 启动完成!"
echo "============================================"
echo ""
echo "Gateway (后端):"
echo "  - 本地: http://127.0.0.1:$PORT"
echo "  - 局域网: http://$HOST_IP:$PORT"
echo "  - 外网: http://117.50.174.50:$PORT"
echo ""
echo "Control UI (前端):"
echo "  - 本地: http://127.0.0.1:$UI_PORT"
echo "  - 局域网: http://$HOST_IP:$UI_PORT"
echo "  - 外网: http://117.50.174.50:$UI_PORT"
echo ""
echo "注意: 首次访问 Control UI 时，需要输入 Gateway 地址连接"
echo "      Gateway 地址: ws://$HOST_IP:$PORT/apps/openclaw"
echo ""
echo "日志查看:"
echo "  - Gateway: tail -f $LOG_FILE"
echo "  - Control UI: tail -f $UI_LOG_FILE"
