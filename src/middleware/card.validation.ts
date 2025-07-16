import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
});

export const createCardSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title cannot be empty'),
        listId: objectIdSchema,
    }),
});

export const updateCardSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: 'At least one field (title or description) must be provided for update'
    }),
});

export const deleteCardSchema = z.object({
    params: z.object({
        id: objectIdSchema,
    }),
});

export const moveCardSchema = z.object({
    params: z.object({
        cardId: objectIdSchema,
    }),
    body: z.object({
        sourceListId: objectIdSchema,
        destinationListId: objectIdSchema,
        destinationIndex: z.number().min(0),
    }),
});