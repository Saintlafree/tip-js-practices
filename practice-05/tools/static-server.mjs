import http from "node:http";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOST = "127.0.0.1";
const ROOT = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const MIME = new Map([[".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".css", "text/css; charset=utf-8"]]);

function allowedFile(name) {
  return name === "index.html" || name === "styles.css" || name.startsWith("src/") || name.startsWith("examples/");
}

function sendText(response, status, message, head = false) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(head ? undefined : message);
}

export function createStaticServer(port = 5507) {
  return http.createServer(async (request, response) => {
    const head = request.method === "HEAD";
    if (request.method !== "GET" && !head) {
      response.setHeader("Allow", "GET, HEAD");
      sendText(response, 405, "Method not allowed", head);
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, `http://${HOST}:${port}`).pathname);
      if (pathname.includes("\\") || pathname.includes("\0") || pathname.split("/").some((part) => part.startsWith("."))) {
        sendText(response, 403, "Forbidden", head);
        return;
      }
      const name = pathname === "/" ? "index.html" : pathname.slice(1);
      const contentType = MIME.get(path.extname(name));
      if (!allowedFile(name) || !contentType) {
        sendText(response, 404, "Not found", head);
        return;
      }
      const filename = await realpath(path.join(ROOT, name));
      const relative = path.relative(ROOT, filename);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        sendText(response, 403, "Forbidden", head);
        return;
      }
      const content = await readFile(filename);
      response.writeHead(200, { "Content-Type": contentType, "Content-Length": content.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      response.end(head ? undefined : content);
    } catch (error) {
      if (["ENOENT", "ENOTDIR", "EISDIR", "URIError"].includes(error.code) || error instanceof URIError) sendText(response, 404, "Not found", head);
      else {
        console.error(error);
        sendText(response, 500, "Internal server error", head);
      }
    }
  });
}

export function readWebPort(raw = 5507) {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new TypeError("Порт сайта должен быть целым числом от 1024 до 65535.");
  return port;
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  const port = readWebPort(process.argv[2] ?? process.env.WEB_PORT);
  const server = createStaticServer(port);
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? `Порт сайта ${port} занят.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, HOST, () => console.log(`Сайт ПР5: http://${HOST}:${port}/`));
}
