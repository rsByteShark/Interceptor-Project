const { HTTPObject } = require("./InterceptorHTTP");
const forge = require('node-forge');

/**
 * @class InterceptorState
 * @private 
 * @description Internal state of InterceptorServer class instance stores all server informations and intercepted connections
 *  also has a capability to provide backend state to GUI
 * @param {number} serverPort port on wich InterceptorServer HTTPproxy server is listening
 * @param {Electron.MessagePortMain} guiCommunicationPort object that contains postMessage function that sends data to GUI 
 */
class InterceptorState {

    connectionsCounter = 0

    connectors = {};

    serverPort = "-";

    mainTarget = null

    guiCommunicationPort = null;

    constructor(serverPort, guiCommunicationPort, mainTarget) {

        this.mainTarget = mainTarget;

        this.serverPort = serverPort;

        this.guiCommunicationPort = guiCommunicationPort;



    }


    /**
     * @typedef {Object} ConnectionState
     * @property {Array.<HTTPObject>} requests array of outbond HTTP traffic 
     * @property {Array.<HTTPObject>} responses array of inbound HTTP traffic 
     * @property {string} target target domain of this connection
     * @property {number} connectionUID unique ID of connection
     */
    /**
     * @typedef {Object} StateChangeCase
     * @property {string} changeCase - external state change case ("CONNECTION_CREATED" || "CONNECTOR_REQUEST" || "CONNECTOR_RESPONSE" || "ALL")
     * @property {Object} [changeLocation] - in case of "CONNECTOR_REQUEST" || "CONNECTOR_RESPONSE || CONNECTION_CREATED", location of changed or created element
     * @property {(HTTPObject | number)} [changeData] - in case of "CONNECTOR_REQUEST" || "CONNECTOR_RESPONSE", `HTTPObject` that was added or 
     * in case of "CONNECTION_CREATED" count of all connections
     */

    /**
     * @typedef {Object} GUIStateObject
     * @property {Array.<ConnectionState>} connections list of intercepted connections with their HTTP traffic
     * @property {("-"|number)} interceptorProxyServerPort port of proxy server
     * @property {number} connectionsCounter quantity of intercepted connections
     * @property {string} changeCase - external state change case ("CONNECTION_CREATED" || "CONNECTOR_REQUEST" || "CONNECTOR_RESPONSE" || "ALL")
     */

    /**
     * 
     * @param {StateChangeCase} caseObject contains change reason and optional change data
     */
    handleStateChange = (caseObject) => {

        const stateObjectForGui = this.createStateObjectForGui(caseObject);


        this.guiCommunicationPort.postMessage(stateObjectForGui);

    }

    /**
     * @description creates minimalistic and safe `GUIStateObject` of `InterceptorState` instance for GUI. Or creates `GUIUpdateStateObject`
     * that informs wich part of existing on frontend `GUIStateObject` to update
     * @param {StateChangeCase} caseObject contains change reason and changed data
     * @returns  {(GUIStateObject | StateChangeCase)} 
     */
    createStateObjectForGui(caseObject) {

        const retObj = {};

        switch (caseObject.changeCase) {
            case InterceptorState.ALL:

                retObj.changeCase = InterceptorState.ALL

                const connectionsObj = {};

                for (const key in this.connectors) {

                    const connector = this.connectors[key];

                    connectionsObj[key] = {

                        requests: connector.requests,

                        responses: connector.responses,

                        target: connector.target,

                    };

                }

                //test connection object
                connectionsObj[forge.util.bytesToHex(forge.random.getBytesSync(4))] = {

                    requests: [],

                    responses: [],

                    target: "example.com",

                }
                retObj.connections = connectionsObj;

                retObj.interceptorProxyServerPort = this.serverPort;

                retObj.connectionsCounter = this.connectionsCounter;

                break;

            case InterceptorState.CONNECTION_CREATED:

                const createdConnector = this.connectors[caseObject.changeLocation.connectionUID];


                const connectionObject = {

                    target: createdConnector.target,

                    connectionUID: caseObject.changeLocation.connectionUID,

                    ALPN: createdConnector.targetALPN,

                };

                retObj.changeCase = InterceptorState.CONNECTION_CREATED;

                retObj.changeData = connectionObject

                retObj.changeLocation = caseObject.changeLocation;



                break;

            case InterceptorState.CONNECTOR_REQUEST:

                retObj.changeCase = InterceptorState.CONNECTOR_REQUEST;

                retObj.changeLocation = caseObject.changeLocation;

                retObj.changeData = this.connectors[caseObject.changeLocation.connectionUID].requests[caseObject.changeLocation.requestID];

                break;

            case InterceptorState.CONNECTOR_RESPONSE:


                retObj.changeCase = InterceptorState.CONNECTOR_RESPONSE;

                retObj.changeLocation = caseObject.changeLocation;

                retObj.changeData = this.connectors[caseObject.changeLocation.connectionUID].responses[caseObject.changeLocation.responseID];



                break;
            case InterceptorState.CONNECTION_COUNTER:

                retObj.changeCase = InterceptorState.CONNECTION_COUNTER;

                retObj.changeData = this.connectionsCounter;

                break;
            case InterceptorState.NEW_FRAMES:

                retObj.changeCase = InterceptorState.NEW_FRAMES;

                retObj.changeLocation = caseObject.changeLocation;

                if (caseObject.changeLocation.direction === "OUT") retObj.changeData = this.connectors[caseObject.changeLocation.connectorID].outboundFrameController.framesPortions[caseObject.changeLocation.index];
                else retObj.changeData = this.connectors[caseObject.changeLocation.connectorID].inboundFrameController.framesPortions[caseObject.changeLocation.index];



                break;
            case InterceptorState.FRAME_UPDATE:

                retObj.changeCase = InterceptorState.FRAME_UPDATE;

                retObj.changeLocation = caseObject.changeLocation;

                if (caseObject.changeLocation.direction === "OUT") retObj.changeData = this.connectors[caseObject.changeLocation.connectorID].outboundFrameController.framesPortions[caseObject.changeLocation.partialIndex][caseObject.changeLocation.frameIndex];
                else retObj.changeData = this.connectors[caseObject.changeLocation.connectorID].inboundFrameController.framesPortions[caseObject.changeLocation.partialIndex][caseObject.changeLocation.frameIndex];


                break;
            default:
                const throwString = `unknown state change case recived: ${caseObject.changeCase}`
                throw throwString
        }


        if (caseObject.changeCase !== InterceptorState.CONNECTION_COUNTER) console.log(retObj);



        return retObj
    }


    _connections = [];

    get interceptedConnections() {

        return this._connections;

    }

    set addInterceptedConnection(connection) {

        this._connections.push(connection);

    }

    //events
    static CONNECTION_CREATED = "CONNECTION_CREATED";
    static CONNECTOR_REQUEST = "CONNECTOR_REQUEST";
    static CONNECTOR_RESPONSE = "CONNECTOR_RESPONSE";
    static CONNECTION_COUNTER = "CONNECTION_COUNTER";
    static FRAME_UPDATE = "FRAME_UPDATE";
    static NEW_FRAMES = "NEW_FRAMES";
    static ALL = "ALL";

}

module.exports = InterceptorState