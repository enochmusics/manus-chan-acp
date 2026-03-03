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
    req.setTimeout(40000, () => {
      req.destroy(new Error("Request timeout"));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function sendMessage(chatId: string, text: string): Promise<void> {
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
  try {
    await httpsRequest(
      {
        hostname: "api.telegram.org",
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      body
    );
  } catch (err) {
    console.error("[bot] sendMessage error:", err);
  }
}

async function getUpdates(offset: number): Promise<any[]> {
  // timeout: 20으로 줄여서 Railway 환경에서 연결 안정성 확보
  // allowed_updates에 message와 callback_query 모두 포함
  const body = JSON.stringify({
    offset,
    timeout: 20,
    allowed_updates: ["message", "callback_query"],
  });
  try {
    const res = await httpsRequest(
      {
        hostname: "api.telegram.org",
        path: `/bot${BOT_TOKEN}/getUpdates`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      body
    );
    const parsed = JSON.parse(res);
    if (!parsed.ok) {
      console.error("[bot] getUpdates not ok:", parsed.description);
      return [];
    }
    return parsed.result || [];
  } catch (err) {
    console.error("[bot] getUpdates error:", err);
    return [];
  }
}

/** PID 파일에서 PID를 읽어 프로세스 생존 여부 확인 */
function checkSellerByPidFile(pidFile: string): { running: boolean; pid: number | null } {
  try {
    const pidStr = fs.readFileSync(pidFile, "utf-8").trim();
    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) return { running: false, pid: null };
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
    },
    {
      name: "MCHAN Seller",
      pidFile: `${PID_DIR}/mchan.pid`,
      logFile: MCHAN_LOG,
      offerings: 12,
    },
    {
      name: "WhaleWatch Seller",
      pidFile: `${PID_DIR}/whalewatch.pid`,
      logFile: WHALE_LOG,
      offerings: 16,
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
  console.log(`[bot] Handling command: ${cmd} from chat ${chatId}`);

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
      "   Offerings: 16개\n" +
      "   API Key: acp-2336e53b78afdc005c43"
    );
  } else {
    await sendMessage(chatId, `❓ Unknown command: <code>${cmd}</code>\nUse /help for available commands.`);
  }
}

async function main(): Promise<void> {
  console.log("[bot] ACP Telegram Bot starting...");
  console.log(`[bot] CHAT_ID: ${CHAT_ID}`);
  console.log(`[bot] BOT_TOKEN: ${BOT_TOKEN.slice(0, 10)}...`);

  // 시작 시 pending 업데이트 모두 flush (이전 누적 메시지 무시)
  try {
    const flushRes = await httpsRequest(
      {
        hostname: "api.telegram.org",
        path: `/bot${BOT_TOKEN}/getUpdates?offset=-1`,
        method: "GET",
      }
    );
    const parsed = JSON.parse(flushRes);
    if (parsed.ok && parsed.result.length > 0) {
      lastUpdateId = parsed.result[parsed.result.length - 1].update_id;
      console.log(`[bot] Flushed pending updates. lastUpdateId set to ${lastUpdateId}`);
    }
  } catch (err) {
    console.error("[bot] Flush error (non-fatal):", err);
  }

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

  // Long-polling loop with improved error handling
  let consecutiveErrors = 0;
  while (true) {
    try {
      const updates = await getUpdates(lastUpdateId + 1);
      consecutiveErrors = 0; // 성공 시 에러 카운터 리셋

      for (const update of updates) {
        lastUpdateId = update.update_id;
        const msg = update.message;
        if (!msg || !msg.text) continue;

        const chatId = String(msg.chat.id);
        const fromUser = msg.from?.username || msg.from?.first_name || "unknown";

        // 인증된 채팅만 처리
        if (chatId !== CHAT_ID) {
          console.log(`[bot] Ignoring message from unauthorized chat: ${chatId} (user: ${fromUser})`);
          continue;
        }

        console.log(`[bot] Received from ${fromUser} (${chatId}): ${msg.text}`);
        await handleCommand(chatId, msg.text);
      }
    } catch (err) {
      consecutiveErrors++;
      console.error(`[bot] Polling error #${consecutiveErrors}:`, err);
      // 연속 에러 시 대기 시간 증가 (최대 30초)
      const waitMs = Math.min(consecutiveErrors * 2000, 30000);
      console.log(`[bot] Waiting ${waitMs}ms before retry...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

main().catch((err) => {
  console.error("[bot] Fatal error:", err);
  process.exit(1);
});
