import * as React from 'react';
import Stack from '@mui/material/Stack';
// import FileDownloadIcon from '@mui/icons-material/FileDownload';
// import FileUploadIcon from '@mui/icons-material/FileUpload';


export default function ConnectionsList(props) {

    const connectionsObj = Object.keys(props.backendState.connectionsObj).length ? props.backendState.connectionsObj :
        [];


    const ADJUST_DIV_WIDTH = 4;

    const [componentHeigth, setComponentHeight] = React.useState(window.innerHeight - 86);

    const [showConnectionData, setShowConnectionData] = React.useState(false);

    const [connectionTrafficWindowWidth, setCTW] = React.useState(window.innerWidth / 2);

    const [markedConnection, setMarkedConnection] = React.useState(null);


    React.useEffect(() => {

        function handleResize() {


            setComponentHeight(window.innerHeight - 86);

            setCTW(window.innerWidth / 2);

        }

        window.addEventListener('resize', handleResize);


    });


    const styleObjects = {
        stickyInfoWindow: {
            display: showConnectionData ? "flex" : "none",
            flexDirection: "column",
            width: `${connectionTrafficWindowWidth}px`,
            height: `${componentHeigth}px`, position: "sticky",
            top: "0px",
        },

        scalableConnectionsContainer: {
            flexGrow: "1", height: `${componentHeigth}px`,
            width: `${window.innerWidth - (connectionTrafficWindowWidth + ADJUST_DIV_WIDTH)}px`,
        },

        adjustWidthDiv: {
            display: `${showConnectionData ? "flex" : "none"}`,
            width: `${ADJUST_DIV_WIDTH}px`, backgroundColor: "grey",
            height: `${componentHeigth}px`,
            cursor: "w-resize",
        },

        connectionsContainerGrid: {
            width: "25%",
            height: "20px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            padding: "0px 5px 0px 0px",
        },

        reqResContainers: { display: "flex", flexDirection: "column", height: "50%", overflowY: "auto" },

    }



    const resizeWidth = (e) => {

        setCTW(window.innerWidth - e.x);

    }
    return (


        <Stack style={{ overflow: "auto", userSelect: "none" }} direction={"row"}>

            <Connections
                scalableConnectionsContainerStyle={styleObjects.scalableConnectionsContainer}
                connectionsContainerGridStyle={styleObjects.connectionsContainerGrid}
                connectionsObj={connectionsObj}
                markedConnection={markedConnection}
                setMarkedConnection={setMarkedConnection}
                setShowConnectionData={setShowConnectionData}
            />


            <div
                onMouseDown={() => {

                    // m_pos = e.x;
                    document.addEventListener("mousemove", resizeWidth, false);

                    document.addEventListener("mouseup", () => { document.removeEventListener("mousemove", resizeWidth, false) }, false);

                }}
                style={styleObjects.adjustWidthDiv} />

            <StickyInfoWindow
                stickyInfoWindowStyle={styleObjects.stickyInfoWindow}
                reqResContainersStyle={styleObjects.reqResContainers}
                connectionsContainerGridStyle={styleObjects.connectionsContainerGrid}
                markedConnection={markedConnection}
                connectionsObj={connectionsObj}
            />

        </Stack>



    )

}


const handleHoverOverflow = (e) => {
    if (e.target.scrollWidth > e.target.clientWidth) {
        e.target.title = e.target.textContent;
    } else if (e.target.title) {
        e.target.removeAttribute("title");
    }
}

const highLightConnection = (e) => {

    e.target = e.target.id ? e.target : e.target.parentElement

    e.target.style.boxShadow = "inset 0 0 1px red";
    e.target.style.backgroundColor = "#272A2C"

};

const removeHighLightConnection = (e) => {

    e.target = e.target.id ? e.target : e.target.parentElement

    if (typeof e.target.getAttribute("active") !== "string") {

        e.target.style.boxShadow = "";
        e.target.style.backgroundColor = "";

    }

}

const markConnection = (e, markedConnection, setMarkedConnection, setShowConnectionData) => {

    e.target = e.target.id ? e.target : e.target.parentElement



    if (markedConnection) {

        if (markedConnection !== e.target) {
            markedConnection.removeAttribute("active");
            markedConnection.style.boxShadow = "";
            markedConnection.style.backgroundColor = "";
            e.target.setAttribute("active", "");


            setMarkedConnection(e.target)



        }


    } else {

        e.target.setAttribute("active", "");

        setMarkedConnection(e.target)

    }






    setShowConnectionData(true);



}


