import { Config } from "./Config";
import { setProcessActive } from "./App";
import { marked } from "./include/marked";
import { addMessageElement, getCurrentSession } from "./ChatSessions";

export type MessageType = 'user' | 'system' | 'assistant';

export interface Message {
    role: MessageType;
    content: string;
}

export type ModelType = 'gpt-4o' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo-1106';

export interface TextCompletionConfig {
    messages: Message[];
    model: ModelType;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    tools?: ToolFunction;
}

export interface ToolParameter {
    type: 'object' | 'string' | 'number';
    description: string;
}

/**
 * Interface representing a GPT(3.5+) tool.
 * This can be used to call external API's.
 */
export interface ToolFunction {
    name: string;
    description?: string;
    parameters?: {};

}

/**
 * Tool interface
 */
export interface Tool {
    /**
     * The type of tool to use. Currently only 'function' is supported
     */
    type: 'function';

    /**
     * The functions associated with this tool.
     */
    function: ToolFunction;
}

const url = Config.baseUrl + 'chat/completions';

/**
 * Generate a response to the given messages using the specified model.
 * This function returns a promise that resolves to the generated response
 * once the response is complete.
 *
 * @param config The configuration object for the response generation.
 */
export async function completeCfg(config: TextCompletionConfig): Promise<Object> {
    setProcessActive(true);
    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + Config.apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
        .then(response => response.json())
        .catch(error => "Sorry, something went wrong.")
        .finally(() => setProcessActive(false));
}

/**
 * Generic function for retrieving a chat-completion.
 * This uses standard configuration found in `Config.ts`
 * @param input The prompt provided.
 */
export async function complete(input: string): Promise<string>
{
    return completeCfg({
        ...Config.TextCompletion.defaultConfiguration,
        messages: [ ...getCurrentSession().messages, { role: 'user', content: input } ]
    }).then(response => response['choices'][0]['message']['content']);
}

