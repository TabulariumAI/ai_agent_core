import { Container } from "typedi";

import { TOKENS } from "../core/tokens";
import * as Interfaces from "../core/interfaces/imports";
import * as Services from "../infrastructure/services/imports";
import * as AIClients from "../infrastructure/aiclients/imports";

export function setupContainer() {
    Container.set(Services.ChoiceService, new Services.ChoiceService());
    Container.set(Services.FileTypeService, new Services.FileTypeService());
    Container.set(Services.SegmentService, new Services.SegmentService());
    Container.set(Services.StreamService, new Services.StreamService());
    Container.set(Services.TokenService, new Services.TokenService());
    Container.set(Services.MetaDataService, new Services.MetaDataService(
        Container.get(Services.StreamService))
    );
    Container.set<Interfaces.IBlobService>(TOKENS.IBlobService, new Services.AzureBlobService());
    Container.set<Interfaces.IIntegrationService>(TOKENS.IIntegrationService, new Services.DemoIntegrationService());
    Container.set<Interfaces.ITrackingService>(TOKENS.ITrackingService, new Services.DemoTrackingService());
    
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
        Container.get(Services.TokenService),Container.get(Services.FileTypeService),
    ));

}
export { Container };

