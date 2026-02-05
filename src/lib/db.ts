'use server';

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  let globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };

export async function getThread(id: string) {
  return prisma.thread.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function getThreads() {
  return prisma.thread.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createThread(title: string) {
  return prisma.thread.create({
    data: { title },
  });
}

export async function getMessages(threadId: string) {
  return prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createMessage(
  threadId: string,
  role: string,
  content: string
) {
  const message = await prisma.message.create({
    data: {
      threadId,
      role,
      content,
    },
  });

  // Update thread updated time
  await prisma.thread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  return message;
}
