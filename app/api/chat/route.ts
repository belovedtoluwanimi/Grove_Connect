import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, courseContext, lectureContext } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Ensure this is in your .env.local file!
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are the Grove AI Tutor. You are helping a student taking the course "${courseContext || 'a course'}". They are currently watching the lecture: "${lectureContext || 'a lecture'}". Be helpful, encouraging, and concise.` 
          },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ reply: "Sorry, I am currently offline." }, { status: 500 });
  }
}