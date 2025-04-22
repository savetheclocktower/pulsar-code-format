"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitFor = exports.wait = void 0;
function wait(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(r => setTimeout(r, ms));
    });
}
exports.wait = wait;
function waitFor(condition_1) {
    return __awaiter(this, arguments, void 0, function* (condition, timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL, interval = 50) {
        let start = Date.now();
        while (!condition()) {
            yield wait(interval);
            if (Date.now() - start > timeout) {
                throw new Error(`Timeout waiting for condition`);
            }
        }
    });
}
exports.waitFor = waitFor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcGVjL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUNBLFNBQXNCLElBQUksQ0FBQyxFQUFVOztRQUNuQyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FBQTtBQUZELG9CQUVDO0FBR0QsU0FBc0IsT0FBTzt5REFDM0IsU0FBd0IsRUFDeEIsVUFBa0IsT0FBTyxDQUFDLHdCQUF3QixFQUNsRCxXQUFtQixFQUFFO1FBRXJCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN2QixPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztZQUNwQixNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyQixJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxLQUFLLEdBQUcsT0FBTyxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUNuRCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7Q0FBQTtBQVpELDBCQVlDIiwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2FpdChtczogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgbXMpKTtcbn1cblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2FpdEZvcihcbiAgY29uZGl0aW9uOiAoKSA9PiBib29sZWFuLFxuICB0aW1lb3V0OiBudW1iZXIgPSBqYXNtaW5lLkRFRkFVTFRfVElNRU9VVF9JTlRFUlZBTCxcbiAgaW50ZXJ2YWw6IG51bWJlciA9IDUwXG4pIHtcbiAgbGV0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgd2hpbGUgKCFjb25kaXRpb24oKSkge1xuICAgIGF3YWl0IHdhaXQoaW50ZXJ2YWwpO1xuICAgIGlmIChEYXRlLm5vdygpIC0gc3RhcnQgPiB0aW1lb3V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRpbWVvdXQgd2FpdGluZyBmb3IgY29uZGl0aW9uYCk7XG4gICAgfVxuICB9XG59XG4iXX0=