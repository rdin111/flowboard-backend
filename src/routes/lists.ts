import { Router, Request, Response } from 'express';
import List from '../models/List';
import Card from '../models/Card';
import Board from '../models/Board';
import validate from '../middleware/validate';
import {
    createListSchema,
    updateListSchema,
    deleteListSchema,
} from '../middleware/list.validation';

const router = Router();

// --- CREATE ---
router.post('/', validate(createListSchema), async (req: Request, res: Response) => {
    try {
        const { title, boardId } = req.body;
        const list = new List({ title, board: boardId });
        const newList = await list.save();
        await Board.findByIdAndUpdate(boardId, { $push: { lists: newList._id } });
        res.status(201).json(newList);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- UPDATE ---
router.patch('/:id', validate(updateListSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const updatedList = await List.findByIdAndUpdate(id, { title }, { new: true });
        if (!updatedList) {
            return res.status(404).json({ message: 'List not found' });
        }
        res.json(updatedList);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- DELETE ---
router.delete('/:id', validate(deleteListSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const list = await List.findById(id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        await Card.deleteMany({ _id: { $in: list.cards } });
        await Board.findByIdAndUpdate(list.board, { $pull: { lists: list._id } });
        await List.findByIdAndDelete(id);

        res.json({ message: 'List and its cards deleted successfully' });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

export default router;