import { Shortage } from '../../models/Shortage.js';
import { AppError } from '../../middleware/errorHandler.js';
export class ShortageController {
    /**
     * GET /api/shortages
     * List all shortage entries, optionally filtered by urgency or status
     */
    static async listShortages(req, res, next) {
        try {
            const { status, search } = req.query;
            const query = {};
            if (status && status !== 'ALL')
                query.status = status;
            if (search) {
                const re = new RegExp(String(search), 'i');
                query.$or = [
                    { medicineName: re },
                    { medicineNameAr: re },
                    { scientificName: re },
                ];
            }
            const items = await Shortage.find(query)
                .sort({ createdAt: -1 })
                .lean();
            res.json({ success: true, data: { items } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/shortages/stats
     * Summary counts broken down by urgency and status
     */
    static async getShortageStats(req, res, next) {
        try {
            const all = await Shortage.find().lean();
            const stats = {
                total: all.length,
                pending: all.filter((i) => i.status === 'PENDING').length,
                ordered: all.filter((i) => i.status === 'ORDERED').length,
                resolved: all.filter((i) => i.status === 'RESOLVED').length,
            };
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/shortages
     * Add a new shortage entry
     */
    static async createShortage(req, res, next) {
        try {
            const { medicineName, medicineNameAr, concentration, scientificName, manufacturer, drugClass, currentQuantity, neededQuantity, notes, addedBy, } = req.body;
            if (!medicineName || neededQuantity === undefined) {
                throw new AppError('medicineName and neededQuantity are required.', 400, 'VALIDATION_ERROR');
            }
            const shortage = new Shortage({
                medicineName,
                medicineNameAr,
                concentration,
                scientificName,
                manufacturer,
                drugClass,
                currentQuantity: Number(currentQuantity ?? 0),
                neededQuantity: Number(neededQuantity), // if CRITICAL, pre-save hook respects it; otherwise auto-computed
                notes,
                addedBy,
                status: 'PENDING',
            });
            await shortage.save();
            res.status(201).json({
                success: true,
                message: 'Shortage entry created.',
                data: { item: shortage },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/shortages/:id
     * Update an existing shortage entry
     */
    static async updateShortage(req, res, next) {
        try {
            const { id } = req.params;
            const { currentQuantity, neededQuantity, status, notes, } = req.body;
            const item = await Shortage.findById(id);
            if (!item)
                throw new AppError('Shortage entry not found.', 404, 'NOT_FOUND');
            if (currentQuantity !== undefined)
                item.currentQuantity = Math.max(0, Number(currentQuantity));
            if (neededQuantity !== undefined)
                item.neededQuantity = Math.max(0, Number(neededQuantity));
            if (status !== undefined)
                item.status = status;
            if (notes !== undefined)
                item.notes = notes;
            await item.save();
            res.json({
                success: true,
                message: 'Shortage entry updated.',
                data: { item },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/shortages/:id
     * Remove a shortage entry
     */
    static async deleteShortage(req, res, next) {
        try {
            const { id } = req.params;
            const item = await Shortage.findByIdAndDelete(id);
            if (!item)
                throw new AppError('Shortage entry not found.', 404, 'NOT_FOUND');
            res.json({ success: true, message: 'Shortage entry deleted.' });
        }
        catch (error) {
            next(error);
        }
    }
}
