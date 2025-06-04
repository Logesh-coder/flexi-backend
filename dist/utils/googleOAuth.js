"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleUser = exports.exchangeCodeForToken = void 0;
const axios_1 = __importDefault(require("axios"));
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const exchangeCodeForToken = async (code) => {
    const res = await axios_1.default.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
    });
    return res.data; // contains access_token
};
exports.exchangeCodeForToken = exchangeCodeForToken;
const getGoogleUser = async (accessToken) => {
    const res = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
};
exports.getGoogleUser = getGoogleUser;
//# sourceMappingURL=googleOAuth.js.map