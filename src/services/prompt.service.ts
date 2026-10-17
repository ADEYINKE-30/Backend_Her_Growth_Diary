import { Prisma } from "@prisma/client";
import { ApiError } from "../errors/api.error";
import { prisma } from "../lib/prisma";
import { paginationMeta } from "../lib/pagination";

export interface PromptInput {
  prompt: string;
  sortOrder: number;
  isPublished?: boolean;
}

export type PromptUpdate = Partial<PromptInput>;

export async function listPrompts(options: { page: number; limit: number }) {
  const where = { isPublished: true };
  const [prompts, total] = await prisma.$transaction([
    prisma.journalPrompt.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.journalPrompt.count({ where }),
  ]);

  return {
    data: prompts,
    meta: paginationMeta(options.page, options.limit, total),
  };
}

export async function getPrompt(id: string) {
  const prompt = await prisma.journalPrompt.findFirst({
    where: { id, isPublished: true },
  });
  if (!prompt) {
    throw new ApiError(404, "Published journal prompt not found.");
  }
  return prompt;
}

export async function createPrompt(input: PromptInput) {
  return prisma.journalPrompt.create({ data: input });
}

export async function updatePrompt(id: string, input: PromptUpdate) {
  try {
    return await prisma.journalPrompt.update({ where: { id }, data: input });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(404, "Journal prompt not found.");
    }
    throw error;
  }
}

export async function deletePrompt(id: string): Promise<void> {
  try {
    await prisma.journalPrompt.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(404, "Journal prompt not found.");
    }
    throw error;
  }
}
