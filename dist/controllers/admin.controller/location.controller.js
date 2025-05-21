"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editLocation = exports.getAllLocations = exports.createLocationWithAreas = void 0;
const location_model_1 = require("../../models/admin.models/location.model");
const response_util_1 = require("../../utils/response.util");
const createLocationWithAreas = async (req, res, next) => {
    try {
        const { cityName, areas } = req.body;
        if (!cityName || !Array.isArray(areas) || areas.length === 0) {
            return (0, response_util_1.errorResponse)(res, 'City name and areas are required', 400);
        }
        const existingCity = await location_model_1.City.findOne({ name: cityName });
        if (existingCity) {
            return (0, response_util_1.errorResponse)(res, 'City already exists', 400);
        }
        const uniqueAreas = [...new Set(areas.map(name => name.trim()).filter(Boolean))];
        if (uniqueAreas.length === 0) {
            return (0, response_util_1.errorResponse)(res, 'No valid area names provided', 400);
        }
        const city = new location_model_1.City({ name: cityName });
        await city.save();
        const areaDocs = uniqueAreas.map(name => ({
            name,
            city: city._id,
        }));
        await location_model_1.Area.insertMany(areaDocs, { ordered: false });
        const data = {
            message: 'City and areas created successfully',
            city,
            areas: uniqueAreas,
        };
        return (0, response_util_1.successResponse)(res, data, 201);
    }
    catch (err) {
        next(err);
    }
};
exports.createLocationWithAreas = createLocationWithAreas;
const getAllLocations = async (req, res, next) => {
    var _a;
    try {
        const search = ((_a = req.query.search) === null || _a === void 0 ? void 0 : _a.toString().trim()) || '';
        const locations = await location_model_1.City.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'areas',
                    localField: '_id',
                    foreignField: 'city',
                    as: 'areas',
                },
            },
            {
                $addFields: {
                    areas: {
                        $map: {
                            input: '$areas',
                            as: 'a',
                            in: {
                                id: '$$a._id',
                                name: '$$a.name',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    cityName: '$name',
                    areas: 1,
                },
            },
            // Apply filter by cityName or area.name
            {
                $match: search
                    ? {
                        $or: [
                            { cityName: { $regex: search, $options: 'i' } },
                            { 'areas.name': { $regex: search, $options: 'i' } },
                        ],
                    }
                    : {},
            },
        ]);
        return (0, response_util_1.successResponse)(res, locations, 200);
    }
    catch (err) {
        next(err);
    }
};
exports.getAllLocations = getAllLocations;
const editLocation = async (req, res, next) => {
    try {
        const { cityId } = req.params;
        const { name, isActive, areas } = req.body;
        // 1. Update city
        const city = await location_model_1.City.findById(cityId);
        if (!city) {
            return res.status(404).json({ message: 'City not found' });
        }
        if (name !== undefined)
            city.name = name;
        if (isActive !== undefined)
            city.isActive = isActive;
        await city.save();
        // 2. Optionally update areas if provided
        if (Array.isArray(areas)) {
            for (const area of areas) {
                if (area.id) {
                    // Update existing area
                    await location_model_1.Area.findOneAndUpdate({ _id: area.id, city: cityId }, { name: area.name }, { new: true });
                }
                else {
                    // Create new area
                    await location_model_1.Area.create({
                        name: area.name,
                        city: cityId,
                    });
                }
            }
        }
        return (0, response_util_1.successResponse)(res, { message: 'Location updated successfully' }, 200);
    }
    catch (err) {
        next(err);
    }
};
exports.editLocation = editLocation;
//# sourceMappingURL=location.controller.js.map