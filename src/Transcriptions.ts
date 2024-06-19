import { Config } from "./Config";
import { setProcessActive } from "./App";

export type TranscriptionModel = 'whisper-1';

/**
 * Configuration object for the transcription.
 */
export interface TranscriptionConfig {

    language?: string;
    file: Blob;
    fileName: string;
    model: TranscriptionModel;
    temperature?: number;
}

const url = Config.baseUrl + 'audio/transcriptions';


/**
 * Transcribe the given audio file using the specified model.
 * This function returns a promise that resolves to the transcribed text
 * once the transcription is complete.
 *
 * @param config The configuration object for the transcription.
 */
export function transcribe(config: TranscriptionConfig): Promise<string> {

    const formData = new FormData();
    formData.append('file', config.file, config.fileName);
    formData.append('model', config.model);
    if (config.language) {
        formData.append('language', config.language);
    }
    if (config.temperature) {
        formData.append('temperature', config.temperature.toString());
    }

    setProcessActive(true)
    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + Config.apiKey
        },
        body: formData
    })
        .then(response => response.json())
        .then(json => json.text)
        .catch(error => "Sorry, something went wrong with the transcription.")
        .finally(() => setProcessActive(false));
}