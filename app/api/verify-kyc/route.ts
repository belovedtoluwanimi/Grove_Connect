import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. We still need Supabase to update the user's profile
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    const { images, userId } = await req.json();

    // ==========================================
    // 🚨 DEVELOPMENT SIMULATION MODE 🚨
    // ==========================================
    // Instead of calling the Smile ID API (which requires keys),
    // we simulate a 3-second network delay and force a success.

    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

    const verificationResult = {
      ResultCode: "1012", // 1012 is Smile ID's code for "Success"
      IDNumber: "SIMULATED_NIN_123456789",
      FullName: "Simulated User",
      ResultText: "Document Verified"
    };

    // ==========================================
    // ONCE YOU HAVE A BUSINESS EMAIL, DELETE THE SIMULATION BLOCK ABOVE
    // AND UNCOMMENT THE REAL API CALL BELOW:
    // ==========================================
    /*
    const smileIdPayload = {
      partner_id: process.env.SMILE_ID_PARTNER_ID,
      api_key: process.env.SMILE_ID_API_KEY,
      job_type: 1, 
      images: images, 
      country: "NG",
      id_type: "NIN_V2" 
    };

    const smileResponse = await fetch('https://api.smileidentity.com/v1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smileIdPayload)
    });

    const verificationResult = await smileResponse.json();
    */

    // 3. Check if the Face matches the ID (Always true in simulation)
    if (verificationResult.ResultCode === "1012") {
      
      // 4. Save the simulated sensitive data to the secure vault
      const { error: vaultError } = await supabaseAdmin
        .from('tutor_kyc_data')
        .upsert({
          user_id: userId,
          id_type: "NIN",
          id_number: verificationResult.IDNumber,
          full_name: verificationResult.FullName,
        });

      if (vaultError) {
          console.error("Vault Error:", vaultError);
          // Ignore vault error in dev mode if the table isn't created yet
      }

      // 5. Update the public profile so the dashboard knows they are verified
      await supabaseAdmin
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      return NextResponse.json({ success: true, message: "Identity verified securely." });
      
    } else {
      return NextResponse.json({ success: false, error: verificationResult.ResultText }, { status: 400 });
    }

  } catch (error: any) {
    console.error("KYC Verification Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}