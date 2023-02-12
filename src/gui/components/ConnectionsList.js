import * as React from 'react';
import Stack from '@mui/material/Stack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';


export default function ConnectionsList(props) {

    const connectionsObj = Object.keys(props.backendState.connectionsObj).length ? props.backendState.connectionsObj :
        [{ target: "1", requests: [1, 2, 3], responses: [1, 2, 3, 45] }];


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

            console.log('setting active');


            setMarkedConnection(e.target)



        }


    } else {

        e.target.setAttribute("active", "");

        setMarkedConnection(e.target)

    }

    console.log(e.target);




    setShowConnectionData(true);



}


const Connections = (props) => {

    return <Stack style={props.scalableConnectionsContainerStyle} direction={"column"}>
        <div style={{ display: "flex" }}>
            <div style={props.connectionsContainerGridStyle} >Connection UID</div>
            <div style={props.connectionsContainerGridStyle} > Target</div>
            <div style={props.connectionsContainerGridStyle} >Requests</div>
            <div style={props.connectionsContainerGridStyle} >Responses</div>
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
                            style={props.connectionsContainerGridStyle}
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                        >{key}</div>
                        <div
                            onMouseOver={handleHoverOverflow}
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={{ ...props.connectionsContainerGridStyle, margin: "0px 5px 0px 0px" }} >{props.connectionsObj[key].target}</div>
                        <div
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={props.connectionsContainerGridStyle} >{props.connectionsObj[key].requests.length}</div>
                        <div
                            onMouseLeave={removeHighLightConnection}
                            onMouseEnter={highLightConnection}
                            style={props.connectionsContainerGridStyle} >{props.connectionsObj[key].responses.length}</div>

                    </div>

                )

            }

            return retArr

        })()}
    </Stack>

}


const StickyInfoWindow = (props) => {

    return <div style={props.stickyInfoWindowStyle}>

        <div style={props.reqResContainersStyle}>
            <div style={{ display: "flex" }}>
                <div style={{ ...props.connectionsContainerGridStyle, width: "5%" }} ></div>
                <div style={props.connectionsContainerGridStyle} >type</div>
                <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >path</div>
            </div>
            {props.markedConnection?.id ? props.connectionsObj[props.markedConnection.id].requests.map((httpObject) => {

                return <div style={{ display: "flex" }}>
                    <div style={{ ...props.connectionsContainerGridStyle, width: "5%" }} ><FileUploadIcon /></div>
                    <div style={props.connectionsContainerGridStyle} >{httpObject.type}</div>
                    <div style={{ ...props.connectionsContainerGridStyle, width: "70%" }} >{httpObject.path}</div>
                </div>

            }) : null
            }
        </div>
        <div style={props.reqResContainersStyle}>
            responses
        </div>
    </div>
}
























// import * as React from 'react';
// import Stack from '@mui/material/Stack';
// import FileDownloadIcon from '@mui/icons-material/FileDownload';
// import FileUploadIcon from '@mui/icons-material/FileUpload';


// export default function ConnectionsList(props) {

//     const connectionsObj = Object.keys(props.backendState.connectionsObj).length ? props.backendState.connectionsObj : {};


//     const ADJUST_DIV_WIDTH = 4;

//     const [componentHeigth, setComponentHeight] = React.useState(window.innerHeight - 86);

//     const [showConnectionData, setShowConnectionData] = React.useState(false);

//     const [connectionTrafficWindowWidth, setCTW] = React.useState(window.innerWidth / 2);

//     const [markedConnection, setMarkedConnection] = React.useState(null);



//     React.useEffect(() => {

//         function handleResize() {


//             setComponentHeight(window.innerHeight - 86);

//             setCTW(window.innerWidth / 2);

//         }

//         window.addEventListener('resize', handleResize);


//     });


//     const stickyInfoWindow = {
//         display: showConnectionData ? "flex" : "none",
//         flexDirection: "column",
//         width: `${connectionTrafficWindowWidth}px`,
//         height: `${componentHeigth}px`, position: "sticky",
//         top: "0px",
//     }

//     const scalableConnectionsContainer = { flexGrow: "1", height: `${componentHeigth}px`, width: `${window.innerWidth - (connectionTrafficWindowWidth + ADJUST_DIV_WIDTH)}px` };

//     const adjustWidthDiv = { display: `${showConnectionData ? "flex" : "none"}`, width: `${ADJUST_DIV_WIDTH}px`, backgroundColor: "grey", height: `${componentHeigth}px`, cursor: "w-resize" };

//     const connectionsContainerGrid = { width: "25%", height: "20px", overflow: "hidden", whiteSpace: "nowrap", padding: "0px 5px 0px 0px" };

//     const reqResContainers = { display: "flex", flexDirection: "column", height: "50%", overflowY: "auto" };

//     const resizeWidth = (e) => {

//         setCTW(window.innerWidth - e.x);

