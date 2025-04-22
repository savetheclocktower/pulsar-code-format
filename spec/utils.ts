
export async function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}


export async function waitFor(
  condition: () => boolean,
  timeout: number = jasmine.DEFAULT_TIMEOUT_INTERVAL,
  interval: number = 50
) {
  let start = Date.now();
  while (!condition()) {
    await wait(interval);
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for condition`);
    }
  }
}
