const { BrevoClient } = require('@getbrevo/brevo');
const logger = require('../utils/logger');

let brevoClient = null;
const REST_API_KEY_PREFIX = 'xkeysib-';
const SMTP_KEY_PREFIX = 'xsmtpsib-';

const getConfiguredApiKey = () => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();

  if (!apiKey) {
    logger.warn('BREVO_API_KEY is not set.');
    return null;
  }

  if (apiKey.startsWith(SMTP_KEY_PREFIX)) {
    logger.error(
      'BREVO_API_KEY contains a Brevo SMTP key. Use a REST API v3 key instead; it usually starts with xkeysib-.'
    );
    return null;
  }

  if (!apiKey.startsWith(REST_API_KEY_PREFIX)) {
    logger.warn('BREVO_API_KEY does not look like a Brevo REST API v3 key; expected a value starting with xkeysib-.');
  }

  return apiKey;
};

/**
 * Configures the Brevo API Client
 */
const configureBrevo = () => {
  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    brevoClient = null;
    return false;
  }

  brevoClient = new BrevoClient({ apiKey });
  return true;
};

/**
 * Returns the configured BrevoClient instance
 */
const getBrevoClient = () => {
  if (!brevoClient) {
    configureBrevo();
  }
  return brevoClient;
};

/**
 * Verifies Brevo REST API connection by fetching account details
 * @returns {Promise<string>} Connection status ('ready' or 'disconnected')
 */
const checkStatus = async () => {
  const apiKey = getConfiguredApiKey();
  if (!apiKey) return 'disconnected';

  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        'api-key': apiKey,
        accept: 'application/json'
      }
    });
    if (response.ok) {
      return 'ready';
    }
    return 'disconnected';
  } catch (err) {
    return 'disconnected';
  }
};

module.exports = {
  configureBrevo,
  getBrevoClient,
  checkStatus
};
