import { IDrugProduct, ISimilarityConfig, ISimilarityResult, SimilarityLevel } from '../../types/index.js';
export declare class SimilarityEngine {
    static DEFAULT_CONFIG: ISimilarityConfig;
    /**
     * Fetch active similarity configuration
     */
    static getActiveConfig(): Promise<ISimilarityConfig>;
    /**
     * Dosage Form Compatibility Evaluation
     */
    static evaluateDosageForm(targetForm: string, candidateForm: string): {
        score: number;
        matched: boolean;
        explanation: string;
    };
    /**
     * Compare secondary active ingredients using Jaccard Similarity
     */
    static evaluateSecondaryIngredients(targetProduct: IDrugProduct, candidateProduct: IDrugProduct): {
        score: number;
        targetList: string[];
        candidateList: string[];
        overlap: string[];
        different: string[];
        explanation: string;
    };
    /**
     * Determine similarity classification level from percentage score
     */
    static getSimilarityLevel(score: number, thresholds: ISimilarityConfig['thresholds']): SimilarityLevel;
    /**
     * Calculate deterministic similarity between target product and candidate product
     */
    static calculateSimilarity(targetProduct: IDrugProduct, candidateProduct: IDrugProduct, customConfig?: ISimilarityConfig): Promise<ISimilarityResult>;
}
