import { Router, Request, Response } from 'express';
import Board from '../models/Board';
import List from '../models/List';
import Card from '../models/Card';
import validate from '../middleware/validate';
import {
    createBoardSchema,
    getBoardSchema,
    updateBoardSchema,
    reorderListsSchema,
} from '../middleware/board.validation';

const router = Router();

// --- CREATE ---
router.post('/', validate(createBoardSchema), async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const board = new Board({ title });
        const newBoard = await board.save();
        res.status(201).json(newBoard);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- READ ALL (for homepage dashboard) ---
router.get('/', async (req: Request, res: Response) => {
    try {
        const boards = await Board.find().select('_id title');
        res.json(boards);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});


// --- READ ONE (for specific board page) ---
router.get('/:id', validate(getBoardSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const board = await Board.findById(id).populate({
            path: 'lists',
            populate: { path: 'cards' },
        });

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.json(board);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- UPDATE ---
router.patch('/:id', validate(updateBoardSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const updatedBoard = await Board.findByIdAndUpdate(
            id,
            { title },
            { new: true }
        );

        if (!updatedBoard) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.json(updatedBoard);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- DELETE ---
router.delete('/:id', validate(getBoardSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const board = await Board.findById(id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        const lists = await List.find({ _id: { $in: board.lists } });
        const cardIds = lists.flatMap(list => list.cards);

        await Card.deleteMany({ _id: { $in: cardIds } });
        await List.deleteMany({ _id: { $in: board.lists } });
        await Board.findByIdAndDelete(id);

        res.json({ message: 'Board and all associated content deleted successfully' });
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

// --- REORDER LISTS ---
router.patch('/:id/reorder-lists', validate(reorderListsSchema), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { orderedListIds } = req.body;
        const updatedBoard = await Board.findByIdAndUpdate(
            id,
            { lists: orderedListIds },
            { new: true }
        );

        if (!updatedBoard) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.json(updatedBoard);
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ message: error.message });
    }
});

export default router;