
import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: 'Refresh token logic is deprecated. Please re-login.' }, { status: 410 });
}
