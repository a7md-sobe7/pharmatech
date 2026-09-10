export declare class NormalizationService {
    private static fallbackAliases;
    /**
     * Normalize an ingredient name string deterministically
     */
    static normalizeString(input: string): string;
    /**
     * Resolves canonical ingredient name using deterministic alias map and DB
     */
    static resolveCanonical(rawName: string): Promise<{
        canonical: string;
        normalized: string;
    }>;
    /**
     * Normalize product name (removes extra dosages and symbols for matching)
     */
    static normalizeProductName(name: string): string;
}
