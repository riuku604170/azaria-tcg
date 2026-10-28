const { PeerServer } = require("peer");

const port = process.env.PORT || 9000;

const server = PeerServer({
  port: port,
  path: "/",
  proxied: true,          // Necesario detrás del proxy de Render
  allow_discovery: true,
  debug: true
});

server.on("connection", (client) => {
  console.log("[PEER] Cliente conectado:", client.getId());
});

server.on("disconnect", (client) => {
  console.log("[PEER] Cliente desconectado:", client.getId());
});

console.log(`[PEER] Servidor PeerJS escuchando en puerto ${port}, path "/"`);
