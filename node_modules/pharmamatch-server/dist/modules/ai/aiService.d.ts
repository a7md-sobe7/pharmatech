import { IAIProvider, AIResponsePayload } from './aiProvider.js';
export declare class AIService {
    private static provider;
    static setProvider(newProvider: IAIProvider): void;
    private static getProvider;
    static query(userQuery: string, req?: any): Promise<AIResponsePayload>;
}
