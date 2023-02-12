//Entry point for electron app
const { app, BrowserWindow, ipcMain, MessageChannelMain } = require('electron')
const path = require('path');
const Interceptor = require("./src/services/InterceptorServer");
const fs = require("fs");


app.whenReady().then(async () => {
    // Create a BrowserWindow with contextIsolation enabled.
    const bw = new BrowserWindow({
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'src', 'gui', 'js', 'electron_preload.js')
        }
    })


    console.log(__dirname);


    //resolve development mode
    if (process.env.DEV_MODE) {

        bw.loadURL("http://localhost:5000/")

    } else {


        bw.loadFile('./build/index.html');

    };



    //create electron communication channel for comunication with react frontend in electron app
    const { port1, port2 } = new MessageChannelMain()


    //put message in send queue where it will be wait for deliver to front
    // port2.postMessage({ test: __dirname })

    //activate port
    port2.start();

    let serverInstanceCreated = false;

    port2.on("message", (mes) => {

        console.log(`message came ${mes.data}`);

        if (!serverInstanceCreated) {

            new Interceptor({ guiCommunicationPortRef: port2 });

            serverInstanceCreated = true;

        }


    })




    // The preload script will receive this IPC message and transfer the port
    // over to frontend.
    bw.webContents.postMessage('main-world-port', null, [port1])
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})