const express = require("express");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

// Track active connections
let clients = new Set();

wss.on("connection", (ws) => {
  console.log("New client connected");
  clients.add(ws);

  ws.on("message", (data) => {
    const messageString = data.toString();
    console.log("Broadcasting:", messageString);

    // Broadcast to every connected client (Dashboard and ESPs)
    clients.forEach((client) => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(messageString);
      }
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("Socket Error:", err);
    clients.delete(ws);
  });
});

// Keep-Alive Ping (prevents Railway from sleeping)
setInterval(() => {
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "ping" }));
    }
  });
}, 30000);
