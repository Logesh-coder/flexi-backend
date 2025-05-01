import { bcrypt } from 'bcrypt';
import { connectDB, disconnectDB } from './config/database';
import logger from './config/logger';
import adminAuth from './models/admin.models/auth.model';


// exports.registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { email, mobile, password } = req.body;

//         const existingAdmin = await adminModel.findOne({ email, mobile });

//         if (existingAdmin) {
//             return res.status(409).json({
//                 success: false,
//                 message: "admin already registered with this email or password",
//             });
//         }

//         const saltRounds = 10;
//         const hashedPassword = await bcrypt.hash(password, saltRounds);

//         const newAdmin = new adminModel({
//             ...req.body,
//             password: hashedPassword,
//         });

//         await newAdmin.save();

//         res.status(201).json({
//             success: true,
//             message: "admin registered successfully",
//             data: newAdmin,
//         });
//     } catch (error) {
//         next(error)
//     }
// };

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
        throw new Error('Error in creating admin user', error);
    }
};

const initializeDatabase = async () => {
    try {
        await connectDB();

        await createAdmin();
        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Database initialization failed:', error);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
};

initializeDatabase();
