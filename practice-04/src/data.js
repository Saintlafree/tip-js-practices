// Общий контрольный набор из методички. Не меняется под вариант.
// id задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант 2 — подготовка выступления. K = 1: выполнена только первая задача.
export const variantNumber = 2;
export const variantTasks = [
  { id: 11, title: "Выбрать тему выступления", completed: true, priority: "high" },
  { id: 23, title: "Составить план доклада", completed: false, priority: "medium" },
  { id: 37, title: "Подготовить слайды презентации", completed: false, priority: "high" },
  { id: 41, title: "Отрепетировать речь с таймером", completed: false, priority: "medium" },
  { id: 58, title: "Собрать ответы на возможные вопросы", completed: false, priority: "low" },
  { id: 64, title: "Проверить проектор и кликер в аудитории", completed: false, priority: "low" },
];
