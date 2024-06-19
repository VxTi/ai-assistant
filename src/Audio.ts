import { transcribe } from "./Transcriptions";
import { completeCfg, Message } from "./TextCompletion";
import { generateSpeechCfg } from "./SpeechGeneration";
import { setProcessActive, voiceIndicatorsCount } from "./App";
import { getCurrentSession } from "./ChatSessions";

let recording = false;
let microphoneStatus: 'not-allowed' | 'allowed' | 'unknown' = 'unknown';

const audioCtx: AudioContext = new (window[ 'AudioContext' ] || window[ 'webkitAudioContext' ])();

/*
 * FFT Audio Analyser.
 * This analyser is used to generate the audio spectrogram.
 */
const audioAnalyser: AnalyserNode = audioCtx.createAnalyser();
audioAnalyser.fftSize = 1 << 10; // 2048
const bufferLength = audioAnalyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

const maxAudioBytes = 1024 * 1024 * 25; // 25 MB

let mediaRecorder: MediaRecorder = null;

export function isRecording() {
    return recording;
}

export function ensureMicrophoneAccess() {

    return new Promise(async (resolve, reject) => {
        if ( microphoneStatus === 'unknown' ) {

            const devices = await navigator.mediaDevices.enumerateDevices();
            const deviceId = devices.find(device => {
                return device.kind === 'audioinput'
            })?.deviceId;

            window.navigator.mediaDevices
                .getUserMedia({ audio: (deviceId ? { deviceId: { exact: deviceId } } : true) })
                .then(mediaStream => {
                    mediaRecorder = new MediaRecorder(mediaStream, {
                        audioBitsPerSecond: 16000
                    });
                    microphoneStatus = 'allowed';
                    resolve(void 0);
                })
                .catch(error => {
                    microphoneStatus = 'not-allowed';
                    reject(error);
                })

        }
        else if ( microphoneStatus === 'allowed' ) {
            resolve(void 0);
        }
        else {
            reject('Microphone access denied');
        }
    });
}

export async function canUseMicrophone(): Promise<boolean>{
    if ( microphoneStatus === 'unknown' )
        return await navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => true)
            .catch(() => false);
    return microphoneStatus === 'allowed';
}

/**
 * Start recording audio from the microphone.
 */
export function startRecording() {
    ensureMicrophoneAccess()
        .then(() => {
            if ( !recording ) {
                console.log('Recording started');
                recording = true;
                mediaRecorder.start(1000); // Record audio every second

                const chunks: Blob[] = [];
                let totalBytes = 0;

                let source = audioCtx.createMediaStreamSource(mediaRecorder.stream);
                source.connect(audioAnalyser);

                let highestFrequencies = Array(voiceIndicatorsCount).fill(0);

                let minHzIdx = 50;
                let maxHzIdx = Math.min(1000, bufferLength - 1);

                let interval = setInterval(() => {
                    audioAnalyser.getByteFrequencyData(dataArray);

                    let frequencies = Array.from(dataArray)
                        .map(n => Math.min(1, n * 2 / 255.0));

                    for ( let i = 0; i < voiceIndicatorsCount; i++ ) {
                        highestFrequencies[ i ] = frequencies[ Math.floor(i * (maxHzIdx - minHzIdx) / voiceIndicatorsCount) + minHzIdx ];
                    }

                    updateAudioSpectrogram(highestFrequencies);
                }, 400);

                // Append the audio data to the chunks array
                mediaRecorder.ondataavailable = event => {
                    chunks.push(event.data);
                    totalBytes += event.data.size;

                    // Currently, the transcription API has a limit of 25 MB per request.
                    if ( totalBytes > maxAudioBytes ) {
                        stopRecording();
                    }
                };

                // When recording stops, concatenate the audio data and transcribe it
                mediaRecorder.onstop = () => {
                    recording = false;
                    updateAudioSpectrogram(Array(voiceIndicatorsCount).fill(0)); // Fill empty
                    feedForward(new Blob(chunks));
                    clearInterval(interval);

                };
            }
        })
        .catch(error => {
            // Cannot record audio.
            document.querySelectorAll('.voice-indicator')
                .forEach(indicator => (indicator as HTMLElement).style.backgroundColor = '#f00');
        })
}

/**
 * Function for playing an audio segment.
 * This function attempts to create an audio element and play it.
 * The promise can be rejected if the user has not granted the web page audio access.
 *
 * @param audioBlob The audio segment to play
 * @returns Promise<boolean> A promise which is resolved after the audio has successfully been played,
 * or rejected when the audio fails to play.
 */
export function playAudio(audioBlob: Blob): Promise<boolean> {
    const audioElem = document.createElement('audio');
    audioElem.src = URL.createObjectURL(audioBlob);
    let revokeUrl = () => URL.revokeObjectURL(audioElem.src);
    audioElem.onended = revokeUrl;

    return audioElem.play()
        .then(_ => true)
        .catch(_ => {
            revokeUrl()
            return false;
        })
}

/**
 * Function for updating the audio spectrogram in the webpage.
 * This function accepts a sequence of intensities, which will change
 * the size of the spectrogram bars.
 *
 * @param sequence The audio intensity values. These numbers must range between 0 and 1.
 * The max size of this sequence must be equal to the number configured in 'App'
 */
function updateAudioSpectrogram(sequence: number[]) {
    console.log(sequence);
    // Prevent this from happening...
    if ( sequence.length != voiceIndicatorsCount )
        return;

    let indicators = document.querySelectorAll('.voice-indicator');

    // This mustn't happen.
    if ( indicators.length != voiceIndicatorsCount )
        throw new Error("Something went wrong whilst attempting to update the voice indicators");

    for ( let i = 0; i < voiceIndicatorsCount; i++ ) {
        (indicators[ i ] as HTMLElement).style.setProperty('--volume', Math.min(Math.max(0, sequence[ i ] || 0), 1) + '');
    }
}

/**
 * Feed forward the audio blob to the transcription API.
 * This function transcribes the audio, generates a response, synthesizes speech,
 * @param blob The audio blob to transcribe.
 */
function feedForward(blob: Blob) {
    // Transcribe audio
    transcribe({
        file: blob,
        fileName: 'audio.mp4',
        model: 'whisper-1'
    }) // Generate response
        .then(transcription => {
            let message: Message = { role: 'user', content: transcription };
            getCurrentSession().addMessage(message);
            completeCfg({
                messages: [ ...getCurrentSession().messages, message ],
                model: 'gpt-4o'
            }) // Generate speech and play it.
                .then(json => {
                    let newMessage: Message = {
                        role: json['choices'][0].message.role,
                        content: json['choices'][0].message.content
                    };
                    getCurrentSession().addMessage(newMessage);
                    generateSpeechCfg({
                        input: newMessage.content,
                        voice: 'nova',
                        model: 'tts-1',
                    })
                })
        })
        .finally(() => setProcessActive(false));
}

/**
 * Stop recording audio from the microphone.
 */
export function stopRecording() {
    if ( recording ) {
        mediaRecorder.stop();
        console.log('Recording stopped');
    }
}