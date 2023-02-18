const HPACK = require("hpack");
const hpackCompressor = new HPACK();

headers = [
    [':scheme', 'http'],
    [':path', '/'],
]


// console.log(hpackCompressor.encode(headers));




/**
 * @typedef {Object} HTTP2FrameOptions
 * @property {string} type type of a frame in form of string from `HTTPFrameObject.frameTypesEnum`
 * @property {string} [flags = "00000000"] flags of frame in form of byte expressed in binary string form ex:. "01001000"
 * @property {string}  [streamID ="00000000"] ID of stream to wich frame refers in form of hex-four-byte string ex:."03b200c1"
 */

/** (
    * Take a note that this class can accept any value of all properties in HTTP2FrameOptions(except `type` prop) as long as they are in proper type.
    * That means that not valid frames can be created with use of this class.
    * Basicly this class only comsumes recived parameters and shapes them in form of HTTP2Frame wich looks like this:
    * +-----------------------------------------------+
    * |                 Payload Length (24)           |
    * +---------------+---------------+---------------+
    * |   Type (8)    |   Flags (8)   |
    * +-+-------------+---------------+-------------------------------+
    * |R|                 Stream Identifier (31)                      |
    * +=+=============================================================+
    * |                   Frame Payload (0...2^24-1 bytes)     ...
    * +---------------------------------------------------------------+
    * Which is stored in form of Buffer in `frameBuffer` property of created instance.
    * To be sure that created frames are valid use `HTTPFrameObject.from(frameBuffer)` method on Buffers that you're sure that are HTTP/2 frames,
    * Or use predefined methods like `HTTPFrameObject.generateServerPreface()`to create ready to use valid HTTP/2 frames
    * )
*/
/**Class that represents an HTTP/2 frame structure
 * @class
 * @param {HTTP2FrameOptions} optionsObj HTTP/2 frame options in form of `HTTP2FrameOptions`
 */
class HTTPFrameObject {

    length = 0;

    coversLength = false;

    type = null;

    typeValue = null;

    flags = "00000000";

    streamID = "00000000";

    framePayload = null;

    frameBuffer = null;

    isFrame = false;

    constructor(optionsObj) {

        if (optionsObj?.type && typeof optionsObj?.type === "string") this.type = optionsObj.type;
        else throw "type of frame in form of string is needed to create frame."

        if (HTTPFrameObject?.frameTypesEnum[this.type]) this.typeValue = HTTPFrameObject.frameTypesEnum[this.type];
        else { let throwString = `recived unknown frame type in frameOptionsObject: ${this.type} `; throw throwString }

        if (optionsObj?.flags && typeof optionsObj.flags === "string") this.flags = optionsObj.flags;
        else if (optionsObj?.flags && !(typeof optionsObj.flags === "string")) throw "recived flags for frame in unexpected type";

        if (optionsObj?.streamID) this.streamID = optionsObj.streamID;

        if (optionsObj?.framePayload) {

            if (Buffer.isBuffer(optionsObj.framePayload)) this.framePayload = optionsObj.framePayload;
            else if (typeof optionsObj.framePayload === "string") this.framePayload = Buffer.from(optionsObj.framePayload);
            else { let throwString = `frame payload needs to be Buffer or String.Recived ${typeof optionsObj.framePayload}`; throw throwString }

        }


        if (optionsObj?._length) this.length = optionsObj._length;

        if (optionsObj?._coversLength) this.coversLength = optionsObj._coversLength;


        this.frameBuffer = this._generateFrameBuffer();
    }

    _generateFrameBuffer() {

        let retBuff = Buffer.from("");

        //frame length
        let uptdBuff = null;

        let lengthStr = this.length.toString(16);

        let zeroPadding = "";

        for (let i = 0; i < 6 - lengthStr.length; i++) { zeroPadding += "0" };

        lengthStr = `${zeroPadding}${lengthStr}`;

        uptdBuff = Buffer.from(lengthStr.match(/.{1,2}/g));

        retBuff = Buffer.concat([retBuff, uptdBuff]);

        //frame type
        uptdBuff = Buffer.from([this.typeValue]);

        retBuff = Buffer.concat([retBuff, uptdBuff]);

        //frame flags
        uptdBuff = Buffer.from([Number(`0b${this.flags}`)]);

        retBuff = Buffer.concat([retBuff, uptdBuff]);

        //frame identifier
        uptdBuff = Buffer.from(this.streamID.match(/.{1,2}/g));

        retBuff = Buffer.concat([retBuff, uptdBuff]);

        //frame payload
        if (this.framePayload) retBuff = Buffer.concat([retBuff, this.framePayload]);

        return retBuff
    }

