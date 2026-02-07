import { getThreads, createThread } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const threads = await getThreads();
    return NextResponse.json(threads);
  } catch (error) {
    console.error('Failed to fetch threads:', error);
    return NextResponse.json(
      { error: 'スレッドの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    const thread = await createThread(title);
    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error('Failed to create thread:', error);
    return NextResponse.json(
      { error: 'スレッドの作成に失敗しました' },
      { status: 500 }
    );
  }
}
