import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import Card from '../models/Card';
import List from '../models/List';
import validate from '../middleware/validate';
import {
    createCardSchema,
    updateCardSchema,
    deleteCardSchema,
    moveCardSchema,
} from '../middleware/card.validation';

const router = Router();

// --- CREATE ---
router.post('/', validate(createCardSchema), async (req: Request, res: Response) => {
    try {
        const { title, listId } = req.body;
        const card = new Card({ title, description: '', list: listId });
        const newCard = await card.save();
        await List.findByIdAndUpdate(listId, { $push: { cards: newCard._id } });
        res.status(201).json(newCard);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- UPDATE ---
router.patch('/:id', validate(updateCardSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedCard = await Card.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCard) {
            return res.status(404).json({ message: 'Card not found' });
        }
        res.json(updatedCard);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- DELETE ---
router.delete('/:id', validate(deleteCardSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const card = await Card.findById(id);
        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }
        await List.findByIdAndUpdate(card.list, { $pull: { cards: card._id } });
        await Card.findByIdAndDelete(id);
        res.json({ message: 'Card deleted successfully' });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- MOVE & REORDER ---
router.patch('/:cardId/move', validate(moveCardSchema), async (req: Request, res: Response) => {
    try {
        const { cardId } = req.params;
        const { sourceListId, destinationListId, destinationIndex } = req.body;

        if (sourceListId === destinationListId) {
            const list = await List.findById(sourceListId);
            if (!list) return res.status(404).json({ message: 'List not found' });

            list.cards = list.cards.filter(c => c.toString() !== cardId);
            const cardObjectId = new Types.ObjectId(cardId);
            list.cards.splice(destinationIndex, 0, cardObjectId);
            await list.save();
        } else {
            const sourceList = await List.findByIdAndUpdate(sourceListId, { $pull: { cards: cardId } });
            if (!sourceList) return res.status(404).json({ message: 'Source list not found' });

            const destinationList = await List.findById(destinationListId);
            if (!destinationList) return res.status(404).json({ message: 'Destination list not found' });

            const cardObjectId = new Types.ObjectId(cardId);
            destinationList.cards.splice(destinationIndex, 0, cardObjectId);
            await destinationList.save();
            await Card.findByIdAndUpdate(cardId, { list: destinationListId });
        }

        // --- ENHANCED SOCKET.IO EMIT ---
        const list = await List.findById(destinationListId);
        if (!list) {
            return res.status(404).json({ message: 'Parent list not found after move' });
        }
        const boardId = list.board.toString();

        req.io.to(boardId).emit('board_updated', {
            message: `Card was moved on board ${boardId}`,
            cardId,
            sourceListId,
            destinationListId
        });

        res.status(200).json({ message: 'Card moved successfully' });

    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

export default router;