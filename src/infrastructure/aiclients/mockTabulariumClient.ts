import { Service, Inject } from "typedi";
import { v4 as uuidv4 } from "uuid";

import { TokenService } from "../services/tokenService";
import * as Entities from "../../core/entities/imports";
import * as Interfaces from "../../core/interfaces/imports";

const metaData: string = JSON.stringify({
    heading: {
        title: "Mock Document",
        class: "class",
        explanation: "explanation"
    },
    secrets: [],
    indexes: [],
});

@Service()
export class MockTabulariumClient implements
    Interfaces.IComputeClient,
    Interfaces.IIndexClient,
    Interfaces.IRecordClient,
    Interfaces.IRedactClient,
    Interfaces.IReprocessClient,
    Interfaces.ISessionClient
     {

    constructor(
        @Inject() private readonly tokenService: TokenService,
    ) {
    }
    async getSession(context: Entities.WorkflowContext, sessionId: string): Promise<Entities.SessionToken> {
        const token: Entities.SessionToken = {
            baseUrl: "",
            token: ""
        };
        return token;
    }

    async createSession(context: Entities.WorkflowContext, documentType: string): Promise<string> {
        return uuidv4().toString();
    }

    async indexDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, document: string, choice: Entities.ChoiceItem[], callback: Entities.Callback): Promise<void> {
        const data = `sn=${JSON.stringify(sessionCallbackData)}`;
        const token = this.tokenService.sign(data);
        const url = `${process.env.CALLBACK_URL}/${callback}?${data}`;
        const result: Entities.CallbackData = {
            status: Entities.CallbackStatus.COMPLETED,
            data: "https://example.com/test.json"

        }
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            },
            body: JSON.stringify(result)
        });
    }


    async reprocessDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, segment: string, callback: Entities.Callback): Promise<void> {
        const data = `sn=${JSON.stringify(sessionCallbackData)}`;
        const token = this.tokenService.sign(data);
        const url = `${process.env.CALLBACK_URL}/${callback}?${data}`;
        const result: Entities.CallbackData = {
            status: Entities.CallbackStatus.COMPLETED,
            data: "https://example.com/test.json"

        }
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            },
            body: JSON.stringify(result)
        });
    }

    async calcDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string | null, callback: Entities.Callback): Promise<void> {
        const data = `sn=${JSON.stringify(sessionCallbackData)}`;
        const token = this.tokenService.sign(data);
        const url = `${process.env.CALLBACK_URL}/${callback}?${data}`;
        const result: Entities.CallbackData = {
            status: Entities.CallbackStatus.COMPLETED,
            data: "https://example.com/test.json"

        }
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            },
            body: JSON.stringify(result)
        });
    }

    async redactDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string | null, callback: Entities.Callback): Promise<void> {
        const data = `sn=${JSON.stringify(sessionCallbackData)}`;
        const token = this.tokenService.sign(data);
        const url = `${process.env.CALLBACK_URL}/${callback}?${data}`;
        const result: Entities.CallbackData = {
            status: Entities.CallbackStatus.COMPLETED,
            data: "https://example.com/test.json"

        }
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            },
            body: JSON.stringify(result)
        });
    }

    async recordDocument(session: string, callback: Entities.Callback): Promise<void> {
        const data = `sn=${session}`;
        const token = this.tokenService.sign(data);
        const url = `${process.env.CALLBACK_URL}/${callback}?${data}`;
        const result: Entities.CallbackData = {
            status: Entities.CallbackStatus.COMPLETED,
            data: "https://example.com/test.json"

        }
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            },
            body: JSON.stringify(result)
        });
    }


    async endorseDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string, callback: Entities.Callback): Promise<void> {
        const data = `sn=${JSON.stringify(sessionCallbackData)}`;
        const token = this.tokenService.sign(data);
        const url = `${process.env.CALLBACK_URL}/${callback}?${data}`;
        const result: Entities.CallbackData = {
            status: Entities.CallbackStatus.COMPLETED,
            data: "https://example.com/test.json"

        }
        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            },
            body: JSON.stringify(result)
        });
    }



}