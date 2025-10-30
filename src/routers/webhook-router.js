import express from 'express';
import { handleWebhookPayload } from '../services/webhook-service.js';

const router = express.Router();

export default (io) => {
  router.post('/spot-hook', async (req, res) => {
    const encoding = req.headers['content-encoding'];
    const buffer = req.body;

    console.log('Received Webhook:', {
      encoding,
      length: buffer.length,
    });
    console.log('Headers:', req.headers);   
    console.log('Raw Body:', buffer);

    try {
      const result = await handleWebhookPayload(buffer, encoding, io);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
};