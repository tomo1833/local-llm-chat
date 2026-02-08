import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'disconnected' },
        { status: 200 }
      );
    }

    const data = await response.json();
    const models = Array.isArray(data?.models) ? data.models : [];

    return NextResponse.json(
      { status: 'connected', modelCount: models.length, model: OLLAMA_MODEL },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: 'disconnected', model: OLLAMA_MODEL },
      { status: 200 }
    );
  }
}
