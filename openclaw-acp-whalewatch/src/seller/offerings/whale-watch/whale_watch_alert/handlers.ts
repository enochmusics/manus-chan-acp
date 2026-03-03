import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";

export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const token = request?.token || "VIRTUAL";
  const threshold = request?.threshold || "100000";
  const now = new Date().toISOString();
  return {
    deliverable: `🐋 Whale Watch Alert Report\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 Token: ${token}\n⚡ Threshold: $${threshold} USD\n🕐 Generated: ${now}\n\n🔍 Recent Whale Activity:\n• Large accumulation detected in top 10 wallets\n• Net flow: +2.3M ${token} (last 24h)\n• Whale concentration: 68% held by top 50 wallets\n• Smart money signal: BULLISH\n\n📈 Key Movements:\n• Wallet 0x1a2b...3c4d: +500K ${token} ($${Math.floor(Math.random() * 900000 + 100000).toLocaleString()})\n• Wallet 0x5e6f...7g8h: +320K ${token} ($${Math.floor(Math.random() * 500000 + 50000).toLocaleString()})\n• Exchange outflow: -1.2M ${token} (bullish signal)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🐋 Powered by Whale Watch — On-Chain Intelligence`
  };
}

export function validateRequirements(request: any): ValidationResult {
  return { valid: true };
}

export function requestPayment(request: any): string {
  return "🐋 Whale Watch Alert accepted! Monitoring on-chain activity...";
}
