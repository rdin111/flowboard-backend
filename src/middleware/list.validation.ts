import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
});

export const createListSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title cannot be empty'),
        boardId: objectIdSchema,
    }),
});

export const updateListSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        title: z.string().min(1, 'Title cannot be empty'),
    }),
});

export const deleteListSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});