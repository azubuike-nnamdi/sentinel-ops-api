import { PasswordUtil } from './password.util';

describe('PasswordUtil', () => {
  const plain = 'Str0ngP@ssw0rd!';

  it('hashes a password', async () => {
    const hash = await PasswordUtil.hash(plain, 4);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(plain);
  });

  it('validates a correct password', async () => {
    const hash = await PasswordUtil.hash(plain, 4);
    await expect(PasswordUtil.compare(plain, hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await PasswordUtil.hash(plain, 4);
    await expect(PasswordUtil.compare('wrong-password', hash)).resolves.toBe(
      false,
    );
  });
});
