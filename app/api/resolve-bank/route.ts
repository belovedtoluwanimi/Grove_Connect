import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'Account number and Bank code required' }, { status: 400 });
    }

    try {
        // 🔥 FINTECH INTEGRATION: Paystack Account Resolution API
        // This pings the central banking system to fetch the name attached to the account
        const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Add this to your .env
            },
        });

        const data = await response.json();

        if (data.status) {
            return NextResponse.json({ 
                success: true, 
                account_name: data.data.account_name 
            });
        } else {
            return NextResponse.json({ error: 'Could not verify this account. Please check the details.' }, { status: 400 });
        }

    } catch (error) {
        console.error("Bank Resolution Error:", error);
        return NextResponse.json({ error: 'Internal server error resolving bank account.' }, { status: 500 });
    }
}