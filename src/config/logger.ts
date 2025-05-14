import fs from 'fs';
import path from 'path';
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';
const logDir = path.join(__dirname, '../../logs');

const transports: winston.transport[] = [];

// File logging only in development
if (!isProduction) {
  // Ensure the 'logs' directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
  );
}

// Always log to console (Vercel captures this)
transports.push(
  new winston.transports.Console({
    format: isProduction ? winston.format.json() : winston.format.simple(),
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});

export default logger;
