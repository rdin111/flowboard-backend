import express, { type Express, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

// Import routes
import boardRoutes from './routes/boards';
import listRoutes from './routes/lists';
import cardRoutes from './routes/cards';
import aiRoutes from './routes/ai';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001; // Elastic Beanstalk will provide this
const frontendURL = "https://www.flowboard.me";

// --- Create HTTP server and wrap the Express app ---
const server = http.createServer(app);

// --- Configure Socket.IO for Production ---
const io = new Server(server, {
    cors: {
        origin: frontendURL, // 1. Allow requests ONLY from your frontend domain
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

// --- Middleware ---
// 2. Configure Express CORS for your specific domain
app.use(cors({ origin: frontendURL }));
app.use(express.json());

app.use((req: Request, res: Response, next) => {
    req.io = io;
    next();
});

// --- MongoDB Connection ---
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error('MongoDB URI is not defined in .env file');
    process.exit(1);
}

mongoose.connection.on('error', err => {
    console.error(` Mongoose connection error: ${err.message}`);
});

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error(`Initial Mongoose connection failed: ${err.message}`);
        process.exit(1);
    });

// --- Socket.IO Handlers ---
io.on('connection', (socket) => {
    console.log('A user connected with socket ID:', socket.id);

    socket.on('join_board', (boardId) => {
        socket.join(boardId);
        console.log(`User ${socket.id} joined board room: ${boardId}`);
    });

    socket.on('leave_board', (boardId) => {
        socket.leave(boardId);
        console.log(`User ${socket.id} left board room: ${boardId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- API Routes ---
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the Flowboard API!', status: 'OK' });
});

app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/ai', aiRoutes);

// --- Start Server ---
// 3. Listen on 0.0.0.0 to accept connections from outside the container/server
server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});