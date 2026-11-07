import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { addTask, findTaskById, removeTask, setTaskCompleted, updateTask } from "./task-service.js";
import { getVisibleTasks } from "./task-selectors.js";
import { renderEmptyState, renderSummary, renderTaskList } from "./task-view.js";
import { validateTaskDraft } from "./form-validation.js";
import { loadTasks, removeSavedTasks, saveTasks } from "./task-storage.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
 list:$("#task-list"), filters:$("#task-filters"), summary:$("#task-summary"), empty:$("#empty-message"),
 message:$("#operation-message"), datasetLabel:$("#dataset-label"), storageStatus:$("#storage-status"),
 form:$("#task-form"), formHeading:$("#form-heading"), formMode:$("#form-mode"), formMessage:$("#form-message"),
 idInput:$("#task-id"), titleInput:$("#task-title"), priorityInput:$("#task-priority"),
 submitButton:$("#form-submit"), cancelButton:$("#cancel-edit"), resetButton:$("#reset-data"),
};
const params = new URLSearchParams(location.search);
const isVariant = params.get("dataset")==="variant";
const isCheckRun = params.get("mode")==="check";
const initialTasks = isVariant ? variantTasks : demoTasks;
const datasetName = isVariant ? "variant" : "demo";
const storageKey = isCheckRun ? `tip-js-practice-04:checks:${datasetName}` : `tip-js-practice-04:${datasetName}`;
let loaded = loadTasks(window.localStorage, storageKey, initialTasks);
let currentTasks = loaded.tasks, currentFilter = "all", editingId = null;
elements.datasetLabel.textContent = isVariant ? `Индивидуальный вариант: ${variantNumber}` : "Общий контрольный набор";
if (loaded.source==="storage") elements.storageStatus.textContent="Данные восстановлены из localStorage.";
else if (loaded.ok) elements.storageStatus.textContent="Используется исходный набор; сохранённых данных пока нет.";
else { elements.storageStatus.textContent=loaded.error; elements.storageStatus.classList.add("is-warning"); }

