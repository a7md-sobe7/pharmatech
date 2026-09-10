export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required: string[];
    };
}
export declare const AI_TOOL_DEFINITIONS: ToolDefinition[];
export declare class AIToolsExecutor {
    static executeTool(toolName: string, args: Record<string, any>): Promise<any>;
}
