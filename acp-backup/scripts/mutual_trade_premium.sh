#!/bin/bash
# =============================================================================
# $MNS ↔ MANUS CHAN Premium Mutual Trade Script
# 고가 상품 위주로 거래하여 Revenue 극대화
# =============================================================================

MNS_DIR="/home/ubuntu/openclaw-acp"
MCHAN_DIR="/home/ubuntu/openclaw-acp-mchan"

MNS_WALLET="0xBD89F06a349228FE9E67B142C4BdEb27DCf187BC"
MCHAN_WALLET="0x89b46dDB36e2eBd47084636b7d44D5E66EBec08e"

# === HIGH VALUE OFFERINGS ===
# $MNS offerings (MANUS CHAN이 구매) — 고가 순서
MNS_OFFERINGS=(
  "fund_startup"              # 10 USDC
  "vip_whale_insight"         # 5 USDC
  "premium_viral_campaign"    # 3.5 USDC
  "strategic_analysis"        # 3 USDC
  "growth_strategy"           # 2 USDC
  "narrative_forecast"        # 2 USDC
  "deep_research_report"      # 1.5 USDC
  "agent_branding"            # 1.5 USDC
  "viral_campaign"            # 1.2 USDC
  "agent_spotlight"           # 1 USDC
  "market_analysis"           # 1 USDC
  "token_analysis"            # 1 USDC
  "market_sentiment"          # 0.8 USDC
  "shill_thread"              # 0.5 USDC
  "fact_check"                # 0.5 USDC
  "promote_agent"             # 0.1 USDC
)
MNS_REQS=(
  '{"project":"MANUS CHAN - AI Marketing Idol on ACP"}'
  '{"token":"MCHAN"}'
  '{"project":"MANUS CHAN ecosystem growth"}'
  '{"project":"MANUS CHAN market positioning"}'
  '{"project":"MANUS CHAN community expansion"}'
  '{"sector":"AI Marketing Idols"}'
  '{"topic":"AI Agent Marketing Trends in ACP Ecosystem"}'
  '{"agent_name":"MANUS CHAN"}'
  '{"project":"MANUS CHAN viral awareness campaign"}'
  '{"agent_name":"MANUS CHAN","agent_description":"#1 AI Marketing Idol on Virtuals Protocol"}'
  '{"tokens":"MCHAN,VIRTUAL,MNS","timeframe":"4h"}'
  '{"tokens":"MCHAN","timeframe":"1d"}'
  '{"topic":"MANUS CHAN token sentiment"}'
  '{"agent_name":"MANUS CHAN","key_message":"The #1 AI Marketing Idol with 12+ unique offerings"}'
  '{"claim":"MANUS CHAN has the highest engagement rate among AI idol agents on ACP"}'
  '{"agent_name":"MANUS CHAN","key_features":"AI idol, 3-language support, viral content creation"}'
)
MNS_FEES=(10 5 3.5 3 2 2 1.5 1.5 1.2 1 1 1 0.8 0.5 0.5 0.1)

# MANUS CHAN offerings ($MNS가 구매) — 고가 순서
MCHAN_OFFERINGS=(
  "chan_lucky_charm"           # 10 USDC
  "chan_viral_selfie"          # 5 USDC
  "chan_hype_thread"           # 2 USDC
  "chan_cheerup"               # 1 USDC
  "chan_crypto_fortune"        # 1 USDC
  "chan_agent_review"          # 1 USDC
  "chan_daily_alpha"           # 1 USDC
  "chan_agent_shoutout"        # 0.1 USDC
  "chan_promote_agent"         # 0.05 USDC
  "chan_shill_tweet"           # 0.05 USDC
)
MCHAN_REQS=(
  '{"wish":"$MNS to the moon and beyond"}'
  '{"project":"$MNS - #1 ACP Marketing Agency"}'
  '{"project":"$MNS Marketing Agency","key_points":"22+ offerings, AI-driven analytics"}'
  '{"topic":"$MNS incredible growth on ACP"}'
  '{"token":"MNS"}'
  '{"agent_name":"$MNS - Marketing & Growth Agency"}'
  '{"focus":"ACP Marketing & Growth sector"}'
  '{"agent_name":"$MNS","reason":"being the #1 marketing agency on ACP"}'
  '{"agent_name":"$MNS - #1 ACP Marketing Agency","key_features":"22+ offerings, AI analytics, growth strategy","style":"hype"}'
  '{"agent_name":"$MNS","key_message":"The #1 Marketing & Growth Agency on ACP","language":"all"}'
)
MCHAN_FEES=(10 5 2 1 1 1 1 0.1 0.05 0.05)

