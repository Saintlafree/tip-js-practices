// Прикладные функции для списка задач (ПР2).
// - ничего не выводят и не обращаются к DOM;
// - не меняют переданные массивы и объекты;
// - ожидаемые ошибки возвращают как { ok: false, error }.

const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const TITLE_MAX_LENGTH = 100;

function fail(error) {
  return { ok: false, error };
}

// Пустая строка — id корректен, иначе текст ошибки.
function checkId(id) {
  if (typeof id !== "number" || !Number.isSafeInteger(id)) {
    return "id должен быть целым числом (строки не преобразуются)";
  }
  if (id <= 0) {
    return "id должен быть больше нуля";
  }
  return "";
}

// Возвращает { title } с очищенным названием или { error }.
function checkTitle(title) {
  if (typeof title !== "string") {
    return { error: "Название задачи должно быть строкой" };
  }
  const cleaned = title.trim();
  if (cleaned === "") {
    return { error: "Название задачи не может быть пустым" };
  }
  if (cleaned.length > TITLE_MAX_LENGTH) {
    return { error: `Название длиннее ${TITLE_MAX_LENGTH} символов` };
  }
  return { title: cleaned };
}

// Общая часть setTaskCompleted и renameTask:
// новый массив через map и новый объект только у выбранной задачи.
function updateTask(tasks, id, changes) {
  if (findTaskById(tasks, id) === undefined) {
    return fail(`Задача ${id} не найдена`);
  }
  const updated = tasks.map((task) => (task.id === id ? { ...task, ...changes } : task));
  return { ok: true, tasks: updated };
}

export function createTask(id, title, priority = "medium") {
  const idError = checkId(id);
  if (idError) {
    return fail(idError);
  }

  const titleCheck = checkTitle(title);
  if (titleCheck.error) {
    return fail(titleCheck.error);
  }

  if (!ALLOWED_PRIORITIES.includes(priority)) {
    return fail(`Приоритет должен быть одним из: ${ALLOWED_PRIORITIES.join(", ")}`);
  }

  return {
    ok: true,
    task: { id, title: titleCheck.title, completed: false, priority },
  };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const pending = getPendingTasks(tasks).length;
  const completed = total - pending;
  // Процент не округляется: toFixed применяется только при выводе.
  const progress = total === 0 ? 0 : (completed / total) * 100;
  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) {
    return created;
  }
  // Уникальность можно проверить только здесь: createTask не знает о списке.
  if (findTaskById(tasks, id) !== undefined) {
    return fail(`Задача с id ${id} уже есть в списке`);
  }
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idError = checkId(id);
  if (idError) {
    return fail(idError);
  }
  if (completed !== true && completed !== false) {
    return fail("Статус должен быть логическим значением true или false");
  }
  return updateTask(tasks, id, { completed });
}

export function renameTask(tasks, id, title) {
  const idError = checkId(id);
  if (idError) {
    return fail(idError);
  }
  const titleCheck = checkTitle(title);
  if (titleCheck.error) {
    return fail(titleCheck.error);
  }
  return updateTask(tasks, id, { title: titleCheck.title });
}

export function removeTask(tasks, id) {
  const idError = checkId(id);
  if (idError) {
    return fail(idError);
  }
  if (findTaskById(tasks, id) === undefined) {
    return fail(`Задача ${id} не найдена`);
  }
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
