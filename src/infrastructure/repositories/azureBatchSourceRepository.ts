import { Inject, Service } from "typedi";
import { Config } from "../../config";
import * as Entities from "../../core/entities/imports";
import * as Interfaces from "../../core/interfaces/imports";
import { ContainerClient } from "@azure/storage-blob";
import { FileTypeService } from "../services/fileTypeService";
import { Readable } from "stream";

@Service()
export class AzureBatchSourceRepository implements Interfaces.IBatchSourceRepository {

    private readonly report: string = "report.json";
    private readonly settings: string = "settings.json";

    constructor(
        @Inject() private readonly fileTypeService: FileTypeService,
        @Inject() private readonly logger: Interfaces.ILogger,
    ) {
    }

    async getSettings(rootPath: string, batchName: string): Promise<Entities.Settings | null> {
        const containerClient = new ContainerClient(Config.batchContainer);
        const blobClient = containerClient.getBlobClient(`${rootPath}/${batchName}/${this.settings}`);
        if (await blobClient.exists()) {
            const buffer = await blobClient.downloadToBuffer();
            const data = new Uint8Array(buffer);
            try {
                const settings: Entities.Settings = JSON.parse(Buffer.from(data).toString());
                return settings;
            } catch (error) {
                this.logger.error(`Failed to parse settings file at path: ${rootPath}/${batchName}/${this.settings}`);
                return null;
            }
        }
        else {
            this.logger.error(`Settings file not found at path: ${rootPath}/${batchName}/${this.settings}`);
        }
        return null;
    }
    
    async getBatch(rootPath: string, batchName: string): Promise<Entities.BatchSource | null> {
        const containerClient = new ContainerClient(Config.batchContainer);
        const prefix = `${rootPath}/${batchName}/`;
        const items: string[] = [];
        for await (const blob of containerClient.listBlobsFlat({ prefix })) {
            let blobName = blob.name;
            blobName = blobName.slice(prefix.length);
            if (blobName.includes("/") || blobName.endsWith(".json")) {
                continue;
            }
            items.push(blobName);
        }
        if (items.length === 0) {
            return null;
        }
        return { name: batchName, items: items } as Entities.BatchSource;
    }

    async getContent(rootPath: string, batchName: string, itemName: string): Promise<Entities.Content | null> {
        const containerClient = new ContainerClient(Config.batchContainer);
        const blobClient = containerClient.getBlobClient(`${rootPath}/${batchName}/${itemName}`);
        if (await blobClient.exists()) {
            const properties = await blobClient.getProperties();
            const mimeType = properties.contentType;
            const buffer = await blobClient.downloadToBuffer();
            const data = new Uint8Array(buffer);
            return new Promise<Entities.Content>((resolve) => {
                resolve({
                    documentType: this.fileTypeService.getFileType(mimeType || ""),
                    data: data,
                });
            });
        }
        return null;
    }

    async setContent(rootPath: string, batchName: string, itemName: string, content: Entities.Content): Promise<void> {
        const fs = require('fs');
        const path = require('path');
        const containerClient = new ContainerClient(Config.batchContainer);
        const blobClient = containerClient.getBlockBlobClient(`${rootPath}/${batchName}/${itemName}`);
        await blobClient.uploadData(Buffer.from(content.data), {
            blobHTTPHeaders: {
                blobContentType: this.fileTypeService.getMimeType(content.documentType),
            },
        });
    }

    async setReport(rootPath: string, batchName: string, report: Entities.BatchReport): Promise<void> {
        const containerClient = new ContainerClient(Config.batchContainer);
        const blobClient = containerClient.getBlockBlobClient(`${rootPath}/${batchName}/${this.report}`);
        await blobClient.uploadData(Buffer.from(JSON.stringify(report)), {
            blobHTTPHeaders: {
                blobContentType: "application/json",
            },
        });
    }
}