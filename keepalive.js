const express = require("express")

const server = express()

server.all("/", (req, res) => {
   res.sendFile('./webpages/test.html',{root: __dirname })
})


function keepAlive() {
  server.listen(3000, () => {
    console.log("Server is ready.")
  })
}

module.exports = keepAlive