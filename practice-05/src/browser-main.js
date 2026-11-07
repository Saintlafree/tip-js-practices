import { ApiError, createApiClient } from "./api-client.js";
import { createTaskApi } from "./task-api.js";
import { variantFilters, variantNumber } from "./variant.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  apiDot: $("#api-dot"), apiStatus: $("#api-status"), apiUrl: $("#api-url"),
  total: $("#stat-total"), categories: $("#stat-categories"), time: $("#stat-time"), http: $("#stat-http"),
  form: $("#filters-form"), query: $("#filter-query"), completed: $("#filter-completed"),
  priority: $("#filter-priority"), category: $("#filter-category"),
  refresh: $("#refresh-list"), clear: $("#clear-filters"), message: $("#request-message"),
  state: $("#list-state"), count: $("#result-count"), list: $("#task-list"),
  detailMessage: $("#detail-message"), detailOutput: $("#detail-output"), test404: $("#test-404"),
};

const params = new URLSearchParams(window.location.search);
const requestedApi = params.get("api") || "http://127.0.0.1:5505/api";
const baseUrl = new URL(requestedApi).href.replace(/\/$/, "");
const isVariant = params.get("dataset") === "variant";
const client = createApiClient({ baseUrl, timeoutMs: 3000 });
const api = createTaskApi(client);
let categories = [];
let currentFilters = isVariant ? { ...variantFilters } : {};
let requestController = null;

function setMessage(message, kind = "") {
  elements.message.textContent = message;
  elements.message.className = `request-message${kind ? ` is-${kind}` : ""}`;
}

function setConnection(online, label) {
  elements.apiDot.classList.toggle("is-online", online);
  elements.apiDot.classList.toggle("is-offline", !online);
  elements.apiStatus.textContent = label;
}

function showError(error) {
  if (error instanceof ApiError) {
    const parts = [`${error.kind}: ${error.message}`];
    if (error.status !== null) parts.push(`HTTP ${error.status}`);
    if (error.code) parts.push(error.code);
    return parts.join(" · ");
  }
  return error instanceof Error ? error.message : "Не удалось выполнить запрос.";
}

function createTaskCard(task) {
  const card = document.createElement("li");
  card.className = `task-card ${task.completed ? "is-completed" : "is-pending"}`;
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  const meta = document.createElement("div");
  meta.className = "task-meta";
  const status = document.createElement("span");
  status.className = `pill ${task.completed ? "is-completed" : "is-pending"}`;
  status.textContent = task.completed ? "Выполнена" : "В работе";
  const priority = document.createElement("span");
  priority.className = "pill";
  priority.textContent = `Приоритет: ${{ low: "низкий", medium: "средний", high: "высокий" }[task.priority]}`;
  const category = categories.find((item) => item.id === task.categoryId);
  const categoryLabel = document.createElement("span");
  categoryLabel.textContent = category ? category.name : "Без категории";
  const identifier = document.createElement("span");
  identifier.textContent = `ID: ${task.id}`;
  meta.append(status, priority, categoryLabel, identifier);
  const actions = document.createElement("div");
  actions.className = "task-actions";
  const details = document.createElement("button");
  details.type = "button";
  details.textContent = "Подробнее";
  details.addEventListener("click", () => loadTaskDetails(task.id));
  actions.append(details);
  card.append(title, meta, actions);
  return card;
}

function renderTasks(tasks) {
  const fragment = document.createDocumentFragment();
  for (const task of tasks) fragment.append(createTaskCard(task));
  elements.list.replaceChildren(fragment);
  elements.count.textContent = `${tasks.length} из ${elements.total.textContent}`;
  elements.state.hidden = tasks.length > 0;
  if (tasks.length === 0) {
    elements.state.className = "list-state";
    elements.state.textContent = "По выбранным условиям задач нет.";
  }
}

function readFilters() {
  const filters = {};
  const query = elements.query.value.trim();
  const completed = elements.completed.value;
  const priority = elements.priority.value;
  const categoryId = elements.category.value;
  if (query) filters.q = query;
  if (completed !== "") filters.completed = completed === "true";
  if (priority) filters.priority = priority;
  if (categoryId) filters.categoryId = Number(categoryId);
  return filters;
}

function applyFiltersToForm(filters) {
  elements.query.value = filters.q ?? "";
  elements.completed.value = filters.completed === undefined ? "" : String(filters.completed);
  elements.priority.value = filters.priority ?? "";
  elements.category.value = filters.categoryId === undefined ? "" : String(filters.categoryId);
}

async function loadTasks(filters = currentFilters) {
  requestController?.abort();
  requestController = new AbortController();
  const controller = requestController;
  const started = performance.now();
  elements.refresh.disabled = true;
  elements.state.hidden = false;
  elements.state.className = "list-state";
  elements.state.textContent = "Выполняется GET-запрос…";
  elements.list.replaceChildren();
  setMessage("Получаем задачи и категории параллельно через Promise.all…");
  try {
    const result = await api.loadInitialData(filters, { signal: controller.signal });
    if (controller !== requestController) return;
    categories = result.categories;
    const duration = performance.now() - started;
    currentFilters = { ...filters };
    elements.total.textContent = String(result.meta.total);
    elements.categories.textContent = String(categories.length);
    elements.time.textContent = `${duration.toFixed(0)} мс`;
    elements.http.textContent = "200 OK";
    elements.apiUrl.textContent = baseUrl;
    elements.category.replaceChildren(new Option("Все категории", ""));
    for (const category of categories) elements.category.add(new Option(category.name, String(category.id)));
    applyFiltersToForm(currentFilters);
    renderTasks(result.tasks);
    setConnection(true, "API подключён");
    setMessage(`Получено ${result.meta.total} задач. Фильтры переданы в query-параметрах.`, "success");
  } catch (error) {
    if (controller !== requestController || error?.kind === "aborted") return;
    setConnection(false, "Нет соединения с API");
    elements.http.textContent = error instanceof ApiError && error.status !== null ? String(error.status) : "—";
    elements.state.hidden = false;
    elements.state.className = "list-state is-error";
    elements.state.textContent = showError(error);
    elements.total.textContent = "—";
    elements.count.textContent = "Нет данных";
    setMessage(showError(error), "error");
  } finally {
    if (controller === requestController) elements.refresh.disabled = false;
  }
}

async function loadTaskDetails(id) {
  elements.detailMessage.textContent = `Запрос GET /tasks/${id}…`;
  elements.detailOutput.hidden = true;
  try {
    const task = await api.getTaskById(id);
    elements.detailMessage.textContent = `Сервер вернул задачу ${id}.`;
    elements.detailOutput.textContent = JSON.stringify({ data: task }, null, 2);
    elements.detailOutput.hidden = false;
  } catch (error) {
    elements.detailMessage.textContent = showError(error);
    elements.detailOutput.textContent = JSON.stringify({ kind: error.kind, status: error.status, code: error.code, details: error.details }, null, 2);
    elements.detailOutput.hidden = false;
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadTasks(readFilters());
});
elements.refresh.addEventListener("click", () => loadTasks(currentFilters));
elements.clear.addEventListener("click", () => {
  applyFiltersToForm({});
  loadTasks({});
});
elements.test404.addEventListener("click", () => loadTaskDetails(999));

elements.apiUrl.textContent = baseUrl;
if (isVariant) {
  elements.completed.value = "true";
  setMessage(`Индивидуальный вариант № ${variantNumber}: загружаются выполненные задачи.`);
}
loadTasks(currentFilters);
