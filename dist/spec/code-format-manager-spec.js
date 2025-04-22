"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const code_format_manager_1 = __importStar(require("../lib/code-format-manager"));
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
                yield (0, utils_1.wait)(code_format_manager_1.SAVE_TIMEOUT * 2);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtbWFuYWdlci1zcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3BlYy9jb2RlLWZvcm1hdC1tYW5hZ2VyLXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUE4RDtBQUM5RCxrRkFBNkU7QUFDN0UsZ0RBQXdCO0FBQ3hCLG1DQUF3QztBQUV4QyxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQ2pDLElBQUksVUFBc0IsQ0FBQztJQUMzQixJQUFJLE9BQTBCLENBQUM7SUFDL0IsSUFBSSxhQUFrQyxDQUFDO0lBRXZDLFVBQVUsQ0FBQyxHQUFTLEVBQUU7UUFDcEIsT0FBTyxHQUFHLElBQUksNkJBQWlCLEVBQUUsQ0FBQztRQUNsQyxhQUFhLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFDO1FBQzFDLGNBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxHQUFHLGNBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixVQUFVLElBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFlLENBQUEsQ0FBQztRQUNoRSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ2IsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2xCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQztJQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxHQUFTLEVBQUU7UUFDNUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO1lBQ3ZCLGFBQWEsRUFBRSxDQUFDLHlCQUF5QixDQUFDO1lBQzFDLFFBQVEsRUFBRSxDQUFDO1lBQ1gsVUFBVSxFQUFF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eUJBQXlCLENBQUM7WUFDMUMsUUFBUSxFQUFFLENBQUM7WUFDWCxZQUFZLEVBQUUsR0FBUyxFQUFFO2dCQUN2QixNQUFNLElBQUEsWUFBSSxFQUFDLGtDQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sQ0FBQzt3QkFDTixRQUFRLEVBQUUsSUFBSSxZQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ25DLE9BQU8sRUFBRSxLQUFLO3dCQUNkLE9BQU8sRUFBRSxLQUFLO3FCQUNmLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQTtTQUNGLENBQUMsQ0FBQztRQUNILFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUIsTUFBTSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBSYW5nZSwgVGV4dEVkaXRvciB9IGZyb20gXCJhdG9tXCI7XG5pbXBvcnQgQ29kZUZvcm1hdE1hbmFnZXIsIHsgU0FWRV9USU1FT1VUIH0gZnJvbSBcIi4uL2xpYi9jb2RlLWZvcm1hdC1tYW5hZ2VyXCI7XG5pbXBvcnQgdGVtcCBmcm9tIFwidGVtcFwiO1xuaW1wb3J0IHsgd2FpdCwgd2FpdEZvciB9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmRlc2NyaWJlKFwiQ29kZUZvcm1hdE1hbmFnZXJcIiwgKCkgPT4ge1xuICBsZXQgdGV4dEVkaXRvcjogVGV4dEVkaXRvcjtcbiAgbGV0IG1hbmFnZXI6IENvZGVGb3JtYXRNYW5hZ2VyO1xuICBsZXQgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICBtYW5hZ2VyID0gbmV3IENvZGVGb3JtYXRNYW5hZ2VyKCk7XG4gICAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGVtcC50cmFjaygpO1xuICAgIGNvbnN0IGZpbGUgPSB0ZW1wLm9wZW5TeW5jKCk7XG4gICAgdGV4dEVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZS5wYXRoKSBhcyBUZXh0RWRpdG9yO1xuICAgIHRleHRFZGl0b3Iuc2V0VGV4dCgnJyk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbWFuYWdlci5kaXNwb3NlKCk7XG4gICAgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gIH0pO1xuXG4gIGl0KFwiZm9ybWF0cyBhbiBlZGl0b3Igb24gcmVxdWVzdFwiLCBhc3luYyAoKSA9PiB7XG4gICAgbWFuYWdlci5hZGRSYW5nZVByb3ZpZGVyKHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcInRleHQucGxhaW4ubnVsbC1ncmFtbWFyXCJdLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBmb3JtYXRDb2RlOiAoKSA9PlxuICAgICAgICBQcm9taXNlLnJlc29sdmUoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG9sZFJhbmdlOiBuZXcgUmFuZ2UoWzAsIDBdLCBbMCwgM10pLFxuICAgICAgICAgICAgb2xkVGV4dDogXCJhYmNcIixcbiAgICAgICAgICAgIG5ld1RleHQ6IFwiZGVmXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSksXG4gICAgfSk7XG4gICAgdGV4dEVkaXRvci5zZXRUZXh0KFwiYWJjXCIpO1xuICAgIGF3YWl0IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goXG4gICAgICBhdG9tLnZpZXdzLmdldFZpZXcodGV4dEVkaXRvciksXG4gICAgICBcInB1bHNhci1jb2RlLWZvcm1hdDpmb3JtYXQtY29kZVwiXG4gICAgKTtcbiAgICBhd2FpdCB3YWl0Rm9yKCgpID0+IHRleHRFZGl0b3IuZ2V0VGV4dCgpID09PSBcImRlZlwiKTtcbiAgfSk7XG5cbiAgaXQoXCJmb3JtYXQgYW4gZWRpdG9yIHVzaW5nIGZvcm1hdEVudGlyZUZpbGVcIiwgYXN5bmMgKCkgPT4ge1xuICAgIG1hbmFnZXIuYWRkRmlsZVByb3ZpZGVyKHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFtcInRleHQucGxhaW4ubnVsbC1ncmFtbWFyXCJdLFxuICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICBmb3JtYXRFbnRpcmVGaWxlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW3tcbiAgICAgICAgICBvbGRSYW5nZTogdGV4dEVkaXRvci5nZXRCdWZmZXIoKS5nZXRSYW5nZSgpLFxuICAgICAgICAgIG5ld1RleHQ6ICdnaGknXG4gICAgICAgIH1dKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRleHRFZGl0b3Iuc2V0VGV4dChcImFiY1wiKTtcbiAgICB0ZXh0RWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoXG4gICAgICBuZXcgUmFuZ2UoWzAsIDBdLCBbMCwgMF0pXG4gICAgKTtcbiAgICBhd2FpdCBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKFxuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpLFxuICAgICAgXCJwdWxzYXItY29kZS1mb3JtYXQ6Zm9ybWF0LWNvZGVcIlxuICAgICk7XG4gICAgYXdhaXQgd2FpdEZvcigoKSA9PiB0ZXh0RWRpdG9yLmdldFRleHQoKSA9PT0gXCJnaGlcIik7XG4gIH0pO1xuXG4gIGl0KFwiZm9ybWF0cyBhbiBlZGl0b3Igb24gdHlwZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgYXRvbS5jb25maWcuc2V0KCdwdWxzYXItY29kZS1mb3JtYXQuZm9ybWF0T25UeXBlJywgdHJ1ZSk7XG4gICAgY29uc3QgcHJvdmlkZXIgPSB7XG4gICAgICBncmFtbWFyU2NvcGVzOiBbXCJ0ZXh0LnBsYWluLm51bGwtZ3JhbW1hclwiXSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0QXRQb3NpdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBvbGRSYW5nZTogbmV3IFJhbmdlKFswLCAwXSwgWzAsIDNdKSxcbiAgICAgICAgICAgIG9sZFRleHQ6IFwiYWJjXCIsXG4gICAgICAgICAgICBuZXdUZXh0OiBcImRlZlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pO1xuICAgICAgfSxcbiAgICAgIGtlZXBDdXJzb3JQb3NpdGlvbjogZmFsc2UsXG4gICAgfTtcblxuICAgIG1hbmFnZXIuYWRkT25UeXBlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIHRleHRFZGl0b3Iuc2V0VGV4dChcImFcIik7XG4gICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihbMCwgMV0pO1xuICAgIHRleHRFZGl0b3IuaW5zZXJ0VGV4dChcImJcIik7XG4gICAgYXdhaXQgd2FpdCgzMDApO1xuICAgIHRleHRFZGl0b3IuaW5zZXJ0VGV4dChcImNcIik7XG4gICAgYXdhaXQgd2FpdEZvcigoKSA9PiB0ZXh0RWRpdG9yLmdldFRleHQoKSA9PT0gXCJkZWZcIik7XG4gIH0pO1xuXG4gIGl0KFwiZm9ybWF0cyBhbiBlZGl0b3Igb24gc2F2ZVwiLCBhc3luYyAoKSA9PiB7XG4gICAgYXRvbS5jb25maWcuc2V0KCdwdWxzYXItY29kZS1mb3JtYXQuZm9ybWF0T25TYXZlJywgdHJ1ZSk7XG4gICAgbWFuYWdlci5hZGRPblNhdmVQcm92aWRlcih7XG4gICAgICBncmFtbWFyU2NvcGVzOiBbXCJ0ZXh0LnBsYWluLm51bGwtZ3JhbW1hclwiXSxcbiAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgZm9ybWF0T25TYXZlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG9sZFJhbmdlOiBuZXcgUmFuZ2UoWzAsIDBdLCBbMCwgM10pLFxuICAgICAgICAgICAgb2xkVGV4dDogXCJhYmNcIixcbiAgICAgICAgICAgIG5ld1RleHQ6IFwiZGVmXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGV4dEVkaXRvci5zZXRUZXh0KFwiYWJjXCIpO1xuICAgIGF3YWl0IHRleHRFZGl0b3Iuc2F2ZSgpO1xuICAgIGF3YWl0IHdhaXRGb3IoKCkgPT4gdGV4dEVkaXRvci5nZXRUZXh0KCkgPT09IFwiZGVmXCIpO1xuICB9KTtcblxuICBpdChcInNob3VsZCBzdGlsbCBzYXZlIG9uIHRpbWVvdXRcIiwgYXN5bmMgKCkgPT4ge1xuICAgIGF0b20uY29uZmlnLnNldCgncHVsc2FyLWNvZGUtZm9ybWF0LmZvcm1hdE9uU2F2ZScsIHRydWUpO1xuICAgIG1hbmFnZXIuYWRkT25TYXZlUHJvdmlkZXIoe1xuICAgICAgZ3JhbW1hclNjb3BlczogW1widGV4dC5wbGFpbi5udWxsLWdyYW1tYXJcIl0sXG4gICAgICBwcmlvcml0eTogMSxcbiAgICAgIGZvcm1hdE9uU2F2ZTogYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCB3YWl0KFNBVkVfVElNRU9VVCAqIDIpO1xuICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICBvbGRSYW5nZTogbmV3IFJhbmdlKFswLCAwXSwgWzAsIDNdKSxcbiAgICAgICAgICBvbGRUZXh0OiBcIndoeVwiLFxuICAgICAgICAgIG5ld1RleHQ6IFwiaG93XCIsXG4gICAgICAgIH1dO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICB0ZXh0RWRpdG9yLnNldFRleHQoJ3doeScpO1xuICAgIGF3YWl0IHRleHRFZGl0b3Iuc2F2ZSgpO1xuICAgIGV4cGVjdCh0ZXh0RWRpdG9yLmdldFRleHQoKSkudG9CZSgnd2h5Jyk7XG4gIH0pO1xufSk7XG4iXX0=