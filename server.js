// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');
const WebSocket = require('ws');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
// const recordingPath = argv._.length ? argv._[0] : '/tmp/audio.raw';
const port = argv.port && parseInt(argv.port) ? parseInt(argv.port) : 3001
let wstream;
var recordDurationMs = 7500;

// Creates a client
const client = new speech.SpeechClient();

const encoding = 'LINEAR16';
var sampleRate = 8000;
const languageCode = 'en-US';

console.log(`listening on port ${port}`);

const wss = new WebSocket.WebSocketServer({
    port
});

let chunks;
let startTime;
let curTime;

wss.on('connection', (ws, req) => {
    console.log(`received connection from ${req.connection.remoteAddress}`);
    // wstream = fs.createWriteStream(recordingPath);
    chunks = [];
    startTime = Date.now();
    var stop_asr = false;

    ws.on('message', (message, isBinary) => {
        if (isBinary !== true) {
            console.log(`received message: ${message}`);
            const config = JSON.parse(message);
            if (config !== null && config['record-duration-ms'] !== null) {
                recordDurationMs = config['record-duration-ms'];
            }
            if (config !== null && config['content-type'] !== null) {
                const contentType = config['content-type'];
                const rate = contentType.match(/rate=([0-9]+)/);
                sampleRate = parseInt(rate[1]);
            }
            console.log(`recordDurationMs = ${recordDurationMs} sampleRate = ${sampleRate}`);
        } else if (message instanceof Buffer) {
            //console.log('received audio');
            chunks.push(message);
            // wstream.write(message);
            curTime = Date.now();
            if (curTime - startTime >= recordDurationMs) {
                console.log(`Elapsed time: ${curTime - startTime} ms`);
                // send ASR request
                console.log('Should send audio for ASR');
                if (!stop_asr && chunks.length > 0) {
                    convertSpeechToText(ws, Buffer.concat(chunks));
                    stop_asr = true;
                }
                startTime = Date.now();
                chunks = [];
            }
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`socket closed ${code}:${reason}`);
        // wstream.end();
    });
});

function convertSpeechToText(ws, audio_buffer) {
    const audio = {
        content: audio_buffer.toString('base64'),
    };
    const request = {
        config: {
            encoding: encoding,
            sampleRateHertz: sampleRate,
            languageCode: languageCode,
        },
        audio: audio,
        interimResults: false, // If you want interim results, set this to true
    };
    client.recognize(request)
        .then((response) => {
            console.log(JSON.stringify(response));
            if (response.length > 0) {
                const transcript = response[0].results[0].alternatives[0].transcript;
                console.log(`Transcript: ${transcript}`);
                const words = transcript.split(' ');
                const yes = words.includes('yes') || words.includes('yep') ||
                    words.includes('obviously') || words.includes('ya');
                const no = words.includes('no') || words.includes('nope') ||
                    words.includes('dont');
                const asr = (yes ? 'yes' : (no ? 'no' : 'none'));
                const message = {
                    asr_response: asr
                };
                ws.send(JSON.stringify(message));
            } else {
                console.log('Could not transcribe.');
                const message = {
                    asr_response: 'none'
                };
                ws.send(JSON.stringify(message));
            }
        }).catch(console.error);
}
