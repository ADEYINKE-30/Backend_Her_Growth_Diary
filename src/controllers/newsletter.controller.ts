import { NextFunction, Request, Response } from "express";
import { NewsletterSubscriptionInput } from "../validation/schemas";
import {
  listNewsletterSubscribers,
  subscribeToNewsletter,
} from "../services/newsletter.service";
import { pagination } from "./content.validation";

export async function subscribeNewsletter(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = request.body as NewsletterSubscriptionInput;
    const result = await subscribeToNewsletter(email);
    response.status(result.created ? 201 : 200).json({
      data: {
        message: "You are subscribed to the newsletter.",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getNewsletterSubscribers(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    response
      .status(200)
      .json(await listNewsletterSubscribers(pagination(request)));
  } catch (error) {
    next(error);
  }
}
