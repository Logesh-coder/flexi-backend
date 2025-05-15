"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLocationWithAreas = void 0;
const location_model_1 = require("../../models/admin.models/location.model");
const response_util_1 = require("../../utils/response.util");
const createLocationWithAreas = async (req, res, next) => {
    try {
        const { cityName, areas } = req.body;
        if (!cityName || !Array.isArray(areas) || areas.length === 0) {
            return (0, response_util_1.errorResponse)(res, 'City name and areas are required', 400);
        }
        const trimmedCity = cityName.trim();
        const existingCity = await location_model_1.City.findOne({ name: trimmedCity });
        if (existingCity) {
            return (0, response_util_1.errorResponse)(res, 'City already exists', 400);
        }
        const uniqueAreas = [...new Set(areas.map(name => name.trim()).filter(Boolean))];
        if (uniqueAreas.length === 0) {
            return (0, response_util_1.errorResponse)(res, 'No valid area names provided', 400);
        }
        const city = new location_model_1.City({ name: trimmedCity });
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
//# sourceMappingURL=location.controller.js.map