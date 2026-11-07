import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";
export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const requiredApi=["loadInitialData","getTasks","createTask","updateTask","setTaskCompleted","deleteTask","resetDemoData"];
  if (!api || requiredApi.some(k=>typeof api[k]!=="function") || !view || ["setListState","setTasks","setCategories","setTotal","setFormTask","showFormErrors","setMutationPending","notify"].some(k=>typeof view[k]!=="function") || typeof validateDraft!=="function") throw new TypeError("Некорректные зависимости контроллера");
  let tasks=[], categories=[], filters={}, editingId=null, categoriesLoaded=false, activeRequest=null, requestVersion=0, destroyed=false;
  function cancelRequest() { if (activeRequest) activeRequest.abort(); activeRequest=null; }
  async function load({ initial=false }={}) {
    cancelRequest(); const controller=new AbortController(); activeRequest=controller; const version=++requestVersion;
    view.setListState("loading");
    try {
      const result = initial || !categoriesLoaded
        ? await api.loadInitialData(filters,{signal:controller.signal})
        : await api.getTasks(filters,{signal:controller.signal}).then(r=>({...r,categories}));
      if (destroyed || version!==requestVersion) return;
      tasks=result.tasks; categories=result.categories; categoriesLoaded=true;
      view.setCategories(categories); view.setTasks(tasks,categories); view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
    } catch(error) {
      if (destroyed || version!==requestVersion || error?.kind==="aborted") return;
      view.setListState("error",messageForError(error));
    } finally { if (version===requestVersion) activeRequest=null; }
  }
  async function start(initialFilters={}) { filters={...initialFilters}; return load({initial:true}); }
  async function applyFilters(next={}) { filters={...next}; return load({initial:!categoriesLoaded}); }
  async function refresh() { return load({initial:!categoriesLoaded}); }
  function beginEdit(id) { const task=tasks.find(t=>t.id===id); if (!task) return; editingId=id; view.setFormTask(task); view.showFormErrors({}); view.notify(""); }
  function cancelEdit() { editingId=null; view.setFormTask(null); view.showFormErrors({}); view.notify(""); }
  async function mutate(action) {
    view.setMutationPending(true);
    try { await action(); editingId=null; view.setFormTask(null); view.showFormErrors({}); view.notify("Изменения сохранены.","success"); await load({initial:!categoriesLoaded}); }
    catch(error) { view.notify(messageForError(error),"error"); }
    finally { view.setMutationPending(false); }
  }
  async function submit(draft) {
    const result=validateDraft(draft,categories);
    if (!result.valid) { view.showFormErrors(result.errors); return; }
    const id=editingId;
    return mutate(()=>id===null ? api.createTask(result.value) : api.updateTask(id,result.value));
  }
  async function toggleTask(id) { const task=tasks.find(t=>t.id===id); if (!task) return; return mutate(()=>api.setTaskCompleted(id,!task.completed)); }
  async function deleteTask(id) { if (!tasks.some(t=>t.id===id)) return; return mutate(()=>api.deleteTask(id)); }
  async function resetData() { return mutate(async()=>{ await api.resetDemoData(); }); }
  function destroy() { destroyed=true; cancelRequest(); requestVersion++; }
  return { start, applyFilters, refresh, submit, beginEdit, cancelEdit, toggleTask, deleteTask, resetData, destroy };
}
