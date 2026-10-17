// Opens many connections to the server in the app and resets each one as soon
// as it is established (RST, like a port scanner or a client that times out).
// On the iOS simulator the app shares the Mac's loopback, so 127.0.0.1 works.
import net from "node:net";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 9800);
const total = Number(process.env.COUNT ?? 2000);
const parallel = Number(process.env.PARALLEL ?? 50);

let started = 0;
let done = 0;
let refused = 0;

function next() {
  if (started >= total) return;
  started++;
  const socket = net.connect({ host, port });
  socket.on("connect", () => socket.resetAndDestroy());
  socket.on("error", (err) => {
    if (err.code === "ECONNREFUSED") refused++;
  });
  socket.on("close", () => {
    done++;
    if (done % 200 === 0) console.log(`${done}/${total} (refused: ${refused})`);
    if (done === total) console.log("done");
    next();
  });
}

for (let i = 0; i < parallel; i++) next();
