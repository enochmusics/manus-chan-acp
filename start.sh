#!/bin/bash
# =============================================================================
# ACP Multi-Seller + Telegram Bot Startup Script
# Starts 4 processes concurrently:
#   1. MNS Seller (openclaw-acp-mns)
#   2. MCHAN Seller (openclaw-acp-mchan)
#   3. WhaleWatch Seller (openclaw-acp-whalewatch)
#   4. Telegram Management Bot (acp-telegram-bot)
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="/tmp/acp-pids"
mkdir -p "$PID_DIR"

echo "=============================================="
echo "  ACP Seller Runtime — Railway Deployment"
echo "  Starting 4 processes..."
echo "=============================================="

# Environment variables passed from Railway
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8550561605:AAHeVdFAMsCR5-Vxq2277cj0wl3jULuLPAo}"
export TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-74318760}"

# --- 1. MNS Seller ---
echo "[1/4] Starting MNS Seller..."
cd "$SCRIPT_DIR/openclaw-acp-mns"
mkdir -p logs
LITE_AGENT_API_KEY="acp-c004cdeac8b5fa744f71" SELLER_LABEL="MNS" \
  npx tsx seller.ts > logs/seller-mns.log 2>&1 &
MNS_PID=$!
echo $MNS_PID > "$PID_DIR/mns.pid"
echo "  MNS Seller PID: $MNS_PID"

# --- 2. MCHAN Seller ---
echo "[2/4] Starting MCHAN Seller..."
cd "$SCRIPT_DIR/openclaw-acp-mchan"
mkdir -p logs
LITE_AGENT_API_KEY="acp-a0cc2140a0445b692b2b" SELLER_LABEL="MCHAN" \
  npx tsx seller.ts > logs/seller-mchan.log 2>&1 &
MCHAN_PID=$!
echo $MCHAN_PID > "$PID_DIR/mchan.pid"
echo "  MCHAN Seller PID: $MCHAN_PID"

# --- 3. WhaleWatch Seller ---
echo "[3/4] Starting WhaleWatch Seller..."
cd "$SCRIPT_DIR/openclaw-acp-whalewatch"
mkdir -p logs
LITE_AGENT_API_KEY="acp-2336e53b78afdc005c43" SELLER_LABEL="WhaleWatch" \
  npx tsx seller.ts > logs/seller-whalewatch.log 2>&1 &
WHALE_PID=$!
echo $WHALE_PID > "$PID_DIR/whalewatch.pid"
echo "  WhaleWatch Seller PID: $WHALE_PID"

# --- 4. Telegram Bot ---
echo "[4/4] Starting Telegram Management Bot..."
cd "$SCRIPT_DIR/acp-telegram-bot"
TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" \
  MNS_LOG="$SCRIPT_DIR/openclaw-acp-mns/logs/seller-mns.log" \
  MCHAN_LOG="$SCRIPT_DIR/openclaw-acp-mchan/logs/seller-mchan.log" \
  WHALE_LOG="$SCRIPT_DIR/openclaw-acp-whalewatch/logs/seller-whalewatch.log" \
  PID_DIR="$PID_DIR" \
  npx tsx bot.ts > /tmp/telegram-bot.log 2>&1 &
BOT_PID=$!
echo $BOT_PID > "$PID_DIR/bot.pid"
echo "  Telegram Bot PID: $BOT_PID"

echo ""
echo "=============================================="
echo "  All 4 processes started!"
echo "  MNS:        PID $MNS_PID"
echo "  MCHAN:      PID $MCHAN_PID"
echo "  WhaleWatch: PID $WHALE_PID"
echo "  TG Bot:     PID $BOT_PID"
echo "=============================================="
echo ""
echo "Waiting 10s for initial connection..."
sleep 10

echo ""
echo "=== MNS Seller Log ==="
tail -5 "$SCRIPT_DIR/openclaw-acp-mns/logs/seller-mns.log" 2>/dev/null || echo "(no log yet)"
echo ""
echo "=== MCHAN Seller Log ==="
tail -5 "$SCRIPT_DIR/openclaw-acp-mchan/logs/seller-mchan.log" 2>/dev/null || echo "(no log yet)"
echo ""
echo "=== WhaleWatch Seller Log ==="
tail -5 "$SCRIPT_DIR/openclaw-acp-whalewatch/logs/seller-whalewatch.log" 2>/dev/null || echo "(no log yet)"
echo ""
echo "=== Telegram Bot Log ==="
tail -5 /tmp/telegram-bot.log 2>/dev/null || echo "(no log yet)"

# Keep container alive — monitor and auto-restart on failure
echo ""
echo "Monitoring processes (auto-restart on failure)..."
while true; do
  # Check MNS
  if ! kill -0 $MNS_PID 2>/dev/null; then
    echo "[monitor] MNS Seller died, restarting..."
    cd "$SCRIPT_DIR/openclaw-acp-mns"
    LITE_AGENT_API_KEY="acp-c004cdeac8b5fa744f71" SELLER_LABEL="MNS" \
      npx tsx seller.ts >> logs/seller-mns.log 2>&1 &
    MNS_PID=$!
    echo $MNS_PID > "$PID_DIR/mns.pid"
    echo "[monitor] MNS Seller restarted (PID: $MNS_PID)"
  fi

  # Check MCHAN
  if ! kill -0 $MCHAN_PID 2>/dev/null; then
    echo "[monitor] MCHAN Seller died, restarting..."
    cd "$SCRIPT_DIR/openclaw-acp-mchan"
    LITE_AGENT_API_KEY="acp-a0cc2140a0445b692b2b" SELLER_LABEL="MCHAN" \
      npx tsx seller.ts >> logs/seller-mchan.log 2>&1 &
    MCHAN_PID=$!
    echo $MCHAN_PID > "$PID_DIR/mchan.pid"
    echo "[monitor] MCHAN Seller restarted (PID: $MCHAN_PID)"
  fi

  # Check WhaleWatch
  if ! kill -0 $WHALE_PID 2>/dev/null; then
    echo "[monitor] WhaleWatch Seller died, restarting..."
    cd "$SCRIPT_DIR/openclaw-acp-whalewatch"
    LITE_AGENT_API_KEY="acp-2336e53b78afdc005c43" SELLER_LABEL="WhaleWatch" \
      npx tsx seller.ts >> logs/seller-whalewatch.log 2>&1 &
    WHALE_PID=$!
    echo $WHALE_PID > "$PID_DIR/whalewatch.pid"
    echo "[monitor] WhaleWatch Seller restarted (PID: $WHALE_PID)"
  fi

  # Check Telegram Bot
  if ! kill -0 $BOT_PID 2>/dev/null; then
    echo "[monitor] Telegram Bot died, restarting..."
    cd "$SCRIPT_DIR/acp-telegram-bot"
    TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" \
      MNS_LOG="$SCRIPT_DIR/openclaw-acp-mns/logs/seller-mns.log" \
      MCHAN_LOG="$SCRIPT_DIR/openclaw-acp-mchan/logs/seller-mchan.log" \
      WHALE_LOG="$SCRIPT_DIR/openclaw-acp-whalewatch/logs/seller-whalewatch.log" \
      PID_DIR="$PID_DIR" \
      npx tsx bot.ts >> /tmp/telegram-bot.log 2>&1 &
    BOT_PID=$!
    echo $BOT_PID > "$PID_DIR/bot.pid"
    echo "[monitor] Telegram Bot restarted (PID: $BOT_PID)"
  fi

  sleep 30
done
