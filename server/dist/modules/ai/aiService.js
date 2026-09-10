import { MockDeterministicProvider } from './aiProvider.js';
import { GeminiAIProvider } from './geminiProvider.js';
import { logAudit } from '../../middleware/audit.js';
export class AIService {
    static provider = null;
    static setProvider(newProvider) {
        this.provider = newProvider;
    }
    static getProvider() {
        if (!this.provider) {
            this.provider = process.env.AI_PROVIDER === 'gemini'
                ? new GeminiAIProvider()
                : new MockDeterministicProvider();
        }
        return this.provider;
    }
    static async query(userQuery, req) {
        const startTime = Date.now();
        const activeProvider = this.getProvider();
        const result = await activeProvider.processQuery(userQuery);
        const duration = Date.now() - startTime;
        if (req) {
            await logAudit('AI_QUERY', req, userQuery, {
                intent: result.intent,
                toolCallsCount: result.toolCalls.length,
                candidatesFound: result.similarProductsFound.length,
                durationMs: duration
            });
        }
        return result;
    }
}
