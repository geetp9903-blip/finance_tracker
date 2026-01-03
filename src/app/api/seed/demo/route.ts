import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { UserModel } from '@/lib/models';
import crypto from 'crypto';

export async function GET() {
    try {
        await dbConnect();

        const demoUsername = 'DemoUser';
        const demoEmail = 'geetpurohit090903@gmail.com';
        const demoPin = '123456';

        let user = await UserModel.findOne({ username: demoUsername });

        const hashedPin = crypto.createHash('sha256').update(demoPin).digest('hex');

        if (user) {
            // Update existing demo user
            user.email = demoEmail;
            user.pin = hashedPin;
            await user.save();
            return NextResponse.json({
                status: 'updated',
                message: `DemoUser updated. Log in with PIN: ${demoPin}`,
                credentials: { username: demoUsername, pin: demoPin }
            });
        } else {
            // Create new
            await UserModel.create({
                id: crypto.randomUUID(),
                username: demoUsername,
                email: demoEmail,
                pin: hashedPin,
            });
            return NextResponse.json({
                status: 'created',
                message: `DemoUser created. Log in with PIN: ${demoPin}`,
                credentials: { username: demoUsername, pin: demoPin }
            });
        }

    } catch (error) {
        return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
    }
}