//     }
//     return (


//         <Stack style={{ overflow: "auto", userSelect: "none" }} direction={"row"}>
//             <Stack style={scalableConnectionsContainer} direction={"column"}>
//                 <div style={{ display: "flex" }}>
//                     <div style={connectionsContainerGrid} >Connection UID</div>
//                     <div style={connectionsContainerGrid} > Target</div>
//                     <div style={connectionsContainerGrid} >Requests</div>
//                     <div style={connectionsContainerGrid} >Responses</div>
//                 </div>
//                 {(() => {

//                     const retArr = [];

//                     for (const key in connectionsObj) {

//                         retArr.push(
//                             <div
//                                 id={key}

//                                 key={key}

//                                 style={{ display: "flex" }}

//                                 onClick={e => markConnection(e, markedConnection, setMarkedConnection, setShowConnectionData)}
//                             >

//                                 <div
//                                     style={connectionsContainerGrid}
//                                     onMouseLeave={removeHighLightConnection}
//                                     onMouseEnter={highLightConnection}
//                                 >{key}</div>
//                                 <div
//                                     onMouseOver={handleHoverOverflow}
//                                     onMouseLeave={removeHighLightConnection}
//                                     onMouseEnter={highLightConnection}
//                                     style={{ ...connectionsContainerGrid, margin: "0px 5px 0px 0px" }} >dasfasdfasdasfasdfasdasfasdfasdasfasdfasdasfasdfasdasfasdfasdasfasdfasdasfasdfas</div>
//                                 <div
//                                     onMouseLeave={removeHighLightConnection}
//                                     onMouseEnter={highLightConnection}
//                                     style={connectionsContainerGrid} >{connectionsObj[key].requests.length}</div>
//                                 <div
//                                     onMouseLeave={removeHighLightConnection}
//                                     onMouseEnter={highLightConnection}
//                                     style={connectionsContainerGrid} >{connectionsObj[key].responses.length}</div>

//                             </div>

//                         )

//                     }

//                     return retArr

//                 })()}
//             </Stack>

//             <div onMouseDown={(e) => {

//                 // m_pos = e.x;
//                 document.addEventListener("mousemove", resizeWidth, false);

//                 document.addEventListener("mouseup", () => { document.removeEventListener("mousemove", resizeWidth, false) }, false);


//             }} style={adjustWidthDiv} />

//             <div style={stickyInfoWindow}>

//                 <div style={reqResContainers}>
//                     <div style={{ display: "flex" }}>
//                         <div style={{ ...connectionsContainerGrid, width: "5%" }} ></div>
//                         <div style={connectionsContainerGrid} >type</div>
//                         <div style={{ ...connectionsContainerGrid, width: "70%" }} >path</div>
//                     </div>
//                     {markedConnection?.id ? connectionsObj[markedConnection.id].requests.map((httpObject) => {
//                         console.log(httpObject);

//                         return <div style={{ display: "flex" }}>
//                             <div style={{ ...connectionsContainerGrid, width: "5%" }} ><FileUploadIcon /></div>
//                             <div style={connectionsContainerGrid} >{httpObject}</div>
//                             <div style={{ ...connectionsContainerGrid, width: "70%" }} >{httpObject}</div>
//                         </div>

//                     }) : null
//                     }
//                 </div>
//                 <div style={reqResContainers}>
//                     responses
//                 </div>
//             </div>

//         </Stack>



//     )

// }


// const handleHoverOverflow = (e) => {
//     if (e.target.scrollWidth > e.target.clientWidth) {
//         e.target.title = e.target.textContent;
//     } else if (e.target.title) {
//         e.target.removeAttribute("title");
//     }
// }

// const highLightConnection = (e) => {

//     e.target = e.target.id ? e.target : e.target.parentElement

//     e.target.style.boxShadow = "inset 0 0 1px red";
//     e.target.style.backgroundColor = "#272A2C"

// };

// const removeHighLightConnection = (e) => {

//     e.target = e.target.id ? e.target : e.target.parentElement

//     if (typeof e.target.getAttribute("active") !== "string") {

//         e.target.style.boxShadow = "";
//         e.target.style.backgroundColor = "";

//     }

// }

// const markConnection = (e, markedConnection, setMarkedConnection, setShowConnectionData) => {

//     e.target = e.target.id ? e.target : e.target.parentElement



//     if (markedConnection) {

//         if (markedConnection !== e.target) {
//             markedConnection.removeAttribute("active");
//             markedConnection.style.boxShadow = "";
//             markedConnection.style.backgroundColor = "";
//             e.target.setAttribute("active", "");

//             console.log('setting active');


//             setMarkedConnection(e.target)



//         }


//     } else {

//         e.target.setAttribute("active", "");

//         setMarkedConnection(e.target)

//     }

//     console.log(e.target);




//     setShowConnectionData(true);



// }