const tls = require("tls");
const net = require("net");
const { HTTPObject, HTTPFramesController } = require("./InterceptorHTTP");
const InterceptorState = require("./InterceptorState");

class InterceptorConnector {

    requests = []

    responses = []

    target = null

    connector = null

    connectorPort = null

    tcpPipe = null

    dataSourceSocket = null

    refToGlobalState = null

    connectorGeneratedUID = null;

    initialRequest = null;

    targetALPN = null;

    outboundFrameController = null;

    inboundFrameController = null;

    static connectorCiphers = tls.DEFAULT_CIPHERS.split(':');

    constructor(tempCert = null, tempCertPrivateKey = null, connectorTarget, dataSourceSocket, globalStateReference, connectorGeneratedUID, initialRequest = null) {

        this.dataSourceSocket = dataSourceSocket;

        this.target = connectorTarget;

        this.refToGlobalState = globalStateReference

        this.connectorGeneratedUID = connectorGeneratedUID;

        this.initialRequest = initialRequest;

        if (tempCert && tempCertPrivateKey) {




            this.resolveTargetALPN().then(ALPN => {

                this.targetALPN = ALPN


                if (this.targetALPN === false) this.targetALPN = "http/1.1";

                if (this.targetALPN === "h2") {

                    this.outboundFrameController = new HTTPFramesController(this.refToGlobalState, this.connectorGeneratedUID, "OUT");

                    this.inboundFrameController = new HTTPFramesController(this.refToGlobalState, this.connectorGeneratedUID, "IN");
                }

                //emitt CONNECTION_CREATED event
                this.refToGlobalState.handleStateChange({ changeCase: InterceptorState.CONNECTION_CREATED, changeLocation: { connectionUID: this.connectorGeneratedUID } });

                let ALPNProtocols = this.targetALPN === "h2" ? ["h2", "http/1.1"] : ["http/1.1"];


                this.connector = tls.createServer({ ALPNProtocols, key: tempCertPrivateKey, cert: tempCert });

                this.initConnectorTLSServer();


            })



        } else {

            this.connector = net.createServer();

            this.initConnectorTCPServer();

        }


    }


    initConnectorTLSServer() {


        this.connector.on("secureConnection", this.handleOutboundTLSTraffic.bind(this))


        this.connector.on("error", (err) => {
            console.log(err);

        })


        this.connector.listen(() => {


            this.connectorPort = this.connector.address().port;


            this.tcpPipe = net.connect({ port: this.connectorPort, host: "localhost" }, () => {


                this.tcpPipe.on("data", (data) => {


                    this.dataSourceSocket.write(data);


                })

                this.dataSourceSocket.resume();
            })


            //here comes pure data from browser
            this.dataSourceSocket.on("data", (data) => {


                this.tcpPipe.write(data);



            })




        })


    }


    initConnectorTCPServer() {

        this.connector.on("connection", this.handleOutboundTCPTraffic.bind(this));

        this.connector.on("error", (err) => {
            console.log(err);

        })


        this.connector.listen(() => {

            this.connectorPort = this.connector.address().port;

            this.tcpPipe = net.connect({ port: this.connectorPort, host: "localhost" }, () => {


                this.tcpPipe.on("data", (data) => {


                    this.dataSourceSocket.write(data);


                })

                this.dataSourceSocket.resume();
            })


            //here comes pure data from browser
            this.dataSourceSocket.on("data", (data) => {


                this.tcpPipe.write(data);



            })


        })


    }


    resolveTargetALPN() {

        return new Promise((resolve, reject) => {

            const testConnection = tls.connect({
                rejectUnauthorized: true,
                port: 443,
                host: this.target,
                servername: this.target,
                ciphers: InterceptorConnector.shuffleCiphers(InterceptorConnector.connectorCiphers),
                ALPNProtocols: ["h2", "http/1.1"],
            })

            testConnection.on("secureConnect", () => {

                resolve(testConnection.alpnProtocol);

                testConnection.end();

                testConnection.destroy();

            });

            testConnection.on("error", (err) => {

                reject(err);

            })

        })

    }

    async handleOutboundTLSTraffic(connectorSocket) {

        this.conectorSocket = connectorSocket;


        this.connectToTLSTarget();

    }


