import { ApiError } from "./api-client.js";
const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);
const invalid = (message) => new ApiError(message, { kind: "invalid-response" });
const positive = (v) => Number.isSafeInteger(v) && v > 0;
function isTask(v) { return Boolean(v && typeof v === "object" && positive(v.id) && typeof v.title === "string" && v.title.trim().length >= 1 && v.title.trim().length <= 100 && typeof v.completed === "boolean" && ALLOWED_PRIORITIES.has(v.priority) && positive(v.categoryId)); }
function isCategory(v) { return Boolean(v && typeof v === "object" && positive(v.id) && typeof v.name === "string" && v.name.trim().length >= 1 && v.name.trim().length <= 100); }
function checkedCollection(payload, predicate, label, withMeta = false) {
  if (!payload || !Array.isArray(payload.data) || !payload.data.every(predicate) || new Set(payload.data.map(x => x.id)).size !== payload.data.length) throw invalid(`Некорректный список: ${label}.`);
  if (withMeta && (!payload.meta || !Number.isSafeInteger(payload.meta.total) || payload.meta.total !== payload.data.length || !payload.meta.filters || typeof payload.meta.filters !== "object")) throw invalid("Некорректное поле meta ответа задач.");
  if (!withMeta && payload.meta && payload.meta.total !== payload.data.length) throw invalid("Некорректное поле meta.total категорий.");
  return payload.data;
}
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") throw new TypeError("Требуется клиент requestJson");
  function normalizeFilters(filters = {}) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) throw new TypeError("Фильтры должны быть объектом");
    const result = {};
    for (const [key, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTERS.has(key)) throw new TypeError(`Неизвестный фильтр: ${key}`);
      if (key === "completed" && typeof value !== "boolean") throw new TypeError("completed должен быть boolean");
      if (key === "priority" && !ALLOWED_PRIORITIES.has(value)) throw new TypeError("Недопустимый priority");
      if (key === "categoryId" && !positive(value)) throw new TypeError("categoryId должен быть положительным целым числом");
      if (key === "q" && (typeof value !== "string" || value.trim().length < 1 || value.trim().length > 100)) throw new TypeError("Некорректный q");
      result[key] = key === "q" ? value.trim() : value;
    }
    return result;
  }
  async function getTasks(filters = {}, options) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { ...(options ?? {}), query });
    const tasks = checkedCollection(payload, isTask, "задач", true);
    return { tasks, meta: payload.meta };
  }
  async function getTaskById(id, options) {
    if (!positive(id)) throw new TypeError("id должен быть положительным целым числом");
    const payload = await client.requestJson(`/tasks/${id}`, options);
    if (!payload || !isTask(payload.data)) throw invalid("Некорректная задача в ответе сервера.");
    return payload.data;
  }
  async function getCategories(options) {
    const payload = await client.requestJson("/categories", options);
    return checkedCollection(payload, isCategory, "категорий");
  }
  async function loadInitialData(filters = {}, options) {
    const [taskResult, categories] = await Promise.all([getTasks(filters, options), getCategories(options)]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }
  return { getTasks, getTaskById, getCategories, loadInitialData };
}
