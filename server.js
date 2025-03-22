const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {}; // Map of username -> WebSocket instance

// Serve frontend from "/"
app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
  let currentUser = null;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "login":
        currentUser = data.username;
        users[currentUser] = ws;
        sendUserList();
        break;

      case "offer":
      case "answer":
      case "candidate":
        const targetSocket = users[data.target];
        if (targetSocket) {
          targetSocket.send(JSON.stringify({
            ...data,
            from: currentUser // add sender info
          }));
        }
        break;
    }
  });

  ws.on("close", () => {
    if (currentUser && users[currentUser]) {
      delete users[currentUser];
      sendUserList();
    }
  });

  function sendUserList() {
    const userList = Object.keys(users);
    const payload = JSON.stringify({ type: "users", users: userList });
    Object.values(users).forEach((client) => client.send(payload));
  }
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});