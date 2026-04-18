import "reflect-metadata";
import { useContainer as routingUseContainer, createExpressServer } from "routing-controllers";
import { Container } from "typedi";
import request from "supertest";
import path from "path";

import { AutoRedactController } from "../../api/controllers/autoRedactController";
import { AutoRedactUseCase, AutoRedactData } from "../../application/useCases/autoRedactUseCase";
import { ChoiceService } from "../../infrastructure/services/choiceService";
import { Choice } from "../../core/entities/choice";
import { FileTypeService } from "../../infrastructure/services/fileTypeService";

jest.mock("../../application/useCases/autoRedactUseCase");

describe('AutoRedactController Integration', () => {

    let app: any;
    let useCaseMock: jest.Mocked<AutoRedactUseCase>;

    const url = "/autoredact";

    beforeAll(() => {
        routingUseContainer(Container);

        useCaseMock = new (AutoRedactUseCase as any)();

        Container.set(ChoiceService, new ChoiceService());
        Container.set(FileTypeService, new FileTypeService());
        Container.set(AutoRedactUseCase, useCaseMock);

        app = createExpressServer({
            controllers: [AutoRedactController],
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
