import { Inject, Service } from "typedi";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import { indexChoice } from "../../core/entities/choices/indexChoice";
import { IndexService } from "../../infrastructure/services/indexService";
import { TaskProcessor } from "./taskProcessor";
import { TOKENS } from "../../core/tokens";
import { Config } from "../../config";


@Service()
export class IndexTaskProcessor extends TaskProcessor {
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
        this.batchType = Entities.BatchType.Index;
        const context: Entities.WorkflowContext = {
            workflow: Entities.Workflow.INDEX,
            step: Entities.Step.INDEX
        };
        this.context = context;
        this.choice = indexChoice;
        this.indexCallback = Entities.Callback.INDEX;
        this.reportRoot = Config.batchIndexOut;
        this.batchInRoot = Config.batchIndexIn;
    }

}
