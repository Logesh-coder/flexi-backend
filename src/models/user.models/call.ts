import mongoose, { Document, Schema } from 'mongoose';

export interface ICall extends Document {
    user: mongoose.Types.ObjectId;
    job?: mongoose.Types.ObjectId;
    worker?: mongoose.Types.ObjectId;
    via: 'job' | 'worker';
    createdAt: Date;
    updatedAt: Date;
}

const callSchema = new Schema<ICall>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'userAuthRegister', required: true },
        job: { type: Schema.Types.ObjectId, ref: 'Job', default: null },
        worker: { type: Schema.Types.ObjectId, ref: 'userAuthRegister', default: null },
        via: { type: String, enum: ['job', 'worker'], required: true },
    },
    { timestamps: true }
);

export default mongoose.model<ICall>('Call', callSchema);
