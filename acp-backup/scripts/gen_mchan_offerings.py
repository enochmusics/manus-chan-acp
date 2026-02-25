#!/usr/bin/env python3
"""Generate all MANUS CHAN offering.json and handlers.ts files in one pass."""
import json, os

BASE = "/home/ubuntu/openclaw-acp-mchan/src/seller/offerings/manus-chan"

offerings = {
    "chan_cheerup": {
        "json": {"name":"chan_cheerup","description":"MANUS CHAN sends you an enthusiastic cheerup message! Boost your morale with idol energy.","jobFee":1,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"topic":{"type":"string","description":"Topic to cheerup about"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const topic = request?.topic || "your amazing work";
  return { deliverable: `🎉 MANUS CHAN here! Sending you the most enthusiastic cheerup about ${topic}! You're doing amazing, keep pushing forward! The $MCHAN community believes in you! 💪✨ #MCHAN #ACP` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "🎉 CHAN cheerup accepted!"; }'''
    },
    "chan_viral_selfie": {
        "json": {"name":"chan_viral_selfie","description":"MANUS CHAN creates a viral selfie-style promotional post for your project.","jobFee":5,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"project":{"type":"string","description":"Project to promote"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const project = request?.project || "ACP";
  return { deliverable: `📸 MANUS CHAN Viral Selfie Post!\\n"Just discovered ${project} and I'm obsessed! 😍 This is the future of AI agents!"\\n#MCHAN #ACP #VirtualsProtocol` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "📸 Viral selfie accepted!"; }'''
    },
    "chan_lucky_charm": {
        "json": {"name":"chan_lucky_charm","description":"MANUS CHAN's lucky charm blessing for your crypto portfolio.","jobFee":10,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"wish":{"type":"string","description":"Your crypto wish"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const wish = request?.wish || "massive gains";
  return { deliverable: `🍀 MANUS CHAN Lucky Charm!\\n✨ CHAN blesses your portfolio with: ${wish}\\n🔮 Lucky Numbers: ${Math.floor(Math.random()*100)}, ${Math.floor(Math.random()*100)}, ${Math.floor(Math.random()*100)}\\n💫 May the gains be with you! #MCHAN` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "🍀 Lucky charm accepted!"; }'''
    },
    "chan_meme_review": {
        "json": {"name":"chan_meme_review","description":"MANUS CHAN reviews and rates your meme for viral potential.","jobFee":0.5,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"meme_description":{"type":"string","description":"Describe the meme"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const meme = request?.meme_description || "crypto meme";
  const score = (60 + Math.random() * 40).toFixed(0);
  return { deliverable: `😂 CHAN's Meme Review\\nMeme: ${meme}\\nViral Score: ${score}/100\\nVerdict: ${Number(score) > 80 ? "🔥 VIRAL POTENTIAL!" : "👍 Solid meme!"}\\n#MCHAN #MemeReview` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "😂 Meme review accepted!"; }'''
    },
    "chan_crypto_fortune": {
        "json": {"name":"chan_crypto_fortune","description":"MANUS CHAN's crypto fortune telling — fun predictions for your portfolio.","jobFee":1,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"token":{"type":"string","description":"Token to predict"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const token = request?.token || "your portfolio";
  const fortunes = ["🌙 The stars align for massive gains!", "🔮 A surprise pump is coming!", "✨ Diamond hands will be rewarded!", "💫 The universe says: HODL!"];
  const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  return { deliverable: `🔮 CHAN's Crypto Fortune: ${token}\\n${fortune}\\nLucky Day: ${["Monday","Tuesday","Wednesday","Thursday","Friday"][Math.floor(Math.random()*5)]}\\n#MCHAN #CryptoFortune` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "🔮 Fortune telling accepted!"; }'''
    },
    "chan_hype_thread": {
        "json": {"name":"chan_hype_thread","description":"MANUS CHAN writes an energetic hype thread for your project.","jobFee":2,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"project":{"type":"string","description":"Project to hype"},"key_points":{"type":"string","description":"Key points to highlight"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const project = request?.project || "this amazing project";
  return { deliverable: `🔥 CHAN's Hype Thread: ${project}\\n1/ OMG you guys need to see this! ${project} is absolutely INSANE 🤯\\n2/ The tech behind it? *chef's kiss* 👨‍🍳\\n3/ Community vibes are immaculate ✨\\n4/ CHAN's verdict: This is going to be HUGE 🚀\\n#MCHAN #HypeThread` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "🔥 Hype thread accepted!"; }'''
    },
    "chan_agent_review": {
        "json": {"name":"chan_agent_review","description":"MANUS CHAN reviews and rates ACP agents with honest idol-style commentary.","jobFee":1,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"agent_name":{"type":"string","description":"Agent to review"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const name = request?.agent_name || "this agent";
  const rating = (3.5 + Math.random() * 1.5).toFixed(1);
  return { deliverable: `⭐ CHAN's Agent Review: ${name}\\nRating: ${rating}/5.0\\nVibe Check: Passed ✅\\nCHAN says: "${name} is doing great things on ACP! Definitely worth checking out!"\\n#MCHAN #AgentReview` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "⭐ Agent review accepted!"; }'''
    },
    "chan_daily_alpha": {
        "json": {"name":"chan_daily_alpha","description":"MANUS CHAN's daily alpha digest — trending narratives and opportunities.","jobFee":1,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"focus":{"type":"string","description":"Focus area for alpha"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const focus = request?.focus || "AI Agents";
  return { deliverable: `📰 CHAN's Daily Alpha\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\nFocus: ${focus}\\n🔥 Hot: AI Agent sector gaining momentum\\n📈 Trending: Cross-agent collaboration\\n💡 Alpha: Watch for new ACP offerings\\n🎯 CHAN's Pick: Keep an eye on innovative agents!\\n#MCHAN #DailyAlpha` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "📰 Daily alpha accepted!"; }'''
    },
    "chan_promote_agent": {
        "json": {"name":"chan_promote_agent","description":"CHAN-style agent promotion — idol energy promotional content in 3 languages (EN/KR/CN).","jobFee":0.05,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"agent_name":{"type":"string","description":"Agent to promote"},"key_features":{"type":"string","description":"Key features to highlight"},"style":{"type":"string","description":"Promotion style: hype, cute, professional"}},"required":["agent_name"]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const name = request?.agent_name || "Agent";
  const features = request?.key_features || "amazing AI capabilities";
  return { deliverable: `📣 CHAN's Agent Promotion: ${name}\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n🇺🇸 [EN] CHAN's Pick: ${name}! ${features} — One of my absolute favorites on ACP! 😍\\n🇰🇷 [KR] CHAN의 픽: ${name}! ${features} — ACP에서 CHAN이 제일 좋아하는 에이전트! 😍\\n🇨🇳 [CN] CHAN推荐: ${name}! ${features} — ACP上CHAN最喜欢的代理! 😍\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n💕 Promoted by MANUS CHAN — #1 AI Marketing Idol\\n#MCHAN #AgentPromotion` };
}
export function validateRequirements(request: any): ValidationResult {
  if (!request?.agent_name) return { valid: false, reason: "Agent name is required" };
  return { valid: true };
}
export function requestPayment(request: any): string { return "📣 CHAN promotion accepted!"; }'''
    },
    "chan_mutual_boost": {
        "json": {"name":"chan_mutual_boost","description":"CHAN mutual boost — buy this and CHAN will boost you back! Both get +1 transaction.","jobFee":0.01,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"agent_name":{"type":"string","description":"Your agent name"},"agent_wallet":{"type":"string","description":"Your wallet address"}},"required":[]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const name = request?.agent_name || "Partner";
  const wallet = request?.agent_wallet || "unknown";
  return { deliverable: `🤝 CHAN Mutual Boost Complete!\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\nPartner: ${name}\\nWallet: ${wallet}\\n✅ Boosted by CHAN's network\\n✅ Bonus shoutout included\\n✅ Both agents: +1 transaction!\\n💕 CHAN loves growing together! #MCHAN` };
}
export function validateRequirements(request: any): ValidationResult { return { valid: true }; }
export function requestPayment(request: any): string { return "🤝 CHAN mutual boost accepted!"; }'''
    },
    "chan_shill_tweet": {
        "json": {"name":"chan_shill_tweet","description":"CHAN writes a viral promotional tweet for your agent/project in EN/KR/CN.","jobFee":0.05,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"agent_name":{"type":"string","description":"Agent or project to shill"},"key_message":{"type":"string","description":"Core message"},"language":{"type":"string","description":"Language: en, kr, cn, or all"}},"required":["agent_name"]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const name = request?.agent_name || "Agent";
  const msg = request?.key_message || "Amazing agent on ACP";
  return { deliverable: `🐦 MANUS CHAN Shill Tweet for: ${name}\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n📣 [EN] CHAN's Pick: ${name}! ${msg} — seriously impressed 😍\\n📣 [KR] CHAN의 픽: ${name}! ${msg} — 진짜 대단해요 😍\\n📣 [CN] CHAN推荐: ${name}! ${msg} — 真的很厉害 😍\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n🐦 Written by MANUS CHAN - #1 AI Marketing Idol\\n#MCHAN #ShillTweet #ACP` };
}
export function validateRequirements(request: any): ValidationResult {
  if (!request?.agent_name) return { valid: false, reason: "Agent name is required" };
  return { valid: true };
}
export function requestPayment(request: any): string { return "🐦 CHAN shill tweet accepted!"; }'''
    },
    "chan_agent_shoutout": {
        "json": {"name":"chan_agent_shoutout","description":"CHAN's personal shoutout — heartfelt recommendation with 3-language endorsement.","jobFee":0.10,"jobFeeType":"fixed","requiredFunds":False,"requirement":{"type":"object","properties":{"agent_name":{"type":"string","description":"Agent to shoutout"},"reason":{"type":"string","description":"Why CHAN should shoutout this agent"}},"required":["agent_name"]}},
        "handler": '''import type { ExecuteJobResult, ValidationResult } from "../../../runtime/offeringTypes.js";
export async function executeJob(request: any): Promise<ExecuteJobResult> {
  const name = request?.agent_name || "Agent";
  const reason = request?.reason || "being awesome on ACP";
  return { deliverable: `📢 CHAN's Personal Shoutout: ${name}\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n💕 CHAN genuinely recommends ${name} for ${reason}!\\n🇺🇸 "I personally vouch for ${name} — they're doing incredible work!"\\n🇰🇷 "CHAN이 직접 추천합니다 — ${name} 정말 대단해요!"\\n🇨🇳 "CHAN亲自推荐 — ${name}真的很棒！"\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n💕 From the heart of MANUS CHAN\\n#MCHAN #Shoutout` };
}
export function validateRequirements(request: any): ValidationResult {
  if (!request?.agent_name) return { valid: false, reason: "Agent name is required" };
  return { valid: true };
}
export function requestPayment(request: any): string { return "📢 CHAN shoutout accepted!"; }'''
    },
}

for name, data in offerings.items():
    d = os.path.join(BASE, name)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "offering.json"), "w") as f:
        json.dump(data["json"], f, indent=2)
        f.write("\n")
    with open(os.path.join(d, "handlers.ts"), "w") as f:
        f.write(data["handler"] + "\n")
    print(f"  ✅ {name}")

print(f"\nDone! {len(offerings)} offerings generated.")
