import { Prisma } from "@prisma/client";
import { ApiError } from "../errors/api.error";
import { prisma } from "../lib/prisma";
import { paginationMeta } from "../lib/pagination";

export interface TopicInput {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

export type TopicUpdate = Partial<TopicInput>;

const topicSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      posts: true,
    },
  },
} as const;

function mapTopic(topic: Prisma.TopicGetPayload<{ select: typeof topicSelect }>) {
  return topic;
}

export async function listTopics(options: { page: number; limit: number }) {
  const [topics, total] = await prisma.$transaction([
    prisma.topic.findMany({
      select: topicSelect,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.topic.count(),
  ]);

  return {
    data: topics.map(mapTopic),
    meta: paginationMeta(options.page, options.limit, total),
  };
}

export async function getTopic(id: string) {
  const topic = await prisma.topic.findUnique({
    where: { id },
    select: topicSelect,
  });

  if (!topic) {
    throw new ApiError(404, "Topic not found.");
  }

  return mapTopic(topic);
}

export async function createTopic(input: TopicInput) {
  try {
    return mapTopic(
      await prisma.topic.create({
        data: input,
        select: topicSelect,
      }),
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "A topic with that slug already exists.");
    }
    throw error;
  }
}

export async function updateTopic(id: string, input: TopicUpdate) {
  try {
    return mapTopic(
      await prisma.topic.update({
        where: { id },
        data: input,
        select: topicSelect,
      }),
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "A topic with that slug already exists.");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(404, "Topic not found.");
    }
    throw error;
  }
}

export async function deleteTopic(id: string): Promise<void> {
  try {
    await prisma.topic.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(404, "Topic not found.");
    }
    throw error;
  }
}
