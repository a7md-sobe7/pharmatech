export type UserRole = 'ADMIN' | 'user' | 'STAFF' | 'MORNING_SHIFT' | 'NIGHT_SHIFT';
export type InventoryStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'DISCONTINUED';
export type SimilarityLevel = 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'NOT_SIMILAR';

export interface IActiveIngredient {
  name: string;
  normalizedName: string;
  arabicName?: string;
  role: 'PRIMARY' | 'SECONDARY' | 'SUPPORTING' | 'UNKNOWN';
  strength?: number;
  unit?: string;
  normalizedStrengthValue?: number;
  normalizedStrengthUnit?: string;
}

export interface IPrimaryActiveIngredient {
  name: string;
  normalizedName: string;
  arabicName?: string;
  strength?: number;
  unit?: string;
  normalizedStrengthValue?: number;
  normalizedStrengthUnit?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  source?: string;
}

export interface IDrugProduct {
  _id: string;
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
  lastVerifiedAt: string;
  inventory?: IPharmacyInventory;
}

export interface IPharmacyInventory {
  _id: string;
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
  expirationDate: string;
  storageLocation: string;
  minimumStockLevel: number;
  status: InventoryStatus;
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

export interface ISimilarityConfig {
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
}

export interface IAuditLog {
  _id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  target?: string;
  metadata: Record<string, any>;
  resultStatus: 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  licenseNumber?: string;
  pharmacyName?: string;
}

export interface AIResponsePayload {
  intent: string;
  language: 'en' | 'ar' | 'mixed';
  query: string;
  toolCalls: {
    toolName: string;
    arguments: Record<string, any>;
    result: any;
  }[];
  targetProduct?: {
    id: string;
    name: string;
    arabicName?: string;
    inventoryStatus: string;
    availableQuantity: number;
    primaryIngredient: string;
  };
  similarProductsFound: any[];
  naturalResponse: string;
  safetyDisclaimer: string;
  requiresPharmacistReview: boolean;
}

export type NotificationType = 
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'EXPIRY_WARNING'
  | 'SALE'
  | 'ADMIN_ALERT'
  | 'SYSTEM_ALERT'
  | 'NEW_USER'
  | 'SHIFT_ALERT';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface INotification {
  _id: string;
  userId?: string;
  targetRole?: UserRole | 'ALL';
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    url?: string;
    medicineId?: string;
    medicineName?: string;
    batchNumber?: string;
    currentStock?: number;
    minimumStock?: number;
    daysLeft?: number;
    [key: string]: any;
  };
  priority: NotificationPriority;
  isRead: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface INotificationPreference {
  _id?: string;
  userId: string;
  lowStock: boolean;
  outOfStock: boolean;
  expiry: boolean;
  sales: boolean;
  adminAlerts: boolean;
  shiftAlerts: boolean;
  systemAlerts: boolean;
  enabledAll: boolean;
  createdAt?: string;
  updatedAt?: string;
}

