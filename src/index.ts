import "reflect-metadata";
import express from "express";
import { useContainer, useExpressServer } from "routing-controllers";
import dotenv from "dotenv";

import { setupContainer, Container } from "./di/container";
import { IndexController } from "./api/controllers/indexController";
import { IndexCallbackController } from "./api/controllers/indexCallbackController";
import { CalcController } from "./api/controllers/calcController";
import { CalcCallbackController } from "./api/controllers/calcCallbackController";
import { AutoRedactController } from "./api/controllers/autoRedactController";
import { AutoRedactCallbackController } from "./api/controllers/autoRedactCallbackController";
import { AutoRecordController } from "./api/controllers/autoRecordController";
import { AutoRecordCallbackController } from "./api/controllers/autoRecordCallbackController";
import { ProvisionController } from "./api/controllers/provisionController";
import { ProvisionCallbackController } from "./api/controllers/provisionCallbackController";
import { EndorseController } from "./api/controllers/endorseController";
import { EndorseCallbackController } from "./api/controllers/endorseCallbackController";
import { RedactController } from "./api/controllers/redactController";
import { RedactCallbackController } from "./api/controllers/redactCallbackController";
import { ReprocessController } from "./api/controllers/reprocessController";
import { ReprocessCallbackController } from "./api/controllers/reprocessCallbackController";

import { startIndexProcessor, startRedactProcessor } from "./application/processors/processorRegistry";
import { RedactBatchProcessingController } from "./api/controllers/redactBatchProcessingController";
import { IndexBatchProcessingController } from "./api/controllers/indexBatchProcessingController";
const controllers = [
    IndexController, 
    IndexCallbackController,
    CalcController, 
    CalcCallbackController,
    EndorseController,
    EndorseCallbackController,
    ReprocessController,
    ReprocessCallbackController,
    RedactController,
    RedactCallbackController,
    AutoRedactController,
    AutoRedactCallbackController,
    AutoRecordController, 
    AutoRecordCallbackController, 
    ProvisionController,
    ProvisionCallbackController,
    IndexBatchProcessingController,
    RedactBatchProcessingController,
];

export function createApp() {
  const app = express();
  useExpressServer(app, { controllers, defaultErrorHandler: false });
  return app;
}

export function startServer(port = 3000) {
  dotenv.config();
  setupContainer();
  useContainer(Container);

  
  const app = createApp();
  const server = app.listen(port, () => console.log(`API running on http://localhost:${port}`));
  void startIndexProcessor();
  void startRedactProcessor();
  return server;
}

export const app = createApp();
