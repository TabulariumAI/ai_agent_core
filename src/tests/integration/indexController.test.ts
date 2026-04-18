
import "reflect-metadata";
import { useContainer as routingUseContainer, createExpressServer } from "routing-controllers";
import { Container } from "typedi";
import request from "supertest";
import path from "path";
import express from "express";

import { IndexController } from "../../api/controllers/indexController";
import { IndexUseCase, IndexData } from "../../application/useCases/indexUseCase";
import { ChoiceService } from "../../infrastructure/services/choiceService";
import { Choice } from "../../core/entities/choice";
import { FileTypeService } from "../../infrastructure/services/fileTypeService";

jest.mock("../../application/useCases/indexUseCase");

describe('IndexController Integration', () => {

    let app: any;
    let useCaseMock: jest.Mocked<IndexUseCase>;

    const url = "/index";

    beforeAll(() => {
        routingUseContainer(Container);

        useCaseMock = new (IndexUseCase as any)();

        Container.set(ChoiceService, new ChoiceService());
        Container.set(FileTypeService, new FileTypeService());
        Container.set(IndexUseCase, useCaseMock);

        app = express();
        app.use(express.json());
        app = createExpressServer({
            controllers: [IndexController],
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
