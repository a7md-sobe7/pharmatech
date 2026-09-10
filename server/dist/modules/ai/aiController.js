import { AIService } from './aiService.js';
import { AI_TOOL_DEFINITIONS } from './aiTools.js';
import { AppError } from '../../middleware/errorHandler.js';
export class AIController {
    /**
     * Process Natural Language Query with Tool Execution Trace
     */
    static async processQuery(req, res, next) {
        try {
            const { query } = req.body;
            if (!query || typeof query !== 'string' || query.trim() === '') {
                throw new AppError('Query text is required.', 400, 'VALIDATION_ERROR');
            }
            const result = await AIService.query(query, req);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get List of Registered AI Tools and Schemas
     */
    static async getTools(req, res, next) {
        try {
            res.json({
                success: true,
                data: {
                    tools: AI_TOOL_DEFINITIONS
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
