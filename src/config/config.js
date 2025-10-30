import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  apiKey: process.env.ARBITRAGE_API_KEY,
  webhookUrl: process.env.WEBHOOK_URL,
};