// ayame signaling server parameters
const signalingUrl = 'wss://ayame-labo.shiguredo.jp/signaling';
let roomId = 'release3-test-room1';

// select 'audio/PCMU' or other MIME type for audio codec initial selection (if any)
const codecMimeTypeInitial = 'audio/PCMU'
//const codecMimeTypeInitial = null;

let mediaStream;  // for local audio device
let clientId = null;
let messages = "";
let signalingKey = null;

// query string から roomId, clientId, signalingKey を取得するヘルパー
// this will use "Querystring Parse and Stringify Library" qs.min.js
// use "?roomId=<room id string>&clientId=<client id string>&signalingKey=<signaling key>" option in URL
// note: 'roomId' 'clientId' 'signalingKey' are all case sensitive
function parseQueryString() {
  const qs = window.Qs;
  if (window.location.search.length > 0) {
    var params = qs.parse(window.location.search.substr(1));
    if (params.roomId) {
      roomId = params.roomId;
    }
    if (params.clientId) {
      clientId = params.clientId;
    }
    if (params.signalingKey) {
      signalingKey = params.signalingKey;
    }
  }
}

parseQueryString();

// setup audio codec selector
const codecSelector = document.querySelector('select#codec');
const codecPreferences = document.querySelector('select#codecPreferences');
const supportsSetCodecPreferences = window.RTCRtpTransceiver &&
'setCodecPreferences' in window.RTCRtpTransceiver.prototype;

function SetupAudioCodecSelect(sender) {
  // if either of above selectors not exist, skip following
  if (!(codecSelector === null || codecPreferences === null)) {

    if (supportsSetCodecPreferences) {
      codecSelector.style.display = 'none';

      const {codecs} = (sender) ? RTCRtpSender.getCapabilities('audio') : RTCRtpReceiver.getCapabilities('audio');

      codecs.forEach(codec => {
        if (['audio/CN', 'audio/telephone-event'].includes(codec.mimeType)) {
          return;
        }
        const option = document.createElement('option');
        option.value = (codec.mimeType + ' ' + codec.clockRate + ' ' +
          (codec.sdpFmtpLine || '')).trim();
        option.innerText = option.value;
        // select specific MimeType for the first selection
        if (codec.mimeType === codecMimeTypeInitial) {
          option.defaultSelected = true;
        }
        codecPreferences.appendChild(option);
      });
      codecPreferences.disabled = false;
    } else {
      codecPreferences.style.display = 'none';
    }
  }
}

function GetAudioCodecSelect() {
  // check "select#codec" then "select#codecPreferences"
  let codec;
  if (codecPreferences.disabled) {
    codec = document.getElementById("codec").value;
  }
  else {
    codec = document.getElementById("codecPreferences").value;
  }
  return codec; // return 'none' if Default selected.
}

// setup audio input/output select
// at this point we dont display ouput select but used for simplicity
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const audioSelectors = [audioInputSelect, audioOutputSelect];

// audioOutputSelect is always disabled
//audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

// parent element for local audio (input) controls
// used by sendrecv and sendonly (null in recvonly)
let localAudioControls = null;

// create HTMLMediaElement ( audio control ) for specified audio input device
async function createAudioInControl(labeltext, deviceId) {
  console.log( `audio control created for ${labeltext}, Id: ${deviceId}`);

  // needs 'localAudioControls'
  if (!localAudioControls) {
    console.log('localAudioControls need to be initialized.');
    return;
  }

  const $label = document.createElement('label');
  $label.setAttribute('for', deviceId);
  $label.innerHTML = labeltext;

  const $audio = document.createElement('audio');
  $audio.id = deviceId;
  $audio.autoplay = true;
  $audio.controls = true;
  $audio.muted = true;

  // 'srcObject' will be set when getUserMedia ready

  const $p = document.createElement('p');
  $p.append($label, $audio);
  localAudioControls.appendChild($p);

  // connect MediaDevices.getUserMedia
  const constraints = {
    audio: {deviceId: {exact: deviceId}},
    video: false
  };

  // wait for stream ready and assign
  const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(handleError);

  if (stream) {
    // successfully got stream
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      console.log(`Using Audio input device: ${audioTracks[0].label}`);   // echo audio input device
    }

    // MediaStream connect to the audio control
    $audio.srcObject = stream;
  }
  else {
    // something wrong happened
    console.log('getUserMedia failed.');
  }
}

// parent element for remote audio (output) controls
// used by sendrecv and recvonly (null in sendonly)
let remoteAudioControls = null;

// create HTMLMediaElement ( audio control ) for specified audio sink/output device
function createAudioOutControl(labeltext, deviceId) {
  console.log( `audio control created for ${labeltext}, Id: ${deviceId}`);

  // needs 'remoteAudioControls'
  if (!remoteAudioControls) {
    console.log('remoteAudioControls need to be initialized.');
    return;
  }

  const $label = document.createElement('label');
  $label.setAttribute('for', deviceId);
  $label.innerHTML = labeltext;

  const $audio = document.createElement('audio');
  $audio.id = deviceId;
  $audio.autoplay = true;
  $audio.controls = true;
  //$audio.muted = true;

  // 'srcObject' will be set when 'addstream' message came in

  const $p = document.createElement('p');
  $p.append($label, $audio);
  remoteAudioControls.appendChild($p);

  // setSinkId() requires some time after <audio> element created
  // so we don't call setSinkId() here but call when WebRTC stream comes in
  // $audio.setSinkId(deviceId)
  //   .then(() => {
  //     console.log(`Success, audio output device connected to: ${deviceId}`);
  //   })
  //   .catch(error => {
  //     let errorMessage = error;
  //     if (error.name === 'SecurityError') {
  //       errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
  //     }
  //     console.error(errorMessage);
  //     // Jump back to first output device in the list as it's the default.
  //     //audioOutputSelect.selectedIndex = 0;
  //   });
}

