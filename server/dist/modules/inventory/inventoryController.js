import { PharmacyInventory } from '../../models/PharmacyInventory.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../middleware/audit.js';
export class InventoryController {
    /**
     * List inventory items with filtering and pagination
     */
    static async listInventory(req, res, next) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, parseInt(req.query.limit) || 30);
            const status = req.query.status;
            const search = (req.query.search || '').trim();
            const skip = (page - 1) * limit;
            const query = {};
            if (status && status !== 'ALL') {
                query.status = status;
            }
            if (search) {
                query.$or = [
                    { productName: new RegExp(search, 'i') },
                    { arabicName: new RegExp(search, 'i') },
                    { batchNumber: new RegExp(search, 'i') },
                    { storageLocation: new RegExp(search, 'i') }
                ];
            }
            const [items, total] = await Promise.all([
                PharmacyInventory.find(query).sort({ status: 1, productName: 1 }).skip(skip).limit(limit).lean(),
                PharmacyInventory.countDocuments(query)
            ]);
            res.json({
                success: true,
                data: {
                    items,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get pharmacy inventory high-level statistics for dashboard
     */
    static async getInventoryStats(req, res, next) {
        try {
            const allItems = await PharmacyInventory.find().lean();
            const now = new Date();
            let availableCount = 0;
            let lowStockCount = 0;
            let outOfStockCount = 0;
            let expiredCount = 0;
            let totalUnits = 0;
            let totalValue = 0;
            for (const item of allItems) {
                const isExp = item.expirationDate && new Date(item.expirationDate) <= now;
                if (isExp || item.status === 'EXPIRED') {
                    expiredCount++;
                }
                else if (item.availableQuantity === 0 || item.status === 'OUT_OF_STOCK') {
                    outOfStockCount++;
                }
                else if (item.availableQuantity <= (item.minimumStockLevel || 5) || item.status === 'LOW_STOCK') {
                    lowStockCount++;
                    availableCount++;
                }
                else {
                    availableCount++;
                }
                totalUnits += item.availableQuantity;
                totalValue += (item.availableQuantity * (item.price || 0));
            }
            res.json({
                success: true,
                data: {
                    totalProducts: allItems.length,
                    availableCount,
                    lowStockCount,
                    outOfStockCount,
                    expiredCount,
                    totalUnits,
                    totalValue: Number(totalValue.toFixed(2)),
                    currency: 'EGP'
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update stock or batch details
     */
    static async updateInventoryItem(req, res, next) {
        try {
            const { id } = req.params;
            const { quantity, reservedQuantity, price, storageLocation, minimumStockLevel, expirationDate } = req.body;
            const item = await PharmacyInventory.findById(id);
            if (!item) {
                throw new AppError('Inventory record not found.', 404, 'INVENTORY_NOT_FOUND');
            }
            if (quantity !== undefined)
                item.quantity = Math.max(0, Number(quantity));
            if (reservedQuantity !== undefined)
                item.reservedQuantity = Math.max(0, Number(reservedQuantity));
            if (price !== undefined)
                item.price = Math.max(0, Number(price));
            if (storageLocation)
                item.storageLocation = storageLocation;
            if (minimumStockLevel !== undefined)
                item.minimumStockLevel = Number(minimumStockLevel);
            if (expirationDate)
                item.expirationDate = new Date(expirationDate);
            await item.save();
            await logAudit('UPDATE_INVENTORY', req, String(item._id), {
                productName: item.productName,
                newQuantity: item.quantity,
                newStatus: item.status
            });
            res.json({
                success: true,
                message: 'Inventory record updated successfully.',
                data: { item }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
