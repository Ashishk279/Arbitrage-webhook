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
          timestamp: new Date(eventData.ts).toISOString()
        });

        // Log each spread event with correct field names
        if (eventData.data && Array.isArray(eventData.data)) {
          eventData.data.forEach((event, index) => {
            logger.info(`Event ${index + 1}/${eventData.data.length}`, {
              symbol: event.symbol,
              profitMax: `${(event.profitIndexMax * 100).toFixed(2)}%`,
              profitAvg: `${(event.profitIndexAvg * 100).toFixed(2)}%`,
              buyExchange: event.exchangeBuy,
              sellExchange: event.exchangeSell,
              buyPrice: `$${event.buyPriceAvg?.toFixed(6)}`,
              sellPrice: `$${event.sellPriceAvg?.toFixed(6)}`,
              volume: `$${event.volumeUsd?.toFixed(2)}`,
              lifetime: `${(event.lifetime / 1000).toFixed(0)}s`
            });
          });

          // Emit via WebSocket to all connected clients
          io.emit('arbitrage-batch', {
            data: eventData.data,
            timestamp: eventData.ts,
            count: eventData.data.length
          });
        }

        resolve({
          status: 'received',
          eventsCount: eventData.data?.length || 0,
          timestamp: eventData.ts
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
