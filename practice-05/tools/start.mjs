import { createApiServer } from "../api/server.mjs";
import { createStaticServer } from "./static-server.mjs";

const HOST = "127.0.0.1";
const apiPort = Number(process.argv[2] ?? process.env.API_PORT ?? 5505);
const webPort = Number(process.argv[3] ?? process.env.WEB_PORT ?? 5507);
if (![apiPort, webPort].every((port) => Number.isInteger(port) && port >= 1024 && port <= 65535) || apiPort === webPort) {
  console.error("Укажите два разных порта в диапазоне 1024–65535.");
  process.exit(1);
}
const apiServer = createApiServer();
const webServer = createStaticServer(webPort);
let closing = false;
function closeAll(code = 0) {
  if (closing) return;
  closing = true;
  let pending = 0;
  for (const server of [apiServer, webServer]) {
    if (server.listening) {
      pending += 1;
      server.close(() => { pending -= 1; if (pending === 0) process.exit(code); });
    }
  }
  if (pending === 0) process.exit(code);
}
function fail(label, port, error) {
  console.error(`${label}: ${error.code === "EADDRINUSE" ? `порт ${port} уже занят` : error.message}`);
  closeAll(1);
}
apiServer.once("error", (error) => fail("API", apiPort, error));
webServer.once("error", (error) => fail("Сайт", webPort, error));
apiServer.listen(apiPort, HOST, () => {
  webServer.listen(webPort, HOST, () => {
    console.log(`API ПР5: http://${HOST}:${apiPort}/api`);
    console.log(`Сайт ПР5: http://${HOST}:${webPort}/`);
    console.log(`Вариант № 2: http://${HOST}:${webPort}/?dataset=variant`);
    console.log("Для остановки нажмите Ctrl+C.");
  });
});
process.on("SIGINT", () => closeAll(0));
process.on("SIGTERM", () => closeAll(0));
