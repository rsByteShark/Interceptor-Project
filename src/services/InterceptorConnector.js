const tls = require("tls");
const net = require("net");
const { HTTPObject } = require("./InterceptorHTTP");
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

    static connectorCiphers = tls.DEFAULT_CIPHERS.split(':');

    constructor(tempCert = null, tempCertPrivateKey = null, connectorTarget, dataSourceSocket, globalStateReference, connectorGeneratedUID) {

        this.dataSourceSocket = dataSourceSocket;

        this.target = connectorTarget;

        this.refToGlobalState = globalStateReference

        this.connectorGeneratedUID = connectorGeneratedUID;


        if (tempCert && tempCertPrivateKey) {

            this.connector = tls.createServer({ key: tempCertPrivateKey, cert: tempCert });

            this.initConnectorTLSServer();

        } else {

            this.connector = net.createServer();

            this.initConnectorTCPServer();

        }


    }


    initConnectorTLSServer() {


        this.connector.on("secureConnection", this.handleOutboundTraffic.bind(this))


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



            this.dataSourceSocket.on("data", (data) => {


                this.tcpPipe.write(data);



            })




        })


    }


    initConnectorTCPServer() {

        this.connector.on("connection", this.handleOutboundTraffic);

        this.connector.on("error", (err) => {
            console.log(err);

        })


        this.connector.listen()

        this.connectorPort = this.connector.address().port;
    }


    connectToTarget() {

        const socketToTarget = tls.connect({
            rejectUnauthorized: true,
            port: 443,
            host: this.target,
            servername: this.target,
            ciphers: InterceptorConnector.shuffleCiphers(InterceptorConnector.connectorCiphers)
        });

        socketToTarget.setKeepAlive(true);


        socketToTarget.on("secureConnect", () => {

            this.socketToTarget = socketToTarget;

            socketToTarget.on("data", (data) => {


                this.responses.push(new HTTPObject(data));

                this.refToGlobalState.handleStateChange({
                    changeCase: InterceptorState.CONNECTOR_RESPONSE,
                    changeLocation: { connectionUID: this.connectorGeneratedUID, responseID: this.responses.length - 1 }
                });

                this.conectorSocket.write(data);

            })

            this.conectorSocket.on("data", (data) => {


                this.requests.push(new HTTPObject(data))

                this.refToGlobalState.handleStateChange({
                    changeCase: InterceptorState.CONNECTOR_REQUEST,
                    changeLocation: { connectionUID: this.connectorGeneratedUID, requestID: this.requests.length - 1 }
                });

                this.socketToTarget.write(data);

            })

        })



        socketToTarget.on("error", (err) => {
            console.log(`error on socket to target: ${err}`);

        })



    }


    handleOutboundTraffic(connectorSocket) {

        this.conectorSocket = connectorSocket;


        this.connectToTarget();


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