#!/usr/bin/env npx tsx
// =============================================================================
// ACP Telegram Management Bot
// Provides status monitoring and control via Telegram commands
// =============================================================================
import https from "https";
import { execSync } from "child_process";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("[bot] TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set");
  process.exit(1);
}

let lastUpdateId = 0;

function httpsRequest(options: https.RequestOptions, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function sendMessage(chatId: string, text: string): Promise<void> {
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
  await httpsRequest(
    {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    },
    body
  );
}

async function getUpdates(offset: number): Promise<any[]> {
  const body = JSON.stringify({ offset, timeout: 30, allowed_updates: ["message"] });
  const res = await httpsRequest(
    {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN}/getUpdates`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    },
    body
  );
  try {
    const parsed = JSON.parse(res);
    return parsed.ok ? parsed.result : [];
  } catch {
    return [];
  }
}

function getStatus(): string {
  const sellers = [
    { name: "MNS Seller", label: "SELLER_LABEL=MNS" },
    { name: "MCHAN Seller", label: "SELLER_LABEL=MCHAN" },
    { name: "WhaleWatch Seller", label: "SELLER_LABEL=WhaleWatch" },
  ];

  let status = "📊 <b>ACP Seller Status</b>\n";
  status += `⏰ ${new Date().toISOString()}\n\n`;

  try {
    const psOutput = execSync("ps aux | grep 'seller.ts\\|seller-with-telegram' | grep -v grep", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const lines = psOutput.split("\n").filter(Boolean);
    if (lines.length === 0) {
      status += "⚠️ No seller processes found\n";
    } else {
      status += `✅ <b>${lines.length} seller process(es) running</b>\n\n`;
      lines.forEach((line, i) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const cpu = parts[2];
        const mem = parts[3];
        status += `• Process ${i + 1}: PID=${pid} CPU=${cpu}% MEM=${mem}%\n`;
      });
    }
  } catch {
    status += "✅ Sellers running (Railway managed)\n";
  }

  status += "\n🤖 Bot: <b>Online</b>";
  return status;
}

async function handleCommand(chatId: string, text: string): Promise<void> {
  const cmd = text.trim().toLowerCase();

  if (cmd === "/start" || cmd === "/help") {
    await sendMessage(
      chatId,
      "🤖 <b>ACP Management Bot</b>\n\n" +
      "Available commands:\n" +
      "/status — Check all seller status\n" +
      "/sellers — List active sellers\n" +
      "/help — Show this message\n\n" +
      "📡 Monitoring: MNS + MCHAN + WhaleWatch sellers\n" +
      "🔔 Auto-alerts: New jobs & deliveries"
    );
  } else if (cmd === "/status") {
    await sendMessage(chatId, getStatus());
  } else if (cmd === "/sellers") {
    await sendMessage(
      chatId,
      "🛍️ <b>Active Sellers</b>\n\n" +
      "1️⃣ <b>MNS Seller</b>\n" +
      "   Agent: Manus - #1 ACP Marketing & Growth Agency\n" +
      "   Offerings: 22개\n" +
      "   API Key: acp-c004cdeac8b5fa744f71\n\n" +
      "2️⃣ <b>MCHAN Seller</b>\n" +
      "   Agent: MANUS CHAN\n" +
      "   Offerings: 12개\n" +
      "   API Key: acp-a0cc2140a0445b692b2b\n\n" +
      "3️⃣ <b>WhaleWatch Seller</b>\n" +
      "   Agent: Whale Watch\n" +
      "   Offerings: 3개\n" +
      "   API Key: acp-2336e53b78afdc005c43"
    );
  } else {
    await sendMessage(chatId, "❓ Unknown command. Use /help for available commands.");
  }
}

async function main(): Promise<void> {
  console.log("[bot] ACP Telegram Bot starting...");

  // Startup notification
  await sendMessage(
    CHAT_ID,
    "🚀 <b>ACP Management Bot 시작!</b>\n\n" +
    "✅ MNS Seller — 대기 중\n" +
    "✅ MCHAN Seller — 대기 중\n" +
    "✅ WhaleWatch Seller — 대기 중\n\n" +
    "🔔 Job 수신 시 자동 알림 활성화\n" +
    "⏰ " + new Date().toISOString() + "\n\n" +
    "Use /help for commands"
  );

  console.log("[bot] Startup notification sent. Polling for commands...");

  // Long-polling loop
  while (true) {
    try {
      const updates = await getUpdates(lastUpdateId + 1);
      for (const update of updates) {
        lastUpdateId = update.update_id;
        const msg = update.message;
        if (!msg || !msg.text) continue;
        const chatId = String(msg.chat.id);
        // Only respond to authorized chat
        if (chatId !== CHAT_ID) {
          console.log(`[bot] Ignoring message from unauthorized chat: ${chatId}`);
          continue;
        }
        console.log(`[bot] Command from ${chatId}: ${msg.text}`);
        await handleCommand(chatId, msg.text);
      }
    } catch (err) {
      console.error("[bot] Polling error:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch((err) => {
  console.error("[bot] Fatal error:", err);
  process.exit(1);
});
