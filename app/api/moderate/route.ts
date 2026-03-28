import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: "No text provided" }, { status: 400 });
    }

    // Ping the free OpenAI Moderation API
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ input: text })
    });

    if (!response.ok) {
        throw new Error("OpenAI API failed");
    }

    const data = await response.json();
    const result = data.results[0];

    // If the AI flags the text for hate speech, violence, self-harm, etc.
    if (result.flagged) {
      // You can even see exactly WHY it was flagged to log it in your database later
      console.warn("🚨 CONTENT FLAGGED:", result.categories);
      
      return NextResponse.json({ 
          success: false, 
          isClean: false, 
          message: "This content violates our community guidelines." 
      });
    }

    // If it passes, give the green light!
    return NextResponse.json({ success: true, isClean: true });

  } catch (error) {
    console.error("Moderation Error:", error);
    return NextResponse.json({ success: false, error: "Server error during moderation" }, { status: 500 });
  }
}