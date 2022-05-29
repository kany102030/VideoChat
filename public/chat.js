// const socket = io.connect("http://localhost:4000")
const socket = io.connect()
const divVideoChatLobby = document.querySelector('#video-chat-lobby')
const divVideoChat = document.querySelector('#video-chat-room')
const joinButton = document.querySelector('#join')
const userVideo = document.querySelector('#user-video')
const peerVideo = document.querySelector('#peer-video')
const roomInput = document.querySelector('#roomName')
const divButtonGroup = document.querySelector('.btn-group')
const muteButton = document.querySelector('#muteButton')
const hideCameraButton = document.querySelector('#HideCameraButton')
const leaveRoomButton = document.querySelector('#LeaveRoomButton')
let creator = false
let roomName = ''
let userStream

let muteFlag = false
let hideCameraFlag = false
//stun url 前面必須加stun:
//turn url 前面必須加turn:
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}
let rtcPeerConnection;
joinButton.addEventListener('click', function (event) {
  console.log(event)
  if (roomInput.value === "") {
    alert("Please enter a room name")
  } else {
    roomName = roomInput.value
    socket.emit("join", roomName)
  }
})
muteButton.addEventListener('click', function (event) {

  console.log(userStream.getTracks())
  muteFlag = !muteFlag
  if (muteFlag) {
    userStream.getTracks()[0].enabled = false
    muteButton.textContent = 'Unmute'
  } else {
    userStream.getTracks()[0].enabled = true
    muteButton.textContent = 'Mute'
  }
})
hideCameraButton.addEventListener('click', function (event) {
  hideCameraFlag = !hideCameraFlag
  if (hideCameraFlag) {
    userStream.getTracks()[1].enabled = false
    hideCameraButton.textContent = 'ShowCamera'
  } else {
    userStream.getTracks()[1].enabled = true
    hideCameraButton.textContent = 'HideCamera'
  }
})

leaveRoomButton.addEventListener('click', function (event) {
  socket.emit('leave', roomName)
  divVideoChatLobby.style = 'display:block'
  divButtonGroup.style = 'display:none'
  // userVideo.srcObject.getTracks()[0].stop()
  // userVideo.srcObject.getTracks()[1].stop()

  if (userVideo.srcObject) {
    userVideo.srcObject.getTracks().forEach((track) => track.stop())
  }
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks().forEach((track) => track.stop())
  }

  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null
    rtcPeerConnection.onicecandidate = null
    rtcPeerConnection.close()
    rtcPeerConnection = null
  }


})

socket.on('created', function () {
  creator = true

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: 500, height: 500 },
    //use default
    //video: { width: 1280, height: 720 },
  })
    .then(function (stream) {
      userStream = stream
      divVideoChatLobby.style = 'display:none'
      divButtonGroup.style = 'display:flex'
      userVideo.srcObject = stream
      userVideo.onloadedmetadata = function (e) {
        userVideo.play()
      }
    })
    .catch(function () {
      alert("Couldn't access user media")
    })
})
socket.on('joined', function () {
  creator = false
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: 500, height: 500 },
    //use default
    //video: { width: 1280, height: 720 },
  })
    .then(function (stream) {
      userStream = stream
      divVideoChatLobby.style = "display:none"
      divButtonGroup.style = 'display:flex'
      userVideo.srcObject = stream
      userVideo.onloadedmetadata = function (e) {
        userVideo.play()
      }
      socket.emit('ready', roomName)
    })
    .catch(function () {
      alert("Couldn't access user media")
    })
})
socket.on('full', function () {
  alert('Room is full, Cannot join.')
})


socket.on('ready', function () {
  if (creator) {
    console.log('get ready')
    rtcPeerConnection = new RTCPeerConnection(iceServers)
    // everytime get iceCandidate
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction
    // everytime get stream data from the otherside
    rtcPeerConnection.ontrack = OnTrackFunction
    // add audio track to the ouput stream
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream)
    // add video track to the output stream
    // the output stream will in the peerside OnTrackFunction
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream)
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        // set the local description for creator
        rtcPeerConnection.setLocalDescription(offer)
        socket.emit('offer', offer, roomName)
      })
      .catch((error) => { console.log(error) })
  }
})
socket.on('candidate', function (candidate) {
  console.log('get candidate')
  const iceCandidate = new RTCIceCandidate(candidate)
  rtcPeerConnection.addIceCandidate(iceCandidate)
})
socket.on('offer', function (offer) {
  if (!creator) {
    console.log('get offer')
    rtcPeerConnection = new RTCPeerConnection(iceServers)
    // everytime get iceCandidate
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction
    // everytime get stream data from the otherside
    rtcPeerConnection.ontrack = OnTrackFunction
    // add audio track to the ouput stream
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream)
    // add video track to the output stream
    // the output stream will in the peerside OnTrackFunction
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream)

    // set the remote description from creator
    rtcPeerConnection.setRemoteDescription(offer)

    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        // set the local description for creator
        rtcPeerConnection.setLocalDescription(answer)
        socket.emit('answer', answer, roomName)
      })
      .catch((error) => { console.log(error) })
  }
})
socket.on('answer', function (answer) {
  console.log('get answer')
  // set the remote description from joiner
  rtcPeerConnection.setRemoteDescription(answer)
})
socket.on('leave', function () {
  //當對方離開時
  creator = true
  if (rtcPeerConnection) {
    rtcPeerConnection.ontrack = null
    rtcPeerConnection.onicecandidate = null
    rtcPeerConnection.close()
    rtcPeerConnection = null
  }
  if (peerVideo.srcObject) {
    peerVideo.srcObject.getTracks().forEach((track) => track.stop())
  }

})

function OnIceCandidateFunction(event) {
  if (event.candidate) {
    socket.emit('candidate', event.candidate, roomName)
  }
}
function OnTrackFunction(event) {
  //event.streams has a stream list [video stream, audio stream]
  peerVideo.srcObject = event.streams[0]
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play()
  }
}
