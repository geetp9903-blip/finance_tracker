import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = process.env.JWT_SECRET || 'default-secret-key-change-me';

const encodedKey = new TextEncoder().encode(SECRET_KEY);

export async function signSessionToken(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // 7 Days Session
        .setJti(uuidv4())
        .sign(encodedKey);
}

export async function verifySessionToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, encodedKey);
        return payload;
    } catch (error) {
        return null;
    }
}
