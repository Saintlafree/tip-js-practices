"use strict";

// ПР1, задание 3. Сводка выполнения задач.
// Вариант 2: totalTasks = 15, completedTasks = 0.
const totalTasks = 15;
const completedTasks = 0;

const MAX_TASK_COUNT = 1000;

// Сначала проверяется totalTasks, затем completedTasks.
// В сообщении указывается, какое именно значение не подошло.
let problem = null;

if (typeof totalTasks !== "number") {
  problem = `totalTasks должен быть числом, получен тип ${typeof totalTasks}`;
} else if (!Number.isFinite(totalTasks)) {
  problem = "totalTasks — недопустимое числовое значение (NaN или Infinity)";
} else if (!Number.isInteger(totalTasks)) {
  problem = "totalTasks должен быть целым числом";
} else if (totalTasks < 0) {
  problem = "totalTasks не может быть отрицательным";
} else if (totalTasks > MAX_TASK_COUNT) {
  problem = `totalTasks больше допустимого максимума ${MAX_TASK_COUNT}`;
} else if (typeof completedTasks !== "number") {
  problem = `completedTasks должен быть числом, получен тип ${typeof completedTasks}`;
} else if (!Number.isFinite(completedTasks)) {
  problem = "completedTasks — недопустимое числовое значение (NaN или Infinity)";
} else if (!Number.isInteger(completedTasks)) {
  problem = "completedTasks должен быть целым числом";
} else if (completedTasks < 0) {
  problem = "completedTasks не может быть отрицательным";
} else if (completedTasks > totalTasks) {
  problem = "выполненных задач больше, чем задач всего";
}

if (problem !== null) {
  console.log(`Ошибка: ${problem}`);
} else if (totalTasks === 0) {
  // completedTasks здесь тоже 0, иначе сработала бы предыдущая проверка.
  console.log("Задач пока нет");
} else {
  const remainingTasks = totalTasks - completedTasks;
  const percent = (completedTasks * 100) / totalTasks;

  // Статус определяется по остатку, а не по округлённому проценту.
  let status = "В работе";
  if (remainingTasks === totalTasks) {
    status = "Не начато";
  } else if (remainingTasks === 0) {
    status = "Завершено";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${percent.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}
