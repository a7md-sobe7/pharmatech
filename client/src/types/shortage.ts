export type ShortageStatus = 'PENDING' | 'ORDERED' | 'RESOLVED';

export interface IShortage {
  _id: string;
  medicineName: string;
  medicineNameAr?: string;
  concentration?: string;
  scientificName?: string;
  manufacturer?: string;
  drugClass?: string;
  currentQuantity: number;
  neededQuantity: number;
  status: ShortageStatus;
  notes?: string;
  addedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IShortageStats {
  total: number;
  pending: number;
  ordered: number;
  resolved: number;
}

/** A single entry from the Egyptian drugs reference database */
export interface IDrugReference {
  commercial_name_en: string;
  commercial_name_ar: string;
  scientific_name: string;
  manufacturer: string;
  drug_class: string;
  route: string;
  price_egp: number;
}
