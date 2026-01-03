import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { verifySessionToken } from '../auth-jwt';
import { UserModel } from '../models';
import dbConnect from '../db';
// import { UserSchema } from '../schemas'; // Can be used for extra validation if needed

// ... imports

export const verifySession = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;

    if (!token) {
        return { isAuth: false, userId: null };
    }

    try {
        const payload = await verifySessionToken(token);
        if (!payload || !payload.userId) {
            return { isAuth: false, userId: null };
        }
        return { isAuth: true, userId: payload.userId as string };
    } catch (error) {
        console.error('Session verification failed:', error);
        return { isAuth: false, userId: null };
    }
});

export const getUser = cache(async () => {
    const session = await verifySession();
    if (!session.isAuth || !session.userId) return null;

    try {
        await dbConnect();
        // Query by _id (session.userId is the Mongo ID string)
        const user = await UserModel.findById(session.userId).lean();

        if (!user) return null;

        // Manually select safe fields if needed, but for now resolving the crash is priority.
        // We rely on 'server-only' to prevent this object from leaking to client components accidentally.

        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
    }
});

export const assertAuth = async () => {
    const user = await getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }
    // Critical: Transactions use 'username' as the Foreign Key, not the Mongo ID.
    // We must return the username to ensure data alignment.
    return user.username;
};
