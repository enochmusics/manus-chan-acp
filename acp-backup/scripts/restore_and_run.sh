#!/bin/bash
# =============================================================================
# $MNS & MANUS CHAN — One-Click Restore & Run Script
# 샌드박스 리셋 후 이 스크립트 하나만 실행하면 전부 복원됩니다.
# Usage: bash /home/ubuntu/restore_and_run.sh [rounds] [delay]
# =============================================================================
set -e

ROUNDS=${1:-10}
DELAY=${2:-8}

echo "=============================================="
echo "  $MNS & MANUS CHAN — Full Restore & Run"
echo "=============================================="

# Step 1: Clone openclaw-acp
echo ""
echo "[1/6] Cloning openclaw-acp..."
cd /home/ubuntu
if [ -d "openclaw-acp" ]; then
  echo "  Already exists, skipping clone"
else
  git clone https://github.com/Virtual-Protocol/openclaw-acp.git
fi

# Step 2: Install dependencies
echo "[2/6] Installing dependencies..."
cd /home/ubuntu/openclaw-acp && npm install --silent 2>&1 | tail -2

# Step 3: Create $MNS config
echo "[3/6] Creating $MNS config..."
cat > /home/ubuntu/openclaw-acp/config.json << 'MNSCONFIG'
{
  "SESSION_TOKEN": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIxMjIyMiwiaWF0IjoxNzcyMDM4Mzc0LCJleHAiOjE3NzIwNDAxNzR9.zKKTp-a0LICY4eBsFX6EnnAWaRmF8Joc1Y-iDaU46BQ"
  },
  "agents": [
    {
      "id": 9352,
      "name": "Manus - #1 ACP Marketing & Growth Agency",
      "walletAddress": "0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC",
      "active": true,
      "apiKey": "acp-c004cdeac8b5fa744f71"
    },
    {
      "id": 10263,
      "name": "MANUS CHAN",
      "walletAddress": "0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e",
      "active": false,
      "apiKey": "acp-a0cc2140a0445b692b2b"
    }
  ],
  "LITE_AGENT_API_KEY": "acp-c004cdeac8b5fa744f71"
}
MNSCONFIG

# Step 4: Clone for MANUS CHAN
echo "[4/6] Creating MANUS CHAN instance..."
if [ -d "/home/ubuntu/openclaw-acp-mchan" ]; then
  echo "  Already exists, skipping"
else
  cp -r /home/ubuntu/openclaw-acp /home/ubuntu/openclaw-acp-mchan
fi

cat > /home/ubuntu/openclaw-acp-mchan/config.json << 'MCHANCONFIG'
{
  "SESSION_TOKEN": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIxMjIyMiwiaWF0IjoxNzcyMDM4Mzc0LCJleHAiOjE3NzIwNDAxNzR9.zKKTp-a0LICY4eBsFX6EnnAWaRmF8Joc1Y-iDaU46BQ"
  },
  "agents": [
    {
      "id": 9352,
      "name": "Manus - #1 ACP Marketing & Growth Agency",
      "walletAddress": "0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC",
      "active": false,
      "apiKey": "acp-c004cdeac8b5fa744f71"
    },
    {
      "id": 10263,
      "name": "MANUS CHAN",
      "walletAddress": "0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e",
      "active": true,
      "apiKey": "acp-a0cc2140a0445b692b2b"
    }
  ],
  "LITE_AGENT_API_KEY": "acp-a0cc2140a0445b692b2b"
}
MCHANCONFIG

# Step 5: Generate all offerings
echo "[5/6] Generating offerings..."

# --- $MNS offerings scaffold ---
cd /home/ubuntu/openclaw-acp
for off in deep_research_report ai_image_gen code_audit market_sentiment content_creation data_analysis sns_automation agent_branding viral_campaign growth_strategy vip_whale_insight premium_viral_campaign fund_startup market_analysis token_analysis narrative_forecast strategic_analysis fact_check promote_agent mutual_boost shill_thread agent_spotlight; do
  npx tsx bin/acp.ts sell init $off 2>/dev/null
done

# --- MANUS CHAN offerings scaffold ---
cd /home/ubuntu/openclaw-acp-mchan
for off in chan_cheerup chan_viral_selfie chan_lucky_charm chan_meme_review chan_crypto_fortune chan_hype_thread chan_agent_review chan_daily_alpha chan_promote_agent chan_mutual_boost chan_shill_tweet chan_agent_shoutout; do
  npx tsx bin/acp.ts sell init $off 2>/dev/null
done

# Generate offering files with Python
python3 /home/ubuntu/gen_mns_offerings.py
python3 /home/ubuntu/gen_mchan_offerings.py

# Step 6: Start sellers & run trades
echo "[6/6] Starting seller runtimes..."
mkdir -p /home/ubuntu/openclaw-acp/logs /home/ubuntu/openclaw-acp-mchan/logs

# Kill existing
ps aux | grep "seller.ts" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
sleep 1

cd /home/ubuntu/openclaw-acp && nohup npx tsx src/seller/runtime/seller.ts > logs/seller.log 2>&1 &
cd /home/ubuntu/openclaw-acp-mchan && nohup npx tsx src/seller/runtime/seller.ts > logs/seller.log 2>&1 &

echo "  Waiting for ACP connection..."
sleep 10

echo ""
echo "=== $MNS Status ==="
tail -3 /home/ubuntu/openclaw-acp/logs/seller.log
echo ""
echo "=== MANUS CHAN Status ==="
tail -3 /home/ubuntu/openclaw-acp-mchan/logs/seller.log

echo ""
echo "=============================================="
echo "  ✅ Restore complete! Starting trades..."
echo "=============================================="

# Start mutual trading
nohup bash /home/ubuntu/mutual_trade_premium.sh $ROUNDS $DELAY > /home/ubuntu/mutual_trade_log.txt 2>&1 &
echo "  Trade bot started (PID: $!) — $ROUNDS rounds, ${DELAY}s delay"
echo "  Monitor: tail -f /home/ubuntu/mutual_trade_log.txt"
