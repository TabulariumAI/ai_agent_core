import { Container } from "typedi";

import { TOKENS } from "../core/tokens";
import * as Interfaces from "../core/interfaces/imports";
import * as Services from "../infrastructure/services/imports";
import * as Repositories from "../infrastructure/repositories/imports";
import * as AIClients from "../infrastructure/aiclients/imports";
import { IndexTaskProcessor } from "../application/processors/indexTaskProcessor";
import { RedactTaskProcessor } from "../application/processors/redactTaskProcessor";
import { TaskProcessor } from "../application/processors/taskProcessor";
import { BatchClient } from "../infrastructure/services/imports";

export function setupContainer() {
    Container.set<Interfaces.ILogger>(TOKENS.ILogger, Container.get(Services.ConsoleLogger));
    Container.set<Interfaces.IBatchRepository>(TOKENS.IBatchRepository, Container.get(Repositories.FsBatchRepository));
    Container.set<Interfaces.IBatchSourceRepository>(TOKENS.IBatchSourceRepository, Container.get(Repositories.AzureBatchSourceRepository));

    Container.set<Interfaces.IBlobService>(TOKENS.IBlobService, Container.get(Services.AzureBlobService));
    Container.set<Interfaces.IIntegrationService>(TOKENS.IIntegrationService, Container.get(Services.DemoBatchIntegrationService));
    Container.set<Interfaces.ITrackingService>(TOKENS.ITrackingService, Container.get(Services.DemoTrackingService));

    Container.set<Interfaces.IComputeClient>(TOKENS.IComputeClient, new AIClients.ComputeClient(
        Container.get(Services.TokenService),
    ));
    Container.set<Interfaces.ISessionClient>(TOKENS.ISessionClient, new AIClients.SessionClient(
        Container.get(Services.TokenService),
    ));
    Container.set<Interfaces.IRedactClient>(TOKENS.IRedactClient, new AIClients.RedactClient(
        Container.get(Services.TokenService), Container.get(Services.FileTypeService),
    ));
    Container.set<Interfaces.IReprocessClient>(TOKENS.IReprocessClient, new AIClients.ReprocessClient(
        Container.get(Services.TokenService),
    ));
    Container.set<Interfaces.IIndexClient>(TOKENS.IIndexClient, new AIClients.IndexClient(
        Container.get(Services.TokenService),
    ));
    Container.set<Interfaces.IRecordClient>(TOKENS.IRecordClient, new AIClients.RecordClient(
        Container.get(Services.TokenService), Container.get(Services.FileTypeService),
    ));


    Container.set<Interfaces.IBatchClient>(TOKENS.IBatchClient, new BatchClient(
        //Container.get(Services.TokenService),
    ));


    Container.set<TaskProcessor>(
        TOKENS.IndexTaskProcessor,
        Container.get(IndexTaskProcessor),
    );
    Container.set<TaskProcessor>(
        TOKENS.RedactTaskProcessor,
        Container.get(RedactTaskProcessor),
    );

    Container.set<Interfaces.IIntegrationService>(
        TOKENS.IIntegrationService,
        Container.get(Services.DemoBatchIntegrationService),
    );


}
export { Container };

