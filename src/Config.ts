import { TranscriptionConfig } from "./Transcriptions";
import { TextCompletionConfig } from "./TextCompletion";
import { SpeechGenerationConfig } from "./SpeechGeneration";

export const Config = {
    baseUrl: 'https://api.openai.com/v1/',
    organizationKey: 'org-0zrD6YgPbJ73YRfBynqNqobH',
    apiKey: localStorage.getItem('openai-key'),
    summarizationPrompt: 'Summarize the following text in max three words:',
    modelIdentity: {
        modelName: 'Nova',
        initialPrompt: 'You are responding as human-like as possible. This means that you cannot give answers that are too long.\n' +
            `Try to answer as short as possible. Your name is Nova, you are a virtual female assistant. You are designed to respond to user speech.` +
            'For extra information, the current date is ' + new Date().toLocaleDateString() + ' in DD/MM/YY format and the time is ' + new Date().toLocaleTimeString() + '.',
    },

    Speech: {
        defaultConfiguration: {
            model: 'tts-1',
            voice: 'nova',
            speed: 1.0
        } as SpeechGenerationConfig
    },
    Transcription: {
        defaultConfiguration: {
            model: 'whisper-1',
            language: 'lv',//'en',
        } as TranscriptionConfig,
    },
    TextCompletion: {
        defaultConfiguration: {
            model: 'gpt-3.5-turbo',//'gpt-4o',
            max_tokens: 1024,
            temperature: 0.5,
        } as TextCompletionConfig
    },
    /**
     * Function for validating an API key.
     * This function attempts to make a request to the API using the given key.
     * If the request is successful, the key is valid.
     * @param key The API key to validate.
     * @returns A boolean indicating whether the key is valid.
     */
    validateApiKey: async function (key: String): Promise<('valid' | 'invalid' | 'error')> {
        if ( key === undefined || key === null || key === '' )
            return 'invalid';
        console.log("Info - Validating OpenAI API key");
        return await fetch(this.baseUrl + 'models', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + key }
        })
            // Request status checking
            .then(response => {
                if ( response.status != 200 )
                    return 'error';
                return response.json()
            })
            // Key validation
            .then(json => {
                if ( json[ 'error' ] )
                    return 'invalid';
                return 'valid';
            })
            .catch(_ => 'error');
    }
}