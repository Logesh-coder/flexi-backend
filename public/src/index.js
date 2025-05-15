"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./config/logger"));
const initServer_1 = require("./initServer");
const auth_1 = require("./middleware/auth");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const notFoundHandler_middleware_1 = require("./middleware/notFoundHandler.middleware");
const index_1 = __importDefault(require("./routes/index"));
dotenv_1.default.config();
(0, database_1.connectDB)();
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
const allowedOrigins = ['https://flexi-web-sigma.vercel.app/', 'http://localhost:5173'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Log incoming requests
app.use((req, res, next) => {
    logger_1.default.info(`Incoming request: ${req.method} ${req.url}`);
    next();
});
// API routes
app.use('/api', index_1.default);
// Protected route
app.get('/protected', auth_1.authenticate, (req, res) => {
    res.json({ message: 'This is a protected route' });
});
// Health check route
app.get('/health', async (req, res) => {
    try {
        await (0, database_1.connectDB)();
        res.status(200).json({
            status: 'success',
            message: 'Server is healthy',
            uptime: process.uptime(),
            timestamp: new Date(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server is not healthy',
        });
    }
});
// Error-handling middleware
app.use(errorHandler_middleware_1.errorHandler);
app.use(notFoundHandler_middleware_1.notFoundHandler);
// // Start the server
app.listen(port, () => {
    const host = 'http://localhost';
    logger_1.default.info(`Server is running on ${host}:${port}`);
});
app.get('/', (req, res) => {
    res.send('Welcome to Flexi Backend!');
});
(0, initServer_1.initializeDatabase)();
exports.default = app;
