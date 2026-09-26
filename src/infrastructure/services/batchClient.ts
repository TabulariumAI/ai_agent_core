import { IBatchClient } from "../../core/interfaces/batchClient";
import { Config } from "../../config";
import { Service } from "typedi";

export interface SessionRequest {
  name: string;
  batch: string;
}

@Service()
export class BatchClient implements IBatchClient {
  async createSession(name: string, batch: string): Promise<void> {
    const url = Config.batch.session();
    const requestBody: SessionRequest = {
      name: name,
      batch: batch
    };
    const apiKey = Config.apiKey;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
    }
  }
}