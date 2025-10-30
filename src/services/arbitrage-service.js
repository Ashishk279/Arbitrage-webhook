import axios from 'axios';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export const createSpotSpreadHook = async () => {
  const payload = {
    max_profit_percent: 3.0,
    min_profit_percent: 0.5,
    min_deal_amount: 1000,
    min_lifetime: 5000,
    max_lifetime: 300000,
    hook: config.webhookUrl,
    buy_networks: ['ethereum', 'bsc'],
    sell_networks: ['ethereum', 'bsc'],
    buy_networks_status: ['output_y', 'output_y'],
    sell_networks_status: ['input_y', 'input_y'],
    buy_exchanges: ['binance', 'okx'],
    sell_exchanges: ['bybit', 'kucoin'],
    whitelisted_currencies: ['USDT'],
    blacklisted_currencies: [],
  };

  try {
    const res = await axios.post(
      'https://b2b.api.arbitragescanner.io/api/screener/v1/live/spot/spread-hook',
      payload,
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'X-API-Key': config.apiKey,
        },
      }
    );
    logger.info('Webhook Hook Created Successfully', res.data);
    return res.data;
  } catch (err) {
    logger.error('Failed to Create Hook', err.response?.data || err.message);
    throw err;
  }
};