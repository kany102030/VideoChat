const socket = require('socket.io')
const express = require('express')
const app = express()
const port = 4000

let server = app.listen(port, function () {
  console.log('listening on http://localhost:4000')
})


app.use(express.static('public'))

const io = socket(server)

io.on('connection', function (socket) {
  console.log('User Connected :', socket.id)
  socket.on('join', function (roomName) {
    const rooms = io.sockets.adapter.rooms

    const room = rooms.get(roomName)
    if (room === undefined) {
      socket.join(roomName)
      console.log('createdsssss')
      socket.emit('created')
    } else if (room.size == 1) {
      socket.join(roomName)
      socket.emit('joined')
    } else {
      socket.emit('full')
    }
    console.log(rooms)
  })

  socket.on('ready', function (roomName) {
    console.log('ready')
    socket.broadcast.to(roomName).emit('ready')
  })
  socket.on('candidate', function (canditate, roomName) {
    console.log('candidate')
    socket.broadcast.to(roomName).emit('candidate', canditate)
  })
  socket.on('offer', function (offer, roomName) {
    console.log('offer', offer)
    socket.broadcast.to(roomName).emit('offer', offer)
  })
  socket.on('answer', function (answer, roomName) {
    socket.broadcast.to(roomName).emit('answer', answer)
  })
})