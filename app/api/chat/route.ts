import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, courseContext, lectureContext } = await req.json();

    // Here you pass the context and the message to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // Make sure you put your OpenAI API key in your .env.local file!
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or gpt-4o
        messages: [
          { 
            role: 'system', 
            content: `You are the Grove AI Tutor. You are helping a student taking the course "${courseContext}". They are currently watching the lecture: "${lectureContext}". Be helpful, encouraging, and concise.` 
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