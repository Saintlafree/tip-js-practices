const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const rawId = draft?.id;
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  if (editingId === null) {
    if (!Number.isSafeInteger(id) || id <= 0) errors.id = "Введите положительный целый идентификатор.";
    else if (tasks.some((task) => task.id === id)) errors.id = `Задача с id ${id} уже есть в списке.`;
  } else if (!tasks.some((task) => task.id === editingId)) {
    errors.id = "Редактируемая задача не найдена.";
  }
  if (!title) errors.title = "Название задачи не может быть пустым.";
  else if (title.length > 100) errors.title = "Название не должно превышать 100 символов.";
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { id: editingId ?? id, title, priority } };
}
