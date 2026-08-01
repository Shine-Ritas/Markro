import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

const CODE_PREFIX = "LD";
const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateGlobalUserCodeValue(): string {
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += CODE_CHARSET[randomInt(0, CODE_CHARSET.length)];
  }
  return `${CODE_PREFIX}-${suffix}`;
}

export async function generateUniqueGlobalUserCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateGlobalUserCodeValue();
    const existing = await prisma.user.findFirst({
      where: { globalUserCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique global user code");
}

export async function assignGlobalUserCode(userId: string): Promise<string | null> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalUserCode: true },
  });
  if (!existing) return null;
  if (existing.globalUserCode) return existing.globalUserCode;

  const code = await generateUniqueGlobalUserCode();
  await prisma.user.update({
    where: { id: userId },
    data: { globalUserCode: code },
  });
  return code;
}

export async function backfillGlobalUserCodes(): Promise<number> {
  const users = await prisma.user.findMany({
    where: { globalUserCode: null, deletedAt: null },
    select: { id: true },
  });

  let count = 0;
  for (const user of users) {
    await assignGlobalUserCode(user.id);
    count++;
  }
  return count;
}

export function isGlobalUserCodeQuery(q: string): boolean {
  return /^LD[-]?[A-Z0-9]{2,}$/i.test(q.trim());
}
