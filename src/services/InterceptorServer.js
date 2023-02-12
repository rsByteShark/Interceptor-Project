const net = require("net");
const InterceptorState = require("./InterceptorState");
const InterceptorConnection = require("./InterceptorConnection");

// const stream = createWriteStream("./keylog.log", { flags: "a" });

/**
 * Options for interceptor server
 * @typedef {Object} InterceptorServerOptions
 * @property {number} [port = 8000] -port on wich proxy server will listen for browser traffic.
 * @property {string} [target = null] - targeted domain (this instance of `InterceptorServer` will only handle traffic to and from that domain).
 * @property {Electron.MessagePortMain} [guiCommunicationPortRef = {postMessage: ()=>{}}] - reference to ipc communication port for sending backend Interceptor app state to front view.
 */

/**
 * @class Interceptor server class
 * 
 * @private
 * 
 * @description creates proxy server that handle connection requests from browser
 * also creates instance of `InterceptorState` class that gathers informations about connections and traffic
 * 
 * @param {InterceptorServerOptions} serverOptions -options for this instance of Interceptor server
 */
class InterceptorServer {

    constructor(serverOptions = {}) {


        this.interceptorState = new InterceptorState(serverOptions?.port || 8000, serverOptions?.guiCommunicationPortRef || { postMessage: () => { } }, serverOptions?.target || null);

        this.HTTPProxyServer = net.createServer(this.tcpConnectionListener.bind(this));

        this.initTcpProxyServer();

        this.interceptorState.handleStateChange({ changeCase: InterceptorState.ALL });

    }

    initTcpProxyServer() {

        this.HTTPProxyServer.listen(this.interceptorState.serverPort, () => {

            console.log(`http proxy server ready on port ${this.interceptorState.serverPort} ${this.interceptorState.mainTarget ? `for target ${this.interceptorState.mainTarget}` : null}`);

        })

    }

    /**
     * @description when browser send connection request this function creates new connection entry in `interceptorState`
     * and fills it with newly created instance of `InterceptedConnection`
     * 
     * @param {net.Socket} socket browser socket
     */
    tcpConnectionListener(socket) {


        this.interceptorState.addInterceptedConnection = new InterceptorConnection(socket, this);


    }

}






module.exports = InterceptorServer;

