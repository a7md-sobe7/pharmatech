import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PharmacyInventory } from '../../models/PharmacyInventory.js';
import { DrugProduct } from '../../models/DrugProduct.js';
import { Shortage } from '../../models/Shortage.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../middleware/audit.js';
import { PushNotificationService } from '../notifications/pushNotificationService.js';
import { NotificationTemplates } from '../notifications/notificationTemplates.js';

export class InventoryController {
  private static async handleShortage(item: any) {
    const minStock = item.minimumStockLevel || 5;
    const currentQty = item.availableQuantity;
    
    if (currentQty < minStock) {
      const neededQuantity = minStock - currentQty;
      const existingShortage = await Shortage.findOne({
        medicineName: item.productName,
        status: { $in: ['PENDING', 'ORDERED'] }
      });
      
      if (existingShortage) {
        existingShortage.currentQuantity = currentQty;
        existingShortage.neededQuantity = neededQuantity;
        await existingShortage.save();
      } else {
        await Shortage.create({
          medicineName: item.productName,
          medicineNameAr: item.arabicName,
          currentQuantity: currentQty,
          neededQuantity: neededQuantity,
          status: 'PENDING',
          notes: 'Auto-generated from inventory threshold'
        });
      }
    } else {
      // Quantity is now sufficient. Remove any active shortages for this medicine from the DB.
      await Shortage.deleteMany({
        medicineName: item.productName,
        status: { $in: ['PENDING', 'ORDERED'] }
      });
    }
  }

  /**
   * List inventory items with filtering and pagination
   */
  public static async listInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 30);
      const status = req.query.status as string;
      const search = (req.query.search as string || '').trim();
      const skip = (page - 1) * limit;

      const query: any = {};
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pharmacy inventory high-level statistics for dashboard
   */
  public static async getInventoryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        } else if (item.availableQuantity === 0 || item.status === 'OUT_OF_STOCK') {
          outOfStockCount++;
        } else if (item.availableQuantity <= (item.minimumStockLevel || 5) || item.status === 'LOW_STOCK') {
          lowStockCount++;
          availableCount++;
        } else {
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
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update stock or batch details
   */
  public static async updateInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity, reservedQuantity, price, storageLocation, minimumStockLevel, expirationDate } = req.body;

      const item = await PharmacyInventory.findById(id);
      if (!item) {
        throw new AppError('Inventory record not found.', 404, 'INVENTORY_NOT_FOUND');
      }

      const previousAvailable = item.availableQuantity;

      if (quantity !== undefined) item.quantity = Math.max(0, Number(quantity));
      if (reservedQuantity !== undefined) item.reservedQuantity = Math.max(0, Number(reservedQuantity));
      if (price !== undefined) item.price = Math.max(0, Number(price));
      if (storageLocation) item.storageLocation = storageLocation;
      if (minimumStockLevel !== undefined) item.minimumStockLevel = Number(minimumStockLevel);
      if (expirationDate) item.expirationDate = new Date(expirationDate);

      await item.save();

      // Trigger real-time stock alert notifications (with duplicate prevention)
      if (item.availableQuantity === 0 && previousAvailable > 0) {
        PushNotificationService.broadcast(
          NotificationTemplates.OUT_OF_STOCK(item.productName, String(item._id))
        ).catch(err => console.error('[Inventory] Out of stock push error:', err));
      } else if (
        item.availableQuantity <= (item.minimumStockLevel || 5) &&
        previousAvailable > (item.minimumStockLevel || 5)
      ) {
        PushNotificationService.broadcast(
          NotificationTemplates.LOW_STOCK(
            item.productName,
            item.availableQuantity,
            item.minimumStockLevel || 5,
            String(item._id)
          )
        ).catch(err => console.error('[Inventory] Low stock push error:', err));
      }

      if (quantity !== undefined && previousAvailable !== item.availableQuantity) {
        PushNotificationService.sendToRole('ADMIN', {
          type: 'SYSTEM_ALERT',
          title: 'Inventory Updated',
          message: `${item.productName} quantity was updated from ${previousAvailable} to ${item.availableQuantity}.`,
          priority: 'NORMAL',
          data: { url: '/inventory' }
        }).catch(err => console.error('[Inventory] Admin update push error:', err));
      }

      await InventoryController.handleShortage(item);

      await logAudit('UPDATE_INVENTORY', req as any, String(item._id), {
        productName: item.productName,
        newQuantity: item.quantity,
        newStatus: item.status
      });

      res.json({
        success: true,
        message: 'Inventory record updated successfully.',
        data: { item }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new inventory item
   */
  public static async createInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productName, arabicName, quantity, price, expirationDate, minimumStockLevel, drugProductId } = req.body;

      if (!productName || quantity === undefined || price === undefined || !expirationDate) {
        throw new AppError('Missing required fields.', 400, 'VALIDATION_ERROR');
      }

      const item = new PharmacyInventory({
        drugProductId: drugProductId || new mongoose.Types.ObjectId().toString(),
        productName,
        arabicName,
        quantity: Number(quantity),
        price: Number(price),
        expirationDate: new Date(expirationDate),
        minimumStockLevel: Number(minimumStockLevel || 5)
      });

      await item.save();

      await InventoryController.handleShortage(item);

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully.',
        data: { item }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an inventory item
   */
  public static async deleteInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const item = await PharmacyInventory.findByIdAndDelete(id);
      if (!item) {
        throw new AppError('Inventory record not found.', 404, 'INVENTORY_NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Inventory item deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
