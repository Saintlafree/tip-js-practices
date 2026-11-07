export class ApiError extends Error {
  constructor(message, { kind, status = null, code = null, details = null, url = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError"; this.kind = kind; this.status = status; this.code = code;
    this.details = details; this.url = url;
  }
}
export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || typeof path !== "string" || !query || typeof query !== "object" || Array.isArray(query)) throw new TypeError("Некорректные параметры URL");
  const url = new URL(`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  return url.href;
}
export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 3000 } = {}) {
  let parsed; try { parsed = new URL(baseUrl); } catch { throw new TypeError("baseUrl должен быть абсолютным URL"); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.search || parsed.hash || typeof fetchFn !== "function" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError("Некорректная конфигурация API-клиента");
  const base = parsed.href.replace(/\/+$/, "");
  async function requestJson(path, { method = "GET", query, body, signal, timeoutMs: limit = timeoutMs } = {}) {
    method = String(method).toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) throw new TypeError("Неподдерживаемый HTTP-метод");
    if (method === "GET" && body !== undefined) throw new TypeError("GET не поддерживает body");
    if (!Number.isSafeInteger(limit) || limit <= 0) throw new TypeError("Некорректный timeoutMs");
    const url = buildUrl(base, path, query);
    const controller = new AbortController(); let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(new Error("timeout")); }, limit);
    const abort = () => controller.abort(signal?.reason ?? new Error("aborted"));
    if (signal?.aborted) abort(); else signal?.addEventListener("abort", abort, { once: true });
    const headers = new Headers({ Accept: "application/json" });
    const init = { method, headers, signal: controller.signal };
    if (body !== undefined) { headers.set("Content-Type", "application/json"); init.body = JSON.stringify(body); }
    try {
      let response;
      try { response = await fetchFn(url, init); }
      catch (cause) {
        if (timedOut) throw new ApiError("Превышено время ожидания ответа.", { kind: "timeout", url, cause });
        if (signal?.aborted || controller.signal.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
        throw new ApiError("Ошибка сети при обращении к серверу.", { kind: "network", url, cause });
      }
      if (!response || typeof response.ok !== "boolean" || !Number.isInteger(response.status) || !response.headers || typeof response.text !== "function") throw new ApiError("Некорректный HTTP-ответ.", { kind: "invalid-response", url });
      if (!response.ok) {
        let payload = null; try { if ((response.headers.get("content-type") || "").includes("json")) payload = await response.json(); } catch {}
        const e = payload?.error ?? {};
        throw new ApiError(e.message || `Ошибка HTTP ${response.status}.`, { kind: "http", status: response.status, code: e.code ?? null, details: e.details ?? null, url });
      }
      if (response.status === 204) return null;
      if (!/\bapplication\/(?:[\w.+-]*\+)?json\b/i.test(response.headers.get("content-type") || "")) throw new ApiError("Успешный ответ не содержит JSON.", { kind: "invalid-response", status: response.status, url });
      let raw; try { raw = await response.text(); } catch (cause) { throw new ApiError("Не удалось прочитать ответ.", { kind: "invalid-response", status: response.status, url, cause }); }
      try { return JSON.parse(raw); } catch (cause) { throw new ApiError("Повреждённый JSON.", { kind: "invalid-response", status: response.status, url, cause }); }
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  return { requestJson };
}
