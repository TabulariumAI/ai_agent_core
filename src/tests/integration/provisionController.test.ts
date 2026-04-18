import "reflect-metadata";
import { useContainer as routingUseContainer, createExpressServer } from "routing-controllers";
import { Container } from "typedi";
import request from "supertest";
import path from "path";

import { ProvisionController } from "../../api/controllers/provisionController";
import { ProvisionUseCase, ProvisionData } from "../../application/useCases/provisionUseCase";
import { ChoiceService } from "../../infrastructure/services/choiceService";
import { Choice } from "../../core/entities/choice";
import { FileTypeService } from "../../infrastructure/services/fileTypeService";

jest.mock("../../application/useCases/provisionUseCase");

describe('ProvisionController Integration', () => {

    let app: any;
    let useCaseMock: jest.Mocked<ProvisionUseCase>;

    const url = "/provision";


    beforeAll(() => {
        routingUseContainer(Container);

        useCaseMock = new (ProvisionUseCase as any)();

        Container.set(ChoiceService, new ChoiceService());
        Container.set(FileTypeService, new FileTypeService());
        Container.set(ProvisionUseCase, useCaseMock);

        app = createExpressServer({
            controllers: [ProvisionController],
            defaultErrorHandler: false,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should upload a file and return session id', async () => {
        useCaseMock.execute.mockResolvedValue("test-session");

        const response = await request(app)
            .post(url)
            .attach('file', path.resolve(__dirname, '../documents/test.TIFF'));

        expect(response.status).toBe(200);
        expect(response.body.session).toBe("test-session");
    });

    it('should fail if no correct file provided', async () => {
        useCaseMock.execute.mockResolvedValue("test-session");

        const response = await request(app)
            .post(url)
            .attach('file', path.resolve(__dirname, '../documents/test.txt'));

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Invalid request: no file uploaded or unsupported file type");
    });

    it('should fail if no file provided', async () => {
        useCaseMock.execute.mockResolvedValue("test-session");

        const response = await request(app)
            .post(url);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Invalid request: no file uploaded or unsupported file type");
    });
});
