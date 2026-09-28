import { Service } from 'typedi';
import crypto from 'crypto';
import { Config } from '../../config';

const TOKEN_EXP = "exp";
const TOKEN_SIG = "sig";
const TOKEN_EXPIRATION = 3600; // seconds

/**
 * Service for generating and validating tokens.
 * It uses HMAC SHA-256 for signing and includes an expiration time.
 */
@Service()
export class TokenService {

  constructor() {}
  /**
   * Generates a token with the given data and expiration time.
   * The token includes an expiration timestamp and a signature.
   *
   * @param data - The data to be included in the token.
   * @param expiration - The expiration time as a Unix timestamp.
   * @returns The generated token as a string.
   */
  private generate(data: string, expiration: string): string {
    const signatureData = `${data}&${TOKEN_EXP}=${expiration}`;
    const signature = crypto
      .createHmac("sha256", Config.tokenSecret)
      .update(signatureData)
      .digest("hex");

    return `${TOKEN_EXP}=${expiration}&${TOKEN_SIG}=${signature}`;
  }
  
  /**
   * Signs the given data with an expiration time.
   * The expiration is set to TOKEN_EXPIRATION seconds from now.
   *
   * @param data - The data to be signed.
   * @returns The signed token as a string.
   */
  sign(data: string): string {
    const expiration = Math.floor(Date.now() / 1000 + TOKEN_EXPIRATION).toString();
    return this.generate(data, expiration);
  }

  /**
   * Validates the given token against the provided data.
   * It checks if the token is not expired and if the signature matches.
   *
   * @param data - The data to validate against the token.
   * @param token - The token to validate.
   * @returns True if the token is valid, false otherwise.
   */
  validate(data: string, token: string): boolean {
    const parts = new URLSearchParams(token);
    const expiration = parts.get(TOKEN_EXP);
    const signature = parts.get(TOKEN_SIG);

    if (!expiration || !signature) {
      return false;
    }

    const expTime = Number(expiration);
    if (isNaN(expTime) || expTime < Math.floor(Date.now() / 1000)) {
      return false;
    }

    const expectedToken = this.generate(data, expiration);
    const expectedParts = new URLSearchParams(expectedToken);
    const expectedSignature = expectedParts.get(TOKEN_SIG)!;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(expectedSignature, "utf8")
      );
    } catch {
      return false;
    }
  }

  validateApiKey(apiKey: string): boolean {
    const key = apiKey?.replace("Bearer ", "");
    return key === Config.apiKey;
  }
}
