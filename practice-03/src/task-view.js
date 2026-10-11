import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.

const PRIORITY_TEXT = { low: "Низкий", medium: "Средний", high: "Высокий" };

// Небольшая фабрика: элемент с классом и текстом.
// Текст всегда назначается через textContent, HTML не разбирается.
function makeElement(tagName, className, text = "") {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function makeActionButton(action, labelText) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.append(makeElement("span", "action-label", labelText));
  return button;
}

export function createTaskElement(task) {
  const item = makeElement("li", "task-card");
  item.dataset.taskId = String(task.id);
  if (task.completed) {
    item.classList.add("is-completed");
  }

  const toggle = makeActionButton("toggle", "Выполнена");
  toggle.setAttribute("aria-pressed", task.completed ? "true" : "false");

  const actions = makeElement("div", "task-actions");
  actions.append(toggle, makeActionButton("delete", "Удалить"));

  item.append(
    makeElement("h3", "task-title", task.title),
    makeElement("p", "task-status", task.completed ? "Выполнена" : "В работе"),
    makeElement("p", "task-priority", PRIORITY_TEXT[task.priority]),
    actions,
  );
  return item;
}

export function renderTaskList(listElement, tasks) {
  // Старые карточки заменяются новыми; сам ul (и его обработчик) остаётся.
  listElement.replaceChildren(...tasks.map(createTaskElement));
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // Сводка — по всему списку, "Показано" — по отфильтрованной выборке.
  const stats = getTaskStats(tasks);
  const texts = {
    total: `${stats.total}`,
    completed: `${stats.completed}`,
    pending: `${stats.pending}`,
    progress: `${stats.progress.toFixed(1)}%`,
    visible: `${visibleCount}`,
  };

  for (const cell of summaryElement.querySelectorAll("[data-stat]")) {
    const key = cell.dataset.stat;
    if (key in texts) {
      cell.textContent = texts[key];
    }
  }
}

export function renderEmptyState(messageElement, total, visibleCount) {
  let text = "";
  if (visibleCount === 0) {
    text = total === 0 ? "Список задач пуст." : "Нет задач по выбранному фильтру.";
  }
  messageElement.textContent = text;
  messageElement.hidden = text === "";
}
