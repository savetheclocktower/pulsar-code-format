import { BufferStoppedChangingEvent, CompositeDisposable, DisplayMarker, Package, Range, TextBuffer, TextEditor } from 'atom';

import { applyEditsToOpenEditor } from './apply-edits';

import { TextEdit } from 'atom-ide-base';
import ProviderRegistry from './provider-registry';
import { FileCodeFormatProvider, OnSaveCodeFormatProvider, OnTypeCodeFormatProvider, RangeCodeFormatProvider } from './providers';
import dedent from 'dedent';

type ConfigSchemaType = 'boolean' | 'object' | 'array' | 'number' | 'string';
type ConfigSchema<T = unknown> = { type: ConfigSchemaType, default: T; };

type ErrorWithDetail = Error & { detail: string; };

function isErrorWithDetail(x: unknown): x is ErrorWithDetail {
  if (!(x instanceof Error)) return false;
  if (!('detail' in x) || typeof x.detail !== 'string') return false;
  return true;
}

// Save events are critical, so don't allow providers to block them.
export const SAVE_TIMEOUT = 500;

function arrayToList(arr: string[]) {
  return arr.map(item => {
    return `* ${item}`;
  }).join('\n');
}

// Look up scope-specific settings for a particular editor. If `editor` is
// `undefined`, it'll return general settings for the same key.
function getScopedSettingsForKey<T = unknown>(key: string, editor: TextEditor): T | null {
  let schema = atom.config.getSchema(key) as ConfigSchema<T>;
  if (!schema) throw new Error(`Unknown config key: ${schema}`);

  let base = atom.config.get(key);
  if (!editor) return base as T;

  let grammar = editor.getGrammar();
  let scoped = atom.config.get(key, { scope: [grammar.scopeName] });

  if (schema?.type === 'object') {
    return { ...base, ...scoped };
  } else {
    return scoped ?? base;
  }
}

function getFormatOnSave(editor: TextEditor) {
  return getScopedSettingsForKey<boolean>(`pulsar-code-format.codeFormat.onSave`, editor);
}

function getFormatOnType(editor: TextEditor) {
  return getScopedSettingsForKey<boolean>(`pulsar-code-format.codeFormat.onType`, editor);
}

type ProviderRegistryCollection = {
  range: ProviderRegistry<RangeCodeFormatProvider>,
  file: ProviderRegistry<FileCodeFormatProvider>,
  onType: ProviderRegistry<OnTypeCodeFormatProvider>,
  onSave: ProviderRegistry<OnSaveCodeFormatProvider>;
};

type CodeFormatStep = (editor: TextEditor, range?: Range) => Promise<TextEdit[] | null>;

// Apply a series of formatters to the editor in a pipeline pattern. Each
// formatter receives the buffer in the state it was left in by the previous
// formatter.
async function applyCodeFormatPipelineToEditor(pipeline: CodeFormatStep[], editor: TextEditor, range?: Range) {
  let marker: DisplayMarker | null = null;
  if (range) {
    marker = editor.markBufferRange(range);
  }
  for (let step of pipeline) {
    let edits;
    if (range && marker) {
      edits = await step(editor, marker.getBufferRange());
    } else {
      edits = await step(editor);
    }
    if (!edits) continue;
    let success = applyEditsToOpenEditor(editor, edits);
    if (!success) {
      throw new Error("Could not apply edits!");
    }
  }
}

class CodeFormatManager {
  private subscriptions: CompositeDisposable;
  private providers: ProviderRegistryCollection;
  private watchedEditors: WeakSet<TextEditor> = new WeakSet();
  private watchedBuffers: WeakSet<TextBuffer> = new WeakSet();

  private bufferModificationTimes: WeakMap<TextBuffer, number> = new WeakMap();

