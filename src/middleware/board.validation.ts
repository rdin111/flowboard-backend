import { z } from 'zod';
import { Types } from 'mongoose';

// Utility to check for a valid MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
});

export const createBoardSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title cannot be empty'),
    }),
});

export const getBoardSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const updateBoardSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        title: z.string().min(1, 'Title cannot be empty'),
    }),
});

export const reorderListsSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        orderedListIds: z.array(objectIdSchema),
    }),
});