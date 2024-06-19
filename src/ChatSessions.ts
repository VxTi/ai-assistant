/**
 * @fileoverview ChatSessions.ts
 * @author Luca Warmenhoven
 * @date Created on Thursday June 06 - 12:17
 */
import { complete, Message } from "./TextCompletion";
import { marked } from "./include/marked";
import { Config } from "./Config";

/**
 * Class representing a ChatSession
 */
export class ChatSession {

    public messages: Message[];
    public description: string;
    public timeSinceEpoch: number;

    constructor(messages?: Message[], description?: string, timeSinceEpoch?: number) {
        this.messages = messages || [];
        this.description = description || null;
        this.timeSinceEpoch = timeSinceEpoch || Date.now();
        if ( this.messages.length == 0 )
            this.messages.push({ role: 'system', content: Config.modelIdentity.initialPrompt });
    }

    /**
     * Returns the amount of messages in this chat session,
     * excluding system messages and empty messages.
     */
    public messageCount(): number {
        return this.messages.filter(message => message.role != 'system' && message.content.length > 0).length;
    }

    /**
     * Adds a message to the message history of this chat session
     * @param message
     */
    public addMessage(message: Message) {
        if ( message.content.length > 0 ) {
            this.messages.push(message);
            let history = getHistory();
            history[ this.timeSinceEpoch ] = this;
            setHistory(history);
            addMessageElement(message);
        }
    }

    /**
     * Sets the messages of this chat session
     *
     * @param messages The messages to set
     */
    public setMessages(messages: Message[]) {
        let localStorageHistory = localStorage.getItem('history');
        this.messages = messages;
        if ( messages.length > 0 )
            localStorage.setItem(this.timeSinceEpoch.toString(), JSON.stringify(messages));
        else if ( localStorage.getItem(this.timeSinceEpoch.toString()) )
            localStorage.removeItem(this.timeSinceEpoch.toString());
    }

    updateDescription(newDescription: string) {
        this.description = newDescription;
        let history = getHistory();
        history[ this.timeSinceEpoch ] = this;
        setHistory(history);
    }
}

/** The currently active session */
let __currentSession = new ChatSession();

/**
 * Object containing chat history.
 */
let __chatHistory: { [ key: number ]: ChatSession } = null;

/**
 * Getter function for retrieving the current session.
 */
export function getCurrentSession(): ChatSession {
    return __currentSession;
}

/**
 * Function for updating the current session to a specified chat session.
 * Only adds non-null session values.
 *
 * @param session The session to update the current one to.
 */
export function setCurrentSession(session: ChatSession) {
    if ( session != null ) {
        console.log("Setting current session to: " + session.timeSinceEpoch)
        __currentSession = session;
        if ( session.messageCount() > 0 ) {
            document.getElementById('message-container').innerHTML = '';
            session.messages.forEach(addMessageElement);
        }
    }
}

/**
 * Function for adding a history session element to the sidebar
 *
 * @param historyEntry The chat session to add to the sidebar.
 * @param active Whether the session should be active.
 */
