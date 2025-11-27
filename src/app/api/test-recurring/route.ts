import { NextResponse } from 'next/server';
import { getRecurringRules, saveRecurringRules } from '@/lib/storage';

export async function GET() {
    try {
        const rules = await getRecurringRules();
        return NextResponse.json({
            success: true,
            count: rules.length,
            rules
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Test API Body:', JSON.stringify(body, null, 2));

        const testRule = {
            id: 'test-' + Date.now(),
            userId: 'DemoUser',
            description: 'Test Rule',
            amount: 100,
            category: 'Test',
            type: 'expense' as const,
            frequency: 'monthly' as const,
            startDate: new Date().toISOString(),
            nextDueDate: new Date().toISOString(),
            active: true
        };

        const rules = await getRecurringRules();
        rules.push(testRule);
        await saveRecurringRules(rules);

        return NextResponse.json({
            success: true,
            message: 'Test rule added',
            rulesCount: rules.length
        });
    } catch (error: any) {
        console.error('Test API Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
