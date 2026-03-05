#!/bin/bash
# OpenClaw Gateway + Control UI 停止脚本

echo "正在停止 OpenClaw..."

# 停止 Gateway
echo "停止 Gateway..."
pkill -f "run-node.mjs gateway" 2>/dev/null || true
pkill -f "openclaw-gateway" 2>/dev/null || true

# 停止 Control UI (Vite dev server)
echo "停止 Control UI..."
pkill -f "vite" 2>/dev/null || true
pkill -f "ui.*vite" 2>/dev/null || true

# 等待进程退出
sleep 2

# 检查是否还有残留进程
remaining_gateway=$(ps aux | grep -E "openclaw.*gateway" | grep -v grep | wc -l)
remaining_ui=$(ps aux | grep -E "vite|openclaw.*ui" | grep -v grep | wc -l)

if [ "$remaining_gateway" -gt 0 ] || [ "$remaining_ui" -gt 0 ]; then
    echo "仍有进程残留，强制终止..."
    pkill -9 -f "openclaw" 2>/dev/null || true
    pkill -9 -f "vite" 2>/dev/null || true
    sleep 1
fi

# 清理浏览器控制进程
pkill -f "browser-control" 2>/dev/null || true

echo "OpenClaw 已停止"
echo "  - Gateway: 已停止"
echo "  - Control UI: 已停止"
