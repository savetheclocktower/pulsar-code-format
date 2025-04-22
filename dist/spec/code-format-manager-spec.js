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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const code_format_manager_1 = __importDefault(require("../lib/code-format-manager"));
const temp_1 = __importDefault(require("temp"));
const utils_1 = require("./utils");
describe("CodeFormatManager", () => {
    let textEditor;
    let manager;
    let subscriptions;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log('setting!');
        atom.config.set('pulsar-code-format.advanced.enableDebugLogging', true);
        manager = new code_format_manager_1.default();
        subscriptions = new atom_1.CompositeDisposable();
        temp_1.default.track();
        const file = temp_1.default.openSync();
        textEditor = (yield atom.workspace.open(file.path));
        textEditor.setText('');
    }));
    afterEach(() => {
        manager.dispose();
        subscriptions.dispose();
    });
    it("formats an editor on request", () => __awaiter(void 0, void 0, void 0, function* () {
        manager.addRangeProvider({
            grammarScopes: ["text.plain.null-grammar"],
            priority: 1,
            formatCode: () => Promise.resolve([
                {
                    oldRange: new atom_1.Range([0, 0], [0, 3]),
                    oldText: "abc",
                    newText: "def",
                },
            ]),
        });
        textEditor.setText("abc");
        yield atom.commands.dispatch(atom.views.getView(textEditor), "pulsar-code-format:format-code");
        yield (0, utils_1.waitFor)(() => textEditor.getText() === "def");
    }));
    it("format an editor using formatEntireFile", () => __awaiter(void 0, void 0, void 0, function* () {
        manager.addFileProvider({
            grammarScopes: ["text.plain.null-grammar"],
            priority: 1,
            formatEntireFile: () => {
                return Promise.resolve([{
                        oldRange: textEditor.getBuffer().getRange(),
                        newText: 'ghi'
                    }]);
            }
        });
        textEditor.setText("abc");
        textEditor.setSelectedBufferRange(new atom_1.Range([0, 0], [0, 0]));
        yield atom.commands.dispatch(atom.views.getView(textEditor), "pulsar-code-format:format-code");
        yield (0, utils_1.waitFor)(() => textEditor.getText() === "ghi");
    }));
    it("formats an editor on type", () => __awaiter(void 0, void 0, void 0, function* () {
        atom.config.set('pulsar-code-format.formatOnType', true);
        const provider = {
            grammarScopes: ["text.plain.null-grammar"],
            priority: 1,
            formatAtPosition: () => {
                return Promise.resolve([
                    {
                        oldRange: new atom_1.Range([0, 0], [0, 3]),
                        oldText: "abc",
                        newText: "def",
                    },
                ]);
            },
            keepCursorPosition: false,
        };
        manager.addOnTypeProvider(provider);
        textEditor.setText("a");
        textEditor.setCursorBufferPosition([0, 1]);
        textEditor.insertText("b");
        yield (0, utils_1.wait)(300);
        textEditor.insertText("c");
        yield (0, utils_1.waitFor)(() => textEditor.getText() === "def");
    }));
    it("formats an editor on save", () => __awaiter(void 0, void 0, void 0, function* () {
        atom.config.set('pulsar-code-format.formatOnSave', true);
        manager.addOnSaveProvider({
            grammarScopes: ["text.plain.null-grammar"],
            priority: 1,
            formatOnSave: () => {
                return Promise.resolve([
                    {
                        oldRange: new atom_1.Range([0, 0], [0, 3]),
                        oldText: "abc",
                        newText: "def",
                    },
                ]);
            }
        });
        textEditor.setText("abc");
        yield textEditor.save();
        yield (0, utils_1.waitFor)(() => textEditor.getText() === "def");
    }));
    it("should still save on timeout", () => __awaiter(void 0, void 0, void 0, function* () {
        atom.config.set('pulsar-code-format.formatOnSave', true);
        manager.addOnSaveProvider({
            grammarScopes: ["text.plain.null-grammar"],
            priority: 1,
            formatOnSave: () => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, utils_1.wait)(3000);
                return [{
                        oldRange: new atom_1.Range([0, 0], [0, 3]),
                        oldText: "why",
                        newText: "how",
                    }];
            }),
        });
        textEditor.setText('why');
        yield textEditor.save();
        expect(textEditor.getText()).toBe('why');
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtbWFuYWdlci1zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3BlYy9jb2RlLWZvcm1hdC1tYW5hZ2VyLXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBOEQ7QUFDOUQscUZBQTZFO0FBQzdFLGdEQUF3QjtBQUN4QixtQ0FBd0M7QUFFeEMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxJQUFJLFVBQXNCLENBQUM7SUFDM0IsSUFBSSxPQUEwQixDQUFDO0lBQy9CLElBQUksYUFBa0MsQ0FBQztJQUV2QyxVQUFVLENBQUMsR0FBUyxFQUFFO1FBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0RBQWdELEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEUsT0FBTyxHQUFHLElBQUksNkJBQWlCLEVBQUUsQ0FBQztRQUNsQyxhQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzFDLGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxHQUFHLGNBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixVQUFVLElBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFlLENBQUEsQ0FBQztRQUNoRSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxHQUFTLEVBQUU7UUFDNUMsT0FBTyxDQUFD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Q0FBQyxpQ0FBaUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxPQUFPLENBQUMsaUJBQWlCLENBQUM7WUFDeEIsYUFBYSxFQUFFLENBQUMseUJBQXlCLENBQUM7WUFDMUMsUUFBUSxFQUFFLENBQUM7WUFDWCxZQUFZLEVBQUUsR0FBUyxFQUFFO2dCQUN2QixNQUFNLElBQUEsWUFBSSxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqQixPQUFPLENBQUM7d0JBQ04sUUFBUSxFQUFFLElBQUksWUFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUNuQyxPQUFPLEVBQUUsS0FBSzt3QkFDZCxPQUFPLEVBQUUsS0FBSztxQkFDZixDQUFDLENBQUM7WUFDTCxDQUFDLENBQUE7U0FDRixDQUFDLENBQUM7UUFDSCxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFCLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3hCLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0MsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgUmFuZ2UsIFRleHRFZGl0b3IgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IENvZGVGb3JtYXRNYW5hZ2VyLCB7IFNBVkVfVElNRU9VVCB9IGZyb20gXCIuLi9saWIvY29kZS1mb3JtYXQtbWFuYWdlclwiO1xuaW1wb3J0IHRlbXAgZnJvbSBcInRlbXBcIjtcbmltcG9ydCB7IHdhaXQsIHdhaXRGb3IgfSBmcm9tIFwiLi91dGlsc1wiO1xuXG5kZXNjcmliZShcIkNvZGVGb3JtYXRNYW5hZ2VyXCIsICgpID0+IHtcbiAgbGV0IHRleHRFZGl0b3I6IFRleHRFZGl0b3I7XG4gIGxldCBtYW5hZ2VyOiBDb2RlRm9ybWF0TWFuYWdlcjtcbiAgbGV0IHN1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ3NldHRpbmchJyk7XG4gICAgYXRvbS5jb25maWcuc2V0KCdwdWxzYXItY29kZS1mb3JtYXQuYWR2YW5jZWQuZW5hYmxlRGVidWdMb2dnaW5nJywgdHJ1ZSk7XG4gICAgbWFuYWdlciA9IG5ldyBDb2RlRm9ybWF0TWFuYWdlcigpO1xuICAgIHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIHRlbXAudHJhY2soKTtcbiAgICBjb25zdCBmaWxlID0gdGVtcC5vcGVuU3luYygpO1xuICAgIHRleHRFZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUucGF0aCkgYXMgVGV4dEVkaXRvcjtcbiAgICB0ZXh0RWRpdG9yLnNldFRleHQoJycpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIG1hbmFnZXIuZGlzcG9zZSgpO1xuICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9KTtcblxuICBpdChcImZvcm1hdHMgYW4gZWRpdG9yIG9uIHJlcXVlc3RcIiwgYXN5bmMgKCkgPT4ge1xuICAgIG1hbmFnZXIuYWRkUmFuZ2VQcm92aWRlcih7XG4gICAgICBncmFtbWFyU2NvcGVzOiBbXCJ0ZXh0LnBsYWluLm51bGwtZ3JhbW1hclwiXSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0Q29kZTogKCkgPT5cbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBvbGRSYW5nZTogbmV3IFJhbmdlKFswLCAwXSwgWzAsIDNdKSxcbiAgICAgICAgICAgIG9sZFRleHQ6IFwiYWJjXCIsXG4gICAgICAgICAgICBuZXdUZXh0OiBcImRlZlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pLFxuICAgIH0pO1xuICAgIHRleHRFZGl0b3Iuc2V0VGV4dChcImFiY1wiKTtcbiAgICBhd2FpdCBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKFxuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpLFxuICAgICAgXCJwdWxzYXItY29kZS1mb3JtYXQ6Zm9ybWF0LWNvZGVcIlxuICAgICk7XG4gICAgYXdhaXQgd2FpdEZvcigoKSA9PiB0ZXh0RWRpdG9yLmdldFRleHQoKSA9PT0gXCJkZWZcIik7XG4gIH0pO1xuXG4gIGl0KFwiZm9ybWF0IGFuIGVkaXRvciB1c2luZyBmb3JtYXRFbnRpcmVGaWxlXCIsIGFzeW5jICgpID0+IHtcbiAgICBtYW5hZ2VyLmFkZEZpbGVQcm92aWRlcih7XG4gICAgICBncmFtbWFyU2NvcGVzOiBbXCJ0ZXh0LnBsYWluLm51bGwtZ3JhbW1hclwiXSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0RW50aXJlRmlsZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFt7XG4gICAgICAgICAgb2xkUmFuZ2U6IHRleHRFZGl0b3IuZ2V0QnVmZmVyKCkuZ2V0UmFuZ2UoKSxcbiAgICAgICAgICBuZXdUZXh0OiAnZ2hpJ1xuICAgICAgICB9XSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXh0RWRpdG9yLnNldFRleHQoXCJhYmNcIik7XG4gICAgdGV4dEVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKFxuICAgICAgbmV3IFJhbmdlKFswLCAwXSwgWzAsIDBdKVxuICAgICk7XG4gICAgYXdhaXQgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChcbiAgICAgIGF0b20udmlld3MuZ2V0Vmlldyh0ZXh0RWRpdG9yKSxcbiAgICAgIFwicHVsc2FyLWNvZGUtZm9ybWF0OmZvcm1hdC1jb2RlXCJcbiAgICApO1xuICAgIGF3YWl0IHdhaXRGb3IoKCkgPT4gdGV4dEVkaXRvci5nZXRUZXh0KCkgPT09IFwiZ2hpXCIpO1xuICB9KTtcblxuICBpdChcImZvcm1hdHMgYW4gZWRpdG9yIG9uIHR5cGVcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF0b20uY29uZmlnLnNldCgncHVsc2FyLWNvZGUtZm9ybWF0LmZvcm1hdE9uVHlwZScsIHRydWUpO1xuICAgIGNvbnN0IHByb3ZpZGVyID0ge1xuICAgICAgZ3JhbW1hclNjb3BlczogW1widGV4dC5wbGFpbi5udWxsLWdyYW1tYXJcIl0sXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdEF0UG9zaXRpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXG4gICAgICAgICAge1xuICAgICAgICAgICAgb2xkUmFuZ2U6IG5ldyBSYW5nZShbMCwgMF0sIFswLCAzXSksXG4gICAgICAgICAgICBvbGRUZXh0OiBcImFiY1wiLFxuICAgICAgICAgICAgbmV3VGV4dDogXCJkZWZcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdKTtcbiAgICAgIH0sXG4gICAgICBrZWVwQ3Vyc29yUG9zaXRpb246IGZhbHNlLFxuICAgIH07XG5cbiAgICBtYW5hZ2VyLmFkZE9uVHlwZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICB0ZXh0RWRpdG9yLnNldFRleHQoXCJhXCIpO1xuICAgIHRleHRFZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oWzAsIDFdKTtcbiAgICB0ZXh0RWRpdG9yLmluc2VydFRleHQoXCJiXCIpO1xuICAgIGF3YWl0IHdhaXQoMzAwKTtcbiAgICB0ZXh0RWRpdG9yLmluc2VydFRleHQoXCJjXCIpO1xuICAgIGF3YWl0IHdhaXRGb3IoKCkgPT4gdGV4dEVkaXRvci5nZXRUZXh0KCkgPT09IFwiZGVmXCIpO1xuICB9KTtcblxuICBpdChcImZvcm1hdHMgYW4gZWRpdG9yIG9uIHNhdmVcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF0b20uY29uZmlnLnNldCgncHVsc2FyLWNvZGUtZm9ybWF0LmZvcm1hdE9uU2F2ZScsIHRydWUpO1xuICAgIG1hbmFnZXIuYWRkT25TYXZlUHJvdmlkZXIoe1xuICAgICAgZ3JhbW1hclNjb3BlczogW1widGV4dC5wbGFpbi5udWxsLWdyYW1tYXJcIl0sXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdE9uU2F2ZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBvbGRSYW5nZTogbmV3IFJhbmdlKFswLCAwXSwgWzAsIDNdKSxcbiAgICAgICAgICAgIG9sZFRleHQ6IFwiYWJjXCIsXG4gICAgICAgICAgICBuZXdUZXh0OiBcImRlZlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRleHRFZGl0b3Iuc2V0VGV4dChcImFiY1wiKTtcbiAgICBhd2FpdCB0ZXh0RWRpdG9yLnNhdmUoKTtcbiAgICBhd2FpdCB3YWl0Rm9yKCgpID0+IHRleHRFZGl0b3IuZ2V0VGV4dCgpID09PSBcImRlZlwiKTtcbiAgfSk7XG5cbiAgaXQoXCJzaG91bGQgc3RpbGwgc2F2ZSBvbiB0aW1lb3V0XCIsIGFzeW5jICgpID0+IHtcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ3B1bHNhci1jb2RlLWZvcm1hdC5mb3JtYXRPblNhdmUnLCB0cnVlKTtcbiAgICBtYW5hZ2VyLmFkZE9uU2F2ZVByb3ZpZGVyKHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcInRleHQucGxhaW4ubnVsbC1ncmFtbWFyXCJdLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBmb3JtYXRPblNhdmU6IGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgd2FpdCgzMDAwKTtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgb2xkUmFuZ2U6IG5ldyBSYW5nZShbMCwgMF0sIFswLCAzXSksXG4gICAgICAgICAgb2xkVGV4dDogXCJ3aHlcIixcbiAgICAgICAgICBuZXdUZXh0OiBcImhvd1wiLFxuICAgICAgICB9XTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGV4dEVkaXRvci5zZXRUZXh0KCd3aHknKTtcbiAgICBhd2FpdCB0ZXh0RWRpdG9yLnNhdmUoKTtcbiAgICBleHBlY3QodGV4dEVkaXRvci5nZXRUZXh0KCkpLnRvQmUoJ3doeScpO1xuICB9KTtcbn0pO1xuIl19