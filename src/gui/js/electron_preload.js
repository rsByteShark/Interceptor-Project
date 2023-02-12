const { contextBridge, ipcRenderer } = require('electron')



const windowLoaded = new Promise(resolve => {
    window.onload = resolve;
});




ipcRenderer.on('main-world-port', async (event) => {
    await windowLoaded
    // We use regular window.postMessage to transfer the port from the isolated
    // world to the main world.

    console.log('message sent 1', event);


    window.postMessage('main-world-port', '*', event.ports)
})




