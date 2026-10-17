import { Prisma } from "@prisma/client";
import { ApiError } from "../errors/api.error";
import { prisma } from "../lib/prisma";
import { removeImage } from "./image.service";
import { paginationMeta } from "../lib/pagination";

export interface ResourceInput {
  categoryId: string;
  title: string;
  description: string;
  url?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  sortOrder: number;
  isPublished?: boolean;
}

export type ResourceUpdate = Partial<ResourceInput>;

const resourceInclude = {
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} as const;

function mapResource(
  resource: Prisma.ResourceGetPayload<{ include: typeof resourceInclude }>,
) {
  return resource;
}

function categoryNotFound(error: unknown): never | undefined {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    throw new ApiError(404, "Resource or category not found.");
  }
}

export async function listResources(options: {
  page: number;
  limit: number;
  categoryId?: string;
}) {
  const where: Prisma.ResourceWhereInput = {
    isPublished: true,
    categoryId: options.categoryId,
  };
  const [resources, total] = await prisma.$transaction([
    prisma.resource.findMany({
      where,
      include: resourceInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.resource.count({ where }),
  ]);

  return {
    data: resources.map(mapResource),
    meta: paginationMeta(options.page, options.limit, total),
  };
}

export async function getResource(id: string) {
  const resource = await prisma.resource.findFirst({
    where: { id, isPublished: true },
    include: resourceInclude,
  });
  if (!resource) {
    throw new ApiError(404, "Published resource not found.");
  }
  return mapResource(resource);
}

export async function createResource(input: ResourceInput) {
  try {
    return mapResource(
      await prisma.resource.create({
        data: input,
        include: resourceInclude,
      }),
    );
  } catch (error) {
    categoryNotFound(error);
    throw error;
  }
}

export async function updateResource(id: string, input: ResourceUpdate) {
  try {
    return mapResource(
      await prisma.resource.update({
        where: { id },
        data: input,
        include: resourceInclude,
      }),
    );
  } catch (error) {
    categoryNotFound(error);
    throw error;
  }
}

export async function deleteResource(id: string): Promise<void> {
  try {
    await removeImage("resource", id);
    await prisma.resource.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(404, "Resource not found.");
    }
    throw error;
  }
}
