// ayame signaling server parameters
const signalingUrl = 'wss://ayame-labo.shiguredo.jp/signaling';
let roomId = 'ayame-test-sdk';

// select 'audio/PCMU' or other MIME type for audio codec initial selection (if any)
//const codecMimeTypeInitial = 'audio/PCMU'
const codecMimeTypeInitial = null;

let clientId = null;
let videoCodec = null;
let messages = "";
let signalingKey = null;

function onChangeVideoCodec() {
  videoCodec = document.getElementById("video-codec").value;
  if (videoCodec == 'none') {
    videoCodec = null;
  }
}

// query string から roomId, clientId を取得するヘルパー
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
