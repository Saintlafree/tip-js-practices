// Новый модуль ПР3. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.

// Правило отбора для каждого режима. filter() всегда возвращает новый массив,
// поэтому и для "all" получается копия, а не тот же самый массив.
const FILTER_RULES = {
  all: () => true,
  pending: (task) => task.completed === false,
  completed: (task) => task.completed === true,
};

export function getVisibleTasks(tasks, filter = "all") {
  const rule = FILTER_RULES[filter] ?? FILTER_RULES.all;
  return tasks.filter(rule);
}
