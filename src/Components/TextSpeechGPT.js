// importing react hooks
import React, { useState, useRef } from "react";


// Speech Recognition
import SpeechRecognition, { useSpeechRecognition, } from "react-speech-recognition";


// OpenAI : to pass the text through GPT
const { Configuration, OpenAIApi } = require("openai");


function TextSpeechGPT() {


  // Set up the state variables
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const microphoneRef = useRef(null);

  //Checking browser compatibility
  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <div className="mircophone-container">
        Browser do not Support Speech Recognition.
      </div>
    );
  }



  // StartBot Handler : it starts listening when we click on bot 
  const StartBotAndListen = () => {
    // set isListening to true to start listening and show disable button 
    setIsListening(true);
    console.log("Bot started listening");

    // adding the class 'listening' in the element div with class 'microphone-icon-container' to add transition effect
    microphoneRef.current.classList.add("listening");
    SpeechRecognition.startListening({
      continuous: true,
    });
  };


  //  StoptBot Handler : it stops listening when we click on disable button and logs the spoken text in the console
  //  then it passes that text to GPT (Openai API) and responses is generated which is spoken 
  //  by browser's speech synthesis functionality 


  const StopBot = async () => {

    // set isListening to false to remove disable button 
    setIsListening(false);

    console.log("Bot Stopped Listening");
    microphoneRef.current.classList.remove("listening");
    SpeechRecognition.stopListening();
    console.log("Transcript : ", transcript);       // speech to text


    // Once the the user has finished speaking we will send the transcript to the OpenAI API
    // and generate response 

    // Initialise the OpenAI APIs
    const configuration = new Configuration({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    // OpenAI Chat Completion API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: transcript }],
    });

    //response after passing transcript to GPT 
    console.log("GPT Response : ", completion.data.choices[0].message.content);


    // Text to Speech API
    // Using 'speechSynthesis; a built-in JavaScript object that provides access to the browser's speech synthesis functionality.
   
    if ("speechSynthesis" in window) {

     
      // get the transcript 
      var text = completion.data.choices[0].message.content

      // create utterence 
      var utterance = new SpeechSynthesisUtterance(text);
      
      // Set utterance properties
      var voiceArr = speechSynthesis.getVoices();
      utterance.voice = voiceArr[2];

    
      // Speak the utterance
      // Since speechSynthesis.speak() is no longer allowed without user activation in 
      // Google's Chrome web browser as it violates autoplay policy of Google Chrome and it speaks only for 15 seconds 
      // we have to cancel the speechSynthesis, otherwise its not compliant to googles autoplay policy
      
      // To resolve this we can intelligently chunks the bigger text into smaller blocks of text 
      // that are stringed together one after the other



      console.log("SpeechSynthesis Speaking");   
      speechUtteranceChunker(utterance, {
        chunkLength: 120
      }, function () {
      
        console.log('Speak done');
      });
 

    }
    else {
      console.log("Text-to-speech not supported.");
    }
    resetTranscript();
  };


// handle function to perform Synthesis speaking intelligently
  var speechUtteranceChunker = function (utt, settings, callback) {
    settings = settings || {};
    var newUtt;
    var txt = (settings && settings.offset !== undefined ? utt.text.substring(settings.offset) : utt.text);
    if (utt.voice && utt.voice.voiceURI === 'native') { 
      newUtt = utt;
      newUtt.text = txt;
      newUtt.addEventListener('end', function () {
        if (speechUtteranceChunker.cancel) {
          speechUtteranceChunker.cancel = false;
        }
        if (callback !== undefined) {
          callback();
        }
      });
    }
    else {
      var chunkLength = (settings && settings.chunkLength) || 160;
      var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
      var chunkArr = txt.match(pattRegex);

      if (chunkArr[0] === undefined || chunkArr[0].length <= 2) {
        //call once all text has been spoken...
        if (callback !== undefined) {
          callback();
        }
        return;
      }
      var chunk = chunkArr[0];
      newUtt = new SpeechSynthesisUtterance(chunk);
      var x;
      for (x in utt) {
        if (utt.hasOwnProperty(x) && x !== 'text') {
          newUtt[x] = utt[x];
        }
      }
      newUtt.addEventListener('end', function () {
        if (speechUtteranceChunker.cancel) {
          speechUtteranceChunker.cancel = false;
          return;
        }
        settings.offset = settings.offset || 0;
        settings.offset += chunk.length - 1;
        speechUtteranceChunker(utt, settings, callback);
      });
    }

    if (settings.modifier) {
      settings.modifier(newUtt);
    }
    console.log(newUtt); 
    //placing the speak invocation inside a callback fixes ordering and onend issues.
    setTimeout(function () {
      speechSynthesis.speak(newUtt);
    }, 0);
  };



  // rendering the component
  return (
    <div className="microphone-wrapper">
      <div className="mircophone-container">
        <div
          className="microphone-icon-container" ref={microphoneRef} onClick={StartBotAndListen} >
          <img src="https://svgshare.com/i/uct.svg" alt="micropohne" className="microphone-icon" />
        </div>

        <div className="microphone-status">
          {
            // if state isListening is true then render Listening
            isListening ? "Listening..." : ""
          }
        </div>

        {isListening && (
          <button className="btn1 btn" onClick={StopBot}>
            Disable
          </button>
        )}
      </div>
    </div>
  );
}

export default TextSpeechGPT;