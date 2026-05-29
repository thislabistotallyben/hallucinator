import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, temperature } = await req.json();

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:270m',
        messages: messages,
        options: {
          temperature: temperature ?? 1.2,
        },
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new NextResponse(`Ollama error: ${errorText}`, { status: response.status });
    }

    // Return the stream directly from Ollama
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
