import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// main.js только вызывает функции task-service.js и печатает результат.

function formatStats(tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  const progressText = total === 0 ? "Задач пока нет" : `${progress.toFixed(1)}%`;
  return `${total} / ${completed} / ${pending} / ${progressText}`;
}

function idsOf(tasks) {
  return `[${tasks.map(({ id }) => id).join(", ")}]`;
}

function showState(title, tasks) {
  console.log(`\n--- ${title} ---`);
  for (const { id, title: name, completed, priority } of tasks) {
    console.log(`  #${id} [${completed ? "x" : " "}] ${name} (${priority})`);
  }
  console.log(`  Названия: ${getTaskTitles(tasks).join(" | ")}`);
  console.log(`  Невыполненные: ${idsOf(getPendingTasks(tasks))}`);
  console.log(`  Всего / выполнено / осталось / прогресс: ${formatStats(tasks)}`);
}

// Состояние заменяется только при result.ok === true.
function step(label, state, result) {
  if (!result.ok) {
    console.log(`✗ ${label} — Ошибка: ${result.error}`);
    console.log(`  состояние не изменилось: ${idsOf(state)}, ${formatStats(state)}`);
    return state;
  }
  console.log(`✓ ${label} -> ${idsOf(result.tasks)}, ${formatStats(result.tasks)}`);
  return result.tasks;
}

// ===== Общий сценарий =====
console.log("===== ОБЩИЙ СЦЕНАРИЙ (demoTasks) =====");
const demoBefore = JSON.stringify(demoTasks);
let tasks = demoTasks;

showState("Исходный набор", tasks);

const task4 = findTaskById(tasks, 4);
console.log(`\nfindTaskById(4): ${task4 ? task4.title : "не найдена"}`);
console.log(`findTaskById("4"): ${findTaskById(tasks, "4")}`);
const sample = createTask(99, "  Отдельно созданная задача  ", "low");
console.log("createTask(99, ...):", sample.ok ? sample.task : sample.error);
console.log("");

tasks = step("addTask id 20", tasks, addTask(tasks, 20, "Добавить проверку", "high"));
tasks = step("setTaskCompleted id 4 = true", tasks, setTaskCompleted(tasks, 4, true));
tasks = step(
  "renameTask id 10",
  tasks,
  renameTask(tasks, 10, "Подготовить инструкцию запуска"),
);
tasks = step("removeTask id 7", tasks, removeTask(tasks, 7));

// Отказы: отсутствующая задача и статус числом.
tasks = step("setTaskCompleted id 99 = true", tasks, setTaskCompleted(tasks, 99, true));
tasks = step("setTaskCompleted id 20 = 1", tasks, setTaskCompleted(tasks, 20, 1));

showState("Итог общего сценария", tasks);
console.log(`\ndemoTasks сохранён без изменений: ${JSON.stringify(demoTasks) === demoBefore}`);
console.log(`Сводка demoTasks: ${formatStats(demoTasks)}`);

// ===== Индивидуальный вариант =====
console.log(`\n===== ВАРИАНТ ${variantNumber} (variantTasks) =====`);
const variantBefore = JSON.stringify(variantTasks);
let mine = variantTasks;

showState("Исходный набор варианта", mine);
console.log("");

mine = step("addTask id 80", mine, addTask(mine, 80, "Отправить слайды организатору", "medium"));
mine = step("setTaskCompleted id 11 = true", mine, setTaskCompleted(mine, 11, true));
mine = step("renameTask id 23", mine, renameTask(mine, 23, "Составить подробный план доклада"));
mine = step("removeTask id 37", mine, removeTask(mine, 37));
mine = step("addTask id 80 повторно", mine, addTask(mine, 80, "Ещё раз отправить слайды", "medium"));

showState("Итог варианта", mine);
console.log(`\nvariantTasks сохранён без изменений: ${JSON.stringify(variantTasks) === variantBefore}`);
console.log(`Сводка variantTasks: ${formatStats(variantTasks)}`);
