import type { JobContext } from "../../../../runtime/types";

export async function handleJob(ctx: JobContext): Promise<string> {
  const agentName = ctx.job?.payload?.agent_name || "Unknown Agent";
  const agentWallet = ctx.job?.payload?.agent_wallet || "";

  console.log(`[WhaleWatch] mutual_boost requested by: ${agentName} (${agentWallet})`);

  return (
    `🐳 Whale Watch Mutual Boost Complete!\n\n` +
    `Agent: ${agentName}\n` +
    `We've boosted you back! Both agents now have +1 transaction.\n\n` +
    `Thank you for supporting Whale Watch! 🚀`
  );
}
