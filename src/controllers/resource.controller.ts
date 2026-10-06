import { NextFunction, Request, Response } from "express";
import {
  pagination,
  requireUuid,
} from "./content.validation";
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  updateResource,
} from "../services/resource.service";
import {
  ResourceCreateInput,
  ResourceUpdateInput,
} from "../validation/schemas";

function categoryFilter(request: Request): string | undefined {
  if (request.query.categoryId === undefined) {
    return undefined;
  }
  return requireUuid(request.query.categoryId, "categoryId");
}

export async function listResourceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(200)
      .json(await listResources({ ...pagination(request), categoryId: categoryFilter(request) }));
  } catch (error) {
    next(error);
  }
}

export async function getResourceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(200)
      .json({ data: await getResource(requireUuid(request.params.id, "Resource id")) });
  } catch (error) {
    next(error);
  }
}

export async function createResourceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response
      .status(201)
      .json({
        data: await createResource(request.body as ResourceCreateInput),
      });
  } catch (error) {
    next(error);
  }
}

export async function updateResourceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.status(200).json({
      data: await updateResource(
        requireUuid(request.params.id, "Resource id"),
        request.body as ResourceUpdateInput,
      ),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteResourceController(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    await deleteResource(requireUuid(request.params.id, "Resource id"));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
}
