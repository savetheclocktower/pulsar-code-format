
const TAG = '[find-references]';

let isEnabled = false;

export function setEnabled(newValue: boolean) {
  isEnabled = newValue;
}

export function log(...args: any) {
  if (!isEnabled) return;
  return console.log(TAG, ...args);
}

export function warn(...args: any) {
  if (!isEnabled) return;
  return console.warn(TAG, ...args);
}

export function debug(...args: any) {
  if (!isEnabled) return;
  return console.debug(TAG, ...args);
}

export function error(...args: any) {
  if (!isEnabled) return;
  return console.error(TAG, ...args);
}