    static generateServerPreface() {

        return new HTTPFrameObject({

            type: HTTPFrameObject.frameTypesEnum[4],
            flags: "00000000"
        })

    }

    static readFrameLength(frameBuffer) {

        if (!Buffer.isBuffer(frameBuffer)) throw `data needs to be Buffer`;

        let retLength = null;

        if (frameBuffer.length >= 9) {

            const lengthBuf = frameBuffer.slice(0, 3)

            const lengthString = `0x${lengthBuf[0].toString(16) + lengthBuf[1].toString(16) + lengthBuf[2].toString(16)}`;

            retLength = Number(lengthString);

        }

        return retLength
    }

    static readFrameType(frameBuffer) {

        if (!Buffer.isBuffer(frameBuffer)) throw `data needs to be Buffer`;

        let retType = null;

        if (frameBuffer.length >= 9) {

            retType = frameBuffer.slice(3, 4)[0];

        }

        return retType


    }

    static readFrameFlags(frameBuffer) {

        if (!Buffer.isBuffer(frameBuffer)) throw `data needs to be Buffer`;

        let retFlags = null;

        if (frameBuffer.length >= 9) {

            retFlags = (frameBuffer.slice(4, 5)[0] >>> 0).toString(2);


            let zeroPadding = "";

            for (let i = 0; i < 8 - retFlags.length; i++) { zeroPadding += "0" };

            retFlags = zeroPadding + retFlags;

        }



        return retFlags

    }

    static readFrameStreamID(frameBuffer) {

        if (!Buffer.isBuffer(frameBuffer)) throw `data needs to be Buffer`;

        let retStreamID = null;

        if (frameBuffer.length >= 9) {

            const streamIDBuffer = frameBuffer.slice(5, 9);
            let streamIDString = "";

            for (let i = 0; i < streamIDBuffer.length; i++) {

                let hexString = streamIDBuffer[i].toString(16);

                if (hexString.length === 1) hexString = "0" + hexString;

                streamIDString += hexString;

            }

            retStreamID = streamIDString;

        }

        return retStreamID
    }

    static readFramePayload(frameBuffer) {

        if (!Buffer.isBuffer(frameBuffer)) throw `data needs to be Buffer`;

        let retPayload = null;

        if (frameBuffer.length > 9) {

            retPayload = frameBuffer.slice(9);

        }

        return retPayload
    }

    static from(rawData) {


        if (!Buffer.isBuffer(rawData)) {

            if (typeof rawData === "string") {

                rawData = Buffer.from(rawData);

            } else {

                throw `unexpected data type in HTTPFrameObject : recived ${typeof rawData} expected Buffer `;

            }


        }

        let retFrameObject = false

        const constructorOptionsObject = { isFrame: false };

        const readedLength = HTTPFrameObject.readFrameLength(rawData);
        if (readedLength !== null) {

            constructorOptionsObject._length = readedLength;

            if (!(readedLength > rawData.length) || !(readedLength < rawData.length)) constructorOptionsObject._coversLength = true;
            else constructorOptionsObject._coversLength = false;

        }
        else return retFrameObject


        const readedType = HTTPFrameObject.readFrameType(rawData);
        if (readedType !== null) {

            constructorOptionsObject.type = HTTPFrameObject.frameTypesEnum[readedType];

            constructorOptionsObject._typeValue = readedType;
        }
        else return retFrameObject


        const readedFlags = HTTPFrameObject.readFrameFlags(rawData);
        if (readedFlags) constructorOptionsObject.flags = readedFlags
        else return retFrameObject


        const readedFrameStreamID = HTTPFrameObject.readFrameStreamID(rawData);
        if (readedFrameStreamID) constructorOptionsObject.streamID = readedFrameStreamID
        else return retFrameObject


        const readedPayload = HTTPFrameObject.readFramePayload(rawData);
        if (readedPayload) constructorOptionsObject.framePayload = readedPayload
        else constructorOptionsObject.framePayload = null;

        constructorOptionsObject.frameBuffer = rawData;

        retFrameObject = new HTTPFrameObject(constructorOptionsObject);


        return retFrameObject

    }

