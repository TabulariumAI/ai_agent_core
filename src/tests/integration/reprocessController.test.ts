import "reflect-metadata";
import { useContainer as routingUseContainer, createExpressServer } from "routing-controllers";
import { Container } from "typedi";
import request from "supertest";

import * as Services from "../../infrastructure/services/imports";
import { InternalError, NotFoundError } from "../../core/entities/error";
import { ReprocessUseCase } from "../../application/useCases/reprocessUseCase";
import { ReprocessController } from "../../api/controllers/reprocessController";

jest.mock("../../application/useCases/reprocessUseCase");


describe("ReprocessController Integration", () => {
    let app: any;
    let useCaseMock: jest.Mocked<ReprocessUseCase>;
    const url = "/reprocess/test-session/party";
    const incorrectSegmentUrl = "/reprocess/test-session/incorrect-segment";

    beforeAll(() => {
        routingUseContainer(Container);

        useCaseMock = new (ReprocessUseCase as any)();

        Container.set(ReprocessUseCase, useCaseMock);

        app = createExpressServer({
            controllers: [ReprocessController],
            defaultErrorHandler: false,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return 200 and call useCase.execute when the request is valid", async () => {
        useCaseMock.execute.mockResolvedValue(undefined);

        const response = await request(app)
            .post(url)

        expect(useCaseMock.execute).toHaveBeenCalledWith({
            session: "test-session",
            segment: "party",
        });
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("should return 200 when no request body is provided", async () => {
        useCaseMock.execute.mockResolvedValue(undefined);

        const response = await request(app)
            .post(url)
            .send({});

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("should return 400 when segment is invalid", async () => {
        useCaseMock.execute.mockResolvedValue(undefined);

        const response = await request(app)
            .post(incorrectSegmentUrl)

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch("Invalid segment");
    });

    it("should return 404 if useCase.execute throws NotFoundError", async () => {
        useCaseMock.execute.mockRejectedValue(new NotFoundError("Some error"));

        const response = await request(app)
            .post(url)

        expect(useCaseMock.execute).toHaveBeenCalled();
        expect(response.status).toBe(404);
        expect(response.body.error).toMatch("Some error");
    });

    it("should return 500 if useCase.execute throws InternalError", async () => {
        useCaseMock.execute.mockRejectedValue(new InternalError("Some error"));

        const response = await request(app)
            .post(url)

        expect(useCaseMock.execute).toHaveBeenCalled();
        expect(response.status).toBe(500);
        expect(response.body.error).toMatch("Some error");
    });

    it("should return 500 if useCase.execute throws", async () => {
        useCaseMock.execute.mockRejectedValue(new Error("Some error"));

        const response = await request(app)
            .post(url)

        expect(useCaseMock.execute).toHaveBeenCalled();
        expect(response.status).toBe(500);
        expect(response.body.error).toMatch("Internal server error");
    });
});