export function addChatSessionElement(historyEntry: ChatSession, active?: boolean) {

    // Find an empty chat session.
    // If there exists an empty one, switch to that one instead of creating a new one.
    if ( historyEntry.messages.length <= 1 ) {

        const historyEntry = Object.entries(getHistory())
            .find(([ key, value ]) => value.messages.length <= 1);

        if ( historyEntry ) {
            console.log("Switching to other empty session instead. ");
            const [ key, value ] = historyEntry;
            setCurrentSession(value);
            return;
        }
    }

    console.log("Adding new session element");

    let historyElement = document.createElement('div');
    historyElement.classList.add('history-item');
    if ( active ) {
        historyElement.classList.add('active');
        document.querySelectorAll('.history-item.active')
            .forEach(e => e.classList.remove('active'));
    }
    let titleElement = document.createElement('span');
    titleElement.classList.add('--title');
    titleElement.innerText = historyEntry.description || 'Empty chat';

    let removeElement = document.createElement('span');
    removeElement.classList.add('--remove');

    historyElement.appendChild(titleElement);
    historyElement.appendChild(removeElement);
    document.getElementById('history-container')
        .appendChild(historyElement);

    // Whenever you click on a session, you switch to it.
    titleElement.addEventListener('click', () => {
        if ( __currentSession != historyEntry ) {
            setCurrentSession(historyEntry);
            historyElement.classList.add('active');
            console.log("Switched to session: " + historyEntry.timeSinceEpoch);
        }
    });

    removeElement.addEventListener('click', () => {
        if ( __currentSession == historyEntry || Object.keys(__chatHistory).length <= 1) {
            let newSession = new ChatSession();
            setCurrentSession(newSession);
            addChatSessionElement(newSession);
        }
        removeFromHistory(historyEntry.timeSinceEpoch);
        historyElement.remove();
    });


}

/**
 * Function for retrieving the history of the chat sessions.
 * @returns The history of the chat sessions.
 */
function getHistory(): { [ key: number ]: ChatSession } {
    if ( !__chatHistory ) {
        __chatHistory = {};
        let savedHistory = localStorage.getItem('history');
        if ( savedHistory ) {
            let parsedHistory = JSON.parse(savedHistory);
            Object.keys(parsedHistory)
                .forEach(key => __chatHistory[ key ] = new ChatSession(
                    parsedHistory[ key ].messages,
                    parsedHistory[ key ].description,
                    parsedHistory[ key ].timeSinceEpoch
                ));
        }
    }
    return __chatHistory;
}

/**
 * Function for setting the history of the chat sessions.
 * @param history The history to set
 */
function setHistory(history: { [ key: number ]: ChatSession }) {
    let historyObject = {};
    Object.keys(history).forEach(key => historyObject[ key ] = {
        messages: history[ key ].messages,
        description: history[ key ].description,
        timeSinceEpoch: history[ key ].timeSinceEpoch
    });
    localStorage.setItem('history', JSON.stringify(historyObject));
}

function removeFromHistory(key: number) {
    let history = getHistory();
    delete history[ key ];
    setHistory(history);
}

/**
 * Function for adding a message to the messages' container.
 * @param message The message to append to the container
 * @returns The readable part of the message, excluding code.
 */
export function addMessageElement(message: Message) {
    console.log("Adding new message element: " + message.content.substring(0, 10) + "...");
    if ( message.content.length == 0 || message.role == 'system' )
        return;

    let parsedContent = marked.parse(message.content);

    let messageRoot = document.createElement('div');
    messageRoot.classList.add('message');

    let sourceElement = document.createElement('span');
    sourceElement.classList.add('--source');
    sourceElement.innerText = message.role == 'user' ? 'You' : 'Assistant'

    let contentElement = document.createElement('span');
    contentElement.classList.add('--content');
    contentElement.innerHTML = parsedContent;

    messageRoot.appendChild(sourceElement);
    messageRoot.appendChild(contentElement);

    document.getElementById('message-container')
        .appendChild(messageRoot);
    document.getElementById('message-container')
        .scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'instant' });

    // TODO: Return extracted text without code blocks.
}

/**
 * Function for loading the chat sessions from the local storage.
 */
export function loadChatSessions() {

    Object
        .values(getHistory())
        .forEach(async entry => {
            if ( entry.messages.length > 1 ) {
                entry.messages.forEach(addMessageElement);
                if ( entry.description === null ) {
                    let history = getHistory();
                    entry.description = await complete(Config.summarizationPrompt + '\n' + entry.messages[ 1 ].content);
                    history[ entry.timeSinceEpoch ] = entry;
                    setHistory(history);
                }
                addChatSessionElement(entry);
            }
        });
    addChatSessionElement(__currentSession, true);
}