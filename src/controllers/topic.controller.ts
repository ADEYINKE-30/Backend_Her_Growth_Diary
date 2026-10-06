import { NextFunction, Request, Response } from "express";
import {
  pagination,
  requireUuid,
} from "./content.validation";
import {
  createTopic,
  deleteTopic,
  getTopic,
  listTopics,
  updateTopic,
} from "../services/topic.service";
import { TopicCreateInput, TopicUpdateInput } from "../validation/schemas";

export async function listTopicController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json(await listTopics(pagination(request)));
  } catch (error) {
    next(error);
  }
}

export async function getTopicController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(200)
      .json({ data: await getTopic(requireUuid(request.params.id, "Topic id")) });
  } catch (error) {
    next(error);
  }
}

export async function createTopicController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(201).json({
      data: await createTopic(request.body as TopicCreateInput),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTopicController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({
      data: await updateTopic(
        requireUuid(request.params.id, "Topic id"),
        request.body as TopicUpdateInput,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTopicController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    await deleteTopic(requireUuid(request.params.id, "Topic id"));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
