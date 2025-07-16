import { Document, Schema, model, Types } from 'mongoose';

export interface ICard extends Document{
    title: string;
    description?: string;
    list : Types.ObjectId;
}

const cardSchema = new Schema<ICard>({
    title :{
        type :String,
        required:true,
    },
    description : {
        type : String,
    },
    list : {
        type : Schema.Types.ObjectId,
        ref : "List",
        required:true,
    }
});

export default model<ICard>("Card", cardSchema);