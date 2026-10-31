import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 2000;

export const conversationIdSchema = z.string().uuid();
export const listingIdSchema = z.string().uuid();

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "Message can't be empty")
  .max(MESSAGE_MAX_LENGTH, `Message must be ${MESSAGE_MAX_LENGTH} characters or less`);

/** Pre-filled in the composer when a buyer opens a brand-new conversation. */
export const DEFAULT_OPENING_MESSAGE =
  "Hi! I'm interested in this item. Is it still available?";
