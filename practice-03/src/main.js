import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
// Наборы не смешиваются, редактировать код для переключения не требуется.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

const FILTER_VALUES = new Set(["all", "pending", "completed"]);

function setMessage(text) {
  elements.message.textContent = text;
}

// Полный список + фильтр -> видимая выборка -> список, сводка, пустое состояние.
// currentTasks только читается, обработчики здесь не назначаются.
function renderApp() {
  const visibleTasks = getVisibleTasks(currentTasks, currentFilter);

  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  elements.filters.querySelectorAll("button[data-filter]").forEach((button) => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

// Строка из data-task-id -> положительное безопасное целое или null.
// Number("4abc") даёт NaN, поэтому "4abc" не превращается в 4 (в отличие от parseInt).
function readTaskId(card) {
  const id = Number(card.dataset.taskId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function handleTaskListClick(event) {
  if (!(event.target instanceof Element)) return;

  // Клик мог прийти по вложенному span — поднимаемся до кнопки.
  const button = event.target.closest("button[data-action]");
  if (button === null || !elements.list.contains(button)) return;

  const { action } = button.dataset;
  if (action !== "toggle" && action !== "delete") return;

  const card = button.closest("li[data-task-id]");
  if (card === null) return;

  const id = readTaskId(card);
  if (id === null) {
    setMessage(`Ошибка: в карточке неверный идентификатор «${card.dataset.taskId}»`);
    return;
  }

  let result;
  if (action === "delete") {
    result = removeTask(currentTasks, id);
  } else {
    // Текущий статус читается из массива, а не из текста кнопки или класса карточки.
    const task = findTaskById(currentTasks, id);
    result = task === undefined
      ? { ok: false, error: `Задача ${id} не найдена` }
      : setTaskCompleted(currentTasks, id, !task.completed);
  }

  if (!result.ok) {
    setMessage(`Ошибка: ${result.error}`);
    return;
  }

  currentTasks = result.tasks;
  setMessage("");
  renderApp();
  restoreTaskFocus(id, action);
}

function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button[data-filter]");
  if (button === null || !elements.filters.contains(button)) return;

  const nextFilter = button.dataset.filter;
  if (!FILTER_VALUES.has(nextFilter)) return;

  // Меняется только режим показа; currentTasks не трогаем.
  currentFilter = nextFilter;
  setMessage("");
  renderApp();
}

// Готовая вспомогательная функция. Сохраняет понятную позицию клавиатурного фокуса
// после замены карточек. Если карточки больше нет, фокус получает активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);

// До реализации renderApp ожидается сообщение о заглушке.
// try/catch здесь — готовая диагностика старта, а не замена проверки result.ok.
try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
