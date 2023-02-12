const { HTTPObject } = require("./InterceptorHTTP");
const InterceptorCertificate = require("./InterceptorCertificate");
const InterceptorConnector = require("./InterceptorConnector");
const InterceptorState = require("./InterceptorState.js");
const forge = require('node-forge');

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

    httpObject = null;

    tlsConnector = null;

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



        if (!this.httpObject) {

            this.httpObject = new HTTPObject(data);

        }

        if (!this.referenceToParentInterceptorInstance.interceptorState?.mainTarget ||
            this.httpObject.path.includes(this.referenceToParentInterceptorInstance.interceptorState.mainTarget)) {


            if (!this.tlsConnector) {

                // console.log(`CONNECT request for ${this.referenceToParentInterceptorInstance.target} came. request:\n\n ${data}`);



                this.certificateForTarget = new InterceptorCertificate(
                    this.referenceToParentInterceptorInstance.interceptorState?.mainTarget ||
                    HTTPObject.stripPortFromHost(this.httpObject.path)
                );


                let connectorUID = forge.util.bytesToHex(forge.random.getBytesSync(4));

                while (connectorUID in this.referenceToParentInterceptorInstance.interceptorState.connectors) {

                    connectorUID = forge.util.bytesToHex(forge.random.getBytesSync(4));

                }


                this.tlsConnector = new InterceptorConnector(
                    this.certificateForTarget.tempCert,
                    this.certificateForTarget.tempCertPrivateKey,
                    this.certificateForTarget.target,
                    this.socketReference,
                    this.referenceToParentInterceptorInstance.interceptorState,
                    connectorUID
                );


                // console.log(`connector instance for target ${this.referenceToParentInterceptorInstance.interceptorState.mainTarget} created`);

                this.referenceToParentInterceptorInstance.interceptorState.connectors[connectorUID] = this.tlsConnector;

                this.referenceToParentInterceptorInstance.interceptorState.handleStateChange({ changeCase: InterceptorState.CONNECTION_CREATED, changeLocation: { connectionUID: connectorUID } });


                this.socketReference.write("200 OK");



                this.socketReference.pause();

            } else {

                // console.log('encoded data from browser came');



            }


        } else {


            // console.log(`connection opened for non included target: ${this.httpObject.path}`);


            this.socketReference.end();



        }



    }

    handleClassError(error) {

        const communicat = `error in InterceptedSocket class: ${error}`;

        throw communicat

    }


}




module.exports = InterceptorConnection;