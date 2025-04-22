import { CompositeDisposable, Range, TextEditor } from "atom";
import CodeFormatManager, { SAVE_TIMEOUT } from "../lib/code-format-manager";
import temp from "temp";
import { wait, waitFor } from "./utils";

describe("CodeFormatManager", () => {
  let textEditor: TextEditor;
  let manager: CodeFormatManager;
  let subscriptions: CompositeDisposable;

  beforeEach(async () => {
    console.log('setting!');
    atom.config.set('pulsar-code-format.advanced.enableDebugLogging', true);
    manager = new CodeFormatManager();
    subscriptions = new CompositeDisposable();
    temp.track();
    const file = temp.openSync();
    textEditor = await atom.workspace.open(file.path) as TextEditor;
    textEditor.setText('');
  });

  afterEach(() => {
    manager.dispose();
    subscriptions.dispose();
  });

  it("formats an editor on request", async () => {
    manager.addRangeProvider({
      grammarScopes: ["text.plain.null-grammar"],
      priority: 1,
      formatCode: () =>
        Promise.resolve([
          {
            oldRange: new Range([0, 0], [0, 3]),
            oldText: "abc",
            newText: "def",
          },
        ]),
    });
    textEditor.setText("abc");
    await atom.commands.dispatch(
      atom.views.getView(textEditor),
      "pulsar-code-format:format-code"
    );
    await waitFor(() => textEditor.getText() === "def");
  });

  it("format an editor using formatEntireFile", async () => {
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
    textEditor.setSelectedBufferRange(
      new Range([0, 0], [0, 0])
    );
    await atom.commands.dispatch(
      atom.views.getView(textEditor),
      "pulsar-code-format:format-code"
    );
    await waitFor(() => textEditor.getText() === "ghi");
  });

  it("formats an editor on type", async () => {
    atom.config.set('pulsar-code-format.formatOnType', true);
    const provider = {
      grammarScopes: ["text.plain.null-grammar"],
      priority: 1,
      formatAtPosition: () => {
        return Promise.resolve([
          {
            oldRange: new Range([0, 0], [0, 3]),
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
    await wait(300);
    textEditor.insertText("c");
    await waitFor(() => textEditor.getText() === "def");
  });

  it("formats an editor on save", async () => {
    atom.config.set('pulsar-code-format.formatOnSave', true);
    manager.addOnSaveProvider({
      grammarScopes: ["text.plain.null-grammar"],
      priority: 1,
      formatOnSave: () => {
        return Promise.resolve([
          {
            oldRange: new Range([0, 0], [0, 3]),
            oldText: "abc",
            newText: "def",
          },
        ]);
      }
    });
    textEditor.setText("abc");
    await textEditor.save();
    await waitFor(() => textEditor.getText() === "def");
  });

  it("should still save on timeout", async () => {
    atom.config.set('pulsar-code-format.formatOnSave', true);
    manager.addOnSaveProvider({
      grammarScopes: ["text.plain.null-grammar"],
      priority: 1,
      formatOnSave: async () => {
        await wait(3000);
        return [{
          oldRange: new Range([0, 0], [0, 3]),
          oldText: "why",
          newText: "how",
        }];
      },
    });
    textEditor.setText('why');
    await textEditor.save();
    expect(textEditor.getText()).toBe('why');
  });
});
