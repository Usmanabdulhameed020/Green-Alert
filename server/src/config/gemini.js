const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

let genAI = null;
let activeModelName = 'gemini-1.5-flash'; // default fallback model

/**
 * Configures the Google Generative AI client and dynamically resolves the best active model
 */
const configureGemini = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY is not set.');
    return false;
  }

  genAI = new GoogleGenerativeAI(apiKey);

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models';
    const response = await fetch(url, { headers: { 'x-goog-api-key': apiKey } });
    const data = await response.json();
    
    if (response.ok && data.models) {
      // Find models that support generateContent method
      const generateModels = data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));

      // Avoid gemini-2.5-flash since it is deprecated for new users.
      // Prioritize newer active models.
      const preferredModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let chosenModel = null;
      for (const model of preferredModels) {
        if (generateModels.includes(model)) {
          chosenModel = model;
          break;
        }
      }

      if (!chosenModel && generateModels.length > 0) {
        // Fallback to first available model that is not gemini-2.5-flash
        const filtered = generateModels.filter(m => m !== 'gemini-2.5-flash');
        chosenModel = filtered.length > 0 ? filtered[0] : generateModels[0];
      }

      if (chosenModel) {
        activeModelName = chosenModel;
        logger.info(`Gemini AI model resolved to: ${activeModelName}`);
      }
    }
  } catch (err) {
    logger.warn(`Could not dynamically resolve Gemini model, falling back to ${activeModelName}:`, err.message);
  }

  return true;
};

/**
 * Returns GoogleGenerativeAI client instance
 */
const getGenAIInstance = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
};

/**
 * Returns the resolved active model name
 * @returns {string}
 */
const getActiveModelName = () => activeModelName;

/**
 * Verifies Gemini API connectivity
 * @returns {Promise<string>} Connection status ('ready' or 'disconnected')
 */
const checkStatus = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'disconnected';
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models';
    const response = await fetch(url, { headers: { 'x-goog-api-key': apiKey } });
    return response.ok ? 'ready' : 'disconnected';
  } catch (err) {
    return 'disconnected';
  }
};

module.exports = {
  configureGemini,
  getGenAIInstance,
  getActiveModelName,
  checkStatus
};
