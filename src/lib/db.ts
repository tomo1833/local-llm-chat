import { PrismaClient } from '@/generated/prisma/client';

let prisma: PrismaClient;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export function getPrismaInstance() {
  return getPrisma();
}

export async function getThread(id: string) {
  const p = getPrisma();
  return p.thread.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function getThreads() {
  const p = getPrisma();
  return p.thread.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createThread(title: string) {
  const p = getPrisma();
  return p.thread.create({
    data: { title },
  });
}

export async function deleteThread(id: string) {
  const p = getPrisma();
  return p.thread.delete({
    where: { id },
  });
}

export async function getMessages(threadId: string) {
  const p = getPrisma();
  return p.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createMessage(
  threadId: string,
  role: string,
  content: string
) {
  const p = getPrisma();
  const message = await p.message.create({
    data: {
      threadId,
      role,
      content,
    },
  });

  // Update thread updated time
  await p.thread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  return message;
}
