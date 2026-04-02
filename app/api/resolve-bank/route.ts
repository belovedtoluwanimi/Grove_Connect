import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("👉 1. Frontend sent data:", body);

        const { bankCode, accountNumber } = body;

        if (!bankCode || !accountNumber) {
            console.log("❌ 2. Missing data from frontend!");
            return NextResponse.json({ error: 'Bank code and account number are required' }, { status: 400 });
        }

        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            console.log("❌ 3. CRITICAL ERROR: PAYSTACK_SECRET_KEY is missing from .env.local!");
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        console.log(`⏳ 4. Pinging Paystack for Account: ${accountNumber}, Bank: ${bankCode}...`);
        
        const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${secretKey}`, 
            },
        });

        const data = await response.json();
        console.log("🏦 5. Paystack Responded:", data);

        if (data.status === true) {
            console.log("✅ 6. Success! Found Name:", data.data.account_name);
            return NextResponse.json({ success: true, account_name: data.data.account_name });
        } else {
            console.log("❌ 7. Paystack Rejected it!");
            return NextResponse.json({ error: data.message || 'Account not found.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error("🔥 SERVER CRASH:", error);
        return NextResponse.json({ error: 'Internal server error connecting to banking network.' }, { status: 500 });
    }
}