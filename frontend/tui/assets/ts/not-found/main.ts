/// <reference lib="dom" />
const output = document.querySelector('[data-not-found-path]');
if (output) {
  output.textContent = location.pathname;
}
