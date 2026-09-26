import { Inject, Service } from "typedi";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import { autoRedactChoice } from "../../core/entities/choices/autoRedactChoice";
import { IndexService } from "../../infrastructure/services/indexService";
import { TaskProcessor } from "./taskProcessor";
import { TOKENS } from "../../core/tokens";
import { Config } from "../../config";

@Service()
export class RedactTaskProcessor extends TaskProcessor {
    protected batchType: Entities.BatchType;
    protected context: Entities.WorkflowContext;
    protected choice: Entities.Choice;
    protected indexCallback: string;
    protected reportRoot: string;
    protected batchInRoot: string;



    constructor(
        @Inject(TOKENS.IBatchRepository) protected readonly batchRepository: Interfaces.IBatchRepository,
        @Inject(TOKENS.IBatchSourceRepository) protected readonly batchSourceRepository: Interfaces.IBatchSourceRepository,
        @Inject(TOKENS.IBatchClient) protected readonly batchClient: Interfaces.IBatchClient,
        @Inject() protected readonly indexService: IndexService,
        @Inject(TOKENS.ILogger) protected readonly logger: Interfaces.ILogger,
    ) {
        super();
        this.batchType = Entities.BatchType.Redact;
        const context: Entities.WorkflowContext = {
            workflow: Entities.Workflow.REDACT,
            step: Entities.Step.REDACT
        };
        this.context = context;
        this.choice = autoRedactChoice;
        this.indexCallback = Entities.Callback.AUTOREDACT_INDEX;
        this.reportRoot = Config.batchRedactOut;
        this.batchInRoot = Config.batchRedactIn;
    }


}
