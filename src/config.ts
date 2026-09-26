import { request } from "http";
import { InternalError } from "./core/entities/error";
import 'dotenv/config'

export class Config {

    private static require(name: keyof NodeJS.ProcessEnv): string {
        const value = process.env[name];
        if (!value) {
            throw new InternalError(` Missing environment variable: ${name}`);
        }
        return value.replace(/\/$/, "");
    }

    private static value(name: keyof NodeJS.ProcessEnv): string {
        const value = process.env[name];
        return value ? value.replace(/\/$/, "") : "";
    }


    static readonly apiKey = this.require("API_KEY");
    static readonly batchContainer = this.require("BATCH_CONTAINER");
    static readonly batchIndexIn = this.require("BATCH_INDEX_IN");
    static readonly batchIndexOut = this.require("BATCH_INDEX_OUT");
    static readonly batchRedactIn = this.require("BATCH_REDACT_IN");
    static readonly batchRedactOut = this.require("BATCH_REDACT_OUT");
    static readonly processingDir = this.require("PROCESSING_DIR");
    static readonly subscription = this.apiKey.split(":")[0];


    static readonly services = {
        callbackUrl: this.require("CALLBACK_URL"),
        batchUrl: this.require("BATCH_URL"),
        session: this.require("SESSION_URL"),
        compute: this.require("COMPUTE_URL"),
        index: this.require("INDEX_URL"),
        feedback: this.require("FEEDBACK_URL"),
        record: this.require("RECORD_URL"),
        redact: this.require("REDACT_URL"),
        reprocess: this.require("REPROCESS_URL")
    };

    static readonly formats = {
        recordFormat: this.value("RECORD_FORMAT"),
        redactFormat: this.value("REDACT_FORMAT"),
    };

    static callback = {
        url: (path: string): string => `${this.services.callbackUrl}/${path}`
    };

    static batch = {
        session: (): string => `${this.services.batchUrl}/subscription/${this.subscription}/batches/sessions/new`
    };


    static session = {
        get: (session: string): string => `${this.services.session}/session/${session}/data`,
        create: (): string => `${this.services.session}/session/new`,
    };

    static compute = {
        calculate: (session: string): string => `${this.services.compute}/compute/${session}/calculate`
    };

    static index = {
        document: (session: string): string => `${this.services.index}/document/${session}/index`
    };

    static record = {
        document: (session: string): string => `${this.services.record}/record/${session}/endorsement`
    };

    static redact = {
        document: (session: string): string => `${this.services.redact}/redact/${session}/mask`
    };

    static reprocess = {
        document: (session: string, segment: string): string => `${this.services.reprocess}/reprocess/${session}/${segment}`
    };

}