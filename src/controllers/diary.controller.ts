import { NextFunction, Request, Response } from "express";
import { requireUuid, pagination, queryString } from "./content.validation";
import { ApiError } from "../errors/api.error";
import {
  createDiaryPost,
  deleteDiaryPost,
  getDiaryPost,
  listDiaryPosts,
  updateDiaryPost,
} from "../services/diary.service";
import {
  DiaryCreateInput,
  DiaryUpdateInput,
} from "../validation/schemas";

export async function listDiary(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = pagination(request);
    const status = queryString(request, "status")?.toUpperCase();
    if (status && !["DRAFT", "PUBLISHED", "ALL"].includes(status)) {
      throw new ApiError(400, "status must be DRAFT, PUBLISHED, or ALL.");
    }
    if (
      (status === "DRAFT" || status === "ALL") &&
      request.admin?.role !== "ADMIN"
    ) {
      throw new ApiError(403, "Administrator access is required for unpublished posts.");
    }

    const result = await listDiaryPosts({
      page,
      limit,
      topic: queryString(request, "topic"),
      search: queryString(request, "search"),
      sort: queryString(request, "sort"),
      direction: queryString(request, "direction"),
      status: status as "DRAFT" | "PUBLISHED" | "ALL" | undefined,
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getDiary(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = queryString(request, "status")?.toUpperCase();
    if (status && !["DRAFT", "PUBLISHED"].includes(status)) {
      throw new ApiError(400, "status must be DRAFT or PUBLISHED.");
    }
    if (status === "DRAFT" && request.admin?.role !== "ADMIN") {
      throw new ApiError(403, "Administrator access is required for unpublished posts.");
    }
    response.status(200).json({
      data: await getDiaryPost(
        requireUuid(request.params.id, "Diary post id"),
        status === "DRAFT" ? "DRAFT" : undefined,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function createDiary(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.status(201).json({
      data: await createDiaryPost(request.body as DiaryCreateInput),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDiary(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response.status(200).json({
      data: await updateDiaryPost(
        requireUuid(request.params.id, "Diary post id"),
        request.body as DiaryUpdateInput,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDiary(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteDiaryPost(requireUuid(request.params.id, "Diary post id"));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
