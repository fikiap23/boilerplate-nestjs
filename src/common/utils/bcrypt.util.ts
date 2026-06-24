import * as bcrypt from 'bcryptjs';

export async function hashBcrypt(value: string, rounds = 10): Promise<string> {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(value, salt);
}

export async function compareBcrypt(
  value: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
