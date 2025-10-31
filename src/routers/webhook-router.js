import express from 'express';
import { handleWebhookPayload } from '../services/webhook-service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

export default (io) => {
  router.post('/spot-hook', async (req, res) => {
    const encoding = req.headers['content-encoding'];
    const batchId = req.headers['x-spreadbatchid'];
    const hookToken = req.headers['x-hooktoken'];

    // Log incoming request details
    logger.info('Webhook Request Received', {
      contentEncoding: encoding,
      contentLength: req.headers['content-length'],
      batchId,
      hookToken,
      bodyType: typeof req.body,
      isBuffer: Buffer.isBuffer(req.body),
      bufferSize: req.body?.length || 0,
      firstBytes: req.body && req.body.length >= 2
        ? `0x${req.body[0].toString(16)} 0x${req.body[1].toString(16)}`
        : 'none'
    });

    try {
      const result = await handleWebhookPayload(req.body, encoding, io);
      logger.info('Webhook Processed Successfully', result);
      res.status(200).json(result);
    } catch (err) {
      logger.error('Webhook Processing Error', err.message);
      res.status(400).json({ error: err.message });
    }
  });

  return router;
};
