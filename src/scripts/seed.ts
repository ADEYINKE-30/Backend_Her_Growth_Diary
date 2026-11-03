import argon2 from "argon2";
import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

const topicSeed = [
  { slug: "self-discovery", name: "Self-discovery", description: "Gentle reflections for learning who you are and what matters to you.", sortOrder: 1 },
  { slug: "confidence", name: "Confidence", description: "Small, honest steps toward trusting your voice and your choices.", sortOrder: 2 },
  { slug: "wellbeing", name: "Wellbeing", description: "Practical reminders for caring for your mind, body, and energy.", sortOrder: 3 },
  { slug: "relationships", name: "Relationships", description: "Thoughtful notes on boundaries, connection, and belonging.", sortOrder: 4 },
  { slug: "creativity", name: "Creativity", description: "Encouragement to make room for curiosity, play, and ideas.", sortOrder: 5 },
  { slug: "purpose", name: "Purpose", description: "Prompts for building a meaningful life at your own pace.", sortOrder: 6 },
] as const;

const categorySeed = [
  { slug: "journal-prompts", name: "Journal Prompts", sortOrder: 1 },
  { slug: "growth-guides", name: "Growth Guides", sortOrder: 2 },
  { slug: "recommended-books", name: "Recommended Books", sortOrder: 3 },
  { slug: "self-reflection", name: "Self-Reflection Exercises", sortOrder: 4 },
] as const;

const postSeed = [
  {
    slug: "you-do-not-have-to-have-it-all-figured-out",
    title: "You Do Not Have to Have It All Figured Out",
    excerpt: "A reminder that becoming is allowed to be uncertain, unfinished, and entirely your own.",
    content: "There is no deadline for becoming yourself.\n\nSome seasons are for moving forward, and some are for listening more closely. Neither season is wasted. You are allowed to take the next small step without knowing the whole path.\n\nLet today be enough. Let the questions stay open. You are still growing, even when growth looks like rest.",
    publishedAt: new Date("2026-01-15T09:00:00.000Z"),
    topics: ["self-discovery", "purpose"],
  },
  {
    slug: "the-small-ways-you-are-becoming-braver",
    title: "The Small Ways You Are Becoming Braver",
    excerpt: "Courage is often quiet: a boundary kept, a truth spoken, or a beginning made before you feel ready.",
    content: "Bravery does not always arrive with a loud decision.\n\nSometimes it is answering honestly when “fine” would be easier. Sometimes it is leaving room for your own needs in a busy day. Sometimes it is trying again after disappointment.\n\nNotice the small ways you keep choosing yourself. They count more than you know.",
    publishedAt: new Date("2026-02-02T09:00:00.000Z"),
    topics: ["confidence", "wellbeing"],
  },
  {
    slug: "a-gentler-way-to-measure-progress",
    title: "A Gentler Way to Measure Progress",
    excerpt: "Progress can look like more peace, clearer boundaries, and returning to yourself sooner.",
    content: "Progress is not only the visible milestone.\n\nIt can be the pause before an old reaction. It can be asking for help sooner, resting without earning it, or choosing a relationship that feels safe. It can be noticing that you are kinder to yourself than you used to be.\n\nMeasure your growth by the way you come home to yourself.",
    publishedAt: new Date("2026-02-20T09:00:00.000Z"),
    topics: ["wellbeing", "relationships"],
  },
] as const;

const resourceSeed = [
  { category: "journal-prompts", title: "The 10-Minute Check-In", description: "A simple prompt set for noticing what you need today.", url: null, author: null, sortOrder: 1 },
  { category: "journal-prompts", title: "Letters to Your Future Self", description: "A reflective exercise for naming hopes without pressure.", url: null, author: null, sortOrder: 2 },
  { category: "growth-guides", title: "The Gifts of Imperfection", description: "Let go of who you think you should be and embrace who you are.", url: "https://brenebrown.com/book/the-gifts-of-imperfection/", author: "Brené Brown", sortOrder: 1 },
  { category: "growth-guides", title: "Set Boundaries, Find Peace", description: "A practical guide to reclaiming yourself and your relationships.", url: "https://www.nedratawwab.com/set-boundaries-find-peace/", author: "Nedra Glover Tawwab", sortOrder: 2 },
  { category: "recommended-books", title: "You Are a Badass", description: "A witty, encouraging guide to creating a life you love.", url: "https://jensincero.com/you-are-a-badass/", author: "Jen Sincero", sortOrder: 1 },
  { category: "recommended-books", title: "Big Magic", description: "On living a creative life beyond fear.", url: "https://www.elizabethgilbert.com/books/big-magic/", author: "Elizabeth Gilbert", sortOrder: 2 },
  { category: "self-reflection", title: "Values in Action", description: "Choose three values and write one way to practice each this week.", url: null, author: null, sortOrder: 1 },
  { category: "self-reflection", title: "The Energy Audit", description: "Notice what gives you energy, what drains it, and one boundary to try.", url: null, author: null, sortOrder: 2 },
] as const;

const promptSeed = [
  "What would feel like a kind choice for me today?",
  "Where am I asking myself to be perfect instead of present?",
  "What boundary would give me more room to breathe?",
  "What part of my life is quietly asking for my attention?",
  "What am I proud of that I have not paused to acknowledge?",
  "If I trusted myself a little more, what would I do next?",
] as const;

async function seed(): Promise<void> {
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, passwordHash, role: "ADMIN" },
  });

  const topics = new Map<string, { id: string }>();
  for (const topic of topicSeed) {
    const saved = await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: topic,
      create: topic,
      select: { id: true },
    });
    topics.set(topic.slug, saved);
  }

  for (const post of postSeed) {
    const topicIds = post.topics.map((slug) => topics.get(slug)!.id);
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        publishedAt: post.publishedAt,
        status: PostStatus.PUBLISHED,
        topics: { deleteMany: {}, create: topicIds.map((topicId) => ({ topic: { connect: { id: topicId } } })) },
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        publishedAt: post.publishedAt,
        status: PostStatus.PUBLISHED,
        topics: { create: topicIds.map((topicId) => ({ topic: { connect: { id: topicId } } })) },
      },
    });
  }

  const categories = new Map<string, { id: string }>();
  for (const category of categorySeed) {
    const saved = await prisma.resourceCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
      select: { id: true },
    });
    categories.set(category.slug, saved);
  }

  for (const resource of resourceSeed) {
    const categoryId = categories.get(resource.category)!.id;
    const existing = await prisma.resource.findFirst({
      where: { categoryId, title: resource.title },
      select: { id: true },
    });
    const data = {
      categoryId,
      title: resource.title,
      description: resource.description,
      url: resource.url,
      author: resource.author,
      sortOrder: resource.sortOrder,
      isPublished: true,
    };
    if (existing) {
      await prisma.resource.update({ where: { id: existing.id }, data });
    } else {
      await prisma.resource.create({ data });
    }
  }

  for (const [sortOrder, prompt] of promptSeed.entries()) {
    const existing = await prisma.journalPrompt.findFirst({
      where: { prompt },
      select: { id: true },
    });
    if (existing) {
      await prisma.journalPrompt.update({ where: { id: existing.id }, data: { sortOrder, isPublished: true } });
    } else {
      await prisma.journalPrompt.create({ data: { prompt, sortOrder, isPublished: true } });
    }
  }

  console.log(`Seeded admin, ${postSeed.length} diary posts, ${topicSeed.length} topics, ${resourceSeed.length} resources, and ${promptSeed.length} prompts.`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
