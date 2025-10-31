import zlib from 'zlib';
import { logger } from '../utils/logger.js';

export const handleWebhookPayload = (buffer, encoding, io) => {
  return new Promise((resolve, reject) => {
    const process = (decompressed) => {
      try {
        const eventData = JSON.parse(decompressed.toString('utf8'));

        // DEBUG: Log first event's raw structure to understand field names
        if (eventData.data && eventData.data.length > 0) {
          console.log('\n========== RAW EVENT STRUCTURE ==========');
          console.log(JSON.stringify(eventData.data[0], null, 2));
          console.log('=========================================\n');
        }

        // Log the batch info
        logger.info('New Arbitrage Batch', {
          eventsCount: eventData.data?.length || 0,
          batchId: eventData.batchId || 'unknown'
        });

        // Log each spread event
        if (eventData.data && Array.isArray(eventData.data)) {
          eventData.data.forEach((event, index) => {
            // Based on the example code structure: event.buy.exchange, event.sell.exchange
            logger.info(`Event ${index + 1}/${eventData.data.length}`, {
              profitIndex: event.profitIndexMax?.toFixed(4),
              profitPercent: event.profitIndexMax ? `${(event.profitIndexMax * 100).toFixed(2)}%` : 'N/A',
              buyExchange: event.buy?.exchange || 'N/A',
              buyNetwork: event.buy?.network || 'N/A',
              sellExchange: event.sell?.exchange || 'N/A',
              sellNetwork: event.sell?.network || 'N/A',
              baseCurrency: event.baseCurrency || event.base?.currency || 'N/A',
              quoteCurrency: event.quoteCurrency || event.quote?.currency || 'N/A',
              timestamp: event.timestamp || event.createdAt || 'N/A'
            });
          });

          // Emit via WebSocket
          io.emit('arbitrage-batch', eventData);
        }

        console.log("eventData", eventData);

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
