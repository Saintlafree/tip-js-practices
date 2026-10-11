"use strict";

// ПР1, задание 4. План выполнения оставшихся задач по дням.
// Вариант 2: totalTasks = 15, completedTasks = 0, dailyLimit = 4.
const totalTasks = 15;
const completedTasks = 0;
const dailyLimit = 4;

const MAX_TASK_COUNT = 1000;
const MAX_DAILY_LIMIT = 1000;

// Проверки totalTasks и completedTasks — как в progress.js,
// затем обязательно проверяется dailyLimit (даже если задач не осталось).
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
} else if (typeof dailyLimit !== "number") {
  problem = `dailyLimit должен быть числом, получен тип ${typeof dailyLimit}`;
} else if (!Number.isFinite(dailyLimit)) {
  problem = "dailyLimit — недопустимое числовое значение (NaN или Infinity)";
} else if (!Number.isInteger(dailyLimit)) {
  problem = "dailyLimit (дневная норма) должен быть целым числом";
} else if (dailyLimit < 1 || dailyLimit > MAX_DAILY_LIMIT) {
  problem = `dailyLimit должен быть в диапазоне от 1 до ${MAX_DAILY_LIMIT}`;
}

if (problem !== null) {
  console.log(`Ошибка: ${problem}`);
} else {
  let tasksLeft = totalTasks - completedTasks;
  let dayCounter = 0;

  if (tasksLeft === 0) {
    console.log("Все задачи уже выполнены, планировать нечего");
  } else {
    console.log(`Осталось задач: ${tasksLeft}`);
  }

  // dailyLimit >= 1, поэтому tasksLeft уменьшается на каждой итерации
  // и цикл обязательно завершится.
  while (tasksLeft > 0) {
    dayCounter += 1;

    // В последний день можно сделать только то, что осталось.
    let doneToday = dailyLimit;
    if (tasksLeft < dailyLimit) {
      doneToday = tasksLeft;
    }

    tasksLeft -= doneToday;
    console.log(`День ${dayCounter}: выполнено ${doneToday}, осталось ${tasksLeft}`);
  }

  console.log(`Потребуется дней: ${dayCounter}`);
}
