import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export function normalizeSubscriberEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function subscribeToNewsletter(email: string) {
  const normalizedEmail = normalizeSubscriberEmail(email);

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, unsubscribedAt: true },
    });

    if (existing) {
      if (existing.unsubscribedAt) {
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            unsubscribedAt: null,
            subscribedAt: new Date(),
          },
        });
      }

      return { created: false };
    }

    await prisma.newsletterSubscriber.create({
      data: { email: normalizedEmail },
      select: {
        id: true,
      },
    });
    return { created: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { created: false };
    }
    throw error;
  }
}

export async function listNewsletterSubscribers(options: {
  page: number;
  limit: number;
}) {
  const [subscribers, total] = await prisma.$transaction([
    prisma.newsletterSubscriber.findMany({
      select: {
        id: true,
        email: true,
        subscribedAt: true,
        unsubscribedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ subscribedAt: "desc" }, { id: "asc" }],
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  return {
    data: subscribers,
    meta: { page: options.page, limit: options.limit, total },
  };
}
