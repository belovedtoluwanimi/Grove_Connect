import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the SERVICE ROLE key to bypass RLS and write to the secure vault
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { images, userId } = await req.json();

    // 1. Send the images to Smile ID's servers for Document Verification
    // (You will need your Partner ID and API Key from the Smile ID portal)
    const smileIdPayload = {
      partner_id: process.env.SMILE_ID_PARTNER_ID,
      api_key: process.env.SMILE_ID_API_KEY,
      job_type: 1, // Job Type 1 = Document Verification
      images: images, 
      country: "NG", // Nigeria
      id_type: "NIN_V2" // Can be NIN, DRIVERS_LICENSE, PASSPORT, etc.
    };

    const smileResponse = await fetch('https://api.smileidentity.com/v1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smileIdPayload)
    });

    const verificationResult = await smileResponse.json();

    // 2. Check if the Face matches the ID and the ID is valid
    if (verificationResult.ResultCode === "1012") {
      
      // 3. Save the sensitive data to the secure vault
      const { error: vaultError } = await supabaseAdmin
        .from('tutor_kyc_data')
        .upsert({
          user_id: userId,
          id_type: "NIN",
          id_number: verificationResult.IDNumber,
          full_name: verificationResult.FullName,
        });

      if (vaultError) throw vaultError;

      // 4. Update the public profile so the dashboard knows they are verified
      await supabaseAdmin
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);

      return NextResponse.json({ success: true, message: "Identity verified securely." });
      
    } else {
      // The faces didn't match, or the ID was fake!
      return NextResponse.json({ success: false, error: verificationResult.ResultText }, { status: 400 });
    }

  } catch (error: any) {
    console.error("KYC Verification Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}