  constructor() {
    this.subscriptions = new CompositeDisposable(
      // A command to format the file or the selected code.
      atom.commands.add(
        "atom-text-editor",
        "pulsar-code-format:format-code",
        async (event) => {
          const editorElement = event.currentTarget;
          const editor = editorElement.getModel();
          let selectionRange = editor.getSelectedBufferRange();
          let pipeline = this.formatCodeInTextEditor(editor, selectionRange);
          try {
            await applyCodeFormatPipelineToEditor(pipeline, editor, selectionRange);
          } catch (err: unknown) {
            if (isErrorWithDetail(err)) {
              atom.notifications.addError(
                `Failed to format code: ${err.message}`,
                { detail: err.detail }
              );
            }
          }
        }
      ),

      // A command to list the active providers.
      atom.commands.add(
        "atom-text-editor",
        "pulsar-code-format:list-providers-for-current-editor",
        async (event) => {
          let editorElement = event.currentTarget;
          let editor = editorElement.getModel();

          let packageResults: { range: Package[], file: Package[], onSave: Package[], onType: Package[]; } = {
            range: [],
            file: [],
            onSave: [],
            onType: []
          };
          let allPackages = atom.packages.getActivePackages();
          for (let pack of allPackages) {
            // @ts-ignore undocumented
            if (!pack?.metadata?.providedServices) continue;
            // @ts-ignore undocumented
            for (let svc of Object.keys(pack.metadata.providedServices)) {
              if (!svc.startsWith('code-format.')) continue;
              if (svc.endsWith('.range')) {
                packageResults.range.push(pack);
              } else if (svc.endsWith('.file')) {
                packageResults.file.push(pack);
              } else if (svc.endsWith('.onSave')) {
                packageResults.onSave.push(pack);
              } else if (svc.endsWith('.onType')) {
                packageResults.onType.push(pack);
              }
            }
          }

          let sections = [];
          if (packageResults.range.length > 0) {
            sections.push(dedent`
            ### Range formatters

            ${arrayToList(packageResults.range.map(p => p.name))}
            `);
          }

          if (packageResults.file.length > 0) {
            sections.push(dedent`
            ### File formatters

            ${arrayToList(packageResults.onSave.map(p => p.name))}
            `);
          }

          if (packageResults.onSave.length > 0) {
            sections.push(dedent`
            ### On-save formatters

            ${arrayToList(packageResults.onSave.map(p => p.name))}
            `);
          }

          if (packageResults.file.length > 0) {
            sections.push(dedent`
            ### On-type formatters

            ${arrayToList(packageResults.onType.map(p => p.name))}
            `);
          }

          let providers = {
            range: this.providers.range.getAllProvidersForEditor(editor),
            file: this.providers.file.getAllProvidersForEditor(editor),
            onSave: this.providers.onSave.getAllProvidersForEditor(editor),
            onType: this.providers.onType.getAllProvidersForEditor(editor)
          };

          let getPackagesForProviders = (providers: unknown[]) => {
            // @ts-ignore
            return providers.map(p => atom.packages.packageForService(p))
          }

          // @ts-ignore experimental API
          if (typeof atom.packages?.packageForService === 'function') {
            let packages = {
              range: getPackagesForProviders(providers.range),
              file: getPackagesForProviders(providers.file),
              onSave: getPackagesForProviders(providers.onSave),
              onType: getPackagesForProviders(providers.onType)
            };
            console.log('PACKAGES!!!', packages);
          }

          sections.unshift(dedent`
          ### Active providers in this editor

          * Range: ${providers.range.length}
          * File: ${providers.file.length}
          * On-save: ${providers.onSave.length}
          * On-type: ${providers.onType.length}
          `);

          let markdown = sections.join('\n\n');

          atom.notifications.addInfo(`Code formatting packages`, {
            description: markdown
          });
        }
      ),

      // Watch all editors
      atom.workspace.observeTextEditors(
        (editor) => {
          if (this.watchedEditors.has(editor)) return;
          this.watchedEditors.add(editor);

          let buffer = editor.getBuffer();

          let editorSubs = new CompositeDisposable(
            // Format on type.
            //
            // TODO: Probably better not to attach this subscription at all in
            // the common case that someone will disable this setting.
            editor.getBuffer().onDidStopChanging(async (event) => {
              if (!getFormatOnType(editor)) return;
              try {
                await this.formatCodeOnTypeInTextEditor(editor, event);
              } catch (err) {
                console.warn(`Failed to format code on type:`, err);
              }
            }),
          );
          if (!this.watchedBuffers.has(buffer)) {
            editorSubs.add(
              // A simple versioning strategy: record buffer modification
              // timestamps so we know if they change while we're waiting for a
              // provider.
              //
              // The `onDidChange` callback fires very often, so we should not
              // do any more work in this callback than we absolutely have to.
              buffer.onDidChange(() => {
                this.bufferModificationTimes.set(buffer, Date.now())
              }),

              // Format on save. Formatters are applied before the buffer is
              // saved; because we return a promise here, committing to disk will
              // be deferred until the promise resolves.
              buffer.onWillSave(async () => {
                if (!getFormatOnSave(editor)) return;
                let pipeline = await this.formatCodeOnSaveInTextEditor(editor);
                try {
                  await applyCodeFormatPipelineToEditor(pipeline, editor);
                } catch (err) {
                  if (isErrorWithDetail(err)) {
                    atom.notifications.addError(
                      `Failed to format code: ${err.message}`,
                      { detail: err.detail }
                    );
                  }
                }
              })
            );
          }
          this.watchedBuffers.add(buffer);
          editor.onDidDestroy(() => editorSubs.dispose());
        }
      )
    );

    this.providers = {
      range: new ProviderRegistry(),
      file: new ProviderRegistry(),
      onType: new ProviderRegistry(),
      onSave: new ProviderRegistry()
    };
  }

