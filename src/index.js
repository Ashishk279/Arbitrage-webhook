import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import webhookRoutes from './routers/webhook-router.js';
import { setupSocket } from './sockets/arbitrage-socket.js';
import { createSpotSpreadHook } from './services/arbitrage-service.js';
import { config } from './config/config.js';
import { logger } from './utils/logger.js';

// CLI flag to create hook
// const shouldCreateHook = process.argv.includes('--create-hook');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb', type: '*/*' })); // Accept all content types

// Routes
app.use('api/webhook', webhookRoutes(io));

// Health check
app.get('api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket setup
setupSocket(io);

// Start server
server.listen(config.port, async () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Webhook: ${config.webhookUrl}`);
  logger.info(`Health: http://localhost:${config.port}/health`);

  // Auto-create hook if flag is passed
  // if (shouldCreateHook) {
  //   logger.info('Creating webhook hook via API...');
  //   try {
  //     await createSpotSpreadHook();
  //     process.exit(0); // Exit after creation
  //   } catch (err) {
  //     process.exit(1);
  //   }
  // }
});