    static frameTypesEnum = {

        0: "DATA",
        1: "HEADERS",
        2: "PRIORITY",
        3: "RST_STREAM",
        4: "SETTINGS",
        5: "PUSH_PROMISE",
        6: "PING",
        7: "GOAWAY",
        8: "WINDOW_UPDATE",
        9: "CONTINUATION",
        "DATA": 0,
        "HEADERS": 1,
        "PRIORITY": 2,
        "RST_STREAM": 3,
        "SETTINGS": 4,
        "PUSH_PROMISE": 5,
        "PING": 6,
        "GOAWAY": 7,
        "WINDOW_UPDATE": 8,
        "CONTINUATION": 9,
    }

    static encodeHeaders(payload) {

        const retBuff = null;



    }
}


class HTTPObject {

    static HTTP_METHODS_TABLE = ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH"];

    type = null;

    method = null;

    path = "null";

    responseCode = "none";

    responseCodeCommunicat = "-";

    headers = {};

    headersCount = 0;

    httpEntity = null;

    httpVersion = null;

    chunked = false;

    isHttp = false;

    constructor(rawHttpData) {


        if (!Buffer.isBuffer(rawHttpData)) {

            if (typeof rawHttpData === "string") {

                rawHttpData = Buffer.from(rawHttpData);

            } else {

                throw `unexpected data type in HTTPObject : recived ${typeof rawHttpData} expected Buffer `;

            }


        }


        const result = HTTPObject.resolveHttpDataType(rawHttpData);

        if (result.isHttp) {

            this.type = result.type;

            this.isHttp = true;

            const httpInfoObject = HTTPObject.parseHttp(rawHttpData, result.type);


            this.chunked = httpInfoObject.chunked;

            this.httpVersion = httpInfoObject.httpVersion;

            this.headers = httpInfoObject.headers;

            this.headersCount = httpInfoObject.headersCount;

            this.httpEntity = httpInfoObject.httpData;

            if (this.type === "request") {

                delete this.responseCode;

                delete this.responseCodeCommunicat;

                this.method = httpInfoObject.method;

                this.path = httpInfoObject.path;

            } else {

                delete this.path;

                delete this.method;

                this.responseCode = httpInfoObject.responseCode ? httpInfoObject.responseCode : this.responseCode;

                this.responseCodeCommunicat = httpInfoObject.responseCodeCommunicat ? httpInfoObject.responseCodeCommunicat : this.responseCodeCommunicat;

            }


        } else {

            this.type = "raw-binary";

            this.httpEntity = rawHttpData;
        }

        let x = 1;

    }

    toBinaryForm() {

        let retBuff = Buffer.from("");

        switch (this.type) {
            case "request":

                const methodBuffer = Buffer.from(this.method + " ");

                retBuff = Buffer.concat([retBuff, methodBuffer]);

                const pathBuffer = Buffer.from(this.path + " ");

                retBuff = Buffer.concat([retBuff, pathBuffer]);

                const versionBuffer = Buffer.from(this.httpVersion + "\r\n");

                retBuff = Buffer.concat([retBuff, versionBuffer]);

                for (let header in this.headers) {

                    const headerString = `${header}: ${this.headers[header]}\r\n`;

                    const headerBuffer = Buffer.from(headerString);

                    retBuff = Buffer.concat([retBuff, headerBuffer]);

                }

                retBuff = Buffer.concat([retBuff, Buffer.from("\r\n")]);

                if (this.httpEntity) retBuff = Buffer.concat([retBuff, this.httpEntity]);

                break;
            case "response":

                break;
            case "raw-binary":

                break;
            default:
                throw "error while parsing HTTPObject to rawBinary form"
        }

        return retBuff
    }

