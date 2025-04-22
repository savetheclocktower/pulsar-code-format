import { createRunner } from "atom-jasmine3-test-runner";

export default createRunner({
  timeReporter: true,
  specHelper: {
    atom: true,
    attachToDom: true,
    ci: true,
    customMatchers: true,
    jasmineFocused: true,
    jasmineJson: true,
    jasminePass: true,
    jasmineTagged: true,
    mockClock: false,
    mockLocalStorage: true,
    profile: true,
    set: true,
    unspy: true
  }
});