const Connections = (props) => {

    return <Stack style={props.scalableConnectionsContainerStyle} direction={"column"}>
        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
            <div style={{ ...props.connectionsContainerGridStyle, width: "20%" }} >Connection UID</div>
            <div style={{ ...props.connectionsContainerGridStyle, width: "40%" }} >Target</div>
            <div style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >ALPN</div>
            <div style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >State</div>
            <div style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >Data Out</div>
            <div style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >Data In</div>
        </div>
        {(() => {

            const retArr = [];

            for (const key in props.connectionsObj) {

                retArr.push(
                    <div
                        id={key}

                        key={key}

                        style={{ display: "flex" }}

                        onClick={e => markConnection(e, props.markedConnection, props.setMarkedConnection, props.setShowConnectionData)}
                    >

                        <div
                            style={{ ...props.connectionsContainerGridStyle, width: "20%" }}
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                        >{key}</div>
                        <div
                            onMouseOver={handleHoverOverflow}
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={{ ...props.connectionsContainerGridStyle, margin: "0px 5px 0px 0px", width: "40%" }} >{props.connectionsObj[key].target}</div>
                        <div
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >{props.connectionsObj[key].ALPN || "unknown"}</div>
                        <div
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >-</div>
                        <div
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >{props.connectionsObj[key].dataOut.length}</div>
                        <div
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={{ ...props.connectionsContainerGridStyle, width: "10%" }} >{props.connectionsObj[key].dataIn.length}</div>

                    </div>

                )

            }

            return retArr

        })()}
    </Stack>

}


const StickyInfoWindow = (props) => {

    if (props.markedConnection?.id) {


        switch (props.connectionsObj[props.markedConnection.id].ALPN) {

            case "http/1.1":

                return <div style={props.stickyInfoWindowStyle}>

                    <div style={props.reqResContainersStyle}>
                        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "100%" }} >Data Out</div>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={props.connectionsContainerGridStyle} >type</div>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >path</div>
                        </div>
                        {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].dataOut.map((httpObject) => {

                            // if (httpObject.type === undefined) console.log(httpObject);
                            const randomId = Math.round(Math.random() * 10000000 + new Date().getTime());

                            return <div key={randomId} style={{ display: "flex" }}>
                                <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{httpObject.path}</div>
                            </div>

                        }) : null
                        }
                    </div>
                    <div style={props.reqResContainersStyle}>
                        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "100%" }} >Data In</div>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={props.connectionsContainerGridStyle} >type</div>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >entity size</div>
                        </div>
                        {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].dataIn.map((httpObject) => {

                            // if (httpObject.type === undefined) console.log(httpObject);

                            const randomId = Math.round(Math.random() * 10000000 + new Date().getTime());

                            return <div key={randomId} style={{ display: "flex" }}>
                                <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{Object.keys(httpObject.httpEntity).length}</div>
                            </div>

                        }) : null
                        }
                    </div>
                </div>

                break;

            case "h2":

                return <div style={props.stickyInfoWindowStyle}>

                    <div style={props.reqResContainersStyle}>
                        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "100%" }} >Data Out</div>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={props.connectionsContainerGridStyle} >type</div>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >frame size</div>
                        </div>
                        {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].dataOut.map((httpObject) => {

                            // if (httpObject.type === undefined) console.log(httpObject);

                            const randomId = Math.round(Math.random() * 1000000 + new Date().getTime());

                            return <div key={randomId} style={{ display: "flex" }}>
                                <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{httpObject.frameSize}</div>
                            </div>

                        }) : null
                        }
                    </div>
                    <div style={props.reqResContainersStyle}>
                        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "100%" }} >Data In</div>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={props.connectionsContainerGridStyle} >type</div>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >frame size</div>
                        </div>
                        {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].dataIn.map((httpObject) => {

                            // if (httpObject.type === undefined) console.log(httpObject);

                            const randomId = Math.round(Math.random() * 1000000 + new Date().getTime());

                            return <div key={randomId} style={{ display: "flex" }}>
                                <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{httpObject.frameSize}</div>
                            </div>

                        }) : null
                        }
                    </div>
                </div>

                break;

            default:

                console.log(JSON.stringify(props.connectionsObj[props.markedConnection.id]));


                return <div style={props.stickyInfoWindowStyle}>

                    <div style={props.reqResContainersStyle}>
                        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "100%" }} >Data Out</div>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={props.connectionsContainerGridStyle} >type</div>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >data size</div>
                        </div>
                        {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].dataOut.map((httpObject) => {

                            // if (httpObject.type === undefined) console.log(httpObject);

                            const randomId = Math.round(Math.random() * 1000000 + new Date().getTime());

                            return <div key={randomId} style={{ display: "flex" }}>
                                <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{Object.keys(httpObject.httpEntity).length}</div>
                            </div>

                        }) : null
                        }
                    </div>
                    <div style={props.reqResContainersStyle}>
                        <div style={{ display: "flex", position: "sticky", top: "0px", backgroundColor: "black" }}>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "100%" }} >Data Out</div>
                        </div>
                        <div style={{ display: "flex" }}>
                            <div style={props.connectionsContainerGridStyle} >type</div>
                            <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >data size</div>
                        </div>
                        {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].dataIn.map((httpObject) => {

                            // if (httpObject.type === undefined) console.log(httpObject);

                            const randomId = Math.round(Math.random() * 1000000 + new Date().getTime());

                            return <div key={randomId} style={{ display: "flex" }}>
                                <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{Object.keys(httpObject.httpEntity).length}</div>
                            </div>

                        }) : null
                        }
                    </div>
                </div>
        }


    } else {

        return null

    }




}





















