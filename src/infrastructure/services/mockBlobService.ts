import { Service } from 'typedi';
import { Readable } from 'stream';

import { IBlobService } from '../../core/interfaces/blobService';
import { Content } from '../../core/entities/content';

interface MockMetaData {
  heading: {
    title: string;
    class: string;
    explanation: string;
  };
  secrets: unknown[];
  indexes: unknown[];
}

/** Mock metadata */
const metaData: MockMetaData = {
  heading: {
    title: "Mock Document",
    class: "class",
    explanation: "explanation"
  },
  secrets: [],
  indexes: [],
};

/** Mock Blob Service.
 * This service implements the IBlobService interface for testing purposes.
 * It simulates the upload and download of blobs without actual storage operations.
 * This is useful for unit tests and development environments where real storage access is not required.
 */
@Service()
export class MockBlobService implements IBlobService {
  async upload(url: string, content: Readable): Promise<void> {
    return;
  }

  async download(url: string): Promise<Readable> {
    const stream = new Readable();
    if (url === "https://example.com/test.json") {
      stream.push(JSON.stringify(metaData));
    }
    else {
      stream.push("Blob content");
    }
    stream.push(null);
    return stream;
  }

  async downloadContent(url: string, type: string): Promise<Content> {
    if (url === "https://example.com/test.json") {
      return {
        documentType: type || "json",
        data: Buffer.from(JSON.stringify(metaData)),
      };
    }

    throw new Error(`No content found for URL: ${url}`);
  }

  async downloadString(url: string): Promise<string> {
    if (url === "https://example.com/test.json") {
      return JSON.stringify(metaData);
    }

    throw new Error(`No content found for URL: ${url}`);
  }
}

