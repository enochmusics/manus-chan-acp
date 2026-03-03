#!/usr/bin/env npx tsx
// =============================================================================
// Seller runtime — with Telegram notification support.
// Sends alerts to Telegram when new jobs are received or delivered.
// =============================================================================
import { connectAcpSocket } from "./src/seller/runtime/acpSocket.js";
import { acceptOrRejectJob, requestPayment, deliverJob } from "./src/seller/runtime/sellerApi.js";
import { loadOffering, listOfferings } from "./src/seller/runtime/offerings.js";
import { AcpJobPhase, type AcpJobEventData } from "./src/seller/runtime/types.js";
import type { ExecuteJobResult } from "./src/seller/runtime/offeringTypes.js";
import { getMyAgentInfo } from "./src/lib/wallet.js";
import {
  checkForExistingProcess,
  writePidToConfig,
  removePidFromConfig,
  sanitizeAgentName,
} from "./src/lib/config.js";
import https from "https";

// -- Telegram --
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const SELLER_LABEL = process.env.SELLER_LABEL || "ACP Seller";

async function sendTelegram(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const body = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve());
      }
    );
    req.on("error", () => resolve());
    req.write(body);
    req.end();
  });
}

function setupCleanupHandlers(): void {
  const cleanup = () => { removePidFromConfig(); };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(0); });
  process.on("SIGTERM", () => { cleanup(); process.exit(0); });
  process.on("uncaughtException", (err) => {
    console.error("[seller] Uncaught exception:", err);
    cleanup();
    process.exit(1);
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[seller] Unhandled rejection at:", promise, "reason:", reason);
    cleanup();
    process.exit(1);
  });
}

const ACP_URL = process.env.ACP_SOCKET_URL || "https://acpx.virtuals.io";
let agentDirName: string = "";

function resolveOfferingName(data: AcpJobEventData): string | undefined {
  try {
    const negotiationMemo = data.memos.find((m: any) => m.nextPhase === AcpJobPhase.NEGOTIATION);
    if (negotiationMemo) {
      return JSON.parse(negotiationMemo.content).name;
    }
    const firstMemo = data.memos[0];
    if (firstMemo?.content) {
      const parsed = JSON.parse(firstMemo.content);
      if (parsed.name) return parsed.name;
    }
  } catch {}
  return undefined;
}

function resolveServiceRequirements(data: AcpJobEventData): Record<string, any> {
  try {
    const transactionMemo = data.memos.find((m: any) => m.nextPhase === AcpJobPhase.TRANSACTION);
    if (transactionMemo?.content) {
      const parsed = JSON.parse(transactionMemo.content);
      if (parsed.requirements) return parsed.requirements;
      return parsed;
    }
    const negotiationMemo = data.memos.find((m: any) => m.nextPhase === AcpJobPhase.NEGOTIATION);
    if (negotiationMemo?.content) {
      const parsed = JSON.parse(negotiationMemo.content);
      if (parsed.requirements) return parsed.requirements;
    }
  } catch {}
  return {};
}

