/**
 * @fileoverview LiveAssistantPage.tsx
 * @author Luca Warmenhoven
 * @date Created on Sunday, October 06 - 18:52
 */

import { useContext, useEffect, useRef } from "react";
import { ApplicationContext }            from "../contexts/ApplicationContext";

/**
 * Convert a float32 array to a 16-bit PCM array.
 * @param float32Array the float32 array.
 */
/*function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view   = new DataView(buffer);
    let offset   = 0;
    for ( let i = 0; i < float32Array.length; i++, offset += 2 ) {
        let s = Math.max(-1, Math.min(1, float32Array[ i ]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
}*/

/**
 * Converts a Float32Array to base64-encoded PCM16 data
 * @param float32Array The Float32Array to encode
 */
/*function base64EncodeAudio(float32Array: Float32Array): string {
    const arrayBuffer = floatTo16BitPCM(float32Array);
    let binary        = '';
    let bytes         = new Uint8Array(arrayBuffer);
    const chunkSize   = 0x8000; // 32KB chunk size
    for ( let i = 0; i < bytes.length; i += chunkSize ) {
        let chunk = Array.from(bytes.subarray(i, i + chunkSize));
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}*/

/**
 * The live assistant page.
 */
export function LiveAssistantPage() {

    useEffect(() => {

    }, []);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { setHeaderConfig } = useContext(ApplicationContext);

    useEffect(() => {

        setHeaderConfig(() => {
            return {
                pageTitle: 'Live Assistant',
            };
        });

        if ( !canvasRef.current )
            return;

        const canvas = canvasRef.current;
        const gl     = canvas.getContext('2d');

        if ( !gl )
            return;

        canvas.width  = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;

        const audioContext = new (window.AudioContext || window[ 'webkitAudioContext' ])();
        const analyzer     = audioContext.createAnalyser();
        analyzer.fftSize   = 256;
        const dataArray    = new Uint8Array(analyzer.frequencyBinCount);

        /** Acquire the audio stream from the user's microphone. */
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                 .then(stream => {
                     const source = audioContext.createMediaStreamSource(stream);
                     source.connect(analyzer);

                     /*const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
                      const ws  = new WebSocket(url, {
                      headers: {
                      'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
                      'OpenAI-Beta': 'realtime=v1'
                      }
                      });
                      ws.on('open', () => {
                      let audioDevice: MediaRecorder = new MediaRecorder(stream);

                      audioDevice.ondataavailable = async (event) => {
                      const blobChunk = event.data;
                      const f32Array  = new Float32Array(await blobChunk.arrayBuffer());
                      const base64    = base64EncodeAudio(f32Array);
                      }

                      ws.send(
                      JSON.stringify(
                      {
                      type: "response.create",
                      response: { modalities: [ "text" ], instructions: "Please speak to the user.", }
                      }));
                      })*/

                 })
                 .catch(() => {

                 });


        console.log(dataArray.length);

        const render = () => {
            gl.clearRect(0, 0, canvas.width, canvas.height);
            analyzer.getByteFrequencyData(dataArray);

            for ( let i = 0; i < dataArray.length; i++)
            {
                const amplitude = Math.max(1, dataArray[i]);
                gl.fillStyle = `rgb(${amplitude * 2} ${amplitude * .5} ${Math.max(0, 255 - .8 * amplitude)})`;
                gl.fillRect(canvas.width / dataArray.length * i, canvas.height - amplitude * canvas.height / 255,
                            canvas.width / dataArray.length / 2, amplitude * canvas.height / 255);
            }

            requestAnimationFrame(render);
        }
        render();
    }, [ canvasRef ]);

    return (
        <div className="mx-auto max-w-screen-md w-full flex flex-col grow justify-start">
            <div className="flex flex-col grow justify-center items-center relative mx-2">
                <canvas className="absolute w-full aspect-video content-container p-3 rounded-2xl" ref={canvasRef}/>
            </div>
        </div>
    )
}
