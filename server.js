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

let clients = new Set();

wss.on("connection", (ws, req) => {
  const origin = req.headers.origin || "unknown";
  console.log(`Client connected: ${origin}`);
  clients.add(ws);

  ws.on("message", (data) => {
    console.log("Data received:", data.toString());
    // Broadcast to all dashboard clients
    for (const client of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(data.toString());
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });
});
