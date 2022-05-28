const express = require('express')
const app = express()
const port = 4000

let server = app.listen(port, function () {
  console.log('listening on http://localhost:4000')
})

app.use(express.static('public'))