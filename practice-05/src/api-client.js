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
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.href;
}

export function createApiClient({ baseUrl, fetchFn = globalThis.fetch, timeoutMs = 2000 } = {}) {
  let parsed;
  try { parsed = new URL(baseUrl); } catch { throw new TypeError("baseUrl должен быть абсолютным URL"); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.search || parsed.hash || typeof fetchFn !== "function" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError("Некорректная конфигурация API-клиента");
  const normalizedBase = parsed.href.replace(/\/+$/, "");

  async function requestJson(path, { query, signal, timeoutMs: requestTimeout = timeoutMs } = {}) {
    if (!Number.isSafeInteger(requestTimeout) || requestTimeout <= 0) throw new TypeError("timeoutMs должен быть положительным целым числом");
    const url = buildUrl(normalizedBase, path, query);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(new Error("timeout")); }, requestTimeout);
    const onAbort = () => controller.abort(signal.reason ?? new Error("aborted"));
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
    try {
      let response;
      try { response = await fetchFn(url, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal }); }
      catch (cause) {
        if (timedOut) throw new ApiError("Превышено время ожидания ответа.", { kind: "timeout", url, cause });
        if (signal?.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
        if (controller.signal.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause });
        throw new ApiError("Ошибка сети при обращении к серверу.", { kind: "network", url, cause });
      }
      if (!response || typeof response.ok !== "boolean" || !Number.isInteger(response.status) || !response.headers || typeof response.text !== "function") throw new ApiError("Сервер вернул объект вместо HTTP-ответа.", { kind: "invalid-response", url });
      if (!response.ok) {
        let payload = null;
        try { if ((response.headers.get("content-type") || "").includes("json")) payload = await response.json(); } catch {}
        const info = payload?.error ?? {};
        throw new ApiError(info.message || `Ошибка HTTP ${response.status}.`, { kind: "http", status: response.status, code: info.code ?? null, details: info.details ?? null, url });
      }
      if (response.status === 204) return null;
      const contentType = response.headers.get("content-type") || "";
      if (!/\bapplication\/(?:[\w.+-]*\+)?json\b/i.test(contentType)) throw new ApiError("Успешный ответ не содержит JSON.", { kind: "invalid-response", status: response.status, url });
      let text;
      try { text = await response.text(); } catch (cause) { throw new ApiError("Не удалось прочитать ответ сервера.", { kind: "invalid-response", status: response.status, url, cause }); }
      try { return JSON.parse(text); } catch (cause) { throw new ApiError("Сервер вернул повреждённый JSON.", { kind: "invalid-response", status: response.status, url, cause }); }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
  return { requestJson };
}
