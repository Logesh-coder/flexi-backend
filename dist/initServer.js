"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.createAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./config/logger"));
const auth_model_1 = __importDefault(require("./models/admin.models/auth.model"));
const createAdmin = async () => {
    try {
        const email = process.env.DEFAULT_ADMIN_EMAIL;
        const password = process.env.DEFAULT_ADMIN_PASSWORD || '';
        let adminUser = await auth_model_1.default.findOne({ email });
        if (!adminUser) {
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Create the admin user first
            adminUser = new auth_model_1.default({
                name: 'Admin User',
                email,
                password: hashedPassword,
                phoneNumber: '9094197462',
                isAuthorized: true,
            });
            await adminUser.save();
            // Generate token after saving the user
            const token = jsonwebtoken_1.default.sign({ userId: adminUser._id, email: adminUser.email }, process.env.SECRET_KEY, { expiresIn: '8h' });
            // Optionally save the token with the user, if your schema has a `token` field
            adminUser.token = token;
            await adminUser.save(); // Save again with the token
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
//# sourceMappingURL=initServer.js.map