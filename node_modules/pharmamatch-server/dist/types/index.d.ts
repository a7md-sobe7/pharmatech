export type IngredientRole = 'PRIMARY' | 'SECONDARY' | 'SUPPORTING' | 'UNKNOWN';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type UserRole = 'ADMIN' | 'PHARMACIST' | 'STAFF';
export type InventoryStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'DISCONTINUED';
export type SimilarityLevel = 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'NOT_SIMILAR';
export interface IActiveIngredient {
    ingredientId?: string;
    name: string;
    normalizedName: string;
    arabicName?: string;
    role: IngredientRole;
    strength?: number;
    unit?: string;
    normalizedStrengthValue?: number;
    normalizedStrengthUnit?: string;
}
export interface IPrimaryActiveIngredient {
    ingredientId?: string;
    name: string;
    normalizedName: string;
    arabicName?: string;
    strength?: number;
    unit?: string;
    normalizedStrengthValue?: number;
    normalizedStrengthUnit?: string;
    confidence: ConfidenceLevel;
    source?: string;
}
export interface IDrugProduct {
    _id?: string;
    productName: string;
    normalizedName: string;
    arabicName?: string;
    brandName: string;
    genericName: string;
    manufacturer: string;
    activeIngredients: IActiveIngredient[];
    primaryActiveIngredient: IPrimaryActiveIngredient;
    dosageForm: string;
    dosageFormCategory?: string;
    route: string;
    therapeuticClass: string;
    indications: string[];
    contraindications: string[];
    interactions?: string[];
    references: {
        title: string;
        source: string;
        url?: string;
    }[];
    source: string;
    sourceUrl?: string;
    lastVerifiedAt: Date;
    referencePrice?: number;
    referencePriceCurrency?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IPharmacyInventory {
    _id?: string;
    pharmacyId: string;
    drugProductId: string;
    productName: string;
    arabicName?: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    price: number;
    currency: string;
    batchNumber: string;
    expirationDate: Date;
    storageLocation: string;
    minimumStockLevel: number;
    status: InventoryStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IIngredientCanonical {
    _id?: string;
    canonicalName: string;
    normalizedName: string;
    arabicName?: string;
    aliases: string[];
    synonyms: string[];
    chemicalName?: string;
    therapeuticClass?: string;
    source?: string;
}
export interface ISimilarityConfig {
    _id?: string;
    primaryIngredientWeight: number;
    strengthWeight: number;
    dosageFormWeight: number;
    secondaryIngredientWeight: number;
    thresholds: {
        veryHigh: number;
        high: number;
        moderate: number;
        low: number;
    };
    version: string;
    updatedBy?: string;
    updatedAt?: Date;
}
export interface ISimilarityResult {
    targetProductId: string;
    candidateProductId: string;
    candidateProduct: IDrugProduct;
    inventory?: IPharmacyInventory;
    isSimilar: boolean;
    similarityLevel: SimilarityLevel;
    score: number;
    percentageScore: number;
    componentScores: {
        primaryIngredientScore: number;
        strengthScore: number;
        dosageFormScore: number;
        secondaryIngredientScore: number;
    };
    reasons: string[];
    warnings: string[];
    comparison: {
        primaryIngredient: {
            target: string;
            candidate: string;
            matched: boolean;
        };
        strength: {
            target: string;
            candidate: string;
            matchPercentage: number;
        };
        dosageForm: {
            target: string;
            candidate: string;
            matched: boolean;
        };
        secondaryIngredients: {
            target: string[];
            candidate: string[];
            overlap: string[];
            different: string[];
        };
    };
    requiresPharmacistReview: boolean;
}
export interface IUser {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    licenseNumber?: string;
    pharmacyName?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
}
export interface IAuditLog {
    _id?: string;
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    target?: string;
    metadata: Record<string, any>;
    resultStatus: 'SUCCESS' | 'WARNING' | 'ERROR';
    ipAddress?: string;
    createdAt?: Date;
}
export interface IPharmacistFeedback {
    _id?: string;
    pharmacistId: string;
    pharmacistName: string;
    targetProductId: string;
    targetProductName: string;
    candidateProductId: string;
    candidateProductName: string;
    calculatedScore: number;
    similarityLevel: SimilarityLevel;
    rating: 'USEFUL' | 'NOT_USEFUL' | 'NOT_CLINICALLY_SUITABLE';
    notes?: string;
    createdAt?: Date;
}
