import { createHash, randomBytes } from 'crypto';

export class TokenUtil {
  static randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('base64url');
  }

  static sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
