const winston = require('winston');
const path = require('path');

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = winston.createLogger({
  level,
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      ),
    }),
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
  ],
});

module.exports = logger;
