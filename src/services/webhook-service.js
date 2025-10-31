import zlib from 'zlib';
import { logger } from '../utils/logger.js';

export const handleWebhookPayload = (buffer, encoding, io) => {
  return new Promise((resolve, reject) => {
    const process = (decompressed) => {
      try {
        const eventData = JSON.parse(decompressed.toString('utf8'));

        // Log the batch info
        logger.info('New Arbitrage Batch', {
          eventsCount: eventData.data?.length || 0,
          batchId: eventData.batchId || 'unknown'
        });

        // Log each spread event
        if (eventData.data && Array.isArray(eventData.data)) {
          eventData.data.forEach((event, index) => {
            logger.info(`Event ${index + 1}/${eventData.data.length}`, {
              profit: `${event.profitPercent?.toFixed(2)}%`,
              profitIndex: event.profitIndexMax?.toFixed(4),
              amount: event.dealAmountUsd ? `$${event.dealAmountUsd}` : 'N/A',
              buy: `${event.buyExchange} (${event.buyNetwork})`,
              sell: `${event.sellExchange} (${event.sellNetwork})`,
              pair: `${event.baseCurrency}/${event.quoteCurrency}`,
              lifetime: `${event.lifetimeMs}ms`,
              timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : 'N/A'
            });
          });

          // Emit via WebSocket
          io.emit('arbitrage-batch', eventData);
        }

        resolve({
          status: 'received',
          eventsCount: eventData.data?.length || 0,
          batchId: eventData.batchId
        });
      } catch (err) {
        logger.error('JSON Parse Error', err);
        reject(new Error('Invalid JSON'));
      }
    };

    // Check if buffer is actually gzipped by checking magic bytes (1f 8b)
    const isGzipped = buffer && buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;

    if (isGzipped) {
      logger.info('Data is gzipped - decompressing...');
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) {
          logger.error('Gzip Decompression Failed', err);
          return reject(new Error('Decompression failed'));
        }
        process(decompressed);
      });
    } else {
      logger.info('Data is NOT gzipped - treating as plain JSON');
      // Data is already decompressed (by Cloudflare/Express middleware)
      process(buffer);
    }
  });
};
