import { NextFunction, Request, Response } from "express";
import { Area, City } from "../../models/admin.models/location.model";
import { errorResponse, successResponse } from "../../utils/response.util";

interface LocationRequestBody {
    cityName: string;
    areas: string[];
}

export const createLocationWithAreas = async (
    req: Request<{}, {}, LocationRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { cityName, areas } = req.body;

        if (!cityName || !Array.isArray(areas) || areas.length === 0) {
            return errorResponse(res, 'City name and areas are required', 400);
        }

        const existingCity = await City.findOne({ name: cityName });
        if (existingCity) {
            return errorResponse(res, 'City already exists', 400);
        }

        const uniqueAreas = [...new Set(areas.map(name => name.trim()).filter(Boolean))];
        if (uniqueAreas.length === 0) {
            return errorResponse(res, 'No valid area names provided', 400);
        }

        const city = new City({ name: cityName });
        await city.save();

        const areaDocs = uniqueAreas.map(name => ({
            name,
            city: city._id,
        }));

        await Area.insertMany(areaDocs, { ordered: false });

        const data = {
            message: 'City and areas created successfully',
            city,
            areas: uniqueAreas,
        };

        return successResponse(res, data, 201);
    } catch (err) {
        next(err);
    }
};

export const getAllLocations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const search = req.query.search?.toString().trim() || '';

        const locations = await City.aggregate([
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

        return successResponse(res, locations, 200);
    } catch (err) {
        next(err);
    }
};

export const editLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cityId } = req.params;
        const { name, isActive, areas } = req.body;

        // 1. Update city
        const city = await City.findById(cityId);
        if (!city) {
            return res.status(404).json({ message: 'City not found' });
        }

        if (name !== undefined) city.name = name;
        if (isActive !== undefined) city.isActive = isActive;

        await city.save();

        // 2. Optionally update areas if provided
        if (Array.isArray(areas)) {
            for (const area of areas) {
                if (area.id) {
                    // Update existing area
                    await Area.findOneAndUpdate(
                        { _id: area.id, city: cityId },
                        { name: area.name },
                        { new: true }
                    );
                } else {
                    // Create new area
                    await Area.create({
                        name: area.name,
                        city: cityId,
                    });
                }
            }
        }

        return successResponse(res, { message: 'Location updated successfully' }, 200);
    } catch (err) {
        next(err);
    }
};