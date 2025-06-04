import axios from 'axios';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

export const exchangeCodeForToken = async (code: string) => {
    const res = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
    });
    return res.data; // contains access_token
};

export const getGoogleUser = async (accessToken: string) => {
    const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
};
