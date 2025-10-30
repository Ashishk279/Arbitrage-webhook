import zlib from 'zlib';
import { logger } from '../utils/logger.js';

export const handleWebhookPayload = (buffer, encoding, io) => {
  return new Promise((resolve, reject) => {
    const process = (decompressed) => {
      try {
        const eventData = JSON.parse(decompressed.toString('utf8'));

        // Console log structured data
        logger.info('New Arbitrage Event', {
          eventType: eventData.event_type || 'spot_spread',
          profit: `${eventData.profit_percent}%`,
          amount: `$${eventData.deal_amount_usd}`,
          buy: `${eventData.buy_exchange} (${eventData.buy_network})`,
          sell: `${eventData.sell_exchange} (${eventData.sell_network})`,
          pair: `${eventData.base_currency}/${eventData.quote_currency}`,
          lifetime: `${eventData.lifetime_ms}ms`,
          timestamp: new Date(eventData.timestamp).toISOString(),
        });

        // Emit via WebSocket
        io.emit('arbitrage-event', eventData);

        resolve({ status: 'received', eventId: eventData.id || 'unknown' });
      } catch (err) {
        logger.error('JSON Parse Error', err);
        reject(new Error('Invalid JSON'));
      }
    };

    if (encoding === 'gzip') {
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) {
          logger.error('Gzip Decompression Failed', err);
          return reject(new Error('Decompression failed'));
        }
        process(decompressed);
      });
    } else {
      process(buffer);
    }
  });
};