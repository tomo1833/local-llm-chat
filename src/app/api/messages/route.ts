import { createMessage } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { threadId, role, content } = await request.json();

    if (!threadId || !role || !content) {
      return NextResponse.json(
        { error: 'threadId、role、contentは必須です' },
        { status: 400 }
      );
    }

    const message = await createMessage(threadId, role, content);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: 'メッセージの作成に失敗しました' },
      { status: 500 }
    );
  }
}
