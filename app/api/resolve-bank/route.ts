import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { bankCode, accountNumber } = await req.json();

        if (!bankCode || !accountNumber) {
            return NextResponse.json({ error: 'Bank code and account number are required' }, { status: 400 });
        }

        // 🔥 REAL FINTECH PING: Paystack's Central Bank Resolver
        const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            method: 'GET',
            headers: {
                // You must get a free API key from Paystack.com and put it in your .env.local file!
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 
            },
        });

        const data = await response.json();

        // If the bank confirms the account exists, it returns the real legal name
        if (data.status) {
            return NextResponse.json({ success: true, account_name: data.data.account_name });
        } else {
            return NextResponse.json({ error: data.message || 'Account not found. Check details.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Bank Resolution Error:", error);
        return NextResponse.json({ error: 'Internal server error connecting to banking network.' }, { status: 500 });
    }
}