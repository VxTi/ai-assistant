import { complete, Message } from "./TextCompletion";
import { generateSpeech } from "./SpeechGeneration";
import { canUseMicrophone, ensureMicrophoneAccess, startRecording, stopRecording } from "./Audio";
import { Config } from "./Config";
import {
    addChatSessionElement,
    ChatSession,
    getCurrentSession,
    loadChatSessions,
    setCurrentSession
} from "./ChatSessions";

export const voiceIndicatorsCount = 7;

let processActive = false;

document.addEventListener('DOMContentLoaded', async () => {

    let status = await Config.validateApiKey(Config.apiKey);

    /*if ( status != 'valid' )
        window.location.href = 'register.html';*/

    // The voice indication elements on top of the screen
    let indicatorContainer = document.querySelector('.voice-indicators');
    for ( let i = 0; i < voiceIndicatorsCount; i++ ) {
        let indicator = document.createElement('span');
        indicator.classList.add('voice-indicator');
        indicator.style.animationDelay = (i * .1) + 's';
        indicatorContainer.appendChild(indicator);
    }
    let historyElement = document.getElementById('chat-history');
    let historyContainer = document.getElementById('history-container');

    loadChatSessions();

    document.getElementById('new-session')
        .addEventListener('click', () => {
            addChatSessionElement(new ChatSession());
        })

    historyElement.addEventListener('click', () => {
        historyContainer.classList.toggle('active');
        if ( historyElement.classList.toggle('active') )
            historyContainer.scrollTop = historyContainer.scrollHeight;
    });

    let microphoneElement = document.querySelector('.microphone');

    // Handle microphone button
    let onMicInteract = (event: Event) => {
        if ( processActive )
            return;

        ensureMicrophoneAccess()
            .then(() => {
                microphoneElement.classList.toggle('active');
                if ( !microphoneElement.classList.contains('active') ) {
                    startRecording();
                }
                else {
                    stopRecording();
                }
            });
    };

    microphoneElement.addEventListener('click', onMicInteract);
    //microphoneElement.addEventListener('touchstart', onMicInteract);

    // Add functionality for text input
    const textInput = document.getElementById('regular-input');

    textInput
        .addEventListener('keydown', (event) => {
            if ( event.key === 'Enter' ) {

                // Cannot start another process if there's already one running
                if ( processActive )
                    return;

                setProcessActive(true);

                event.preventDefault();
                let target = event.target as HTMLInputElement;
                let content = target.value;
                target.value = '';

                let message: Message = { role: 'user', content: content }

                getCurrentSession().addMessage(message);

                complete(content)
                    .then(response => {
                        getCurrentSession().addMessage({ role: 'assistant', content: response });
                        generateSpeech(response)
                    })
                    .finally(() => setProcessActive(false));
            }
        })
})

export function setProcessActive(active: boolean) {
    processActive = active;
    document.querySelector('.voice-indicators')
        .classList[ active ? 'add' : 'remove' ]('active')
}

export function handleError(error: string) {
    // Do something
}