import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Canvas from 'react-native-canvas';
import WebRTC from 'react-native-webrtc';
import { Alert } from 'react-native';

// Alert.alert(WebRTC)

var {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  getUserMedia,
} = WebRTC;

export default class App extends React.Component {
  constructor(props){
    super(props)
    this.currentStrokeColor = '#ffffff'
    this.state = {
      canvas: null
      , mouseDown: false
      , lastMousePos: null
      , mousePosIdx: -1
      , portraitHistory: {
          mousePositionArray: []
        }
    }
    this.rtc()
    console.log('in constructor')
  }

  rtc = () => {
    var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
    var pc = new RTCPeerConnection(configuration)

    // var configuration = {"iceServers": [{"url": "turn:localhost:9000/api",}], "peerIdentity":12}
    //  // peer = new Peer(id, {key:'peerjs', port:9000, host:'localhost', path: '/api', debug:3})
    
     let isFront = true;
     MediaStreamTrack.getSources(sourceInfos => {
       console.log(sourceInfos);
       let videoSourceId;
       for (let i = 0; i < sourceInfos.length; i++) {
         const sourceInfo = sourceInfos[i];
         if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
           videoSourceId = sourceInfo.id;
           console.log(videoSourceId)
         }
       }
     
     console.log('getUserMedia') 
     getUserMedia({
       audio: true,
       video: {
         mandatory: {
           minWidth: 500, // Provide your own width, height and frame rate here
           minHeight: 300,
           minFrameRate: 30
         },
         facingMode: (isFront ? "user" : "environment"),
         optional: (videoSourceId ? [{sourceId: videoSourceId}] : [])
       }
     }, function (stream) {
       console.log('dddd', stream);
       callback(stream);
     }, (err)=>{console.log('error: '+err)});
   });

   pc.createOffer(function(desc) {
     pc.setLocalDescription(desc, function () {
      console.log('pc.setLocalDescription')
  //      // Send pc.localDescription to peer
     }, function(e) {});
   }, function(e) {});

   pc.onicecandidate = function (event) {
      console.log('pc.onicecandidate')
  //    // send event.candidate to peer
   };

  }
  
  handleCanvas = (canvas) => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'purple';
    ctx.fillRect(0, 0, 200, 200);
    this.setState({canvas: canvas})
  }

  playDrawing = (canvas, mousePositionArray, mousePosIdx) => {
    if (mousePositionArray.length < 2) {
      return
    }
    let ctx = canvas.getContext('2d')
    let lastMousePos = mousePositionArray[mousePosIdx-1]
    let mousePos = mousePositionArray[mousePosIdx]
    if(!lastMousePos.mouseUp){
      ctx.beginPath()
      ctx.moveTo(lastMousePos.x, lastMousePos.y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.lineWidth = 2
      ctx.strokeStyle = mousePositionArray[mousePosIdx-1].color
      ctx.stroke()
    }
    if(mousePosIdx < mousePositionArray.length - 1){
      this.playDrawing(canvas, mousePositionArray, mousePosIdx + 1)
    }
  }
  
  getAndStoreMousePos = (evt, mouseUpBool) => {
    let newPH = this.state.portraitHistory
    newPH.mousePositionArray.push({
      x: evt.nativeEvent.locationX
      , y: evt.nativeEvent.locationY
      , mouseUp: mouseUpBool
      , color: this.currentStrokeColor 
    })
    this.setState({
      portraitHistory: newPH
      , mousePosIdx: this.state.mousePosIdx+1
    })
    return {
      x: evt.nativeEvent.locationX
      , y: evt.nativeEvent.locationY
      , mouseUp: mouseUpBool    
    }
  }

  mouseDownListener = (evt) => {
    this.getAndStoreMousePos(evt ,false)
    this.setState({mouseDown: true})
  }

  mouseMoveListener = (evt) => {
    if (this.state.mouseDown) {
      const mousePos = this.getAndStoreMousePos(evt, false)
    }
  }

  mouseUpListener = (evt) => {
    this.setState({mouseDown: false})
    this.getAndStoreMousePos(evt, true)
  }

  render() {
    if (this.state.canvas) {
      this.playDrawing(this.state.canvas, this.state.portraitHistory.mousePositionArray, this.state.mousePosIdx)
    }
    return (
      <View 
        onStartShouldSetResponder={()=>true}
        onResponderStart={this.mouseDownListener}
        onResponderMove={this.mouseMoveListener}
        onResponderRelease={this.mouseUpListener}
        onResponderTerminationRequest={(evt) => true}
      >
        <Text>Dont open up App.js to start working on your app!</Text>
        <Canvas ref={this.handleCanvas}/>
      </View>
    );
  }
}