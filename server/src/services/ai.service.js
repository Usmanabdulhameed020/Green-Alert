const { getGenAIInstance, getActiveModelName } = require('../config/gemini');
const logger = require('../utils/logger');

/**
 * Reusable AI Service for Gemini content generation with multi-model retry strategy
 */
const generateText = async (prompt) => {
  const genAI = getGenAIInstance();
  const primaryModel = getActiveModelName();

  if (!genAI) {
    throw new Error('Gemini AI client is not configured.');
  }

  // Model fallback chain if the primary model fails or key is rate-limited
  const candidateModels = Array.from(new Set([
    primaryModel,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
  ]));

  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim()) {
        return text;
      }
    } catch (error) {
      logger.warn(`Gemini model ${modelName} failed: ${error.message}. Trying next candidate...`);
      lastError = error;
    }
  }

  logger.error('All Gemini AI model attempts failed:', lastError?.message);
  throw lastError || new Error('Gemini AI generation failed on all models.');
};

module.exports = {
  generateText
};
