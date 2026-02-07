import { getThread, getMessages, deleteThread } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = await getThread(id);

    if (!thread) {
      return NextResponse.json(
        { error: 'スレッドが見つかりません' },
        { status: 404 }
      );
    }

    const messages = await getMessages(id);

    return NextResponse.json({ thread, messages });
  } catch (error) {
    console.error('Failed to fetch thread:', error);
    return NextResponse.json(
      { error: 'スレッドの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteThread(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete thread:', error);
    return NextResponse.json(
      { error: 'スレッドの削除に失敗しました' },
      { status: 500 }
    );
  }
}
