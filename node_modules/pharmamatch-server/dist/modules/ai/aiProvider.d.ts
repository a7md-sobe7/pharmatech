export interface ToolCallRecord {
    toolName: string;
    arguments: Record<string, any>;
    result: any;
}
export interface AIResponsePayload {
    intent: string;
    language: 'en' | 'ar' | 'mixed';
    query: string;
    toolCalls: ToolCallRecord[];
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
export interface IAIProvider {
    processQuery(userQuery: string, context?: any): Promise<AIResponsePayload>;
}
export declare class MockDeterministicProvider implements IAIProvider {
    processQuery(userQuery: string): Promise<AIResponsePayload>;
}