    handleOutboundTCPTraffic(connectorSocket) {

        this.conectorSocket = connectorSocket;

        this.connectToTCPTarget();

        this.targetALPN = "http/1.1"

        //emitt CONNECTION_CREATED event
        this.refToGlobalState.handleStateChange({ changeCase: InterceptorState.CONNECTION_CREATED, changeLocation: { connectionUID: this.connectorGeneratedUID } });

    }


    connectToTLSTarget() {

        //create secure connection to foregin target requested by browser
        const socketToTarget = tls.connect({
            rejectUnauthorized: true,
            port: 443,
            host: this.target,
            servername: this.target,
            ciphers: InterceptorConnector.shuffleCiphers(InterceptorConnector.connectorCiphers),
            ALPNProtocols: ["h2", "http/1.1"],
        });

        socketToTarget.setKeepAlive(true);


        socketToTarget.on("secureConnect", () => {

            this.socketToTarget = socketToTarget;

            //here comes decrypted response data from target
            socketToTarget.on("data", (data) => {

                if (this.targetALPN === "h2") {

                    this.inboundFrameController.feedWithBufferOfFrames(data);


                } else {

                    this.responses.push(new HTTPObject(data));

                    this.refToGlobalState.handleStateChange({
                        changeCase: InterceptorState.CONNECTOR_RESPONSE,
                        changeLocation: { connectionUID: this.connectorGeneratedUID, responseID: this.responses.length - 1 }
                    });

                }



                //encrypt and write response data from target to this.tcpPipe that is connected to connector
                //wich will send it to dataSourceSocket(browser proxy socket)
                this.conectorSocket.write(data);

            })

            //here comes decrypted data from browser after tls connection to this.connector
            this.conectorSocket.on("data", (data) => {

                //here we assume that this data is http or http payload
                if (this.targetALPN === "h2") {

                    this.outboundFrameController.feedWithBufferOfFrames(data);

                } else {

                    this.requests.push(new HTTPObject(data));

                    //generate CONNECTOR_REQUEST event for state
                    this.refToGlobalState.handleStateChange({
                        changeCase: InterceptorState.CONNECTOR_REQUEST,
                        changeLocation: { connectionUID: this.connectorGeneratedUID, requestID: this.requests.length - 1 }
                    });

                }



                //encrypt and send data from browser to target
                this.socketToTarget.write(data);

            })

        })



        socketToTarget.on("error", (err) => {
            console.log(`error on socket to target: ${err}`);

        })



    }


    connectToTCPTarget() {

        const socketToTarget = net.connect({ port: 80, host: this.target });

        socketToTarget.setKeepAlive(true);

        socketToTarget.on("connect", () => {

            this.socketToTarget = socketToTarget;

            if (this.initialRequest !== null) { this.tcpPipe.write(this.initialRequest.toBinaryForm()); this.initialRequest = null; }

            //here comes response data from target
            socketToTarget.on("data", (data) => {

                this.responses.push(new HTTPObject(data));


                this.refToGlobalState.handleStateChange({
                    changeCase: InterceptorState.CONNECTOR_RESPONSE,
                    changeLocation: { connectionUID: this.connectorGeneratedUID, responseID: this.responses.length - 1 }
                });

                //write response data to tcp pipe that is connected to connector
                this.conectorSocket.write(data);

            })

        })

        //here comes data from browser 
        this.conectorSocket.on("data", (data) => {

            //here we assume that this data is http or http payload
            this.requests.push(new HTTPObject(data));

            //generate CONNECTOR_REQUEST event for state
            this.refToGlobalState.handleStateChange({
                changeCase: InterceptorState.CONNECTOR_REQUEST,
                changeLocation: { connectionUID: this.connectorGeneratedUID, requestID: this.requests.length - 1 }
            });

            //send data from browser to target
            this.socketToTarget.write(data);

        })

        socketToTarget.on("error", (err) => {
            console.log(`error on socket to target: ${err}`);

        })

    }

    //shuffle tls ciphers to prevent TLS fingerprinting
    static shuffleCiphers(ciphers) {

        /**
         * firefox order:
         * 'TLS_AES_128_GCM_SHA256'
         * 'TLS_CHACHA20_POLY1305_SHA256'
         * 'TLS_AES_256_GCM_SHA384'
         */
        const shuffledCiphers = [
            ciphers[2],
            ciphers[1],
            ciphers[0],
            ...ciphers.slice(3)
        ].join(':');



        return shuffledCiphers

    }

}



module.exports = InterceptorConnector