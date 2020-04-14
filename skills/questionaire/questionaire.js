// Kicks everything off!
getAccessToken();

function initiateTokenRefresh() {
    misty.Set("googleAuthToken", "not updated yet", false);
    _getAuthToken();
    misty.RegisterTimerEvent("getAuthToken", 60000 * 15, true);
}
initiateTokenRefresh();

function _getAuthToken() {
    misty.SendExternalRequest("POST", misty.Get("cloudFunctionAuthTokenURL"), null, null, null, false, false, null, "application/json", "_UpdateAuthToken");
}

function _UpdateAuthToken(data) 
{
    misty.Set("googleAuthToken", JSON.parse(data.Result.ResponseObject.Data).authToken, false);
    misty.Debug("Updated Auth Token");
}

function creds(){
    misty.Set("cloudFunctionAuthTokenURL", "https://us-central1-mistyvoicecommand-otapmj.cloudfunctions.net/get-access-token", false);
    misty.Set("GoogleCloudProjectID", "mistyvoicecommand-otapmj", false);
    misty.Set("langCodeForTTS", "en-US", false);
    misty.Set("genderCodeForTTS", "FEMALE", false);
}
creds();

// Creates a unique session ID for opening a session with our Dialogflow
// agent.
function getSessionId(){
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Gets an access token for use with DialogFlow API
function getAccessToken(){
    misty.SendExternalRequest("POST",  _params.getAccessTokenUrl, null, null, null, false, false, null, "application/json", "SetAccessToken");
}

function SetAccessToken(data) {
    let response = JSON.parse(data.Result.ResponseObject.Data)
    misty.Set("googleAccessToken", response.accessToken);

    startToListen();
}

function startToListen() {
    misty.AddReturnProperty("VoiceRecord", "Filename");
    misty.AddReturnProperty("VoiceRecord", "Success");
    misty.AddReturnProperty("VoiceRecord", "ErrorCode");
    misty.AddReturnProperty("VoiceRecord", "ErrorMessage");
    misty.RegisterEvent("VoiceRecord", "VoiceRecord", 10, true);

    misty.Pause(1000);
    misty.ChangeLED(255, 255, 255);
    misty.Debug("Misty is listening, say 'Hey Snapdragon' to start the conversation!")
    misty.DisplayImage("e_Content.jpg");
    misty.PlayAudio("s_Joy3.wav");

    // We start key phrase recognition and set voice recording to begin
    // immediately after Misty heads the wake word ("Hey, Misty")
    misty.StartKeyPhraseRecognition(true, true, 15000); 
}



function _VoiceRecord(){
    misty.Debug("Speech captured.")
    misty.GetAudioFile("capture_HeyMisty.wav", "ProcessAudioFile");
    ProcessAudioFile("capture_HeyMisty.wav");
}

function _SpeechCaptured(data) {
    misty.Debug("SpeechCaptured!");
    let filename = data.AdditionalResults[0];
    let success = data.AdditionalResults[1];
    misty.Debug(filename);
    misty.Debug("Success = " + success);
    if (success == true && filename == "capture_Dialogue.wav"){
            misty.Debug("captured recording after wake word - " + filename);
            misty.PlayAudio(filename);
    }
    misty.Debug("Time to Process " + filename);
    misty.GetAudioFile(filename, "ProcessAudioFile");
}

// Sends speech recording to DialogFlow. Dialogflow uses 
// speech-to-text to match the recording with an "intent" we define in
// the DialogFlow project, then sends a response back with intent data.
// We use this response data to change Misty's LED.
function ProcessAudioFile(data) {
    misty.Debug("Process Audio File: " + data);
    // Set variable with base64 data for capture_HeyMisty audio file
    let base64 = data.Result.Base64;

    // Set up params for request to DialogFlow
    let sessionId = getSessionId();
	let url = "https://dialogflow.googleapis.com/v2/projects/" + _params.projectID + "/agent/sessions/" + sessionId + ":detectIntent";
    let authorizationType =  "Bearer";
    let dialogFlowParams = JSON.stringify({
        "queryInput": {
            "audioConfig": {
                "audioEncoding": "AUDIO_ENCODING_LINEAR_16",
                "languageCode": "en-US",
                "sampleRateHertz": 16000
            }
        },
        "inputAudio": base64
    });

    let accessToken = misty.Get("googleAccessToken");

    misty.SendExternalRequest("POST", url, authorizationType, accessToken, dialogFlowParams, false, false, null, "application/json", "ProcessDialogFlowResponse");
}

// Handles response from Dialogflow agent
function ProcessDialogFlowResponse(data) {
    
    // Gets the intent and parameters from the response
    let response = JSON.parse(data.Result.ResponseObject.Data)
    let intent = response.queryResult.intent.displayName;
    let parameters = response.queryResult.parameters;

    // Prints some debug messages with contents of the response
    misty.Debug("Intent: " + intent);
    misty.Debug("Input text: " + response.queryResult.queryText);

    if(intent == "Confirm"){
        //changes LED red
        //misty.ChangeLED(255, 0, 0);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(4000);
        startToListen();
    }
    if (intent == "ChangeLED") {
        misty.Debug("Color: " + parameters.color);
        switch(parameters.color) {
            case "red":
                //changes LED red
                misty.ChangeLED(255, 0, 0);
                misty.Pause(2000);
                processResponse();
                break;
            case "blue":
                misty.ChangeLED(0, 0, 255);
                processResponse();
                break;
            case "green":
                misty.ChangeLED(0, 255, 0);
                animateCompliance();
                processResponse();
                break;
            case "yellow":
                misty.ChangeLED(255,255,51);
                animateCompliance();
                processResponse();
                break;
            case "orange":
                misty.ChangeLED(255,128,0);
                animateCompliance();
                processResponse();
                break;
            case "pink":
                misty.ChangeLED(255,51,187);
                animateComplaince();
                processResponse();
                break;
            case "white":
                misty.ChangeLED(255, 255, 255);
                animateComplaince();
                processResponse();
                break;
            case "random":
                misty.ChangeLED(Math.floor((Math.random() * 255) + 1), Math.floor((Math.random() * 10) + 1), Math.floor((Math.random() * 10) + 1));
                animateComplaince();
                processResponse();
                break;
            default:
                misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
                speakTheText();
                break;
        }
    }
    else if(intent == "Questionaire"){
        animateInterest();
        misty.Debug("Ready to start the questionaire.");
        misty.Pause(2000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(7000);
        //startToListen();
        processResponse();
    }
    else if(intent == "Questionaire - good"){
        animateCompliance();
        //misty.Debug("Feeling: " + parameters.Feeling);
        misty.Debug("That is great!");
        misty.Pause(2000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(3000);
        processResponse();
    }
    else if(intent == "Questionaire - good - good"){
        animateCompliance();
        misty.Debug("Awesome!");
        misty.Pause(2000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText(); 
        misty.Pause(4000);
        misty.CancelSkill("baca7c34-3133-4b27-a5f4-dc1aa4855b3b");
    }

    else if(intent == "Questionaire - bad"){
        animateSadness();
        //misty.Debug("Feeling: " + parameters.Feeling);
        misty.Debug("I'm sorry to hear that!");
        misty.Pause(4000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(7000);
        processResponse();
    }

    else if(intent == "Questionaire - bad - yes"){
        animateCompliance();
       //misty.Debug("Feeling: " + parameters.Feeling);
        misty.Debug("I've notified a staff member to assist you!");
        misty.Pause(4000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(5000);
        processResponse();
        misty.CancelSkill("baca7c34-3133-4b27-a5f4-dc1aa4855b3b");
    }

    else if(intent == "Questionaire - bad - no"){
        //misty.Debug("Feeling: " + parameters.Feeling);
        animateStandard();
        misty.Debug("Okay. Are you sure?");
        misty.Pause(4000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(5000);
        processResponse();
        misty.CancelSkill("baca7c34-3133-4b27-a5f4-dc1aa4855b3b");
    }
    else if(intent == "Flashlight"){
        misty.Debug("Turning flashlight on.");
        misty.Pause(1000);
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.SetFlashlight(true);
        misty.Pause(3000);
        processResponse();
    }
    else {
        misty.Set("textToSpeak", response.queryResult.fulfillmentText, false);
        speakTheText();
        misty.Pause(3000);
        processResponse();
    }
}

function animateCompliance() {
    misty.MoveHeadDegrees(-15, 0, 0, 100);
    misty.PlayAudio("s_Acceptance.wav");
    misty.DisplayImage("e_Joy2.jpg");
    misty.MoveArms(0, -25, 100, 100);
}

function animateSadness() {
    misty.MoveHeadDegrees(25, 0, 0, 100);
    misty.PlayAudio("e_Sadness.wav");
    misty.DisplayImage("e_Sadness.jpg");
    misty.MoveArms(0, 0, 100, 100);
}

function animateInterest() {
    misty.MoveHeadDegrees(-15, 0, 0, 100);
    misty.DisplayImage("e_Confusion.jpg");
    misty.MoveArms(-25, 25, 100, 100);
}

function animateStandard() {
    misty.MoveHeadDegrees(-10, 0, 0, 100);
    misty.DisplayImage("e_Content.jpg");
    misty.MoveArms(0, 0, 100, 100);
}

function speakTheText() {
    var arguments = JSON.stringify({
        'input': {
            'text': misty.Get("textToSpeak")
        },
        'voice': {
            'languageCode': misty.Get("langCodeForTTS"),
            'ssmlGender': misty.Get("genderCodeForTTS")
        },
        'audioConfig': {
            'audioEncoding': "LINEAR16",
            "effectsProfileId": [
                "handset-class-device"
            ],
            "pitch": 5,
            "speakingRate": 0.91
        }
    });

    misty.Debug("Sending Data to Google");
    misty.SendExternalRequest("POST", "https://texttospeech.googleapis.com/v1beta1/text:synthesize", "Bearer", misty.Get("googleAccessToken"), arguments, false, false, null, "application/json", "_Base64In")
    misty.Debug("Text sent to Google Text to Speech API");
}

function _Base64In(data) {
    misty.Debug("Audio(base64) in from Google TTS API");
    misty.Debug(JSON.stringify(data));

    misty.Set("playingAudio", true, false);

    // Saves and plays the Base64-encoded audio data 
    misty.SaveAudio("tts.wav", JSON.parse(data.Result.ResponseObject.Data).audioContent, true, true);
}

//Helper function for Misty to process a response in the conversation
function processResponse() {
    //Misty starts listening, overwrites previous recording audio file
    //Does NOT require Misty's key phrase to start speaking
    misty.Debug("Misty is listening for a response!")
    misty.CaptureSpeech(false, true);
    misty.Pause(2000);
    misty.AddReturnProperty("SpeechCaptured", "Filename");
    misty.AddReturnProperty("SpeechCaptured", "Success");
    misty.RegisterEvent("SpeechCaptured", "VoiceRecord", 1000, true);
}
