!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("Ayame",[],t):"object"==typeof exports?exports.Ayame=t():e.Ayame=t()}(window,function(){return function(e){var t={};function i(n){if(t[n])return t[n].exports;var s=t[n]={i:n,l:!1,exports:{}};return e[n].call(s.exports,s,s.exports,i),s.l=!0,s.exports}return i.m=e,i.c=t,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)i.d(n,s,function(t){return e[t]}.bind(null,s));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=0)}([function(e,t,i){"use strict";function n(e,t){let i="";window.performance&&(i="[Ayame "+(window.performance.now()/1e3).toFixed(3)+"]"),"edge"===function(){const e=window.navigator.userAgent.toLocaleLowerCase();if(-1!==e.indexOf("edge"))return"edge";if(-1!==e.indexOf("chrome")&&-1===e.indexOf("edge"))return"chrome";if(-1!==e.indexOf("safari")&&-1===e.indexOf("chrome"))return"safari";if(-1!==e.indexOf("opera"))return"opera";if(-1!==e.indexOf("firefox"))return"firefox";return}()?console.log(i+" "+e+"\n",t):console.info(i+" "+e+"\n",t)}i.r(t);var s=class{constructor(e,t,i){this.roomId=t,this.signalingUrl=e,this.options=i,this._isNegotiating=!1,this.stream=null,this._pc=null,this.authnMetadata=null,this._callbacks={connect:()=>{},disconnect:()=>{},addstream:()=>{},removestream:()=>{}}}on(e,t){e in this._callbacks&&(this._callbacks[e]=t)}async connect(e,t=null){if(this._ws||this._pc)throw n("connection already exists"),new Error("Connection Already Exists!");return this.stream=e,this.authnMetadata=t,await this._signaling(),e}async disconnect(){const e=new Promise((e,t)=>{if(!this._pc)return e();if(this._pc&&"closed"==this._pc.signalingState)return e();this._pc.oniceconnectionstatechange=()=>{};const i=setInterval(()=>this._pc?this._pc&&"closed"==this._pc.signalingState?(clearInterval(i),e()):void 0:(clearInterval(i),t("PeerConnection Closing Error")),800);this._pc.close()}),t=new Promise((e,t)=>{if(!this._ws)return e();if(this._ws&&3===this._ws.readyState)return e();this._ws.onclose=()=>{};const i=setInterval(()=>this._ws?3===this._ws.readyState?(clearInterval(i),e()):void 0:(clearInterval(i),t("WebSocket Closing Error")),800);this._ws&&this._ws.close()});this.stream&&this.stream.getTracks().forEach(e=>{e.stop()}),this.remoteStreamId=null,this.stream=null,this.authnMetadata=null,this._isNegotiating=!1,await Promise.all([t,e]),this._ws=null,this._pc=null}async _signaling(){return new Promise((e,t)=>this._ws?t("WebSocket Connnection Already Exists!"):(this._ws=new WebSocket(this.signalingUrl),this._ws.onopen=()=>{const e={type:"register",roomId:this.roomId,clientId:this.options.clientId,authnMetadata:void 0};null!==this.authnMetadata&&(e.authnMetadata=this.authnMetadata),this._sendWs(e),this._ws&&(this._ws.onmessage=async e=>{try{if("string"!=typeof e.data)return;const t=JSON.parse(e.data);if("ping"===t.type)this._sendWs({type:"pong"});else if("close"===t.type)this._callbacks.close(e);else if("accept"===t.type)this._pc||(this._pc=this._createPeerConnection(!0)),this._callbacks.connect({authzMetadata:t.authzMetadata}),this._ws&&(this._ws.onclose=async e=>{await this.disconnect(),this._callbacks.disconnect({reason:"WS-CLOSED",event:e})});else if("reject"===t.type)await this.disconnect(),this._callbacks.disconnect({reason:"REJECTED"});else if("offer"===t.type)this._setOffer(t);else if("answer"===t.type)await this._setAnswer(t);else if("candidate"===t.type&&t.ice){n("Received ICE candidate ...",t.ice);const e=new window.RTCIceCandidate(t.ice);this._addIceCandidate(e)}}catch(e){await this.disconnect(),this._callbacks.disconnect({reason:"SIGNALING-ERROR",error:e})}})},this._ws&&(this._ws.onclose=async e=>{await this.disconnect(),this._callbacks.disconnect(e)}),e()))}_createPeerConnection(e){const t={iceServers:this.options.iceServers},i=new window.RTCPeerConnection(t);if(void 0===i.ontrack)i.onaddstream=e=>{const t=e.stream;(this.remoteStreamId&&t.id!==this.remoteStreamId||null===this.remoteStreamId)&&(this.remoteStreamId=t.id,this._callbacks.addstream(e))},i.onremovestream=e=>{this.remoteStreamId&&e.stream.id===this.remoteStreamId&&(this.remoteStreamId=null,this._callbacks.removestream(e))};else{let e=[];i.ontrack=t=>{n("-- peer.ontrack()",t),e.push(t.track);let i=new window.MediaStream(e);this.remoteStreamId=i.id,t.stream=i,this._callbacks.addstream(t)}}i.onicecandidate=e=>{e.candidate?this._sendIceCandidate(e.candidate):n("empty ice event","")},i.oniceconnectionstatechange=async()=>{switch(n("ICE connection Status has changed to ",i.iceConnectionState),i.iceConnectionState){case"connected":this._isNegotiating=!1;break;case"failed":n(""),await this.disconnect(),this._callbacks.disconnect({reason:"ICE-CONNECTION-STATE-FAILED"})}},i.onnegotiationneeded=async()=>{if(!this._isNegotiating)try{if(n("Negotiation Needed"),this._isNegotiating=!0,e){const e=await i.createOffer({offerToReceiveAudio:this.options.audio.enabled,offerToReceiveVideo:this.options.video.enabled});await i.setLocalDescription(e),this._sendSdp(i.localDescription),this._isNegotiating=!1}}catch(e){await this.disconnect(),this._callbacks.disconnect({reason:"NEGOTIATION-ERROR",error:e})}},i.onsignalingstatechange=e=>{n("signaling state changes:",i.signalingState)};const s=this.stream&&this.stream.getVideoTracks()[0],a=this.stream&&this.stream.getAudioTracks()[0];return a&&i.addTrack(a,this.stream),i.addTransceiver("audio",{direction:"recvonly"}),s&&i.addTrack(s,this.stream),i.addTransceiver("video",{direction:"recvonly"}),"sendonly"===this.options.video.direction&&i.getTransceivers().forEach(e=>{s&&e.sender.replaceTrack(s),e.direction=this.options.video.direction}),"sendonly"===this.options.audio.direction&&i.getTransceivers().forEach(e=>{a&&e.sender.replaceTrack(a),e.direction=this.options.audio.direction}),i}async _createAnswer(){if(this._pc)try{let e=await this._pc.createAnswer();await this._pc.setLocalDescription(e),this._sendSdp(this._pc.localDescription)}catch(e){await this.disconnect(),this._callbacks.disconnect({reason:"CREATE-ANSWER-ERROR",error:e})}}async _setAnswer(e){await this._pc.setRemoteDescription(e)}async _setOffer(e){this._pc=this._createPeerConnection(!1);try{await this._pc.setRemoteDescription(e),await this._createAnswer()}catch(e){await this.disconnect(),this._callbacks.disconnect({reason:"SET-OFFER-ERROR",error:e})}}async _addIceCandidate(e){try{this._pc&&await this._pc.addIceCandidate(e)}catch(t){n("invalid ice candidate",e)}}_sendIceCandidate(e){const t={type:"candidate",ice:e};this._sendWs(t)}_sendSdp(e){this._sendWs(e)}_sendWs(e){this._ws&&this._ws.send(JSON.stringify(e))}};i.d(t,"defaultOptions",function(){return a}),i.d(t,"connection",function(){return o}),i.d(t,"version",function(){return c});const a={audio:{direction:"sendrecv",enabled:!0},video:{direction:"sendrecv",enabled:!0},iceServers:[{urls:"stun:stun.l.google.com:19302"}],clientId:function(e){for(var t=[];e--;)t.push("0123456789".charAt(Math.floor(Math.random()*"0123456789".length)));return t.join("")}(17)};function o(e,t,i=a){return new s(e,t,i)}function c(){return"0.0.1-rc6"}}])});