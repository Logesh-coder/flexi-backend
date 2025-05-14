// api/index.ts
import serverless from 'serverless-http';
import app from '../index';

module.exports.handler = serverless(app);
