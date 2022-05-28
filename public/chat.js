const divVideoChatLobby = document.querySelector('#video-chat-lobby')
const divVideoChat = document.querySelector('#video-chat-room')
const joinButton = document.querySelector('#join')
const userVideo = document.querySelector('#user-video')
const peerVideo = document.querySelector('#peer-video')
const roomInput = document.querySelector('#roomName')

joinButton.addEventListener('click', function (event) {
  console.log(event)
  if (roomInput.value === "") {
    alert("Please enter a room name")
  } else {
    navigator.getUserMedia({
      audio: true,
      video: true,
      //use default
      //video: { width: 1280, height: 720 },
    },
      function successGetMedia(stream) {
        divVideoChatLobby.style = "display:none"
        userVideo.srcObject = stream
        userVideo.onloadedmetadata = function (e) {
          userVideo.play()
        }
      },
      function failGetMedia() {
        alert("Couldn't access user media")
      })
  }
})