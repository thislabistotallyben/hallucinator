import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      return NextResponse.json({ status: 'offline', error: 'Ollama is unreachable' }, { status: 500 });
    }
    const data = await response.json();
    const models = data.models || [];
    const hasGemma = models.some((m: any) => 
      m.name.includes('gemma3:270m') || m.name.includes('gemma3')
    );
    
    return NextResponse.json({
      status: 'online',
      models: models.map((m: any) => m.name),
      hasGemma3_270m: hasGemma,
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'offline', error: error.message }, { status: 500 });
  }
}
