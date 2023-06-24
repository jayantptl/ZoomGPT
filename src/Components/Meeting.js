import React from "react";
import ReactDOM from "react-dom";

//import of css
import "./Meet.css";

//import of zoom meeting SDK
import { ZoomMtg } from "@zoomus/websdk";

//import of TextSpeechGPT component
import TextSpeechGPT from "./TextSpeechGPT";



// Zoom Meeting SDKs use JSON Web Tokens (JWT) for authorization. 
// We Generate a Meeting SDK JWT using the Meeting SDK app credentials.
// JWTs consist of three core parts: Header, Payload, and Signature. The header includes the specification of the signing algorithm.
// The payload of a JWT contains the claims of the token, pieces of information about the user and any required metadata such as sdkKey, role.

// To generate a Meeting SDK JWT using jsrsasign, an open source cryptographic JavaScript library.
const KJUR = require("jsrsasign");


// Zoom Meeting SDK Setup, The following JS functions are used to load the WebAssembly assets and language files:
ZoomMtg.setZoomJSLib("https://source.zoom.us/2.13.0/lib", "/av");
ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();
ZoomMtg.i18n.load("en-US");
ZoomMtg.i18n.reload("en-US");



function Meeting() {

    var sdkKey = process.env.REACT_APP_ZOOM_MEETING_SDK_KEY;
    // Meeting Credentials
    var meetingURL = "";
    var meetingNumber = "";
    var passWord = "";

    // role 0 means user and 1 means host
    var role = 0;
    var userName = "ZoomBOT";
    var userEmail = "";
    var registrantToken = "";
    var zakToken = "";

    // The url where user will be redirected after the meeting is ended
    var leaveUrl = "https://zoom.us/";

    const [element, setElement] = React.useState(
        document.getElementsByClassName("footer__btns-container")
    );
    function getSignature(e) {
        e.preventDefault();
        // Test the meetingURL against the regex ^https:\/\/us05web\.zoom\.us\/j\/\d+\?pwd=[a-zA-Z0-9]+$
        if (
            !meetingURL ||
            !meetingURL.match(
                /^https:\/\/us05web\.zoom\.us\/j\/\d+\?pwd=[a-zA-Z0-9]+$/
            )
        ) {
            alert("Please provide a valid meeting URL");
            return;
        }

        // Extract the meeting number and password from the meeting URL
        passWord = meetingURL.split("?")[1].split("=")[1];
        meetingNumber = meetingURL.split("?")[0].split("/")[4];

        // To create a signature for the JWT, we must encrypt the header and payload with the Meeting SDK Secret. 
        // Stanadard procedure to generate the signature
        const iat = Math.round(new Date().getTime() / 1000) - 30;
        const exp = iat + 60 * 60 * 2;
        const oHeader = { alg: "HS256", typ: "JWT" };
        const oPayload = {
            sdkKey: process.env.REACT_APP_ZOOM_MEETING_SDK_KEY,
            mn: meetingNumber,
            role: role,
            iat: iat,
            exp: exp,
            appKey: process.env.REACT_APP_ZOOM_MEETING_SDK_KEY,
            tokenExp: iat + 60 * 60 * 2,
        };
        const sHeader = JSON.stringify(oHeader);
        const sPayload = JSON.stringify(oPayload);
        const signature = KJUR.jws.JWS.sign(
            "HS256",
            sHeader,
            sPayload,
            process.env.REACT_APP_ZOOM_MEETING_SDK_SECRET
        );


        startMeeting(signature);
    }

    // join meeting 
    function startMeeting(signature) {

        // initially display was marked none, on joining mark display block
        document.getElementById("zmmtg-root").style.display = "block";

        // When initialised the Meeting SDK adds new elements to the DOM to handle client overlays and accessibility elements.
        ZoomMtg.init({
            leaveUrl: leaveUrl,
            success: (success) => {
                ZoomMtg.join({
                    signature: signature,
                    sdkKey: sdkKey,
                    meetingNumber: meetingNumber,
                    passWord: passWord,
                    userName: userName,
                    userEmail: userEmail,

                    success: (success) => {
                        // Check if the bot is joined into the meeting every 2 seconds.
                        // If admitted then render the TextSpeechGPT component.

                        var UpdateInterval = setInterval(() => {
                            if (document.getElementsByClassName("footer__btns-container")) {
                                setElement(
                                    document.getElementsByClassName("footer__btns-container")
                                );
                            }
                        }, 2000);
                        if (element.length) {
                            const elememtDiv = document.createElement("div");
                            elememtDiv.setAttribute("id", "custom-foot-bar");
                            element[0].appendChild(elememtDiv);
                            ReactDOM.render(

                                //rendering the TextSpeechGPT component
                                <TextSpeechGPT />,
                                document.getElementById("custom-foot-bar")

                            );
                            clearInterval(UpdateInterval);
                        }
                        console.log('Joined :', success);
                    },
                    error: (error) => {
                        console.log(error);
                    },
                });
            },
            error: (error) => {
                console.log(error);
            },
        });
    }

    return (
        <>
            <main>

                <nav className="navbar navbar-light bg-light">
                    <span className="navbar-text">
                        <h1 >ZoomGPT</h1>
                    </span>
                </nav>
                <div className="container ">
                    <div className="container d-flex justify-content-center my-4">
                        <h4>Please provide the zoom meeting link below to join the meeting with BOT </h4>
                    </div>


                    <div className="meeting__credentials container my-5">
                        <form>
                            <div className="form-group">
                                <label >Meeting URL</label>
                                <input autoFocus type="text" className="form-control" id="meetingURL"
                                 placeholder="https://us05web.zoom.us/j/12345678?pwd=abcdefgh123456"
                                 required  defaultValue={meetingURL}
                                 onChange={(e) => {
                                        meetingURL = e.target.value;
                                    }}
                                />
                            </div>

                            <button onClick={getSignature} className="btn btn-dark">Join Meeting</button>
                        </form>
                    </div>
                </div>




            </main>

        </>
    );

}


export default Meeting;










