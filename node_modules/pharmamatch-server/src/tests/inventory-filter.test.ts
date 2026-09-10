import { describe, it, expect } from 'vitest';
import { IPharmacyInventory } from '../types/index.js';

describe('Inventory Safety Filtering Rules', () => {
  const availableCandidate: IPharmacyInventory = {
    pharmacyId: 'main-pharmacy',
    drugProductId: 'prod-calcitron',
    productName: 'Calcitron Capsule',
    quantity: 18,
    reservedQuantity: 0,
    availableQuantity: 18,
    price: 85,
    currency: 'EGP',
    batchNumber: 'CTR-2026-B1',
    expirationDate: new Date('2028-12-31'),
    storageLocation: 'Shelf A-14',
    minimumStockLevel: 5,
    status: 'AVAILABLE'
  };

  const outOfStockCandidate: IPharmacyInventory = {
    pharmacyId: 'main-pharmacy',
    drugProductId: 'prod-out',
    productName: 'Out of Stock Drug',
    quantity: 0,
    reservedQuantity: 0,
    availableQuantity: 0,
    price: 50,
    currency: 'EGP',
    batchNumber: 'OOS-2024-X',
    expirationDate: new Date('2028-12-31'),
    storageLocation: 'Shelf A-15',
    minimumStockLevel: 5,
    status: 'OUT_OF_STOCK'
  };

  const expiredCandidate: IPharmacyInventory = {
    pharmacyId: 'main-pharmacy',
    drugProductId: 'prod-exp',
    productName: 'Expired Drug Batch',
    quantity: 10,
    reservedQuantity: 0,
    availableQuantity: 10,
    price: 50,
    currency: 'EGP',
    batchNumber: 'EXP-2023',
    expirationDate: new Date('2023-01-01'), // past date
    storageLocation: 'Quarantine Rack',
    minimumStockLevel: 0,
    status: 'EXPIRED'
  };

  const isEligibleAsAvailableAlternative = (inv: IPharmacyInventory): boolean => {
    const now = new Date();
    const isExpired = inv.expirationDate && new Date(inv.expirationDate) <= now;
    return (
      inv.availableQuantity > 0 &&
      inv.status !== 'OUT_OF_STOCK' &&
      inv.status !== 'EXPIRED' &&
      inv.status !== 'DISCONTINUED' &&
      !isExpired
    );
  };

  // Test Case 4: Candidate is similar but out of stock -> Excluded
  it('Test Case 4: Out-of-stock candidates are strictly excluded from available recommendations', () => {
    expect(isEligibleAsAvailableAlternative(outOfStockCandidate)).toBe(false);
  });

  // Test Case 5: Candidate is expired -> Excluded
  it('Test Case 5: Expired batches are strictly excluded from available recommendations', () => {
    expect(isEligibleAsAvailableAlternative(expiredCandidate)).toBe(false);
  });

  it('In-stock valid candidates pass the availability filter', () => {
    expect(isEligibleAsAvailableAlternative(availableCandidate)).toBe(true);
  });
});
