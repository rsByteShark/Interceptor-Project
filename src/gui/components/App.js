import React, { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import BasicTabs from "./Tab";



const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
    typography: {

        fontSize: 12,

    },
});




function App() {


    const [backendState, setBackendState] = React.useState({

        connectionsObj: {},
        connectionsCounter: 0,
        interceptorProxyServerPort: "-",

    });

    //ipc communication main loop
    window.onmessage = (event) => {

        if (event.source === window && event.data === 'main-world-port') {
            const [port] = event.ports

            console.log("PORT CAME");




            port.start();
            port.postMessage("APP_READY");

            port.onmessage = (event) => {


                switch (event.data.changeCase) {
                    case "ALL":

                        const newState = {

                            connectionsObj: event.data.connections,
                            interceptorProxyServerPort: event.data.interceptorProxyServerPort,
                            connectionsCounter: event.data.connectionsCounter
                        };


                        setBackendState(newState)




                        break;
                    case "CONNECTION_CREATED":
                        // console.log(event.data);


                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            updateConnectionsObj[event.data.changeLocation.connectionUID] = event.data.changeData;

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })



                        break;
                    case "CONNECTOR_REQUEST":
                        // console.log(event.data);

                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            updateConnectionsObj[event.data.changeLocation.connectionUID].dataOut[event.data.changeLocation.requestID] = event.data.changeData;

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })



                        break;
                    case "CONNECTOR_RESPONSE":
                        // console.log(event.data);

                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            updateConnectionsObj[event.data.changeLocation.connectionUID].dataIn[event.data.changeLocation.responseID] = event.data.changeData;

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })


                        break;
                    case "CONNECTION_COUNTER":

                        setBackendState(prevState => { return { ...prevState, connectionsCounter: event.data.changeData } });


                        break;
                    case "NEW_FRAMES":

                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            if (event.data.changeLocation.direction === "OUT") {

                                const outDataArr = updateConnectionsObj[event.data.changeLocation.connectorID].dataOut;

                                event.data.changeData.forEach(frame => {

                                    if (!frame?.type) console.log(JSON.stringify(event.data));

                                    outDataArr.push(frame);

                                })

                            } else {

                                const inDataArr = updateConnectionsObj[event.data.changeLocation.connectorID].dataIn;

                                event.data.changeData.forEach(frame => {

                                    if (!frame?.type) console.log(JSON.stringify(event.data));

                                    inDataArr.push(frame);

                                })

                            }

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })


                        break;
                    case "FRAME_UPDATE":

                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            if (event.data.changeLocation.direction === "OUT") {

                                updateConnectionsObj[event.data.changeLocation.connectorID].dataOut[event.data.changeLocation.orderIndex] = event.data.changeData;

                            } else {

                                updateConnectionsObj[event.data.changeLocation.connectorID].dataIn[event.data.changeLocation.orderIndex] = event.data.changeData;

                            }

                            if (!event.data.changeData?.type) console.log(JSON.stringify(event.data));

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })


                        break;
                    default:

                        break;
                }





            }
        }
    }


    return (

        <ThemeProvider theme={darkTheme}>
            <CssBaseline enableColorScheme />
            <main style={{ height: "100vh", overflow: "hidden" }} >
                <BasicTabs backendState={backendState} />
            </main>
        </ThemeProvider>


    );
}

export default App;


