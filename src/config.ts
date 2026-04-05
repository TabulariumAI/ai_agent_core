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

    static readonly services = {
        callbackUrl: this.require("CALLBACK_URL"),
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

    static session = {
        get: (session: string):  string => `${this.services.session}/session/${session}/data`,
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