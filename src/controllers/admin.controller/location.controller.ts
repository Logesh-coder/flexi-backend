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

        const trimmedCity = cityName.trim();

        const existingCity = await City.findOne({ name: trimmedCity });
        if (existingCity) {
            return errorResponse(res, 'City already exists', 400);
        }

        const uniqueAreas = [...new Set(areas.map(name => name.trim()).filter(Boolean))];
        if (uniqueAreas.length === 0) {
            return errorResponse(res, 'No valid area names provided', 400);
        }

        const city = new City({ name: trimmedCity });
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
