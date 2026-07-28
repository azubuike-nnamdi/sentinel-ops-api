const REDACTED = '[REDACTED]';

/** Object keys that must never be persisted (case-insensitive, separators ignored). */
const SENSITIVE_KEY_PATTERN =
  /^(authorization|cookie|set-cookie|password|passwd|pwd|secret|token|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|apikey|auth|bearer|jwt|session|session[_-]?id|csrf|x-api-key)$/i;

/** Bearer / JWT-shaped values in free-text messages. */
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN =
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

const MAX_DEPTH = 8;

export class SensitiveDataUtil {
  static readonly REDACTED = REDACTED;

  static sanitizeString(value: string): string {
    return value
      .replace(BEARER_TOKEN_PATTERN, `Bearer ${REDACTED}`)
      .replace(JWT_PATTERN, REDACTED);
  }

  static sanitizeValue(value: unknown, depth = 0): unknown {
    if (depth > MAX_DEPTH) {
      return REDACTED;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item, depth + 1));
    }

    if (value !== null && typeof value === 'object') {
      return this.sanitizeObject(value as Record<string, unknown>, depth + 1);
    }

    return value;
  }

  static sanitizeObject(
    input: Record<string, unknown> | undefined | null,
    depth = 0,
  ): Record<string, unknown> | undefined {
    if (input == null) {
      return undefined;
    }

    if (depth > MAX_DEPTH) {
      return { _redacted: REDACTED };
    }

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (this.isSensitiveKey(key)) {
        result[key] = REDACTED;
        continue;
      }

      result[key] = this.sanitizeValue(value, depth);
    }

    return result;
  }

  static sanitizeLogPayload<
    T extends { message: string; metadata?: Record<string, unknown> },
  >(payload: T): T {
    return {
      ...payload,
      message: this.sanitizeString(payload.message),
      metadata: this.sanitizeObject(payload.metadata),
    };
  }

  private static isSensitiveKey(key: string): boolean {
    const normalized = key.replace(/[\s-]/g, '_');
    return SENSITIVE_KEY_PATTERN.test(normalized);
  }
}
