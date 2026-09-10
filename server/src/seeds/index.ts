import mongoose from 'mongoose';
import { DrugProduct } from '../models/DrugProduct.js';
import { PharmacyInventory } from '../models/PharmacyInventory.js';
import { Ingredient } from '../models/Ingredient.js';
import { User } from '../models/User.js';
import { SimilarityConfig } from '../models/SimilarityConfig.js';
import { canonicalIngredientsSeed, drugProductsSeed } from './seedData.js';
import { SimilarityEngine } from '../modules/similarity/similarityEngine.js';

export async function seedDatabaseIfEmpty(): Promise<void> {
  const productCount = await DrugProduct.countDocuments();
  if (productCount > 0) {
    console.log(`Database already populated (${productCount} products). Skipping seed.`);
    return;
  }

  console.log('Seeding initial clinical drug data, inventory, and users...');
  await seedDatabase();
}

export async function seedDatabase(): Promise<void> {
  // 1. Seed Ingredients
  await Ingredient.deleteMany({});
  await Ingredient.insertMany(canonicalIngredientsSeed);
  console.log(`✅ Seeded ${canonicalIngredientsSeed.length} canonical active ingredients.`);

  // 2. Seed Drug Products
  await DrugProduct.deleteMany({});
  const insertedProducts = await DrugProduct.insertMany(drugProductsSeed);
  console.log(`✅ Seeded ${insertedProducts.length} clinical drug products.`);

  // 3. Seed Pharmacy Inventory with specific availability and expiration test cases
  await PharmacyInventory.deleteMany({});
  
  const inventoryItems: any[] = [];
  const futureExpiry1 = new Date('2027-12-31');
  const futureExpiry2 = new Date('2028-06-30');
  const pastExpiry = new Date('2024-05-15'); // Expired batch

  for (const prod of insertedProducts) {
    const pName = prod.productName.toLowerCase();

    // Specific business test case mappings:
    if (pName.includes('calmag')) {
      // Out of Stock requested product
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        price: 45.0,
        currency: 'EGP',
        batchNumber: 'CAL-2024-X0',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf A-12',
        minimumStockLevel: 5,
        status: 'OUT_OF_STOCK'
      });
    } else if (pName.includes('calcitron')) {
      // In stock candidate for Calmag
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 18,
        reservedQuantity: 0,
        availableQuantity: 18,
        price: 85.0,
        currency: 'EGP',
        batchNumber: 'CTR-2026-B1',
        expirationDate: futureExpiry2,
        storageLocation: 'Shelf A-14',
        minimumStockLevel: 5,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('osteocare')) {
      // In stock candidate for Calmag
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 24,
        reservedQuantity: 0,
        availableQuantity: 24,
        price: 95.0,
        currency: 'EGP',
        batchNumber: 'OST-2026-C3',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf A-15',
        minimumStockLevel: 5,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('caltrate')) {
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 12,
        reservedQuantity: 0,
        availableQuantity: 12,
        price: 120.0,
        currency: 'EGP',
        batchNumber: 'CLT-2026-D4',
        expirationDate: futureExpiry2,
        storageLocation: 'Shelf A-16',
        minimumStockLevel: 4,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('sandoz effervescent')) {
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 8,
        reservedQuantity: 0,
        availableQuantity: 8,
        price: 70.0,
        currency: 'EGP',
        batchNumber: 'SAN-2026-E5',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf A-17',
        minimumStockLevel: 3,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('augmentin')) {
      // Out of stock requested antibiotic
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        price: 135.0,
        currency: 'EGP',
        batchNumber: 'AUG-2024-Z9',
        expirationDate: futureExpiry1,
        storageLocation: 'Fridge / Shelf B-01',
        minimumStockLevel: 10,
        status: 'OUT_OF_STOCK'
      });
    } else if (pName.includes('curam')) {
      // In stock alternative
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 35,
        reservedQuantity: 2,
        availableQuantity: 33,
        price: 115.0,
        currency: 'EGP',
        batchNumber: 'CUR-2026-F1',
        expirationDate: futureExpiry2,
        storageLocation: 'Shelf B-02',
        minimumStockLevel: 8,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('megamox')) {
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 14,
        reservedQuantity: 0,
        availableQuantity: 14,
        price: 105.0,
        currency: 'EGP',
        batchNumber: 'MEG-2026-G2',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf B-03',
        minimumStockLevel: 5,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('hibiotic')) {
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 20,
        reservedQuantity: 0,
        availableQuantity: 20,
        price: 110.0,
        currency: 'EGP',
        batchNumber: 'HIB-2026-H3',
        expirationDate: futureExpiry2,
        storageLocation: 'Shelf B-04',
        minimumStockLevel: 5,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('panadol extra')) {
      // Out of stock
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        price: 40.0,
        currency: 'EGP',
        batchNumber: 'PAN-2024-K1',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf C-01',
        minimumStockLevel: 10,
        status: 'OUT_OF_STOCK'
      });
    } else if (pName.includes('cetal extra')) {
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 50,
        reservedQuantity: 0,
        availableQuantity: 50,
        price: 25.0,
        currency: 'EGP',
        batchNumber: 'CET-2026-M2',
        expirationDate: futureExpiry2,
        storageLocation: 'Shelf C-02',
        minimumStockLevel: 10,
        status: 'AVAILABLE'
      });
    } else if (pName.includes('concor 5mg')) {
      // Out of stock
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        price: 60.0,
        currency: 'EGP',
        batchNumber: 'CON-2024-P1',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf D-01',
        minimumStockLevel: 5,
        status: 'OUT_OF_STOCK'
      });
    } else if (pName.includes('cataflam')) {
      // Out of stock
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        price: 55.0,
        currency: 'EGP',
        batchNumber: 'CAT-2024-Q1',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf E-01',
        minimumStockLevel: 5,
        status: 'OUT_OF_STOCK'
      });
    } else if (pName.includes('controloc')) {
      // Out of stock
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        price: 110.0,
        currency: 'EGP',
        batchNumber: 'CNT-2024-R1',
        expirationDate: futureExpiry1,
        storageLocation: 'Shelf G-01',
        minimumStockLevel: 5,
        status: 'OUT_OF_STOCK'
      });
    } else {
      // Standard available stock
      inventoryItems.push({
        pharmacyId: 'main-pharmacy',
        drugProductId: String(prod._id),
        productName: prod.productName,
        arabicName: prod.arabicName,
        quantity: 25,
        reservedQuantity: 0,
        availableQuantity: 25,
        price: 50.0,
        currency: 'EGP',
        batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        expirationDate: futureExpiry2,
        storageLocation: 'General Storage',
        minimumStockLevel: 5,
        status: 'AVAILABLE'
      });
    }
  }

  // Insert a purposefully EXPIRED batch to verify safety filtering
  if (insertedProducts.length > 0) {
    inventoryItems.push({
      pharmacyId: 'main-pharmacy',
      drugProductId: String(insertedProducts[0]._id),
      productName: `${insertedProducts[0].productName} (Old Batch)`,
      arabicName: insertedProducts[0].arabicName,
      quantity: 15,
      reservedQuantity: 0,
      availableQuantity: 0,
      price: 40.0,
      currency: 'EGP',
      batchNumber: 'EXP-BATCH-2024',
      expirationDate: pastExpiry,
      storageLocation: 'Quarantine Rack Q-1',
      minimumStockLevel: 0,
      status: 'EXPIRED'
    });
  }

  await PharmacyInventory.insertMany(inventoryItems);
  console.log(`✅ Seeded ${inventoryItems.length} pharmacy inventory records.`);

  // 4. Seed Default Users
  await User.deleteMany({});
  const admin = new User({
    name: 'Chief Admin',
    email: 'admin@pharmamatch.ai',
    password: 'Admin@123456Password',
    role: 'ADMIN',
    licenseNumber: 'LIC-ADM-9901',
    pharmacyName: 'PharmaMatch Central'
  });
  await admin.save();

  const pharmacist = new User({
    name: 'Dr. Sarah Ahmed, PharmD',
    email: 'pharmacist@pharmamatch.ai',
    password: 'Pharma@123456Password',
    role: 'PHARMACIST',
    licenseNumber: 'LIC-PH-4421',
    pharmacyName: 'Al-Shifa Community Pharmacy'
  });
  await pharmacist.save();
  console.log('✅ Seeded default users (admin & pharmacist).');

  // 5. Seed Similarity Configuration
  await SimilarityConfig.deleteMany({});
  await SimilarityConfig.create(SimilarityEngine.DEFAULT_CONFIG);
  console.log('✅ Seeded default similarity configuration.');
}
