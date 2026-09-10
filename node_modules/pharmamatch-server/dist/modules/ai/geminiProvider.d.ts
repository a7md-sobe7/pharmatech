import { IAIProvider, AIResponsePayload } from './aiProvider.js';
export declare class GeminiAIProvider implements IAIProvider {
    private genAI;
    private model;
    constructor();
    processQuery(userQuery: string): Promise<AIResponsePayload>;
}
