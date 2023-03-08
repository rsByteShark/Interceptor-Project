const { HTTPFrameObject, HTTPFramesController } = require("./InterceptorHTTP");
const fs = require("fs");

let framesBuffer = fs.readFileSync("./frames");


// // const prismBuff = Buffer.from([0, 0, 1, 2, 1, 0, 0, 0, 1, 1]);
// // framesBuffer = Buffer.concat([framesBuffer, prismBuff])

// // const framesArr = HTTPFrameObject.from(framesBuffer);


// // console.log(framesBuffer.slice(148, 158));


// console.log(HTTPFrameObject.from(framesBuffer));



// const HPACK = require("hpack");
// const hpackCompressor = new HPACK();

// console.log(hpackCompressor.decode(Buffer.from([0, 2, 0x88, 0, 1, 0, 0, 0, 0x11])));

framesBuffer = Buffer.concat([framesBuffer, Buffer.from([0, 0, 0xa, 1, 0xf, 0, 0, 0, 0x11, 1, 1])]);

const frames = new HTTPFramesController();


frames.feedWithBufferOfFrames(framesBuffer)

console.log(frames.framesArray.at(-1), frames.expectedPayloadDataLength);

frames.feedWithBufferOfFrames(Buffer.from([1, 1, 1]));

console.log(frames.framesArray.at(-1), frames.expectedPayloadDataLength);