"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inActiveUser = exports.getSingleWorker = exports.getWorkers = exports.updatePssword = exports.profileEdit = exports.profile = exports.verifyToken = exports.resetPassword = exports.forgotPassword = exports.loginUser = exports.registerUser = exports.handleGoogleCallback = void 0;
const axios_1 = __importDefault(require("axios"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const auth_model_1 = __importDefault(require("../../models/user.models/auth.model"));
const wishlist_1 = require("../../models/user.models/wishlist");
const cache_1 = __importDefault(require("../../utils/cache"));
const response_util_1 = require("../../utils/response.util");
const handleGoogleCallback = async (req, res) => {
    const code = req.query.code;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const frontendUrl = process.env.WEBSITE_LINK || 'http://localhost:3000';
    try {
        // 1. Exchange code for access token
        const tokenResponse = await axios_1.default.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });
        const { access_token } = tokenResponse.data;
        console.log('access_token', access_token);
        if (!access_token) {
            return res.status(401).json({ message: 'Failed to get access token from Google' });
        }
        // 2. Get user info from Google
        const googleUser = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const { name, email } = googleUser.data;
        if (!email) {
            return res.status(400).json({ message: 'Google account has no email' });
        }
        // 3. Check if user exists in DB
        let user = await auth_model_1.default.findOne({ email });
        if (!user) {
            // 4. Generate slug from name 
            const slug = name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/--+/g, '-');
            // 5. Create new user
            user = new auth_model_1.default({
                name,
                email,
                slug,
                // isActive: true,
            });
            await user.save();
        }
        // 6. Create JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '8h' });
        user.token = token;
        await user.save();
        // 7. Redirect to frontend with token
        const successUrl = `${frontendUrl}/login?token=${token}&isActive=${user.isActive}`;
        return res.redirect(successUrl);
    }
    catch (err) {
        console.error('Google OAuth Error:', err);
        return res.status(500).json({ message: 'Google authentication failed' });
    }
};
exports.handleGoogleCallback = handleGoogleCallback;
const registerUser = async (req, res, next) => {
    try {
        const { email, mobile, password, name, date_of_birth } = req.body;
        const existingUser = await auth_model_1.default.findOne({ $or: [{ email }, { mobile }] });
        if (existingUser) {
            return (0, response_util_1.errorResponse)(res, 'User already registered with this email or mobile', 409);
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // remove special chars
            .replace(/\s+/g, '-') // spaces to hyphens
            .replace(/--+/g, '-');
        const newUser = new auth_model_1.default({
            name,
            date_of_birth,
            email,
            mobile,
            password: hashedPassword,
            slug
        });
        await newUser.save();
        (0, response_util_1.successResponse)(res, newUser, 201);
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const userLogin = await auth_model_1.default.findOne({ email });
        if (!userLogin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const isPasswordMatch = await bcrypt_1.default.compare(password, userLogin.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const token = jsonwebtoken_1.default.sign({ userId: userLogin._id, email: userLogin.email }, process.env.SECRET_KEY, { expiresIn: "8h" });
        userLogin.token = token;
        await userLogin.save();
        console.log('userLogin', userLogin);
        const data = {
            token,
            isActive: userLogin.isActive
        };
        (0, response_util_1.successResponse)(res, data, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await auth_model_1.default.findOne({ email });
        if (!user) {
            return (0, response_util_1.errorResponse)(res, 'User with this email does not exist', 404);
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.SECRET_KEY, {
            expiresIn: "1h",
        });
        const resetLink = `${process.env.FRONT_END_URL}/reset-password?token=${resetToken}`;
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });
        console.log("user", user);
        const mailOptions = {
            from: email,
            to: user.email,
            subject: "Password Reset",
            html: `<p>You requested a password reset</p>
             <p>Click this <a href="${resetLink}">link</a> to reset your password.</p>`,
        };
        // Send the email
        await transporter.sendMail(mailOptions);
        user.resetPasswordToken = resetToken;
        await user.save();
        return (0, response_util_1.successResponse)(res, "Password reset link has been sent to your email", 200);
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        if (!newPassword) {
            return (0, response_util_1.errorResponse)(res, 'Password fields cannot be empty', 400);
        }
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required",
            });
        }
        const user = await auth_model_1.default.findOne({
            token,
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token user",
            });
        }
        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(newPassword, saltRounds);
        // Update the user's password and clear the reset token and expiration time
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        (0, response_util_1.successResponse)(res, 'Password has been reset successfully', 200);
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({
                success: false,
                message: "Authorization header with Bearer token is required",
            });
        }
        // Extract the token from the header
        const token = authHeader.split(" ")[1];
        // Find the user with the provided token
        const user = await auth_model_1.default.findOne({ token });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }
        // Verify the token using JWT and get the decoded payload
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY);
        }
        catch (err) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
        // Token is valid
        res.status(200).json({
            success: true,
            message: "Token is valid",
            data: {
                userId: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyToken = verifyToken;
const profile = async (req, res, next) => {
    var _a;
    try {
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const findUser = await auth_model_1.default.findOne({ _id: id });
        if (!findUser) {
            return (0, response_util_1.errorResponse)(res, 'user not found', 500);
        }
        return (0, response_util_1.successResponse)(res, findUser, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.profile = profile;
const profileEdit = async (req, res, next) => {
    var _a;
    try {
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { name, mobile, date_of_birth, instaProfileLink, salary, domain, city, area } = req.body;
        if (!id) {
            return (0, response_util_1.errorResponse)(res, 'User ID is required', 400);
        }
        const user = await auth_model_1.default.findById(id);
        if (!user) {
            return (0, response_util_1.errorResponse)(res, 'User not found', 404);
        }
        // if (mobile && mobile !== user.mobile) {
        //   const existingUser = await userAuth.findOne({ mobile });
        //   if (existingUser) {
        //     return errorResponse(res, 'Mobile number is already in use.', 400);
        //   }
        // }
        const updatedUser = await auth_model_1.default.findByIdAndUpdate(id, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (mobile && { mobile })), (date_of_birth && { date_of_birth })), (instaProfileLink && { instaProfileLink })), (salary && { salary })), (city && { city })), (area && { area })), (domain && { domain })), { new: true });
        if (!updatedUser) {
            return (0, response_util_1.errorResponse)(res, 'User not found', 404);
        }
        const checkUpdateUser = await auth_model_1.default.findById(id);
        if ((checkUpdateUser === null || checkUpdateUser === void 0 ? void 0 : checkUpdateUser.city) &&
            (checkUpdateUser === null || checkUpdateUser === void 0 ? void 0 : checkUpdateUser.area) &&
            (checkUpdateUser === null || checkUpdateUser === void 0 ? void 0 : checkUpdateUser.salary) &&
            (checkUpdateUser === null || checkUpdateUser === void 0 ? void 0 : checkUpdateUser.mobile) &&
            (checkUpdateUser === null || checkUpdateUser === void 0 ? void 0 : checkUpdateUser.date_of_birth) &&
            (checkUpdateUser === null || checkUpdateUser === void 0 ? void 0 : checkUpdateUser.domain)) {
            checkUpdateUser.isActive = true;
            await checkUpdateUser.save();
        }
        return (0, response_util_1.successResponse)(res, updatedUser, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.profileEdit = profileEdit;
const updatePssword = async (req, res, next) => {
    var _a;
    try {
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return (0, response_util_1.errorResponse)(res, 'Current and new password are required', 400);
        }
        const user = await auth_model_1.default.findById(id).select('+password');
        if (!user) {
            return (0, response_util_1.errorResponse)(res, 'User not found', 404);
        }
        const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return (0, response_util_1.errorResponse)(res, 'Current password is incorrect', 401);
        }
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();
        return (0, response_util_1.successResponse)(res, 'Password updated successfully', 200);
    }
    catch (error) {
        next(error);
    }
};
exports.updatePssword = updatePssword;
const getWorkers = async (req, res, next) => {
    var _a, _b;
    try {
        const { search, city, area, page = 1, limit = 10 } = req.query;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        let user;
        if (token) {
            user = await auth_model_1.default.findOne({ token }).select('_id');
        }
        const filters = { isActive: true };
        if (city)
            filters.city = city;
        if (area)
            filters.area = area;
        const aggregationPipeline = [];
        // ✅ Step 1: Atlas $search (only if search is provided)
        if (search) {
            aggregationPipeline.push({
                $search: {
                    index: 'userSearchIndex', // Your Atlas Search index name
                    text: {
                        query: 'catering',
                        path: 'domain',
                        fuzzy: {
                            maxEdits: 2,
                            prefixLength: 1,
                        }
                    }
                }
            });
        }
        // ✅ Step 2: Apply filters (city, area)
        if (Object.keys(filters).length > 0) {
            aggregationPipeline.push({ $match: filters });
        }
        // ✅ Step 3: Sort and Paginate
        aggregationPipeline.push({ $sort: { createdAt: -1 } }, { $skip: (Number(page) - 1) * Number(limit) }, { $limit: Number(limit) });
        // ✅ Step 4: Wishlist Lookup
        aggregationPipeline.push({
            $lookup: {
                from: 'userwishlists',
                let: { workerId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$workerId', '$$workerId'] },
                                    { $eq: ['$userId', new mongoose_1.default.Types.ObjectId(user === null || user === void 0 ? void 0 : user._id)] }
                                ]
                            }
                        }
                    }
                ],
                as: 'wishlist'
            }
        }, {
            $addFields: {
                isSaved: { $gt: [{ $size: '$wishlist' }, 0] }
            }
        }, {
            $project: {
                wishlist: 0
            }
        });
        // ✅ Execute aggregation
        const workers = await auth_model_1.default.aggregate(aggregationPipeline);
        // ✅ Separate count for pagination metadata
        const countPipeline = [];
        if (search) {
            countPipeline.push({
                $search: {
                    index: 'userSearchIndex',
                    text: {
                        query: search,
                        path: 'domain',
                        fuzzy: {
                            maxEdits: 2,
                            prefixLength: 1,
                        }
                    }
                }
            });
        }
        if (Object.keys(filters).length > 0) {
            countPipeline.push({ $match: filters });
        }
        countPipeline.push({ $count: 'total' });
        const countResult = await auth_model_1.default.aggregate(countPipeline);
        const totalItems = ((_b = countResult[0]) === null || _b === void 0 ? void 0 : _b.total) || 0;
        // ✅ Send response
        res.status(200).json({
            success: true,
            data: {
                workers,
                page: Number(page),
                totalPages: Math.ceil(totalItems / Number(limit)),
                totalItems
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getWorkers = getWorkers;
const getSingleWorker = async (req, res, next) => {
    var _a;
    try {
        const { slug } = req.params;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        const cacheKey = `worker:${slug}`;
        // Optional: skip cache if you want dynamic wishlist status
        const cached = cache_1.default.get(cacheKey);
        if (cached && !token) {
            return (0, response_util_1.successResponse)(res, cached, 200);
        }
        // 🔐 Get logged-in user (if any)
        let userId;
        if (token) {
            const user = await auth_model_1.default.findOne({ token }).select('_id');
            if (user)
                userId = user._id;
        }
        // 🧾 Get worker details
        const findUser = await auth_model_1.default
            .findOne({ slug })
            .select('-password -__v -token');
        if (!findUser) {
            return (0, response_util_1.errorResponse)(res, 'worker not found', 500);
        }
        // ❤️ Check if this worker is in the user's wishlist
        let isSaved = false;
        if (userId) {
            const wishlistItem = await wishlist_1.userWishlist.findOne({
                userId,
                workerId: findUser._id
            });
            isSaved = !!wishlistItem;
        }
        // ✅ Add isSaved field to response
        const result = Object.assign(Object.assign({}, findUser.toObject()), { isSaved });
        // ✅ Cache the result only if token is not present (so result is universal)
        if (!token) {
            cache_1.default.set(cacheKey, result);
        }
        return (0, response_util_1.successResponse)(res, result, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.getSingleWorker = getSingleWorker;
// export const getSingleWorker = async (req: CustomRequest, res: Response, next: NextFunction) => {
//   try {
//     const { slug } = req.params;
//     // 🔐 Unique cache key for this worker
//     const cacheKey = `worker:${slug}`;
//     const cached = cache.get(cacheKey);
//     if (cached) {
//       return successResponse(res, cached, 200);
//     }
//     const findUser = await userAuth
//       .findOne({ slug })
//       .select('-password -__v -token');
//     if (!findUser) {
//       return errorResponse(res, 'worker not found', 500);
//     }
//     console.log('findUser', findUser?._id)
//     const userId = findUser?._id
//     let isSaved = false;
//     if (userId) {
//       const wishlistItem = await userWishlist.findOne({
//         userId,
//         workerId: findUser._id
//       });
//       console.log(wishlistItem)
//       isSaved = !!wishlistItem;
//     }
//     // ✅ Add isSaved field to response
//     const result = {
//       ...findUser.toObject(),
//     };
//     // ✅ Store in cache
//     cache.set(cacheKey, findUser);
//     return successResponse(res, result, 200);
//   } catch (error) {
//     next(error);
//   }
// };
const inActiveUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const findUser = await auth_model_1.default.findOne({ id });
        if (!findUser) {
            return (0, response_util_1.errorResponse)(res, 'worker not found', 500);
        }
        findUser.isActive = false;
        await findUser.save();
        return (0, response_util_1.successResponse)(res, findUser, 200);
    }
    catch (error) {
        next(error);
    }
};
exports.inActiveUser = inActiveUser;
//# sourceMappingURL=auth.controller.js.map