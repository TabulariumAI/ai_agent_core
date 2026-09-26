import { Token } from "typedi";
import * as Interfaces from "./interfaces/imports";

export const TOKENS = {
  IBlobService: "IBlobService",
  IIntegrationService: "IIntegrationService",
  ITrackingService: "ITrackingService",
  IRedactClient: "IRedactClient",
  IReprocessClient: "IReprocessClient",
  IComputeClient: "IComputeClient",
  IIndexClient: "IIndexClient",
  IRecordClient: "IRecordClient",
  ISessionClient: "ISessionClient",
  ILogger: "ILogger",

  IBatchSourceRepository: "IBatchSourceRepository",
  IBatchRepository: "IBatchRepository",
  ITaskRepository: "ITaskRepository",
  IBatchClient: "IBatchClient",
  IIndexTaskClient: "IIndexTaskClient",
  IRedactTaskClient: "IRedactTaskClient",
  IndexTaskExecutor: new Token<Interfaces.ITaskExecutor>("IndexTaskExecutor"),
  RedactTaskExecutor: new Token<Interfaces.ITaskExecutor>("RedactTaskExecutor"),
  IndexTaskProcessor: "IndexTaskProcessor",
  RedactTaskProcessor: "RedactTaskProcessor",


} as const;