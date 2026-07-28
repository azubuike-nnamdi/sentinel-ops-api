import { SensitiveDataUtil } from './sensitive-data.util';

describe('SensitiveDataUtil', () => {
  const sampleJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFBPJxXgt3s';

  it('redacts Bearer tokens in free text', () => {
    const message = `Authorization failed for Bearer ${sampleJwt}`;
    expect(SensitiveDataUtil.sanitizeString(message)).toBe(
      `Authorization failed for Bearer ${SensitiveDataUtil.REDACTED}`,
    );
  });

  it('redacts bare JWT strings', () => {
    expect(SensitiveDataUtil.sanitizeString(`token=${sampleJwt}`)).toBe(
      `token=${SensitiveDataUtil.REDACTED}`,
    );
  });

  it('redacts sensitive object keys case-insensitively', () => {
    const sanitized = SensitiveDataUtil.sanitizeObject({
      Authorization: `Bearer ${sampleJwt}`,
      accessToken: sampleJwt,
      refresh_token: sampleJwt,
      password: 'Str0ngP@ssw0rd!',
      userId: 'user-1',
      nested: {
        apiKey: 'secret-key',
        note: 'ok',
      },
    });

    expect(sanitized).toEqual({
      Authorization: SensitiveDataUtil.REDACTED,
      accessToken: SensitiveDataUtil.REDACTED,
      refresh_token: SensitiveDataUtil.REDACTED,
      password: SensitiveDataUtil.REDACTED,
      userId: 'user-1',
      nested: {
        apiKey: SensitiveDataUtil.REDACTED,
        note: 'ok',
      },
    });
  });

  it('sanitizes log payloads before persistence', () => {
    const payload = SensitiveDataUtil.sanitizeLogPayload({
      message: `login ok Bearer ${sampleJwt}`,
      metadata: {
        accessToken: sampleJwt,
        path: '/auth/me',
      },
    });

    expect(payload.message).toContain(SensitiveDataUtil.REDACTED);
    expect(payload.message).not.toContain(sampleJwt);
    expect(payload.metadata).toEqual({
      accessToken: SensitiveDataUtil.REDACTED,
      path: '/auth/me',
    });
  });
});
