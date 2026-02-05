import { createMessage } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { threadId, role, content } = await request.json();

    if (!threadId || !role || !content) {
      return NextResponse.json(
        { error: 'threadId, role, and content are required' },
        { status: 400 }
      );
    }

    const message = await createMessage(threadId, role, content);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
