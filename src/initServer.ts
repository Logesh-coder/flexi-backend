import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from './config/logger';
import adminAuth from './models/admin.models/auth.model';

export const createAdmin = async () => {
    try {
        const email = process.env.DEFAULT_ADMIN_EMAIL;
        const password = process.env.DEFAULT_ADMIN_PASSWORD || '';

        let adminUser = await adminAuth.findOne({ email });

        if (!adminUser) {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create the admin user first
            adminUser = new adminAuth({
                name: 'Admin User',
                email,
                password: hashedPassword,
                phoneNumber: '9094197462',
                isAuthorized: true,
            });

            await adminUser.save();

            // Generate token after saving the user
            const token = jwt.sign(
                { userId: adminUser._id, email: adminUser.email },
                process.env.SECRET_KEY as string,
                { expiresIn: '8h' }
            );

            // Optionally save the token with the user, if your schema has a `token` field
            adminUser.token = token;
            await adminUser.save(); // Save again with the token

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