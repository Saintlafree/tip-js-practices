import { ApiError } from "./api-client.js";
const PRIORITIES = new Set(["low", "medium", "high"]);
const FILTERS = new Set(["completed", "priority", "categoryId", "q"]);
const invalid = (m) => new ApiError(m, { kind: "invalid-response" });
const positive = (n) => Number.isSafeInteger(n) && n > 0;
export function isTask(v) { return Boolean(v && typeof v === "object" && positive(v.id) && typeof v.title === "string" && v.title.trim().length > 0 && v.title.trim().length <= 100 && typeof v.completed === "boolean" && PRIORITIES.has(v.priority) && positive(v.categoryId)); }
export function isCategory(v) { return Boolean(v && typeof v === "object" && positive(v.id) && typeof v.name === "string" && v.name.trim().length > 0 && v.name.trim().length <= 100); }
function collection(p, predicate, label, exactTotal = false) {
  if (!p || !Array.isArray(p.data) || !p.data.every(predicate) || new Set(p.data.map(x => x.id)).size !== p.data.length) throw invalid(`Некорректный список ${label}.`);
  if (p.meta && (!Number.isSafeInteger(p.meta.total) || p.meta.total < 0 || (exactTotal && p.meta.total !== p.data.length))) throw invalid("Некорректное meta.total.");
  if (label === "задач" && (!p.meta || !p.meta.filters || typeof p.meta.filters !== "object")) throw invalid("Отсутствует meta.filters.");
  return p.data;
}
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") throw new TypeError("Требуется requestJson");
  function normalize(filters = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new TypeError("Фильтры должны быть объектом");
    const out = {};
    for (const [k,v] of Object.entries(filters)) {
      if (!FILTERS.has(k)) throw new TypeError(`Неизвестный фильтр ${k}`);
      if (k === "completed" && typeof v !== "boolean") throw new TypeError("completed должен быть boolean");
      if (k === "priority" && !PRIORITIES.has(v)) throw new TypeError("Некорректный priority");
      if (k === "categoryId" && !positive(v)) throw new TypeError("Некорректный categoryId");
      if (k === "q" && (typeof v !== "string" || !v.trim() || v.trim().length > 100)) throw new TypeError("Некорректный q");
      out[k] = k === "q" ? v.trim() : v;
    }
    return out;
  }
  async function getTasks(filters = {}, options) {
    const payload = await client.requestJson("/tasks", { ...(options ?? {}), query: normalize(filters) });
    const tasks = collection(payload, isTask, "задач");
    return { tasks, meta: payload.meta };
  }
  async function getTaskById(id, options) { if (!positive(id)) throw new TypeError("Некорректный id"); const p = await client.requestJson(`/tasks/${id}`, options); if (!p || !isTask(p.data)) throw invalid("Некорректная задача."); return p.data; }
  async function getCategories(options) { const p = await client.requestJson("/categories", options); return collection(p, isCategory, "категорий", true); }
  async function loadInitialData(filters = {}, options) { const [r,c] = await Promise.all([getTasks(filters, options), getCategories(options)]); return { tasks:r.tasks, categories:c, meta:r.meta }; }
  async function createTask(draft, options) { const p = await client.requestJson("/tasks", { ...(options ?? {}), method:"POST", body:draft }); if (!p || !isTask(p.data)) throw invalid("Некорректная созданная задача."); return p.data; }
  async function updateTask(id, changes, options) { if (!positive(id)) throw new TypeError("Некорректный id"); const p = await client.requestJson(`/tasks/${id}`, { ...(options ?? {}), method:"PATCH", body:changes }); if (!p || !isTask(p.data)) throw invalid("Некорректная обновлённая задача."); return p.data; }
  async function setTaskCompleted(id, completed, options) { if (typeof completed !== "boolean") throw new TypeError("completed должен быть boolean"); return updateTask(id, { completed }, options); }
  async function deleteTask(id, options) { if (!positive(id)) throw new TypeError("Некорректный id"); const result = await client.requestJson(`/tasks/${id}`, { ...(options ?? {}), method:"DELETE" }); if (result !== null) throw invalid("Ожидался пустой ответ 204."); return null; }
  async function resetDemoData(options) { const p = await client.requestJson("/debug/reset", { ...(options ?? {}), method:"POST" }); if (!p || !p.data || p.data.reset !== true || !Number.isSafeInteger(p.data.total)) throw invalid("Некорректный ответ сброса."); return p.data; }
  return { getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData };
}
