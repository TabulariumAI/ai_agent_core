import { Readable } from 'stream';
import * as Entities from '../entities/imports';

/**
 * Interface for Blob Service.
 * Provides methods for uploading and downloading blobs.
 */
export interface IBlobService {
  /**
   * Uploads content to a specified URL.
   * @param url - The URL where the content will be uploaded.
   * @param content - The content to upload, provided as a Readable stream.
   * @returns A promise that resolves when the upload is complete.
   */
  upload(url: string, content: Readable): Promise<void>;
  /**
   * Downloads content from a specified URL.
   * @param url - The URL from which the content will be downloaded.
   * @returns A promise that resolves to a Readable stream containing the downloaded content.
   * @throws Error if the download fails or if no readable stream body is found.
   */
  download(url: string): Promise<Readable>;

  /**
   * Downloads content from a specified URL and returns it as an Entities.Content object.
   * @param url - The URL from which the content will be downloaded.
   * @param type - The type of callback associated with the content.
   * @returns A promise that resolves to an Entities.Content object containing the downloaded content and its type.
   * @throws Error if the download fails or if no readable stream body is found.
   */
  downloadContent(url: string, type: string): Promise<Entities.Content>;

  downloadString(url: string): Promise<string>;
}
