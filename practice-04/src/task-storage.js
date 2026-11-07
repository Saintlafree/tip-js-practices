export const STORAGE_VERSION = 1;
const PRIORITIES = new Set(["low", "medium", "high"]);
export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  return value.every((task) => {
    if (!task || typeof task !== "object" || !Number.isSafeInteger(task.id) || task.id <= 0 ||
      typeof task.title !== "string" || !task.title.trim() || task.title.trim().length > 100 ||
      typeof task.completed !== "boolean" || !PRIORITIES.has(task.priority) || ids.has(task.id)) return false;
    ids.add(task.id); return true;
  });
}
const clone = (tasks) => tasks.map((task) => ({ ...task }));
export function loadTasks(storage, key, fallbackTasks) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: "initial", tasks: clone(fallbackTasks) };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION || !isValidTaskList(parsed.tasks))
      throw new Error("Сохранённые данные имеют неверную версию или структуру.");
    return { ok: true, source: "storage", tasks: clone(parsed.tasks) };
  } catch (error) {
    return { ok: false, source: "fallback", tasks: clone(fallbackTasks), error: `Не удалось восстановить данные: ${error.message}` };
  }
}
export function saveTasks(storage, key, tasks) {
  try {
    if (!isValidTaskList(tasks)) throw new Error("Список задач не прошёл проверку.");
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) { return { ok: false, error: `Не удалось сохранить данные: ${error.message}` }; }
}
export function removeSavedTasks(storage, key) {
  try { storage.removeItem(key); return { ok: true }; }
  catch (error) { return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` }; }
}