  // A wrapper around an arbitrary pipeline action. Will try to detect when a
  // code formatting result is stale and fail silently instead of doing
  // something destructive.
  guardVersion(fn: (editor: TextEditor, range?: Range) => Promise<TextEdit[]>) {
    return async (editor: TextEditor, range?: Range) => {
      let buffer = editor.getBuffer();
      let before = this.bufferModificationTimes.get(buffer) ?? -1;
      let edits = await fn(editor, range);
      let after = this.bufferModificationTimes.get(buffer) ?? -1;
      if (before !== after) {
        console.warn("Warning: Code format provider failed to act because of a version mismatch.");
        return [];
      }
      return edits;
    }
  }

  formatCodeInTextEditor(editor: TextEditor, selectionRange: Range | null = null) {
    selectionRange ??= editor.getSelectedBufferRange();

    let pipeline: CodeFormatStep[] = [];

    // Range providers.
    let rangeProviders = [...this.providers.range.getConfiguredProvidersForEditor(editor)];

    // File providers.
    let fileProviders: FileCodeFormatProvider[] = [];
    if (selectionRange.isEmpty()) {
      fileProviders = [...this.providers.file.getConfiguredProvidersForEditor(editor)];
    }

    if (selectionRange.isEmpty() && fileProviders.length > 0) {
      for (let provider of fileProviders) {
        pipeline.push(
          this.guardVersion(
            async (editor: TextEditor) => await provider.formatEntireFile(editor)
          )
        );
      }
      return pipeline;
    } else {
      // Apply code formatters in order.
      for (let provider of rangeProviders) {
        pipeline.push(
          this.guardVersion(
            async (editor: TextEditor, range?: Range) => {
              range ??= editor.getBuffer().getRange();
              return await provider.formatCode(editor, range);
            }
          )
        );
      }
      return pipeline;
    }
  }

  async formatCodeOnTypeInTextEditor(editor: TextEditor, { changes }: BufferStoppedChangingEvent) {
    // Bail if there's more than one cursor.
    if (changes.length > 1) return [];

    // Bail if we have no providers.
    let providers = [...this.providers.onType.getConfiguredProvidersForEditor(editor)];
    if (providers.length === 0) return [];

    let [change] = changes;
    if (!shouldFormatOnType(change)) return [];

    // In the case of bracket-matching, we use the last character because
    // that's the character that will usually cause a reformat (i.e. `}`
    // instead of `{`).
    const character = change.newText[change.newText.length - 1];

    const contents = editor.getText();
    const cursorPosition = editor.getCursorBufferPosition().copy();

    // The bracket-matching package basically overwrites
    //
    //     editor.insertText('{');
    //
    // with
    //
    //     editor.insertText('{}');
    //     cursor.moveLeft();
    //
    // We want to wait until the cursor has actually moved before we issue a
    // format request, so that we format at the right position (and potentially
    // also let any other event handlers have their go).
    const allEdits = await Promise.all(
      providers.map((p) => p.formatAtPosition(editor, editor.getCursorBufferPosition(), character))
    );
    const firstNonEmptyIndex = allEdits.findIndex((edits) => edits.length > 0);
    if (firstNonEmptyIndex === -1) return [];

    const edits = allEdits[firstNonEmptyIndex];
    const provider = providers[firstNonEmptyIndex];
    checkContentsAreSame(contents, editor.getText());
    // Note that this modification is not in a transaction, so it applies as a
    // separate editing event than the character typing. This means that you
    // can undo just the formatting by attempting to undo once, and then undo
    // your actual code by undoing again.
    if (!applyEditsToOpenEditor(editor, edits)) {
      throw new Error("Could not apply edits to text buffer.");
    }

    if (provider.keepCursorPosition) {
      editor.setCursorBufferPosition(cursorPosition);
    }
    return edits;
  }

