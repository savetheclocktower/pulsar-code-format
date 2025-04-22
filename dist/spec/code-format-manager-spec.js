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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtbWFuYWdlci1zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3BlYy9jb2RlLWZvcm1hdC1tYW5hZ2VyLXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBOEQ7QUFDOUQscUZBQTZFO0FBQzdFLGdEQUF3QjtBQUN4QixtQ0FBd0M7QUFFeEMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxJQUFJLFVBQXNCLENBQUM7SUFDM0IsSUFBSSxPQUEwQixDQUFDO0lBQy9CLElBQUksYUFBa0MsQ0FBQztJQUV2QyxVQUFVLENBQUMsR0FBUyxFQUFFO1FBQ3BCLE9BQU8sR0FBRyxJQUFJLDZCQUFpQixFQUFFLENBQUM7UUFDbEMsYUFBYSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztRQUMxQyxjQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsVUFBVSxJQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBZSxDQUFBLENBQUM7UUFDaEUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQixhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDMUIsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsOEJBQThCLEVBQUUsR0FBUyxFQUFFO1FBQzVDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQztZQUN2QixhQUFhLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQztZQUMxQyxRQUFRLEVBQUUsQ0FBQztZQUNYLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FDZixPQUFPLENB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RUFBRSxDQUFDO1lBQ1gsWUFBWSxFQUFFLEdBQVMsRUFBRTtnQkFDdkIsTUFBTSxJQUFBLFlBQUksRUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDakIsT0FBTyxDQUFDO3dCQUNOLFFBQVEsRUFBRSxJQUFJLFlBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDbkMsT0FBTyxFQUFFLEtBQUs7d0JBQ2QsT0FBTyxFQUFFLEtBQUs7cUJBQ2YsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFBO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIFJhbmdlLCBUZXh0RWRpdG9yIH0gZnJvbSBcImF0b21cIjtcbmltcG9ydCBDb2RlRm9ybWF0TWFuYWdlciwgeyBTQVZFX1RJTUVPVVQgfSBmcm9tIFwiLi4vbGliL2NvZGUtZm9ybWF0LW1hbmFnZXJcIjtcbmltcG9ydCB0ZW1wIGZyb20gXCJ0ZW1wXCI7XG5pbXBvcnQgeyB3YWl0LCB3YWl0Rm9yIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZGVzY3JpYmUoXCJDb2RlRm9ybWF0TWFuYWdlclwiLCAoKSA9PiB7XG4gIGxldCB0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yO1xuICBsZXQgbWFuYWdlcjogQ29kZUZvcm1hdE1hbmFnZXI7XG4gIGxldCBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgIG1hbmFnZXIgPSBuZXcgQ29kZUZvcm1hdE1hbmFnZXIoKTtcbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0ZW1wLnRyYWNrKCk7XG4gICAgY29uc3QgZmlsZSA9IHRlbXAub3BlblN5bmMoKTtcbiAgICB0ZXh0RWRpdG9yID0gYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlLnBhdGgpIGFzIFRleHRFZGl0b3I7XG4gICAgdGV4dEVkaXRvci5zZXRUZXh0KCcnKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBtYW5hZ2VyLmRpc3Bvc2UoKTtcbiAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfSk7XG5cbiAgaXQoXCJmb3JtYXRzIGFuIGVkaXRvciBvbiByZXF1ZXN0XCIsIGFzeW5jICgpID0+IHtcbiAgICBtYW5hZ2VyLmFkZFJhbmdlUHJvdmlkZXIoe1xuICAgICAgZ3JhbW1hclNjb3BlczogW1widGV4dC5wbGFpbi5udWxsLWdyYW1tYXJcIl0sXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdENvZGU6ICgpID0+XG4gICAgICAgIFByb21pc2UucmVzb2x2ZShbXG4gICAgICAgICAge1xuICAgICAgICAgICAgb2xkUmFuZ2U6IG5ldyBSYW5nZShbMCwgMF0sIFswLCAzXSksXG4gICAgICAgICAgICBvbGRUZXh0OiBcImFiY1wiLFxuICAgICAgICAgICAgbmV3VGV4dDogXCJkZWZcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdKSxcbiAgICB9KTtcbiAgICB0ZXh0RWRpdG9yLnNldFRleHQoXCJhYmNcIik7XG4gICAgYXdhaXQgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChcbiAgICAgIGF0b20udmlld3MuZ2V0Vmlldyh0ZXh0RWRpdG9yKSxcbiAgICAgIFwicHVsc2FyLWNvZGUtZm9ybWF0OmZvcm1hdC1jb2RlXCJcbiAgICApO1xuICAgIGF3YWl0IHdhaXRGb3IoKCkgPT4gdGV4dEVkaXRvci5nZXRUZXh0KCkgPT09IFwiZGVmXCIpO1xuICB9KTtcblxuICBpdChcImZvcm1hdCBhbiBlZGl0b3IgdXNpbmcgZm9ybWF0RW50aXJlRmlsZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgbWFuYWdlci5hZGRGaWxlUHJvdmlkZXIoe1xuICAgICAgZ3JhbW1hclNjb3BlczogW1widGV4dC5wbGFpbi5udWxsLWdyYW1tYXJcIl0sXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdEVudGlyZUZpbGU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbe1xuICAgICAgICAgIG9sZFJhbmdlOiB0ZXh0RWRpdG9yLmdldEJ1ZmZlcigpLmdldFJhbmdlKCksXG4gICAgICAgICAgbmV3VGV4dDogJ2doaSdcbiAgICAgICAgfV0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGV4dEVkaXRvci5zZXRUZXh0KFwiYWJjXCIpO1xuICAgIHRleHRFZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShcbiAgICAgIG5ldyBSYW5nZShbMCwgMF0sIFswLCAwXSlcbiAgICApO1xuICAgIGF3YWl0IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goXG4gICAgICBhdG9tLnZpZXdzLmdldFZpZXcodGV4dEVkaXRvciksXG4gICAgICBcInB1bHNhci1jb2RlLWZvcm1hdDpmb3JtYXQtY29kZVwiXG4gICAgKTtcbiAgICBhd2FpdCB3YWl0Rm9yKCgpID0+IHRleHRFZGl0b3IuZ2V0VGV4dCgpID09PSBcImdoaVwiKTtcbiAgfSk7XG5cbiAgaXQoXCJmb3JtYXRzIGFuIGVkaXRvciBvbiB0eXBlXCIsIGFzeW5jICgpID0+IHtcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ3B1bHNhci1jb2RlLWZvcm1hdC5mb3JtYXRPblR5cGUnLCB0cnVlKTtcbiAgICBjb25zdCBwcm92aWRlciA9IHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcInRleHQucGxhaW4ubnVsbC1ncmFtbWFyXCJdLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBmb3JtYXRBdFBvc2l0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG9sZFJhbmdlOiBuZXcgUmFuZ2UoWzAsIDBdLCBbMCwgM10pLFxuICAgICAgICAgICAgb2xkVGV4dDogXCJhYmNcIixcbiAgICAgICAgICAgIG5ld1RleHQ6IFwiZGVmXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSk7XG4gICAgICB9LFxuICAgICAga2VlcEN1cnNvclBvc2l0aW9uOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgbWFuYWdlci5hZGRPblR5cGVQcm92aWRlcihwcm92aWRlcik7XG4gICAgdGV4dEVkaXRvci5zZXRUZXh0KFwiYVwiKTtcbiAgICB0ZXh0RWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKFswLCAxXSk7XG4gICAgdGV4dEVkaXRvci5pbnNlcnRUZXh0KFwiYlwiKTtcbiAgICBhd2FpdCB3YWl0KDMwMCk7XG4gICAgdGV4dEVkaXRvci5pbnNlcnRUZXh0KFwiY1wiKTtcbiAgICBhd2FpdCB3YWl0Rm9yKCgpID0+IHRleHRFZGl0b3IuZ2V0VGV4dCgpID09PSBcImRlZlwiKTtcbiAgfSk7XG5cbiAgaXQoXCJmb3JtYXRzIGFuIGVkaXRvciBvbiBzYXZlXCIsIGFzeW5jICgpID0+IHtcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ3B1bHNhci1jb2RlLWZvcm1hdC5mb3JtYXRPblNhdmUnLCB0cnVlKTtcbiAgICBtYW5hZ2VyLmFkZE9uU2F2ZVByb3ZpZGVyKHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcInRleHQucGxhaW4ubnVsbC1ncmFtbWFyXCJdLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBmb3JtYXRPblNhdmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXG4gICAgICAgICAge1xuICAgICAgICAgICAgb2xkUmFuZ2U6IG5ldyBSYW5nZShbMCwgMF0sIFswLCAzXSksXG4gICAgICAgICAgICBvbGRUZXh0OiBcImFiY1wiLFxuICAgICAgICAgICAgbmV3VGV4dDogXCJkZWZcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0ZXh0RWRpdG9yLnNldFRleHQoXCJhYmNcIik7XG4gICAgYXdhaXQgdGV4dEVkaXRvci5zYXZlKCk7XG4gICAgYXdhaXQgd2FpdEZvcigoKSA9PiB0ZXh0RWRpdG9yLmdldFRleHQoKSA9PT0gXCJkZWZcIik7XG4gIH0pO1xuXG4gIGl0KFwic2hvdWxkIHN0aWxsIHNhdmUgb24gdGltZW91dFwiLCBhc3luYyAoKSA9PiB7XG4gICAgYXRvbS5jb25maWcuc2V0KCdwdWxzYXItY29kZS1mb3JtYXQuZm9ybWF0T25TYXZlJywgdHJ1ZSk7XG4gICAgbWFuYWdlci5hZGRPblNhdmVQcm92aWRlcih7XG4gICAgICBncmFtbWFyU2NvcGVzOiBbXCJ0ZXh0LnBsYWluLm51bGwtZ3JhbW1hclwiXSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0T25TYXZlOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHdhaXQoMzAwMCk7XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgIG9sZFJhbmdlOiBuZXcgUmFuZ2UoWzAsIDBdLCBbMCwgM10pLFxuICAgICAgICAgIG9sZFRleHQ6IFwid2h5XCIsXG4gICAgICAgICAgbmV3VGV4dDogXCJob3dcIixcbiAgICAgICAgfV07XG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRleHRFZGl0b3Iuc2V0VGV4dCgnd2h5Jyk7XG4gICAgYXdhaXQgdGV4dEVkaXRvci5zYXZlKCk7XG4gICAgZXhwZWN0KHRleHRFZGl0b3IuZ2V0VGV4dCgpKS50b0JlKCd3aHknKTtcbiAgfSk7XG59KTtcbiJdfQ==