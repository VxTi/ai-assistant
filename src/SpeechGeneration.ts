import { Config } from './Config';
import { playAudio } from "./Audio";
import { setProcessActive } from "./App";

export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type SpeechModelType = 'tts-1' | 'tts-1-hd';

const url = Config.baseUrl + 'audio/speech';

export interface SpeechGenerationConfig {
    input: string;
    voice: VoiceType;
    model?: SpeechModelType;
    speed?: number;
}

/**
 * Generate speech from the given input text using the specified voice and model.
 *
 * @param config The configuration object for the speech generation.
 * @returns A promise that resolves to a boolean indicating whether the speech was generated successfully.
 */
export async function generateSpeechCfg(config: SpeechGenerationConfig): Promise<boolean> {
    // Send a request to the API
    setProcessActive(true);
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + Config.apiKey
        },
        body: JSON.stringify(config)
    })
        .then(response => response.blob())
        .then(blob => playAudio(blob))
        .catch(_ => false)
        .finally(() => setProcessActive(false));
}

export async function generateSpeech(input: string) {
    return generateSpeechCfg({
        ...Config.Speech.defaultConfiguration,
        input: input
    });
}
