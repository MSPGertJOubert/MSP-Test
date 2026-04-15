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

// Use a set to keep track of active connections
let clients = new Set();

wss.on("connection", (ws, req) => {
  console.log(`New connection established`);
  clients.add(ws);

  ws.on("message", (data) => {
    const messageString = data.toString();
    console.log("Broadcasting data:", messageString);

    // BROADCAST TO EVERYONE
    // We remove the "client !== ws" check to ensure the dashboard 
    // always receives the relay from the ESP32.
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
    console.error("WS Error:", err);
    clients.delete(ws);
  });
});

// KEEP ALIVE: Sends a ping every 30 seconds to stop Railway from idling
setInterval(() => {
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "ping" }));
    }
  });
}, 30000);