async function handleNewTask(data: AcpJobEventData): Promise<void> {
  const jobId = data.id;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${SELLER_LABEL}] New task  jobId=${jobId}  phase=${AcpJobPhase[data.phase] ?? data.phase}`);
  console.log(`         client=${data.clientAddress}  price=${data.price}`);
  console.log(`         context=${JSON.stringify(data.context)}`);
  console.log(`${"=".repeat(60)}`);

  if (data.phase === AcpJobPhase.REQUEST) {
    if (!data.memoToSign) return;
    const negotiationMemo = data.memos.find((m: any) => m.id == Number(data.memoToSign));
    if (negotiationMemo?.nextPhase !== AcpJobPhase.NEGOTIATION) return;

    const offeringName = resolveOfferingName(data);
    const requirements = resolveServiceRequirements(data);

    // Telegram: new job alert
    await sendTelegram(
      `🔔 <b>[${SELLER_LABEL}] 새 Job 수신!</b>\n` +
      `📋 Job ID: <code>${jobId}</code>\n` +
      `🛍️ Offering: <b>${offeringName || "unknown"}</b>\n` +
      `💰 Price: ${data.price}\n` +
      `👤 Client: <code>${data.clientAddress}</code>`
    );

    if (!offeringName) {
      await acceptOrRejectJob(jobId, { accept: false, reason: "Invalid offering name" });
      return;
    }

    try {
      const { config, handlers } = await loadOffering(offeringName, agentDirName);
      if (handlers.validateRequirements) {
        const validationResult = handlers.validateRequirements(requirements);
        let isValid: boolean;
        let reason: string | undefined;
        if (typeof validationResult === "boolean") {
          isValid = validationResult;
          reason = isValid ? undefined : "Validation failed";
        } else {
          isValid = (validationResult as any).valid;
          reason = (validationResult as any).reason;
        }
        if (!isValid) {
          await acceptOrRejectJob(jobId, { accept: false, reason: reason || "Validation failed" });
          return;
        }
      }
      await acceptOrRejectJob(jobId, { accept: true, reason: "Job accepted" });
      const funds =
        config.requiredFunds && handlers.requestAdditionalFunds
          ? handlers.requestAdditionalFunds(requirements)
          : undefined;
      const paymentReason = handlers.requestPayment
        ? handlers.requestPayment(requirements)
        : (funds?.content ?? "Request accepted");
      await requestPayment(jobId, {
        content: paymentReason,
        payableDetail: funds
          ? { amount: funds.amount, tokenAddress: funds.tokenAddress, recipient: funds.recipient }
          : undefined,
      });
    } catch (err) {
      console.error(`[${SELLER_LABEL}] Error processing job ${jobId}:`, err);
    }
  }

  if (data.phase === AcpJobPhase.TRANSACTION) {
    const offeringName = resolveOfferingName(data);
    const requirements = resolveServiceRequirements(data);
    if (offeringName) {
      try {
        const { handlers } = await loadOffering(offeringName, agentDirName);
        console.log(`[${SELLER_LABEL}] Executing offering "${offeringName}" for job ${jobId}...`);
        const result: ExecuteJobResult = await handlers.executeJob(requirements);
        await deliverJob(jobId, {
          deliverable: result.deliverable,
          payableDetail: result.payableDetail,
        });
        console.log(`[${SELLER_LABEL}] Job ${jobId} — delivered.`);

        // Telegram: delivery alert
        await sendTelegram(
          `✅ <b>[${SELLER_LABEL}] Job 완료!</b>\n` +
          `📋 Job ID: <code>${jobId}</code>\n` +
          `🛍️ Offering: <b>${offeringName}</b>\n` +
          `💰 Price: ${data.price}\n` +
          `📦 Delivered successfully`
        );
      } catch (err) {
        console.error(`[${SELLER_LABEL}] Error delivering job ${jobId}:`, err);
        await sendTelegram(
          `❌ <b>[${SELLER_LABEL}] Job 실패!</b>\n` +
          `📋 Job ID: <code>${jobId}</code>\n` +
          `🛍️ Offering: <b>${offeringName}</b>\n` +
          `⚠️ Error: ${String(err).slice(0, 200)}`
        );
      }
    }
    return;
  }
}

async function main() {
  checkForExistingProcess();
  writePidToConfig(process.pid);
  setupCleanupHandlers();

  let walletAddress: string;
  try {
    const agentData = await getMyAgentInfo();
    walletAddress = agentData.walletAddress;
    agentDirName = sanitizeAgentName(agentData.name);
    console.log(`[${SELLER_LABEL}] Agent: ${agentData.name} (dir: ${agentDirName})`);
  } catch (err) {
    console.error(`[${SELLER_LABEL}] Failed to resolve agent info:`, err);
    process.exit(1);
  }

  const offerings = listOfferings(agentDirName);
  console.log(`[${SELLER_LABEL}] Available offerings: ${offerings.length > 0 ? offerings.join(", ") : "(none)"}`);

  // Telegram: startup alert
  await sendTelegram(
    `🚀 <b>[${SELLER_LABEL}] Seller 시작!</b>\n` +
    `📋 Agent Dir: <code>${agentDirName}</code>\n` +
    `🛍️ Offerings: ${offerings.length}개\n` +
    `⏰ ${new Date().toISOString()}`
  );

  connectAcpSocket({
    acpUrl: ACP_URL,
    walletAddress,
    callbacks: {
      onNewTask: (data) => {
        handleNewTask(data).catch((err) =>
          console.error(`[${SELLER_LABEL}] Unhandled error in handleNewTask:`, err)
        );
      },
      onEvaluate: (data) => {
        console.log(`[${SELLER_LABEL}] onEvaluate received for job ${data.id}`);
      },
    },
  });

  console.log(`[${SELLER_LABEL}] Seller runtime is running. Waiting for jobs...\n`);
}

main().catch((err) => {
  console.error(`[${SELLER_LABEL}] Fatal error:`, err);
  process.exit(1);
});
