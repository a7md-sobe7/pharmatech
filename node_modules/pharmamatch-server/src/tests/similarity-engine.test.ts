import { describe, it, expect } from 'vitest';
import { StrengthNormalizer } from '../utils/strengthNormalizer.js';
import { NormalizationService } from '../modules/ingredients/normalizationService.js';
import { SimilarityEngine } from '../modules/similarity/similarityEngine.js';
import { IDrugProduct } from '../types/index.js';

describe('StrengthNormalizer', () => {
  it('correctly standardizes grams to milligrams', () => {
    const norm = StrengthNormalizer.normalize(0.5, 'g');
    expect(norm.value).toBe(500);
    expect(norm.unit).toBe('mg');
  });

  it('correctly calculates 100% similarity for identical normalized strengths (500mg vs 0.5g)', () => {
    const res = StrengthNormalizer.calculateStrengthSimilarity(500, 'mg', 0.5, 'g');
    expect(res.score).toBe(1.0);
    expect(res.percentage).toBe(100);
  });

  it('calculates proportional similarity for different strengths (500mg vs 250mg)', () => {
    const res = StrengthNormalizer.calculateStrengthSimilarity(500, 'mg', 250, 'mg');
    expect(res.score).toBe(0.5);
    expect(res.percentage).toBe(50);
  });
});

describe('NormalizationService', () => {
  it('normalizes string casing, punctuation, and diacritics', () => {
    const norm = NormalizationService.normalizeString(' Calcium Carbonate (Ca) 500mg ');
    expect(norm).toContain('calcium carbonate ca');
  });

  it('resolves Arabic ingredient name to canonical English equivalent', async () => {
    const res = await NormalizationService.resolveCanonical('كالسيوم');
    expect(res.normalized).toBe('calcium');
  });
});

describe('Deterministic SimilarityEngine Test Cases', () => {
  const sampleCalmag: IDrugProduct = {
    _id: 'prod-calmag',
    productName: 'Calmag Tablet',
    normalizedName: 'calmag tablet',
    brandName: 'Calmag',
    genericName: 'Calcium + Magnesium + Vitamin D3',
    manufacturer: 'Eva Pharma',
    dosageForm: 'Tablet',
    route: 'Oral',
    therapeuticClass: 'Mineral Supplement',
    indications: ['Calcium deficiency'],
    contraindications: ['Hypercalcemia'],
    references: [],
    source: 'DailyMed',
    lastVerifiedAt: new Date(),
    primaryActiveIngredient: {
      name: 'Calcium',
      normalizedName: 'calcium',
      strength: 500,
      unit: 'mg',
      confidence: 'HIGH'
    },
    activeIngredients: [
      { name: 'Calcium', normalizedName: 'calcium', role: 'PRIMARY', strength: 500, unit: 'mg' },
      { name: 'Magnesium', normalizedName: 'magnesium', role: 'SECONDARY', strength: 100, unit: 'mg' },
      { name: 'Vitamin D', normalizedName: 'vitamin d', role: 'SECONDARY', strength: 200, unit: 'IU' }
    ]
  };

  const sampleCalcitron: IDrugProduct = {
    _id: 'prod-calcitron',
    productName: 'Calcitron Capsule',
    normalizedName: 'calcitron capsule',
    brandName: 'Calcitron',
    genericName: 'Calcium + Vitamin D3 + Zinc',
    manufacturer: 'Nerhadou',
    dosageForm: 'Capsule',
    route: 'Oral',
    therapeuticClass: 'Mineral Supplement',
    indications: ['Pregnancy support'],
    contraindications: ['Hypercalcemia'],
    references: [],
    source: 'DailyMed',
    lastVerifiedAt: new Date(),
    primaryActiveIngredient: {
      name: 'Calcium',
      normalizedName: 'calcium',
      strength: 500,
      unit: 'mg',
      confidence: 'HIGH'
    },
    activeIngredients: [
      { name: 'Calcium', normalizedName: 'calcium', role: 'PRIMARY', strength: 500, unit: 'mg' },
      { name: 'Vitamin D', normalizedName: 'vitamin d', role: 'SECONDARY', strength: 400, unit: 'IU' },
      { name: 'Zinc', normalizedName: 'zinc', role: 'SECONDARY', strength: 10, unit: 'mg' }
    ]
  };

  const sampleIbuprofen: IDrugProduct = {
    _id: 'prod-ibuprofen',
    productName: 'Brufen 400mg',
    normalizedName: 'brufen 400mg',
    brandName: 'Brufen',
    genericName: 'Ibuprofen',
    manufacturer: 'Abbott',
    dosageForm: 'Tablet',
    route: 'Oral',
    therapeuticClass: 'NSAID',
    indications: ['Pain'],
    contraindications: ['Ulcer'],
    references: [],
    source: 'DailyMed',
    lastVerifiedAt: new Date(),
    primaryActiveIngredient: {
      name: 'Ibuprofen',
      normalizedName: 'ibuprofen',
      strength: 400,
      unit: 'mg',
      confidence: 'HIGH'
    },
    activeIngredients: [
      { name: 'Ibuprofen', normalizedName: 'ibuprofen', role: 'PRIMARY', strength: 400, unit: 'mg' }
    ]
  };

  // Test Case 1: Same Primary Active Ingredient (Calmag ↔ Calcitron)
  it('Test Case 1: Calmag ↔ Calcitron matches primary ingredient and yields HIGH/VERY_HIGH similarity', async () => {
    const result = await SimilarityEngine.calculateSimilarity(sampleCalmag, sampleCalcitron);
    expect(result.comparison.primaryIngredient.matched).toBe(true);
    expect(result.isSimilar).toBe(true);
    expect(result.percentageScore).toBeGreaterThanOrEqual(75);
    expect(result.reasons).toEqual(expect.arrayContaining([expect.stringContaining('Same primary active ingredient')]));
  });

  // Test Case 2: Different Primary Active Ingredient (Calmag ↔ Ibuprofen)
  it('Test Case 2: Calmag ↔ Ibuprofen has different primary ingredient and is NOT similar', async () => {
    const result = await SimilarityEngine.calculateSimilarity(sampleCalmag, sampleIbuprofen);
    expect(result.comparison.primaryIngredient.matched).toBe(false);
    expect(result.isSimilar).toBe(false);
    expect(result.percentageScore).toBeLessThan(40);
  });

  // Test Case 3: Secondary Ingredient Overlap Analysis
  it('Test Case 3: Identifies shared secondary ingredients and distinct formulation components', async () => {
    const result = await SimilarityEngine.calculateSimilarity(sampleCalmag, sampleCalcitron);
    expect(result.comparison.secondaryIngredients.overlap).toContain('vitamin d');
    expect(result.comparison.secondaryIngredients.different).toContain('magnesium');
    expect(result.comparison.secondaryIngredients.different).toContain('zinc');
  });
});
