const { HTTPObject } = require("./InterceptorHTTP");
const InterceptorCertificate = require("./InterceptorCertificate");
const InterceptorConnector = require("./InterceptorConnector");
const InterceptorState = require("./InterceptorState.js");
const forge = require('node-forge');
const net = require("net");
const tls = require("tls");

/**
 * @class
 * @private
 * @description respresents 
 * @param {net.Socket} socketReference reference to intercepted socket
 * @param {InterceptorServer} refToInterceptorInstance reference to instance of `InterceptorServer` that created this instance of `InterceptorConnection`
 */
class InterceptorConnection {

    referenceToParentInterceptorInstance = null;

    socketReference = null;

    socketUid = null;

    httpConnectRequestObject = null;

    connector = null;

    connectionTarget = null;

    connectionPort = null;



    constructor(socketReference, refToInterceptorInstance) {

        this.socketReference = socketReference || this.handleClassError(`socket reference is ${socketReference}`)

        this.referenceToParentInterceptorInstance = refToInterceptorInstance || this.handleClassError(`reference to main Interceptor class instance is ${refToInterceptorInstance}`);

        this.initSocketInterception();

    }


    initSocketInterception() {

        // this.socketReference.pause();

        this.socketReference.uid = this.referenceToParentInterceptorInstance.interceptorState.connectionsCounter;

        this.socketUid = this.referenceToParentInterceptorInstance.interceptorState.connectionsCounter;

        // this.socketReference.setEncoding = "utf-8";

        this.referenceToParentInterceptorInstance.interceptorState.connectionsCounter++;

        this.referenceToParentInterceptorInstance.interceptorState.handleStateChange({ changeCase: InterceptorState.CONNECTION_COUNTER })

        this.socketReference.on("close", (hasError) => {

            // console.log(`socket ${this.socketReference.uid} closed ${hasError ? "with" : "without"} error`);

        })


        this.socketReference.on("error", (err) => {

            console.log("socket porbably disconnect");


        })


        this.socketReference.on("data", this.handleOutboundTraffic.bind(this))


    }


    handleOutboundTraffic = (data) => {

        //if connect request object don't exists that means browser send connect request to proxy that we want interpret
        if (!this.httpConnectRequestObject) {

            this.httpConnectRequestObject = new HTTPObject(data);

            const x = data.toString();

            if (this.httpConnectRequestObject.method === "CONNECT") {

                const connectionPortAndHost = HTTPObject.getPortAndHost(this.httpConnectRequestObject.path)

                if (!(connectionPortAndHost?.host)) throw "undefined connection host";

                this.connectionTarget = connectionPortAndHost.host;

                this.connectionPort = connectionPortAndHost.port

                //check if connection port is valid for https
                if (this.connectionPort == 443) this.connectionKind = "https"
                else { const throwString = `browser wants to connect to unknown foregin port: ${this.connectionKind}`; throw throwString };

            } else {

                this.connectionKind = "http";
                if (this.httpConnectRequestObject.headers?.["Host"]) this.connectionTarget = this.httpConnectRequestObject.headers?.["Host"];
                else throw "recived http call for unknown host"
            }



        }

        //connection target check
        if (!this.referenceToParentInterceptorInstance.interceptorState?.mainTarget ||
            this.httpConnectRequestObject.path.includes(this.referenceToParentInterceptorInstance.interceptorState.mainTarget)) {

            //if connector for this connection don't exist create it based on connectRequestObject
            if (!this.connector) {


                //create fake tls certificate if connection is https
                let certificateForTarget = null;
                if (this.connectionKind === "https") {

                    certificateForTarget = new InterceptorCertificate(
                        this.referenceToParentInterceptorInstance.interceptorState?.mainTarget ||
                        this.connectionTarget
                    )

                }

                //create unique UID for connector
                let connectorUID = forge.util.bytesToHex(forge.random.getBytesSync(4));

                while (connectorUID in this.referenceToParentInterceptorInstance.interceptorState.connectors) {

                    connectorUID = forge.util.bytesToHex(forge.random.getBytesSync(4));

                }

                //create connector
                this.connector = new InterceptorConnector(
                    certificateForTarget?.tempCert,
                    certificateForTarget?.tempCertPrivateKey,
                    certificateForTarget?.target || this.connectionTarget,
                    this.socketReference,
                    this.referenceToParentInterceptorInstance.interceptorState,
                    connectorUID,
                    this.connectionKind === "http" ? this.httpConnectRequestObject : null,
                );

                //add created connector to connectors in state
                this.referenceToParentInterceptorInstance.interceptorState.connectors[connectorUID] = this.connector;

                //notify data source socket about connection creation
                if (this.connectionKind === "https") this.socketReference.write("200 OK");
                this.socketReference.pause();

            } else {

                //there will came next encoded or not data from browser for target

            }


        } else {

            //close data source socket that wants to make connection to non included target
            this.socketReference.end();

        }



    }

    handleClassError(error) {

        const communicat = `error in InterceptedSocket class: ${error}`;

        throw communicat

    }


}




module.exports = InterceptorConnection;