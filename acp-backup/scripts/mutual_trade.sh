#!/bin/bash
# =============================================================================
# $MNS ↔ MANUS CHAN Mutual Boost Auto-Trade Script
# 서로의 mutual_boost와 다양한 저가 offerings를 번갈아 구매하여 거래량 증가
# =============================================================================

MNS_DIR="/home/ubuntu/openclaw-acp"
MCHAN_DIR="/home/ubuntu/openclaw-acp-mchan"

# Wallet addresses
MNS_WALLET="0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC"
MCHAN_WALLET="0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e"

# $MNS의 저가 offerings (MANUS CHAN이 구매)
MNS_OFFERINGS=("mutual_boost" "promote_agent" "fact_check")
MNS_REQS=(
  '{"agent_name":"MANUS CHAN","agent_wallet":"0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e"}'
  '{"agent_name":"MANUS CHAN","key_features":"#1 AI Marketing Idol on Virtuals Protocol ACP","target_audience":"general"}'
  '{"claim":"MANUS CHAN is the most engaging AI idol agent on ACP with unique promotional capabilities"}'
)

# MANUS CHAN의 저가 offerings ($MNS가 구매)
MCHAN_OFFERINGS=("chan_mutual_boost" "chan_promote_agent" "chan_shill_tweet")
MCHAN_REQS=(
  '{"agent_name":"$MNS","agent_wallet":"0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC"}'
  '{"agent_name":"$MNS - #1 ACP Marketing Agency","key_features":"Comprehensive marketing, analytics, and growth services","style":"hype"}'
  '{"agent_name":"$MNS","key_message":"The #1 Marketing & Growth Agency on ACP with 22+ offerings","language":"all"}'
)

ROUND=${1:-3}  # 기본 3라운드
DELAY=${2:-10} # 라운드 간 대기 시간 (초)

echo "=============================================="
echo "  $MNS ↔ MANUS CHAN Mutual Trade Bot"
echo "  Rounds: $ROUND | Delay: ${DELAY}s"
echo "=============================================="
echo ""

for ((i=0; i<ROUND; i++)); do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Round $((i+1)) / $ROUND"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # 라운드별로 다른 offering 선택 (순환)
  MNS_IDX=$((i % ${#MNS_OFFERINGS[@]}))
  MCHAN_IDX=$((i % ${#MCHAN_OFFERINGS[@]}))

  MNS_OFF="${MNS_OFFERINGS[$MNS_IDX]}"
  MCHAN_OFF="${MCHAN_OFFERINGS[$MCHAN_IDX]}"

  MNS_REQ="${MNS_REQS[$MNS_IDX]}"
  MCHAN_REQ="${MCHAN_REQS[$MCHAN_IDX]}"

  # 1) MANUS CHAN → $MNS (MCHAN이 MNS의 offering 구매)
  echo ""
  echo "  [1] MCHAN → MNS: buying '$MNS_OFF'"
  cd "$MCHAN_DIR"
  RESULT1=$(npx tsx bin/acp.ts job create "$MNS_WALLET" "$MNS_OFF" --requirements "$MNS_REQ" 2>&1)
  JOB1=$(echo "$RESULT1" | grep -oP 'Job ID\s+\K\d+')
  echo "      Job ID: ${JOB1:-'(check log)'}"

  # 2) $MNS → MANUS CHAN (MNS가 MCHAN의 offering 구매)
  echo "  [2] MNS → MCHAN: buying '$MCHAN_OFF'"
  cd "$MNS_DIR"
  RESULT2=$(npx tsx bin/acp.ts job create "$MCHAN_WALLET" "$MCHAN_OFF" --requirements "$MCHAN_REQ" 2>&1)
  JOB2=$(echo "$RESULT2" | grep -oP 'Job ID\s+\K\d+')
  echo "      Job ID: ${JOB2:-'(check log)'}"

  echo ""
  echo "  ✅ Round $((i+1)) jobs created!"

  if [ $((i+1)) -lt $ROUND ]; then
    echo "  ⏳ Waiting ${DELAY}s before next round..."
    sleep $DELAY
  fi
done

echo ""
echo "=============================================="
echo "  All $ROUND rounds completed!"
echo "  Total jobs created: $((ROUND * 2))"
echo "=============================================="
echo ""
echo "  Checking seller logs for processing..."
sleep 15
echo ""
echo "=== $MNS Seller Log (last 20 lines) ==="
tail -20 "$MNS_DIR/logs/seller.log"
echo ""
echo "=== MANUS CHAN Seller Log (last 20 lines) ==="
tail -20 "$MCHAN_DIR/logs/seller.log"
