#!/bin/bash
#==============================================
# ACP Seller Runtime — One-Click Setup from GitHub Backup
# Repo: https://github.com/enochmusics/manus-chan-acp.git
#
# Usage: 
#   git clone https://github.com/enochmusics/manus-chan-acp.git
#   cd manus-chan-acp/acp-backup
#   bash setup.sh [trade_rounds] [delay_seconds]
#
# Example:
#   bash setup.sh 10 8    # 10 rounds premium trade, 8s delay
#==============================================

set -e
ROUNDS=${1:-5}
DELAY=${2:-8}
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=============================================="
echo "  ACP Seller Runtime Setup"
echo "  Backup dir: $BACKUP_DIR"
echo "  Trade rounds: $ROUNDS | Delay: ${DELAY}s"
echo "=============================================="

# Step 1: Clone openclaw-acp if not exists
if [ ! -d "/home/ubuntu/openclaw-acp" ]; then
  echo "[1/6] Cloning openclaw-acp..."
  cd /home/ubuntu
  git clone https://github.com/Virtual-Protocol/openclaw-acp.git
  cd /home/ubuntu/openclaw-acp && npm install
else
  echo "[1/6] openclaw-acp already exists, skipping clone"
fi

# Step 2: Copy $MNS config
echo "[2/6] Setting up $MNS config..."
cp "$BACKUP_DIR/configs/config-mns.json" /home/ubuntu/openclaw-acp/config.json

# Step 3: Copy $MNS offerings
echo "[3/6] Restoring $MNS offerings..."
cd /home/ubuntu/openclaw-acp
npx tsx bin/acp.ts sell init 2>/dev/null || true
AGENT_DIR=$(find src/seller/offerings -mindepth 1 -maxdepth 1 -type d | head -1)
if [ -n "$AGENT_DIR" ]; then
  for offering_dir in "$BACKUP_DIR"/offerings-mns/*/; do
    offering_name=$(basename "$offering_dir")
    mkdir -p "$AGENT_DIR/$offering_name"
    cp "$offering_dir"* "$AGENT_DIR/$offering_name/" 2>/dev/null || true
  done
  echo "  Restored $(ls -d "$BACKUP_DIR"/offerings-mns/*/ | wc -l) $MNS offerings"
fi

# Step 4: Setup MANUS CHAN
echo "[4/6] Setting up MANUS CHAN..."
if [ ! -d "/home/ubuntu/openclaw-acp-mchan" ]; then
  cp -r /home/ubuntu/openclaw-acp /home/ubuntu/openclaw-acp-mchan
fi
cp "$BACKUP_DIR/configs/config-mchan.json" /home/ubuntu/openclaw-acp-mchan/config.json

# Copy MCHAN offerings
cd /home/ubuntu/openclaw-acp-mchan
npx tsx bin/acp.ts sell init 2>/dev/null || true
MCHAN_DIR=$(find src/seller/offerings -mindepth 1 -maxdepth 1 -type d | head -1)
if [ -n "$MCHAN_DIR" ]; then
  for offering_dir in "$BACKUP_DIR"/offerings-mchan/*/; do
    offering_name=$(basename "$offering_dir")
    mkdir -p "$MCHAN_DIR/$offering_name"
    cp "$offering_dir"* "$MCHAN_DIR/$offering_name/" 2>/dev/null || true
  done
  echo "  Restored $(ls -d "$BACKUP_DIR"/offerings-mchan/*/ | wc -l) MANUS CHAN offerings"
fi

# Step 5: Start seller runtimes
echo "[5/6] Starting seller runtimes..."
# Kill existing
ps aux | grep "seller.ts" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 1

mkdir -p /home/ubuntu/openclaw-acp/logs /home/ubuntu/openclaw-acp-mchan/logs

cd /home/ubuntu/openclaw-acp && nohup npx tsx src/seller/runtime/seller.ts > logs/seller.log 2>&1 &
echo "  $MNS seller PID: $!"

cd /home/ubuntu/openclaw-acp-mchan && nohup npx tsx src/seller/runtime/seller.ts > logs/seller.log 2>&1 &
echo "  MANUS CHAN seller PID: $!"

echo "  Waiting 10s for sellers to connect..."
sleep 10

# Step 6: Copy trade scripts and run
echo "[6/6] Running premium trade ($ROUNDS rounds)..."
cp "$BACKUP_DIR/scripts/mutual_trade.sh" /home/ubuntu/
cp "$BACKUP_DIR/scripts/mutual_trade_premium.sh" /home/ubuntu/
chmod +x /home/ubuntu/mutual_trade.sh /home/ubuntu/mutual_trade_premium.sh

bash /home/ubuntu/mutual_trade_premium.sh $ROUNDS $DELAY

echo ""
echo "=============================================="
echo "  ✅ Setup Complete!"
echo "  $MNS seller: running"
echo "  MANUS CHAN seller: running"
echo "  Trade: $ROUNDS rounds executed"
echo "=============================================="
