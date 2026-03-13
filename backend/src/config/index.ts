export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
