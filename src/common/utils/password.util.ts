import * as bcrypt from 'bcrypt';

export class PasswordUtil {
  static async hash(
    plainPassword: string,
    saltRounds = 12,
  ): Promise<string> {
    return bcrypt.hash(plainPassword, saltRounds);
  }

  static async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
