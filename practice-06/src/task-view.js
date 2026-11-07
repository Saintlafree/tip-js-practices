const PRIORITY_LABELS = Object.freeze({ low:"Низкий", medium:"Средний", high:"Высокий" });
function actionButton(action, label, className) { const button=document.createElement("button"); button.type="button"; button.dataset.action=action; button.className=className; button.textContent=label; return button; }
export function createTaskElement(task, category) {
  const item=document.createElement("li"); item.className="task-card"; item.dataset.taskId=String(task.id);
  const heading=document.createElement("h3"); heading.textContent=task.title;
  const meta=document.createElement("p"); meta.className="task-meta"; meta.textContent=`${category?.name ?? "Без категории"} · ${PRIORITY_LABELS[task.priority] ?? task.priority} · ${task.completed ? "Выполнена" : "Не выполнена"}`;
  if (task.completed) item.classList.add("is-completed");
  const actions=document.createElement("div"); actions.className="task-actions";
  actions.append(actionButton("toggle", task.completed ? "Вернуть в работу" : "Завершить", "button button-secondary"), actionButton("edit", "Изменить", "button button-secondary"), actionButton("delete", "Удалить", "button button-danger"));
  item.append(heading,meta,actions); return item;
}
export function renderTaskList(list, tasks, categories) {
  const byId=new Map(categories.map(c=>[c.id,c]));
  list.replaceChildren(...tasks.map(task=>createTaskElement(task,byId.get(task.categoryId))));
}
