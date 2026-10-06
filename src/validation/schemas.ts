import { z } from "zod";

const uuid = z.string().uuid("must be a valid UUID");
const nonEmptyString = z.string().trim().min(1, "is required");
const nullableString = z.string().trim().nullable().optional();
const integer = z.number().int("must be an integer");

export const diaryCreateSchema = z
  .object({
    slug: nonEmptyString,
    title: nonEmptyString,
    excerpt: nonEmptyString,
    content: nonEmptyString,
    coverImageUrl: nullableString,
    coverImageAlt: nullableString,
    publishedAt: z
      .iso.datetime({ offset: true })
      .transform((value) => new Date(value))
      .nullable()
      .optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
    topicIds: z.array(uuid).optional(),
  })
  .strict();

export const diaryUpdateSchema = diaryCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const topicCreateSchema = z
  .object({
    slug: nonEmptyString,
    name: nonEmptyString,
    description: nonEmptyString,
    sortOrder: integer,
  })
  .strict();

export const topicUpdateSchema = topicCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

const resourceFields = {
  categoryId: uuid,
  title: nonEmptyString,
  description: nonEmptyString,
  url: nullableString,
  author: nullableString,
  sortOrder: integer,
  isPublished: z.boolean().optional(),
};

export const resourceCreateSchema = z.object(resourceFields).strict();
export const resourceUpdateSchema = resourceCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const promptCreateSchema = z
  .object({
    prompt: nonEmptyString,
    sortOrder: integer,
    isPublished: z.boolean().optional(),
  })
  .strict();

export const promptUpdateSchema = promptCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one editable field is required",
  });

export const newsletterSubscriptionSchema = z
  .object({
    email: z.string().trim().email("must be a valid email address"),
  })
  .strict();

export const adminLoginSchema = z
  .object({
    email: z.string().trim().email("must be a valid email address"),
    password: z.string().min(1, "is required"),
  })
  .strict();

export type DiaryCreateInput = z.infer<typeof diaryCreateSchema>;
export type DiaryUpdateInput = z.infer<typeof diaryUpdateSchema>;
export type TopicCreateInput = z.infer<typeof topicCreateSchema>;
export type TopicUpdateInput = z.infer<typeof topicUpdateSchema>;
export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
export type PromptCreateInput = z.infer<typeof promptCreateSchema>;
export type PromptUpdateInput = z.infer<typeof promptUpdateSchema>;
export type NewsletterSubscriptionInput = z.infer<
  typeof newsletterSubscriptionSchema
>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
