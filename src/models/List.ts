import { Document, Schema, model, Types } from 'mongoose';
import { ICard } from './Card';

export interface IList extends Document {
    title : string;
    cards : (Types.ObjectId | ICard)[];
    board : Types.ObjectId;
}


const ListSchema = new Schema<IList>({
    title: {
        type : String,
        required : true,
    },
    cards : [{
        type : Schema.Types.ObjectId,
        ref : "Card",
    }],
    board : {
        type : Schema.Types.ObjectId,
        ref : "Board",
        required: true,
    },
})

export default model<IList>("List", ListSchema);