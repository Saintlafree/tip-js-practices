// Собственные проверки ПР2 (Куксов Д. С.).
// Вынесены в отдельный файл, чтобы готовый checks.js оставался без изменений.
// Запуск из корня репозитория: node practice-02/my-checks.js
import assert from "node:assert/strict";
import {
  findTaskById, getPendingTasks, getTaskStats,
  addTask, setTaskCompleted, renameTask, removeTask,
} from "./src/task-service.js";

let passed = 0;
let failed = 0;

function check(name, action) {
  try {
    action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.message);
  }
}

// Свежая копия общего набора для каждой проверки.
function fixture() {
  return [
    { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
    { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
    { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
    { id: 10, title: "Оформить README", completed: true, priority: "medium" },
  ];
}

function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

function expectFailure(result) {
  assert.equal(result.ok, false, "Ожидается ok: false");
  assert.ok(typeof result.error === "string" && result.error.trim() !== "");
}

function expectTasks(result) {
  assert.equal(result.ok, true, "Ожидается ok: true");
  assert.ok(Array.isArray(result.tasks));
  return result.tasks;
}


check("С1. удаление всех задач по одной до пустого списка", () => {
  const tasks = fixture();
  const before = copyTasks(tasks);

  let current = tasks;
  const history = [];
  for (const id of [10, 1, 7, 4]) {
    current = expectTasks(removeTask(current, id));
    history.push(current.map((task) => task.id));
  }

  assert.deepEqual(history, [[1, 4, 7], [4, 7], [4], []]);
  assert.deepEqual(getTaskStats(current), { total: 0, completed: 0, pending: 0, progress: 0 });
  assert.deepEqual(getPendingTasks(current), []);
  // После опустошения списка удалять уже нечего.
  expectFailure(removeTask(current, 4));
  assert.deepEqual(tasks, before);
});

check("С2. отказ в середине цепочки не портит прошлый результат", () => {
  const tasks = fixture();
  const before = copyTasks(tasks);

  const renamed = expectTasks(renameTask(tasks, 7, "Разобрать find, filter и map"));
  const renamedCopy = copyTasks(renamed);

  // Некорректный приоритет и строковый статус — оба вызова должны вернуть отказ.
  expectFailure(addTask(renamed, 30, "Новая задача", "urgent"));
  expectFailure(setTaskCompleted(renamed, 7, "true"));
  assert.deepEqual(renamed, renamedCopy);

  // После отказов цепочка продолжается от того же состояния.
  const done = expectTasks(setTaskCompleted(renamed, 7, true));
  assert.deepEqual(findTaskById(done, 7), {
    id: 7, title: "Разобрать find, filter и map", completed: true, priority: "low",
  });
  assert.deepEqual(getTaskStats(done), { total: 4, completed: 3, pending: 1, progress: 75 });
  assert.deepEqual(tasks, before);
});

check("С3. переименование на границе 100 символов", () => {
  const tasks = fixture();
  const before = copyTasks(tasks);
  const exact = "Т".repeat(100);

  const renamed = expectTasks(renameTask(tasks, 4, `   ${exact}   `));
  const task = findTaskById(renamed, 4);
  assert.equal(task.title, exact);
  assert.equal(task.title.length, 100);
  assert.equal(task.completed, false);
  assert.equal(task.priority, "high");

  expectFailure(renameTask(tasks, 4, `${exact}Т`));
  expectFailure(renameTask(renamed, 4, "     "));
  assert.equal(findTaskById(renamed, 4).title, exact);
  assert.deepEqual(tasks, before);
});

console.log(`\nСобственных проверок пройдено: ${passed}; не пройдено: ${failed}.`);
if (failed > 0) {
  process.exitCode = 1;
}
