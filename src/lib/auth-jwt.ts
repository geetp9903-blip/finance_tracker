
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key-change-me';
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key-change-me';

const encodedKey = new TextEncoder().encode(SECRET_KEY);
const encodedRefreshKey = new TextEncoder().encode(REFRESH_SECRET_KEY);

export async function signAccessToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(encodedKey);
}

export async function signRefreshToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .setJti(uuidv4()) // Unique ID for the token
        .sign(encodedRefreshKey);
}

export async function verifyAccessToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, encodedKey);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function verifyRefreshToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, encodedRefreshKey);
        return payload;
    } catch (error) {
        return null;
    }
}