function renderApp() {
 const visible=getVisibleTasks(currentTasks,currentFilter);
 renderTaskList(elements.list,visible); renderSummary(elements.summary,currentTasks,visible.length);
 renderEmptyState(elements.empty,currentTasks.length,visible.length);
 for (const button of elements.filters.querySelectorAll("[data-filter]")) {
  const active=button.dataset.filter===currentFilter;
  button.classList.toggle("is-active",active); button.setAttribute("aria-pressed",String(active));
 }
}
function clearFieldError(name) {
 const input=elements.form.elements.namedItem(name), message=elements.form.querySelector(`[data-error-for="${name}"]`);
 if(input){input.setCustomValidity("");input.removeAttribute("aria-invalid");}
 if(message)message.textContent="";
}
function clearFormErrors(){for(const name of ["id","title","priority"])clearFieldError(name);elements.formMessage.textContent="";}
function showFormErrors(errors){
 clearFormErrors();
 for(const [name,text] of Object.entries(errors)){
  const input=elements.form.elements.namedItem(name), message=elements.form.querySelector(`[data-error-for="${name}"]`);
  input?.setCustomValidity(text); input?.setAttribute("aria-invalid","true"); if(message)message.textContent=text;
 }
 elements.formMessage.textContent="Исправьте отмеченные поля."; elements.form.reportValidity();
}
function setFormMode(id=null){
 clearFormErrors(); editingId=id;
 if(id===null){
  elements.form.reset(); elements.idInput.disabled=false; elements.formHeading.textContent="Добавление задачи";
  elements.formMode.textContent="Режим создания новой задачи."; elements.submitButton.textContent="Добавить задачу";
  elements.cancelButton.hidden=true;
 } else {
  const task=findTaskById(currentTasks,id);
  if(!task){elements.message.textContent=`Задача ${id} не найдена`;return false;}
  elements.idInput.value=String(task.id); elements.titleInput.value=task.title; elements.priorityInput.value=task.priority;
  elements.idInput.disabled=true; elements.formHeading.textContent="Редактирование задачи";
  elements.formMode.textContent=`Изменение задачи ${id}.`; elements.submitButton.textContent="Сохранить изменения";
  elements.cancelButton.hidden=false;
 }
 return true;
}
function persistCurrentTasks(successMessage){
 const saved=saveTasks(window.localStorage,storageKey,currentTasks);
 elements.storageStatus.classList.toggle("is-warning",!saved.ok);
 elements.storageStatus.textContent=saved.ok?"Изменения сохранены в localStorage.":saved.error;
 elements.message.textContent=saved.ok?successMessage:`${successMessage} ${saved.error}`;
 renderApp(); return saved;
}
function restoreTaskFocus(id,action){
 const target=elements.list.querySelector(`[data-task-id="${id}"] button[data-action="${action}"]`);
 (target??elements.filters.querySelector(`[data-filter="${currentFilter}"]`))?.focus();
}
function handleFormSubmit(event){
 event.preventDefault();
 const fd=new FormData(elements.form);
 const draft={id:fd.get("id"),title:fd.get("title"),priority:fd.get("priority")};
 const validation=validateTaskDraft(draft,currentTasks,editingId);
 if(!validation.ok){showFormErrors(validation.errors);return;}
 const {id,title,priority}=validation.value;
 const wasEditing=editingId!==null;
 const result=!wasEditing?addTask(currentTasks,id,title,priority):updateTask(currentTasks,id,title,priority);
 if(!result.ok){showFormErrors({[editingId===null?"id":"title"]:result.error});return;}
 currentTasks=result.tasks; setFormMode(); persistCurrentTasks(wasEditing?"Задача обновлена.":"Задача добавлена.");
 elements.idInput.focus();
}
function handleTaskListClick(event){
 const button=event.target.closest("button[data-action]");
 if(!button||!elements.list.contains(button))return;
 const card=button.closest("li[data-task-id]"); if(!card)return;
 const id=Number(card.dataset.taskId), action=button.dataset.action;
 if(action==="edit"){setFormMode(id);elements.titleInput.focus();return;}
 let result;
 if(action==="toggle"){const task=findTaskById(currentTasks,id);if(!task)return;result=setTaskCompleted(currentTasks,id,!task.completed);}
 else if(action==="delete")result=removeTask(currentTasks,id); else return;
 if(!result.ok){elements.message.textContent=`Ошибка: ${result.error}`;return;}
 currentTasks=result.tasks; persistCurrentTasks(action==="toggle"?"Статус задачи изменён.":"Задача удалена.");
 restoreTaskFocus(id,action);
}
function handleFilterClick(event){
 const button=event.target.closest("button[data-filter]");
 if(!button||!elements.filters.contains(button))return;
 currentFilter=button.dataset.filter; elements.message.textContent="";renderApp();
}
function handleResetClick(){
 const result=removeSavedTasks(window.localStorage,storageKey);
 if(!result.ok){elements.storageStatus.textContent=result.error;elements.storageStatus.classList.add("is-warning");return;}
 currentTasks=initialTasks.map(task=>({...task}));currentFilter="all";setFormMode();
 elements.storageStatus.classList.remove("is-warning");elements.storageStatus.textContent="Сохранённые данные удалены; восстановлен исходный набор.";
 elements.message.textContent="Данные сброшены.";renderApp();
}
elements.form.addEventListener("submit",handleFormSubmit);
elements.form.addEventListener("input",event=>{if(event.target.matches("input,select"))clearFieldError(event.target.name);});
elements.list.addEventListener("click",handleTaskListClick);
elements.filters.addEventListener("click",handleFilterClick);
elements.cancelButton.addEventListener("click",()=>setFormMode());
elements.resetButton.addEventListener("click",handleResetClick);
setFormMode();renderApp();
