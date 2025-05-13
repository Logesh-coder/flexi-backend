import bcrypt from 'bcrypt';
import logger from './config/logger';
import adminAuth from './models/admin.models/auth.model';

export const createAdmin = async () => {
    try {
        const email = process.env.DEFAULT_ADMIN_EMAIL;
        const password = process.env.DEFAULT_ADMIN_PASSWORD || '';

        let adminUser = await adminAuth.findOne({ email });

        if (!adminUser) {
            // const role = ROLES.ADMIN;
            const hashedPassword = await bcrypt.hash(password, 10);

            adminUser = new adminAuth({
                name: 'Admin User',
                email,
                password: hashedPassword,
                // role,
                phoneNumber: '9094197462',
                isAuthorized: true,
            });
            await adminUser.save();
            logger.info('Default admin user created');
        }
        return adminUser;
    } catch (error: any) {
        throw new Error('Error in creating admin user: ' + error.message);
    }
};

export const initializeDatabase = async () => {
    try {

        await createAdmin();
        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Database initialization failed:', error);
        process.exit(1);
    } finally {
        // await disconnectDB();
    }
};