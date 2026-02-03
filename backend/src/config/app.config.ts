import { registerAs } from '@nestjs/config';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!secret && nodeEnv === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be set in production',
    );
  }

  // Only allow fallback in development/test environments
  return secret || 'dev-secret-key-not-for-production';
};

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: getJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
}));