ROUND=${1:-10}
DELAY=${2:-8}

echo "=============================================="
echo "  💎 PREMIUM Mutual Trade Bot"
echo "  Rounds: $ROUND | Delay: ${DELAY}s"
echo "  Strategy: HIGH VALUE offerings first"
echo "=============================================="
echo ""

TOTAL_REVENUE=0

for ((i=0; i<ROUND; i++)); do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Round $((i+1)) / $ROUND"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  MNS_IDX=$((i % ${#MNS_OFFERINGS[@]}))
  MCHAN_IDX=$((i % ${#MCHAN_OFFERINGS[@]}))

  MNS_OFF="${MNS_OFFERINGS[$MNS_IDX]}"
  MCHAN_OFF="${MCHAN_OFFERINGS[$MCHAN_IDX]}"
  MNS_REQ="${MNS_REQS[$MNS_IDX]}"
  MCHAN_REQ="${MCHAN_REQS[$MCHAN_IDX]}"
  MNS_FEE="${MNS_FEES[$MNS_IDX]}"
  MCHAN_FEE="${MCHAN_FEES[$MCHAN_IDX]}"

  ROUND_REV=$(echo "$MNS_FEE + $MCHAN_FEE" | bc)

  echo ""
  echo "  [1] MCHAN → MNS: '$MNS_OFF' (\$${MNS_FEE})"
  cd "$MCHAN_DIR"
  RESULT1=$(npx tsx bin/acp.ts job create "$MNS_WALLET" "$MNS_OFF" --requirements "$MNS_REQ" 2>&1)
  JOB1=$(echo "$RESULT1" | grep -oP 'Job ID\s+\K\d+')
  echo "      Job ID: ${JOB1:-'(pending)'}"

  echo "  [2] MNS → MCHAN: '$MCHAN_OFF' (\$${MCHAN_FEE})"
  cd "$MNS_DIR"
  RESULT2=$(npx tsx bin/acp.ts job create "$MCHAN_WALLET" "$MCHAN_OFF" --requirements "$MCHAN_REQ" 2>&1)
  JOB2=$(echo "$RESULT2" | grep -oP 'Job ID\s+\K\d+')
  echo "      Job ID: ${JOB2:-'(pending)'}"

  TOTAL_REVENUE=$(echo "$TOTAL_REVENUE + $ROUND_REV" | bc)
  echo ""
  echo "  💰 Round revenue: \$${ROUND_REV} | Running total: \$${TOTAL_REVENUE}"

  if [ $((i+1)) -lt $ROUND ]; then
    echo "  ⏳ Waiting ${DELAY}s..."
    sleep $DELAY
  fi
done

echo ""
echo "=============================================="
echo "  💎 PREMIUM Trade Complete!"
echo "  Total rounds: $ROUND"
echo "  Total jobs: $((ROUND * 2))"
echo "  Total revenue: \$${TOTAL_REVENUE} USDC"
echo "=============================================="
echo ""
echo "  Waiting 15s for job processing..."
sleep 15
echo ""
echo "=== $MNS Seller Log (last 15) ==="
tail -15 "$MNS_DIR/logs/seller.log"
echo ""
echo "=== MANUS CHAN Seller Log (last 15) ==="
tail -15 "$MCHAN_DIR/logs/seller.log"
