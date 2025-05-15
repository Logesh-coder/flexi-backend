"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.createAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = __importDefault(require("./config/logger"));
const auth_model_1 = __importDefault(require("./models/admin.models/auth.model"));
const createAdmin = async () => {
    try {
        const email = process.env.DEFAULT_ADMIN_EMAIL;
        const password = process.env.DEFAULT_ADMIN_PASSWORD || '';
        let adminUser = await auth_model_1.default.findOne({ email });
        if (!adminUser) {
            // const role = ROLES.ADMIN;
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            adminUser = new auth_model_1.default({
                name: 'Admin User',
                email,
                password: hashedPassword,
                // role,
                phoneNumber: '9094197462',
                isAuthorized: true,
            });
            await adminUser.save();
            logger_1.default.info('Default admin user created');
        }
        return adminUser;
    }
    catch (error) {
        throw new Error('Error in creating admin user: ' + error.message);
    }
};
exports.createAdmin = createAdmin;
const initializeDatabase = async () => {
    try {
        await (0, exports.createAdmin)();
        logger_1.default.info('Database initialization completed successfully');
    }
    catch (error) {
        logger_1.default.error('Database initialization failed:', error);
        process.exit(1);
    }
    finally {
        // await disconnectDB();
    }
};
exports.initializeDatabase = initializeDatabase;