  async formatCodeOnSaveInTextEditor(editor: TextEditor) {
    if (!getFormatOnSave(editor)) return [];
    let saveProviders = [...this.providers.onSave.getConfiguredProvidersForEditor(editor)];
    const pipeline: CodeFormatStep[] = [];
    for (let provider of saveProviders) {
      pipeline.push(
        this.guardVersion(
          async (editor: TextEditor) => {
            return await provider.formatOnSave(editor);
          }
        )
      );
    }
    if (pipeline.length === 0) {
      // Fall back to a range provider (with the entire buffer as the range).
      return this.formatCodeInTextEditor(editor, editor.getBuffer().getRange());
    }
    return pipeline;
  }

  addRangeProvider(provider: RangeCodeFormatProvider) {
    if (!('formatCode' in provider)) {
      console.warn('Invalid provider:', provider);
      return;
    }
    let result = this.providers.range.addProvider(provider);
    console.log('Provider count for range:', this.providers.range.providers.length);
    return result;
  }

  addFileProvider(provider: FileCodeFormatProvider) {
    if (!('formatEntireFile' in provider)) {
      console.warn('Invalid provider:', provider);
      return;
    }
    let result = this.providers.file.addProvider(provider);
    console.log('Provider count for file:', this.providers.file.providers.length);
    return result;
  }

  addOnTypeProvider(provider: OnTypeCodeFormatProvider) {
    if (!('formatAtPosition' in provider)) {
      console.warn('Invalid provider:', provider);
      return;
    }
    let result = this.providers.onType.addProvider(provider);
    console.log('Provider count for onType:', this.providers.onType.providers.length);
    return result;
  }

  addOnSaveProvider(provider: OnSaveCodeFormatProvider) {
    if (!('formatOnSave' in provider)) {
      console.warn('Invalid provider:', provider);
      return;
    }
    let result = this.providers.onSave.addProvider(provider);
    console.log('Provider count for onSave:', this.providers.onSave.providers.length);
    return result;
  }

  dispose() {
    this.subscriptions.dispose();
  }
}

function shouldFormatOnType(change: BufferStoppedChangingEvent['changes'][0]) {
  // There's not a direct way to figure out what caused this edit event. There
  // are three cases that we want to pay attention to:
  //
  // 1) The user typed a character.
  // 2) The user typed a character, and bracket-matching kicked in, causing
  //    there to be two characters typed.
  // 3) The user pasted a string.
  //
  // We only want to trigger autoformatting in the first two cases. However,
  // we can only look at what new string was inserted, and not what actually
  // caused the event, so we just use some heuristics to determine which of
  // these the event probably was depending on what was typed. This means, for
  // example, we may issue spurious format requests when the user pastes a
  // single character, but this is acceptable.
  if (change.oldText !== "") {
    // We either just deleted something or replaced a selection. For the time
    // being, we're not going to issue a reformat in that case.
    return false;
  } else if (change.newText === "") {
    // Not sure what happened here; why did we get an event in this case? Bail
    // for safety.
    return false;
  } else if (change.newText.length > 1 && !isBracketPair(change.newText)) {
    return false;
  }
  return true;
}


// We can't tell the difference between a paste and the bracket-matcher package
// inserting an extra bracket, so we just assume that any pair of brackets that
// `bracket-matcher` recognizes was a pair matched by the package.
function isBracketPair(typedText: string) {
  if (atom.packages.getActivePackage("bracket-matcher") === undefined) {
    return false;
  }
  const validBracketPairs = atom.config.get("bracket-matcher.autocompleteCharacters");
  return validBracketPairs.includes(typedText);
}

function checkContentsAreSame(before: string, after: string) {
  if (before !== after) {
    throw new Error("The file contents were changed before formatting was complete.");
  }
}


export default CodeFormatManager;
