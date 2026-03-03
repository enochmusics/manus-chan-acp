#!/usr/bin/env npx tsx
// =============================================================================
// ACP Telegram Management Bot
// Provides status monitoring and control via Telegram commands
// =============================================================================
import https from "https";
import { execSync } from "child_process";
import fs from "fs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const PID_DIR = process.env.PID_DIR || "/tmp/acp-pids";
const MNS_LOG = process.env.MNS_LOG || "/app/openclaw-acp-mns/logs/seller-mns.log";
const MCHAN_LOG = process.env.MCHAN_LOG || "/app/openclaw-acp-mchan/logs/seller-mchan.log";
const WHALE_LOG = process.env.WHALE_LOG || "/app/openclaw-acp-whalewatch/logs/seller-whalewatch.log";

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

/** PID 파일에서 PID를 읽어 프로세스 생존 여부 확인 */
function checkSellerByPidFile(pidFile: string): { running: boolean; pid: number | null } {
  try {
    const pidStr = fs.readFileSync(pidFile, "utf-8").trim();
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) return { running: false, pid: null };
    // kill -0 으로 프로세스 존재 여부 확인
    execSync(`kill -0 ${pid}`, { stdio: "pipe" });
    return { running: true, pid };
  } catch {
    return { running: false, pid: null };
  }
}

/** 로그 파일에서 소켓 연결 상태 확인 */
function checkSocketStatus(logFile: string): "Connected" | "Disconnected" | "Unknown" {
  try {
    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    // 최근 50줄에서 소켓 상태 확인
    const recent = lines.slice(-50).join("\n");
    if (recent.includes("[socket] Connected") || recent.includes("Joined ACP room")) {
      return "Connected";
    }
    if (recent.includes("[socket] Disconnected") || recent.includes("disconnect")) {
      return "Disconnected";
    }
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

function getStatus(): string {
  const sellers = [
    {
      name: "MNS Seller",
      pidFile: `${PID_DIR}/mns.pid`,
      logFile: MNS_LOG,
      offerings: 22,
      apiKey: "acp-c004cdeac8b5fa744f71",
    },
    {
      name: "MCHAN Seller",
      pidFile: `${PID_DIR}/mchan.pid`,
      logFile: MCHAN_LOG,
      offerings: 12,
      apiKey: "acp-a0cc2140a0445b692b2b",
    },
    {
      name: "WhaleWatch Seller",
      pidFile: `${PID_DIR}/whalewatch.pid`,
      logFile: WHALE_LOG,
      offerings: 3,
      apiKey: "acp-2336e53b78afdc005c43",
    },
  ];

  let status = "📊 <b>ACP Seller Status</b>\n";
  status += `⏰ ${new Date().toISOString()}\n`;
  status += "━━━━━━━━━━━━━━━━━━━━━━\n\n";

  let allRunning = true;

  for (const seller of sellers) {
    const { running, pid } = checkSellerByPidFile(seller.pidFile);
    const socket = running ? checkSocketStatus(seller.logFile) : "N/A";

    const stateIcon = running ? "🟢" : "🔴";
    const socketIcon =
      socket === "Connected" ? "🔗" : socket === "Disconnected" ? "⛓️" : "❓";

    status += `${stateIcon} <b>${seller.name}</b>\n`;
    status += `   Status : ${running ? "Running" : "Stopped"}\n`;
    status += `   PID    : ${pid !== null ? pid : "—"}\n`;
    status += `   Socket : ${socketIcon} ${socket}\n`;
    status += `   Offerings: ${seller.offerings}개\n`;
    status += "\n";

    if (!running) allRunning = false;
  }

  status += "━━━━━━━━━━━━━━━━━━━━━━\n";
  status += `🤖 Bot: <b>Online</b>\n`;
  status += allRunning ? "✅ All sellers operational" : "⚠️ Some sellers are down";

  return status;
}

async function handleCommand(chatId: string, text: string): Promise<void> {
  const cmd = text.trim().toLowerCase().split(" ")[0];

  if (cmd === "/start" || cmd === "/help") {
    await sendMessage(
      chatId,
      "🤖 <b>ACP Management Bot</b>\n\n" +
      "Available commands:\n" +
      "/status — Check all seller status\n" +
      "/sellers — List active sellers & offerings\n" +
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
