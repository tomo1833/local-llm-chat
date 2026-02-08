import { NextResponse } from 'next/server';
import { getOllamaModels } from '@/lib/ollama';

export async function GET() {
  try {
    const models = await getOllamaModels();
    const mapped = models
      .map((m: any) => ({
        name: m?.name,
        parameterSize: m?.details?.parameter_size ?? null,
        family: m?.details?.family ?? null,
        quantization: m?.details?.quantization_level ?? null,
      }))
      .filter((m: any) => typeof m.name === 'string');
    return NextResponse.json({ models: mapped }, { status: 200 });
  } catch {
    return NextResponse.json({ models: [] }, { status: 200 });
  }
}
