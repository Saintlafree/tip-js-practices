"use strict";
const totalTasks = 15;
const completedTasks = 0;
if (typeof totalTasks !== "number" || typeof completedTasks !== "number") console.log("Ошибка: количество задач должно быть числом.");
else if (!Number.isFinite(totalTasks) || !Number.isFinite(completedTasks)) console.log("Ошибка: недопустимое числовое значение.");
else if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) console.log("Ошибка: количество задач должно быть целым числом.");
else if (totalTasks < 0 || completedTasks < 0) console.log("Ошибка: отрицательное количество задач.");
else if (totalTasks > 1000) console.log("Ошибка: превышена верхняя граница.");
else if (completedTasks > totalTasks) console.log("Ошибка: выполнено больше, чем существует.");
else if (totalTasks === 0 && completedTasks === 0) console.log("Задач пока нет");
else {
  const remainingTasks = totalTasks - completedTasks;
  const progress = completedTasks / totalTasks * 100;
  let status = completedTasks === 0 ? "Не начато" : completedTasks === totalTasks ? "Завершено" : "В работе";
  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${progress.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}
