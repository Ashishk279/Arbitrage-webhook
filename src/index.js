import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import webhookRoutes from './routers/webhook-router.js';
import { setupSocket } from './sockets/arbitrage-socket.js';
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

// Serve static files from public directory (for frontend)
app.use(express.static('public'));

// Use raw body parser for webhook routes to receive binary/gzipped data
app.use('/api/webhook', express.raw({
  type: 'application/json',
  limit: '10mb'
}));

// Use JSON parser for other routes
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/webhook', webhookRoutes(io));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket setup
setupSocket(io);

// Start server
server.listen(config.port, async () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Webhook: ${config.webhookUrl}`);
  logger.info(`Frontend: https://arbitrage-webhook.onrender.com`);
  logger.info(`Health: https://arbitrage-webhook.onrender.com/api/health`);

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