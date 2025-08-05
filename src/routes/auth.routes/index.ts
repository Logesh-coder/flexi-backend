import { Router } from 'express';
import { handleGoogleCallback } from '../../controllers/user.controller/auth.controller';

const router = Router();


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

router.get('/google', (_req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile&access_type=offline`;
    res.redirect(url);
});



router.get('/google/callback', handleGoogleCallback);

router.get('/google/start', (req, res) => {
    const redirectUri = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent',
    });

    res.redirect(`${redirectUri}?${params.toString()}`);
});

export default router; 
