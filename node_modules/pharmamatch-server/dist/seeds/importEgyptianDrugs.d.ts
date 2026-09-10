/**
 * importEgyptianDrugs.ts
 * One-time import of all 25,095 Egyptian drugs from reference database into MongoDB Atlas.
 * Run with: npm run import-drugs --workspace=server
 *
 * Maps CSV fields:
 *   commercial_name_en  → productName, brandName
 *   commercial_name_ar  → arabicName
 *   scientific_name     → genericName, primaryActiveIngredient, activeIngredients
 *   manufacturer        → manufacturer
 *   drug_class          → therapeuticClass
 *   route               → route, dosageForm, dosageFormCategory
 *   price_egp           → referencePrice
 */
export {};
