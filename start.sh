#!/bin/bash
# OpenClaw Gateway + Control UI 启动脚本
# 包含实时配置保护功能，防止 Control UI 保存时丢失 gateway 配置

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 配置参数
PORT=18789
UI_PORT=5173
BIND_ADDR="0.0.0.0"
LOG_FILE="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
UI_LOG_FILE="/tmp/openclaw/openclaw-ui-$(date +%Y-%m-%d).log"
GATEWAY_TOKEN="683a6d04df0c1d33a3d2ccbd26dc5b93"
CONFIG_FILE="$SCRIPT_DIR/openclaw.gateway-dev.json"
CONFIG_LOCK="$CONFIG_FILE.lock"
GUARD_PID_FILE="/tmp/openclaw/guard.pid"

export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"
export DASHSCOPE_API_KEY="sk-sp-c9fc8058dd184f5eb6cf560b04a900b2"
export FIRECRAWL_API_KEY="fc-64f6dddeef4e4e56a482b1e9d5435949"
export TAVILY_API_KEY="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"
export OPENCLAW_CONFIG_PATH="$CONFIG_FILE"

HOST_IP=$(hostname -I | awk '{print $1}')
mkdir -p /tmp/openclaw

# ========== 修复配置文件 ==========
fix_config() {
    node -e "
const fs = require('fs');
const c = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
let changed = false;
if (!c.gateway) { c.gateway = {}; changed = true; }
if (!c.gateway.controlUi) { c.gateway.controlUi = {}; changed = true; }
const ui = c.gateway.controlUi;
if (ui.dangerouslyAllowHostHeaderOriginFallback !== true) { ui.dangerouslyAllowHostHeaderOriginFallback = true; changed = true; }
if (ui.allowInsecureAuth !== true) { ui.allowInsecureAuth = true; changed = true; }
if (ui.dangerouslyDisableDeviceAuth !== true) { ui.dangerouslyDisableDeviceAuth = true; changed = true; }
if (changed) {
    fs.writeFileSync('$CONFIG_FILE', JSON.stringify(c, null, 2));
    console.log('CONFIG_FIXED');
}
" 2>/dev/null
}

# ========== 启动 Gateway ==========
start_gateway() {
    pnpm openclaw gateway --port $PORT --bind lan --allow-unconfigured --force --verbose > "$LOG_FILE" 2>&1 &
    sleep 3
    if pgrep -f "run-node.mjs gateway" > /dev/null 2>&1; then
        echo "Gateway 启动成功! PID: $(pgrep -f 'run-node.mjs gateway')"
        return 0
    fi
    return 1
}

echo "启动 OpenClaw Gateway..."
echo "  绑定地址: $BIND_ADDR"
echo "  端口: $PORT"
echo "  日志文件: $LOG_FILE"

fix_config

# 杀掉可能存在的旧 Gateway
pkill -f "run-node.mjs gateway" 2>/dev/null
sleep 1

# 启动 Gateway
start_gateway

if ! pgrep -f "run-node.mjs gateway" > /dev/null 2>&1; then
    if grep -q "requires gateway.controlUi" "$LOG_FILE" 2>/dev/null; then
        echo "Gateway 启动失败，修复配置后重试..."
        fix_config
        sleep 1
        start_gateway
    fi
fi

if ! pgrep -f "run-node.mjs gateway" > /dev/null 2>&1; then
    echo "Gateway 启动失败"
    exit 1
fi

# ========== 启动 Control UI ==========
echo ""
echo "启动 Control UI..."

if lsof -i :$UI_PORT > /dev/null 2>&1; then
    echo "Control UI 已在运行中"
else
    cd "$SCRIPT_DIR/ui"
    pnpm dev > "$UI_LOG_FILE" 2>&1 &
    cd "$SCRIPT_DIR"
    sleep 3
    if ! lsof -i :$UI_PORT > /dev/null 2>&1; then
        echo "Control UI 启动失败"
        exit 1
    fi
    echo "Control UI 启动成功!"
fi

# ========== 超级守护进程 ==========
# 使用原子操作确保配置修复在 Gateway 读取之前完成
(
    # 保存之前的配置文件md5
    LAST_MD5=""
    
    while true; do
        sleep 0.3  # 非常频繁地检查
        
        # 检查 Gateway 是否在运行
        if ! pgrep -f "run-node.mjs gateway" > /dev/null 2>&1; then
            # Gateway 没在运行，检查是否需要启动
            if grep -q "requires gateway.controlUi" "$LOG_FILE" 2>/dev/null; then
                echo "[守护] 检测到 Gateway 停止，修复配置..."
                fix_config
                sleep 0.5
                start_gateway
            fi
            continue
        fi
        
        # 检查配置是否被覆盖
        CURRENT_MD5=$(md5sum "$CONFIG_FILE" 2>/dev/null | cut -d' ' -f1)
        
        if [ "$CURRENT_MD5" != "$LAST_MD5" ]; then
            # 配置文件改变了！
            # 立即修复，使用原子操作
            fix_config
            
            # 再次检查是否修复成功
            if node -e "
const fs = require('fs');
const c = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
if (!c.gateway || !c.gateway.controlUi || c.gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback !== true) {
    process.exit(0);
}
process.exit(1);
" 2>/dev/null; then
                echo "[守护] 配置被覆盖，修复完成"
            fi
            
            LAST_MD5=$(md5sum "$CONFIG_FILE" 2>/dev/null | cut -d' ' -f1)
        fi
    done
) &
echo $! > "$GUARD_PID_FILE"

echo "[守护进程] 已启动"

# 输出访问信息
echo ""
echo "============================================"
echo "OpenClaw 启动完成!"
echo "============================================"
echo ""
echo "Gateway: http://127.0.0.1:$PORT"
echo "Control UI: http://127.0.0.1:$UI_PORT"
echo "日志: tail -f $LOG_FILE"
