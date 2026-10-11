"use strict";
const totalTasks = 15;
const completedTasks = 0;
const dailyLimit = 4;
if (typeof totalTasks !== "number" || typeof completedTasks !== "number") console.log("Ошибка: количество задач должно быть числом.");
else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) console.log("Ошибка: количество задач должно быть целым числом.");
else if (totalTasks < 0 || completedTasks < 0) console.log("Ошибка: отрицательное количество задач.");
else if (totalTasks > 1000) console.log("Ошибка: превышена верхняя граница.");
else if (completedTasks > totalTasks) console.log("Ошибка: выполнено больше, чем существует.");
else if (typeof dailyLimit !== "number") console.log("Ошибка: дневная норма должна быть числом.");
else if (!Number.isInteger(dailyLimit)) console.log("Ошибка: дробной дневной нормы быть не должно.");
else if (dailyLimit < 1 || dailyLimit > 1000) console.log("Ошибка: дневная норма от 1 до 1000.");
else {
  let remainingTasks = totalTasks - completedTasks;
  let days = 0;
  if (remainingTasks === 0) console.log("Все задачи уже выполнены");
  else {
    console.log(`Осталось задач: ${remainingTasks}`);
    while (remainingTasks > 0) {
      days += 1;
      const doneToday = Math.min(dailyLimit, remainingTasks);
      remainingTasks -= doneToday;
      console.log(`День ${days}: выполнено ${doneToday}, осталось ${remainingTasks}`);
    }
  }
  console.log(`Потребуется дней: ${days}`);
}
