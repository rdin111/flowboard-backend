import { Server } from 'socket.io';

// This merges our new property with the existing Express Request interface
declare global {
    namespace Express {
        export interface Request {
            io: Server;
        }
    }
}