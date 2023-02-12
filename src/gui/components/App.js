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

            port.start();
            port.postMessage("APP_READY");

            port.onmessage = (event) => {


                switch (event.data.changeCase) {
                    case "ALL":
                        console.log(event.data);

                        const newState = {

                            connectionsObj: event.data.connections,
                            interceptorProxyServerPort: event.data.interceptorProxyServerPort,
                            connectionsCounter: event.data.connectionsCounter
                        };


                        setBackendState(newState)



                        break;
                    case "CONNECTION_CREATED":
                        console.log(event.data);
                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            console.log("READED");


                            updateConnectionsObj[event.data.changeLocation.connectionUID] = event.data.changeData;

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })

                        break;
                    case "CONNECTOR_REQUEST":
                        console.log(event.data);
                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            updateConnectionsObj[event.data.changeLocation.connectionUID].requests[event.data.changeLocation.requestID] = event.data.changeData;

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })

                        break;
                    case "CONNECTOR_RESPONSE":
                        console.log(event.data);
                        setBackendState(prevState => {
                            const updateConnectionsObj = { ...prevState.connectionsObj };

                            updateConnectionsObj[event.data.changeLocation.connectionUID].responses[event.data.changeLocation.responseID] = event.data.changeData;

                            return { ...prevState, connectionsObj: updateConnectionsObj };
                        })

                        break;
                    case "CONNECTION_COUNTER":

                        setBackendState(prevState => { return { ...prevState, connectionsCounter: event.data.changeData } });


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


