/**
 * Strength and Unit Normalizer
 * Standardizes units into canonical base units (e.g., mg for mass, ml for volume, IU for international units)
 */
export class StrengthNormalizer {
    /**
     * Parse and normalize strength from numeric value and unit
     */
    static normalize(value, unit) {
        if (value === undefined || value === null || isNaN(value)) {
            return { value: 0, unit: 'unknown', rawString: 'N/A' };
        }
        const cleanUnit = (unit || '').trim().toLowerCase();
        const rawString = `${value} ${unit || ''}`.trim();
        // Unit conversion to standardized base units:
        // Standard mass base: mg
        if (cleanUnit === 'g' || cleanUnit === 'gram' || cleanUnit === 'grams') {
            return { value: value * 1000, unit: 'mg', rawString };
        }
        if (cleanUnit === 'mcg' || cleanUnit === 'microgram' || cleanUnit === 'ug' || cleanUnit === 'µg') {
            return { value: value / 1000, unit: 'mg', rawString };
        }
        if (cleanUnit === 'mg' || cleanUnit === 'milligram' || cleanUnit === 'milligrams') {
            return { value: value, unit: 'mg', rawString };
        }
        // Standard volume base: ml
        if (cleanUnit === 'l' || cleanUnit === 'liter' || cleanUnit === 'liters') {
            return { value: value * 1000, unit: 'ml', rawString };
        }
        if (cleanUnit === 'ml' || cleanUnit === 'milliliter') {
            return { value: value, unit: 'ml', rawString };
        }
        // Standard IU / % / others
        if (cleanUnit === 'iu' || cleanUnit === 'international units') {
            return { value: value, unit: 'iu', rawString };
        }
        if (cleanUnit === '%' || cleanUnit === 'percent') {
            return { value: value, unit: '%', rawString };
        }
        return { value: value, unit: cleanUnit || 'units', rawString };
    }
    /**
     * Compare two strengths and return a similarity score between 0.0 and 1.0
     */
    static calculateStrengthSimilarity(targetVal, targetUnit, candidateVal, candidateUnit) {
        const targetNorm = this.normalize(targetVal, targetUnit);
        const candNorm = this.normalize(candidateVal, candidateUnit);
        // If both missing strength
        if (targetNorm.value === 0 && candNorm.value === 0) {
            return { score: 1.0, percentage: 100, explanation: 'Both products have unspecified strength.' };
        }
        // Incompatible units
        if (targetNorm.unit !== candNorm.unit && targetNorm.unit !== 'unknown' && candNorm.unit !== 'unknown') {
            return {
                score: 0.0,
                percentage: 0,
                explanation: `Different strength units (${targetNorm.rawString} vs ${candNorm.rawString}).`
            };
        }
        const val1 = targetNorm.value;
        const val2 = candNorm.value;
        if (val1 === val2) {
            return {
                score: 1.0,
                percentage: 100,
                explanation: `Identical strength (${targetNorm.rawString}).`
            };
        }
        const maxVal = Math.max(val1, val2);
        if (maxVal === 0)
            return { score: 1.0, percentage: 100, explanation: 'Matching strengths.' };
        const ratio = Math.min(val1, val2) / maxVal;
        const percentage = Math.round(ratio * 100);
        return {
            score: ratio,
            percentage,
            explanation: `Strength differs: ${targetNorm.rawString} vs ${candNorm.rawString} (${percentage}% match).`
        };
    }
}