    static resolveHttpDataType(rawHttpData) {

        let retObj = { isHttp: false, type: null };

        let httpData = rawHttpData;

        typeof httpData === "string" ? null : httpData = httpData.toString();

        //check if response
        if (httpData.slice(0, 4) === "HTTP") {

            retObj.isHttp = true;

            retObj.type = "response";


        }

        //check if request
        for (let i = 0; i < HTTPObject.HTTP_METHODS_TABLE.length; i++) {

            const method = HTTPObject.HTTP_METHODS_TABLE[i];

            if (httpData.slice(0, 8).includes(method + " ")) {

                retObj.isHttp = true;

                retObj.type = "request";


            }

        }


        // httpData = Buffer.from(httpData);

        // //check if frame
        // frameCheck(httpData);

        return retObj
    }

    static parseHttp(httpData, type) {

        const retObj = {

            method: "",

            path: "",

            responseCode: "",

            responseCodeCommunicat: "",

            httpVersion: "",

            headers: {},

            headersCount: 0,

            httpData: [],

            chunked: false,
        }


        let iterator = 0;

        let parse = true;

        let parseStage = 0;

        let curentProcessedHeaderName = "";

        let curentProcessedHeaderValue = "";

        let headersCount = 0;

        let processedHeaderMode = "name";


        if (type === "request") {



            while (parse && (iterator < httpData.length)) {

                const curentChar = httpData[iterator];

                switch (parseStage) {

                    case 0:

                        curentChar === 0x20 ? parseStage++ : retObj.method += String.fromCharCode(curentChar);

                        iterator++;

                        break;
                    case 1:

                        curentChar === 0x20 ? parseStage++ : retObj.path += String.fromCharCode(curentChar);

                        iterator++;

                        break;
                    case 2:

                        if (curentChar !== 0xd) {

                            curentChar === 0xa ? parseStage++ : retObj.httpVersion += String.fromCharCode(curentChar);

                        }

                        iterator++;

                        break;
                    case 3:


                        if (processedHeaderMode === "name") {

                            if (curentChar === 0x20) {

                                processedHeaderMode = "value";

                            } else {

                                curentChar !== 0x3a ? curentProcessedHeaderName += String.fromCharCode(curentChar) : null;

                            }


                        } else {

                            if (curentChar !== 0xd) {


                                if (curentChar === 0xa &&
                                    httpData[iterator + 1] !== 0xa &&
                                    httpData[iterator + 2] !== 0xa) {

                                    processedHeaderMode = "name";

                                    headersCount++;

                                    retObj.headers[curentProcessedHeaderName] = curentProcessedHeaderValue;

                                    curentProcessedHeaderName = "";

                                    curentProcessedHeaderValue = "";


                                } else if (curentChar !== 0xa) {

                                    curentProcessedHeaderValue += String.fromCharCode(curentChar);

                                } else if (httpData[iterator + 1] === 0xa) {

                                    parseStage++;


                                    processedHeaderMode = "name";

                                    headersCount++;

                                    retObj.headers[curentProcessedHeaderName] = curentProcessedHeaderValue;

                                    curentProcessedHeaderName = "";

                                    curentProcessedHeaderValue = "";

                                    iterator += 2;

                                    break;

                                } else if (httpData[iterator + 2] === 0xa) {

                                    parseStage++;


                                    processedHeaderMode = "name";

                                    headersCount++;

                                    retObj.headers[curentProcessedHeaderName] = curentProcessedHeaderValue;

                                    curentProcessedHeaderName = "";

                                    curentProcessedHeaderValue = "";

                                    iterator += 3;

                                    break;

                                }

                            }

                        }




                        iterator++;

                        break;
                    case 4:


                        if (retObj.headers?.["Transfer-Encoding"] && (retObj.headers["Transfer-Encoding"] === "chunked")) {


                            retObj.chunked = true;



                            if (!retObj?.httpData[0]) {

                                retObj.httpData[0] = { size: 0, chunk: [] };

                                let chunkSize = "";


                                while (httpData[iterator] !== 0xa && (iterator < httpData.length)) {

                                    if (httpData[iterator] !== 0xd) {

                                        chunkSize += String.fromCharCode(httpData[iterator]);

                                    }

                                    iterator++;


                                }

                                if (Number(chunkSize) === NaN) {

                                    throw "unexpected chunked transfer format in HTTPObject"

                                }

                                retObj.httpData[0].size = chunkSize;

                            } else {

                                retObj.httpData[0].chunk.push(curentChar);



                            }


                        } else {

                            retObj.httpData.push(curentChar);

                        }

                        iterator++;
                        break;
                    default:

                        throw "http parse stage error";

                }

            }



        } else if (type === "response") {



            while (parse && (iterator < httpData.length)) {

                const curentChar = httpData[iterator];

                switch (parseStage) {

                    case 0:

                        curentChar === 0x20 ? parseStage++ : retObj.httpVersion += String.fromCharCode(curentChar);

                        iterator++;

                        break;
                    case 1:

                        if (curentChar !== 0xd) {

                            curentChar === 0x20 ? parseStage++ : retObj.responseCode += String.fromCharCode(curentChar);

                            curentChar === 0xa ? parseStage += 2 : null;

                        }



                        iterator++;

                        break;
                    case 2:

                        if (curentChar !== 0xd) {

                            curentChar === 0xa ? parseStage++ : retObj.responseCodeCommunicat += String.fromCharCode(curentChar);

                        }

                        iterator++;

                        break;
                    case 3:


                        if (processedHeaderMode === "name") {

                            if (curentChar === 0x20) {

                                processedHeaderMode = "value";

                            } else {

                                curentChar !== 0x3a ? curentProcessedHeaderName += String.fromCharCode(curentChar) : null;

                            }


                        } else {

                            if (curentChar !== 0xd) {


                                if (curentChar === 0xa &&
                                    httpData[iterator + 1] !== 0xa &&
                                    httpData[iterator + 2] !== 0xa) {

                                    processedHeaderMode = "name";

                                    headersCount++;

                                    retObj.headers[curentProcessedHeaderName] = curentProcessedHeaderValue;

                                    curentProcessedHeaderName = "";

                                    curentProcessedHeaderValue = "";

                                } else if (curentChar !== 0xa) {

                                    curentProcessedHeaderValue += String.fromCharCode(curentChar);

                                } else if (httpData[iterator + 1] === 0xa) {

                                    parseStage++;

                                    processedHeaderMode = "name";

                                    headersCount++;

                                    retObj.headers[curentProcessedHeaderName] = curentProcessedHeaderValue;

                                    curentProcessedHeaderName = "";

                                    curentProcessedHeaderValue = "";

                                    iterator += 2;

                                    break;

                                } else if (httpData[iterator + 2] === 0xa) {

                                    parseStage++;

                                    processedHeaderMode = "name";

                                    headersCount++;

                                    retObj.headers[curentProcessedHeaderName] = curentProcessedHeaderValue;

                                    curentProcessedHeaderName = "";

                                    curentProcessedHeaderValue = "";

                                    iterator += 3;

                                    break;

                                }

                            }

                        }


                        iterator++;

                        break;
                    case 4:

                        if (retObj.headers?.["Transfer-Encoding"] && (retObj.headers["Transfer-Encoding"] === "chunked")) {


                            retObj.chunked = true;



                            if (!retObj?.httpData[0]) {

                                retObj.httpData[0] = { size: 0, chunk: [] };

                                let chunkSize = "";


                                while (httpData[iterator] !== 0xa && (iterator < httpData.length)) {

                                    if (httpData[iterator] !== 0xd) {

                                        chunkSize += String.fromCharCode(httpData[iterator]);

                                    }

                                    iterator++;


                                }

                                if (Number(chunkSize) === NaN) {

                                    throw "unexpected chunked transfer format in HTTPObject"

                                }

                                retObj.httpData[0].size = chunkSize;

                            } else {

                                retObj.httpData[0].chunk.push(curentChar);



                            }


                        } else {

                            retObj.httpData.push(curentChar);



                        }

                        iterator++;

                        break;
                    default:

                        throw "http parse stage error";

                }

            }

        }

        retObj.headersCount = headersCount;

        if (!retObj.chunked) {

            retObj.httpData = Buffer.from(retObj.httpData);

        }



        return retObj;

    }

    static getPortAndHost(host) {

        let retObj = { port: null, host: null };

        const indexOfSeparator = host.indexOf(":");

        if (indexOfSeparator === -1) return retObj;

        retObj.host = host.substring(0, indexOfSeparator);

        retObj.port = host.substring(indexOfSeparator + 1);

        return retObj

    }

}


module.exports.HTTPFrameObject = HTTPFrameObject

module.exports.HTTPObject = HTTPObject;


