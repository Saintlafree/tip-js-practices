const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
export function validateTaskDraft(draft, categories) {
  const errors = {};
  if (!draft || typeof draft !== "object") draft = {};
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  if (!title) errors.title = "Введите название задачи.";
  else if (title.length > 100) errors.title = "Название должно содержать не более 100 символов.";
  const priority = draft.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  const categoryId = typeof draft.categoryId === "number" ? draft.categoryId : Number(draft.categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !Array.isArray(categories) || !categories.some(c => c.id === categoryId)) errors.categoryId = "Выберите существующую категорию.";
  if (Object.keys(errors).length) return { valid:false, value:null, errors };
  return { valid:true, value:{ title, priority, categoryId }, errors };
}