// define getUserMedia callback
function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = audioSelectors.map(select => select.value);
  audioSelectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
      console.log('audio input: ', option.text, ` Id: ${deviceInfo.deviceId}`);
      if (localAudioControls && deviceInfo.deviceId !== 'default' && deviceInfo.deviceId !== 'communications') {
        createAudioInControl(option.text, deviceInfo.deviceId);
      }
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
      console.log('audio output: ', option.text, ` Id: ${deviceInfo.deviceId}`);
      if (remoteAudioControls && deviceInfo.deviceId !== 'default' && deviceInfo.deviceId !== 'communications') {
        createAudioOutControl(option.text, deviceInfo.deviceId);
      }
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      // skip Camera device
      //videoSelect.appendChild(option);
      //console.log('Camera source: ', option.text, ` Id: ${deviceInfo.deviceId}`);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }

  // set both audioSource and audioOutput
  audioSelectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

// define getUserMedia callback for audio/video streaming start
function gotStream(stream) {
  mediaStream = stream;   // remember local stream used
  //window.stream = stream; // make stream (feedback) available to console

  const audioTracks = mediaStream.getAudioTracks();
  if (audioTracks.length > 0) {
    console.log(`Using Audio input device: ${audioTracks[0].label}`);   // echo audio input device
  }

  // use Audio/Video controls to monitor local video/audio
  // unmute and use headset to prevent howling audio response
  document.querySelector('#local-audio').srcObject = mediaStream;
  //videoElement.srcObject = stream;

  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

// Attach audio output device to audio/video element using device/sink ID.
function attachSinkId(element, sinkId) {
  if (element == null) {
    // exclude 'null' or 'undefined'
    console.log(`Invalid element passed: ${element}`);
  } else if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
        .then(() => {
          console.log(`Success, audio output device changed to: ${sinkId}`);
        })
        .catch(error => {
          let errorMessage = error;
          if (error.name === 'SecurityError') {
            errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
          }
          console.error(errorMessage);
          // Jump back to first output device in the list as it's the default.
          audioOutputSelect.selectedIndex = 0;
        });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

// attach selected audio output to remote audio controls
// function changeAudioDestination() {
//   const audioDestination = audioOutputSelect.value;   // get current audioOutput device Id selected
//   const element = document.querySelector('#remote-audio');
//   attachSinkId(element, audioDestination);
// }

// get desired UserMedia for send
// we only use audioSource, no videoSource used
function start() {
  // if (window.stream) {
  //   window.stream.getTracks().forEach(track => {
  //     track.stop();
  //   });
  // }

  const audioSource = audioInputSelect.value;
  //const videoSource = videoSelect.value;
  const constraints = {
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    //video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    video: false
  };
  navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

// global AudioContext for Web Audio API
let audioCtx = null;
let sourceMix = null;
let streamOut = null;

// Array of MediaStreamSource
let sourceNodes = [];

// Array of GainNode each connected to MediaStreamSource
let sourceGains = [];

// initialize globals, must be called after user's first interraction (button press etc...)
// assumes audio control already created
// returns MediaStream or null if failed
function WebAudioStart() {

  // needs 'localAudioControls'
  if (!localAudioControls) {
    console.log('localAudioControls need to be initialized.');
    return null;
  }

  // check if any of <audio> control generated
  const audioInputs = localAudioControls.querySelectorAll('audio');
  if (audioInputs.length == 0) {
    console.log('no audio control found within localAudioControls.');
    return null;
  }
  else {
    console.log(`${audioInputs.length} audio inputs.`);
  }

  // we have at least one <audio> control

  // create AudioContext and Initialize global controls
  if (!audioCtx) {
    // initialize AudioContext etc.
    audioCtx = new AudioContext();

    // create GainNode for audio input mix and connect to final output
    sourceMix = audioCtx.createGain();
    sourceMix.gain.value = 1.0;

    // enable below to monitor mixed sound
    //sourceMix.connect(audioCtx.destination);  // connect to default audio out

    // create MediaStream compatible destination object and connect
    streamOut = audioCtx.createMediaStreamDestination();
    sourceMix.connect(streamOut);

    // make Arrays empty
    sourceNodes = [];
    sourceGains = [];
    
    // get gain value for all inputs
    //const vol = 1.0 / audioInputs.length;
    const vol = 1.0;

    audioInputs.forEach(function(control) {

      // get MediaStream object from <audio> control
      const stream = control.srcObject;

      // create source node and register
      const node = audioCtx.createMediaStreamSource(stream);
      sourceNodes.push(node);

      // create gain node, set initial gain, and register
      const gain = audioCtx.createGain();
      gain.gain.value = vol;
      sourceGains.push(gain);

      // connect to sourceMix
      node.connect(gain);
      gain.connect(sourceMix);

    });

  }

  // in case of MediaStreamSource there's no need to start()
  // sourceNodes.forEach(function(source) {
  //   source.start(0);
  // });

  console.log('Wave API start.');
 
  // streamOut is "MediaStreamAudioDestinationNode" object
  // convert to MediaStream object
  return streamOut.stream;
}

// stop Wave Audio playback and free resources
function WebAudioStop() {
  if (audioCtx) {

    audioCtx.close().then(function() {

      audioCtx = null;
      sourceMix = null;
      streamOut = null;

      sourceNodes = [];
      sourceGains = [];
        
      console.log('Wave API stop.');
    });
  }
}
