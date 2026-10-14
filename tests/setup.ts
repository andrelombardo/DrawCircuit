import { vi } from 'vitest';
vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
// jsdom does not implement the browser's native modal dialog lifecycle.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}
