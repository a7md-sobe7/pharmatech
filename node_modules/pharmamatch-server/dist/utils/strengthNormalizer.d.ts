/**
 * Strength and Unit Normalizer
 * Standardizes units into canonical base units (e.g., mg for mass, ml for volume, IU for international units)
 */
export interface NormalizedStrength {
    value: number;
    unit: string;
    rawString: string;
}
export declare class StrengthNormalizer {
    /**
     * Parse and normalize strength from numeric value and unit
     */
    static normalize(value?: number, unit?: string): NormalizedStrength;
    /**
     * Compare two strengths and return a similarity score between 0.0 and 1.0
     */
    static calculateStrengthSimilarity(targetVal?: number, targetUnit?: string, candidateVal?: number, candidateUnit?: string): {
        score: number;
        percentage: number;
        explanation: string;
    };
}
