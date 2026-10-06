import {
  Prisma,
  PostStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../errors/api.error";
import { removeImage } from "./image.service";

export interface DiaryPostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  coverImagePublicId?: string | null;
  publishedAt?: Date | null;
  status?: PostStatus;
  topicIds?: string[];
}

export type DiaryPostUpdate = Partial<DiaryPostInput>;

const postInclude = {
  topics: {
    include: {
      topic: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  },
} as const;

function mapPost(post: Prisma.PostGetPayload<{ include: typeof postInclude }>) {
  const { topics, ...postFields } = post;

  return {
    ...postFields,
    topics: topics.map(({ topic }) => topic),
  };
}

export async function listDiaryPosts(options: {
  page: number;
  limit: number;
  topic?: string;
  search?: string;
  sort?: string;
  direction?: string;
  status?: "DRAFT" | "PUBLISHED" | "ALL";
}) {
  const where: Prisma.PostWhereInput = {};
  if (options.status !== "ALL") {
    where.status = options.status ?? PostStatus.PUBLISHED;
  }

  if (options.topic) {
    where.topics = {
      some: {
        topic: {
          slug: options.topic,
        },
      },
    };
  }

  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { excerpt: { contains: options.search, mode: "insensitive" } },
      { content: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const sortFields = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    publishedAt: "publishedAt",
    title: "title",
  } as const;
  const sort = options.sort ?? "createdAt";
  const direction = options.direction ?? "desc";
  if (!(sort in sortFields) || !["asc", "desc"].includes(direction)) {
    throw new ApiError(
      400,
      "sort must be createdAt, updatedAt, publishedAt, or title; direction must be asc or desc.",
    );
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: [{ [sortFields[sort as keyof typeof sortFields]]: direction }, { id: "asc" }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    data: posts.map(mapPost),
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
      hasNextPage: options.page * options.limit < total,
      hasPreviousPage: options.page > 1,
    },
  };
}

export async function getDiaryPost(id: string, requestedStatus?: "DRAFT") {
  const post = await prisma.post.findFirst({
    where: {
      id,
      status: requestedStatus ?? PostStatus.PUBLISHED,
    },
    include: postInclude,
  });

  if (!post) {
    throw new ApiError(404, "Diary post not found.");
  }

  return mapPost(post);
}

export async function createDiaryPost(input: DiaryPostInput) {
  try {
    const post = await prisma.post.create({
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        coverImageUrl: input.coverImageUrl,
        coverImageAlt: input.coverImageAlt,
        coverImagePublicId: input.coverImagePublicId,
        publishedAt: input.publishedAt,
        status: input.status,
        topics: input.topicIds
          ? {
              create: input.topicIds.map((topicId) => ({
                topic: {
                  connect: { id: topicId },
                },
              })),
            }
          : undefined,
      },
      include: postInclude,
    });

    return mapPost(post);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "A diary post with that slug already exists.");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new ApiError(404, "One or more topics were not found.");
    }

    throw error;
  }
}

export async function updateDiaryPost(id: string, input: DiaryPostUpdate) {
  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        content: input.content,
        coverImageUrl: input.coverImageUrl,
        coverImageAlt: input.coverImageAlt,
        coverImagePublicId: input.coverImagePublicId,
        publishedAt: input.publishedAt,
        status: input.status,
        topics:
          input.topicIds === undefined
            ? undefined
            : {
                deleteMany: {},
                create: input.topicIds.map((topicId) => ({
                  topic: {
                    connect: { id: topicId },
                  },
                })),
              },
      },
      include: postInclude,
    });

    return mapPost(post);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "A diary post with that slug already exists.");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new ApiError(404, "Diary post or one or more topics not found.");
    }

    throw error;
  }
}

export async function deleteDiaryPost(id: string): Promise<void> {
  try {
    await removeImage("diary", id);
    await prisma.post.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new ApiError(404, "Diary post not found.");
    }

    throw error;
  }
}
