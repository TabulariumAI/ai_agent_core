import { Inject, Service, Token } from 'typedi';
import { Readable } from 'stream';
import * as Entities from '../../core/entities/imports';
import { BlobServiceClient } from '@azure/storage-blob';
//import { StreamError } from '../../core/entities/error';

const { BlockBlobClient } = require('@azure/storage-blob');

import { IBlobService } from '../../core/interfaces/blobService';
import { CallbackType } from '../../core/entities/imports';

/** IBlobService implementation for handling Azure Blob Storage operations.
 * Provides methods to upload and download blobs using Azure's
 * BlockBlobClient.
 * The upload method streams content to Azure Blob Storage,
 * while the download method retrieves a blob as a readable stream.
  * It uses the BlockBlobClient from the Azure Storage Blob SDK.
  */
@Service()
export class AzureBlobService implements IBlobService {

  /** Uploads a Readable stream to Azure Blob Storage.
   * @param url - The URL of the blob to upload to.
   * @param content - The Readable stream containing the content to upload.
   * @returns A promise that resolves when the upload is complete.
   * @throws Error if the upload fails.
   */
  async upload(url: string, content: Readable): Promise<void> {

    const blockBlobClient = new BlockBlobClient(url);
    const bufferSize = 4 * 1024 * 1024; // 4MB
    const maxConcurrency = 20;

    await blockBlobClient.uploadStream(content, bufferSize, maxConcurrency, {
      blobHTTPHeaders: { blobContentType: 'application/octet-stream' }
    });
  }

  /** Downloads a blob from Azure Blob Storage as a Readable stream.
   * @param url - The URL of the blob to download.
   * @returns A promise that resolves to a Readable stream containing the blob content.
   * @throws Error if the download fails or if no readable stream body is found.
   */
  async download(url: string): Promise<Readable> {
    try {
      const blockBlobClient = new BlockBlobClient(url);
      const response = await blockBlobClient.download(0);

      if (!response.readableStreamBody) {
        throw new Error(`No readable stream body found for URL: ${url}`);
      }
      return response.readableStreamBody;
    }
    catch (err) {
      throw new Error(`Error downloading blob from URL: ${url}`);
    }
  }

  async downloadContent(url: string, type: string): Promise<Entities.Content> {
    try {
      const blockBlobClient = new BlockBlobClient(url);
      const response = await blockBlobClient.download(0);

      if (!response.readableStreamBody) {
        throw new Error(`No readable stream body found for URL: ${url}`);
      }

      const chunks: Buffer[] = [];

      for await (const chunk of response.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      return {
        documentType: type,
        data: buffer
      };
    }
    catch (err) {
      throw new Error(`Error downloading blob from URL: ${url}`);
    }
  }

  async downloadString(url: string): Promise<string> {
    try {
      const blockBlobClient = new BlockBlobClient(url);
      const response = await blockBlobClient.download(0);

      if (!response.readableStreamBody) {
        throw new Error(`No readable stream body found for URL: ${url}`);
      }

      const chunks: Buffer[] = [];

      for await (const chunk of response.readableStreamBody) {
        chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks).toString('utf-8');
    }
    catch (err) {
      throw new Error(`Error downloading blob from URL: ${url}`);
    }
  }

}

