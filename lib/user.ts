import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateUniqueGlobalUserCode } from "@/lib/global-user-code";
import type { Prisma } from "@prisma/client";

type CreateUserInput = {
  email: string;
  name?: string | null;
  password?: string;
  image?: string | null;
  emailVerified?: Date | null;
};

export async function createUserWithCode(
  data: CreateUserInput,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma;
  const globalUserCode = await generateUniqueGlobalUserCode();
  const user = await client.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name ?? null,
      image: data.image ?? null,
      passwordHash: data.password ? await hashPassword(data.password) : null,
      emailVerified: data.emailVerified ?? null,
      globalUserCode,
    },
  });

  return user;
}
