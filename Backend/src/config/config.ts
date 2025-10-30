import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  env: string;
  mongoUri: string;
  corsOrigin: string;
  googleClientId: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cb-backend',
  corsOrigin: process.env.CORS_ORIGIN || 'http://10.35.157.83:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID || ''
};

export default config;
