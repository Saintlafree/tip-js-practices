const button = document.querySelector("#run-experiment");
const log = document.querySelector("#event-log");
const summary = document.querySelector("#event-summary");
let runId = 0;

function addEvent(label, kind) {
  const item = document.createElement("li");
  item.className = `event-${kind}`;
  item.textContent = label;
  log.append(item);
}

button.addEventListener("click", () => {
  runId += 1;
  log.replaceChildren();
  summary.textContent = `Эксперимент № ${runId} выполняется.`;
  button.disabled = true;
  addEvent("A — синхронный код", "sync");
  Promise.resolve().then(() => addEvent("D — обработчик Promise", "micro"));
  async function continueAfterAwait() {
    addEvent("B — начало async-функции", "sync");
    await Promise.resolve();
    addEvent("E — продолжение после await", "micro");
  }
  continueAfterAwait();
  addEvent("C — конец синхронного кода", "sync");
  setTimeout(() => {
    addEvent("F — задача таймера", "timer");
    summary.textContent = "Готово: сначала синхронный стек, затем микрозадачи, затем таймер.";
    button.disabled = false;
  }, 0);
});
