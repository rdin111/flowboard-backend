import { Document, Schema, model, Types } from 'mongoose';
import { IList } from './List'; // Import the IList interface

// Interface to define the properties of a Board
export interface IBoard extends Document {
    title: string;
    lists: (Types.ObjectId | IList)[];
}

const BoardSchema = new Schema<IBoard>({
    title: {
        type: String,
        required: true,
    },
    lists: [{
        type: Schema.Types.ObjectId,
        ref: 'List',
    }],
});

export default model<IBoard>('Board', BoardSchema);