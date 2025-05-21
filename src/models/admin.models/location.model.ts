import mongoose from 'mongoose';

const citySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter city name'],
            unique: true,
            trim: true,
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const City = mongoose.model('City', citySchema);

const areaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter area name'],
            trim: true,
        },
        city: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: [true, 'City reference is required'],
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Area = mongoose.model('Area', areaSchema);


export { Area, City };

