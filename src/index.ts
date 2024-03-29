import "dotenv/config";
import express from "express";
import {prepareAlchemyData, validateAlchemySignature} from "./utils/alchemy";
import {processPoolSwapEvent} from "./controllers/webhooks/swap";
import cron from "node-cron";

import {publishTokenStats} from "./jobs/token-stats";
import {processTransferEvent} from "./controllers/webhooks/transfer";

// init express app
export const app = express();

app.use(express.json({limit: "10mb"}));

app.post(
  "/webhooks/token/swaps",
  // Middlewares needed to validate the alchemy signature
  prepareAlchemyData(),
  validateAlchemySignature(process.env.ALCHEMY_WEBHOOK_SIGNING_KEY_SWAP),
  processPoolSwapEvent
);

app.post(
  "/webhooks/token/transfers",
  // Middlewares needed to validate the alchemy signature
  prepareAlchemyData(),
  validateAlchemySignature(process.env.ALCHEMY_WEBHOOK_SIGNING_KEY_TRANSFER),
  processTransferEvent
);

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port 3000");
});

// run every 1 hour
cron.schedule("0 */3 * * *", async () => {
  console.log("Elaborating Tokens stats...");
  try {
    await publishTokenStats();
  } catch (e) {
    console.error(e);
    await publishTokenStats();
  }
});
