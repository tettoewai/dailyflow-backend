import type { StringValue } from 'ms';
import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

export const jwtConstants = {
  secret: requireEnv('JWT_ACCESS_TOKEN_SECRET'),
  refreshSecret: requireEnv('JWT_REFRESH_TOKEN_SECRET'),
  accessTokenExpirationTime: (requireEnv('JWT_ACCESS_TOKEN_EXPIRATION_TIME') ??
    '15m') as StringValue,
  refreshTokenExpirationTime: (requireEnv(
    'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
  ) ?? '7d') as StringValue,
};

export const jwtRefreshOptions = {
  secret: jwtConstants.refreshSecret,
  signOptions: {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME as string,
  },
};
