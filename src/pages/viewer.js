const FORMAT_READY_MESSAGE = "JSON formatting will be available in the next step.";

const formatButton = document.querySelector("#format-button");
const outputArea = document.querySelector("#json-output");

if (formatButton instanceof HTMLButtonElement && outputArea instanceof HTMLElement) {
  formatButton.addEventListener("click", () => {
    outputArea.textContent = FORMAT_READY_MESSAGE;
  });
}
