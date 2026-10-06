import { NextFunction, Request, Response } from "express";
import {
  pagination,
  requireUuid,
} from "./content.validation";
import {
  createPrompt,
  deletePrompt,
  getPrompt,
  listPrompts,
  updatePrompt,
} from "../services/prompt.service";
import {
  PromptCreateInput,
  PromptUpdateInput,
} from "../validation/schemas";

export async function listPromptController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json(await listPrompts(pagination(request)));
  } catch (error) {
    next(error);
  }
}

export async function getPromptController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(200)
      .json({ data: await getPrompt(requireUuid(request.params.id, "Prompt id")) });
  } catch (error) {
    next(error);
  }
}

export async function createPromptController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(201).json({
      data: await createPrompt(request.body as PromptCreateInput),
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePromptController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({
      data: await updatePrompt(
        requireUuid(request.params.id, "Prompt id"),
        request.body as PromptUpdateInput,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePromptController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    await deletePrompt(requireUuid(request.params.id, "Prompt id"));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
