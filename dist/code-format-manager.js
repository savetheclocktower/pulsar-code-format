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
exports.SAVE_TIMEOUT = void 0;
const atom_1 = require("atom");
const apply_edits_1 = require("./apply-edits");
const provider_registry_1 = __importDefault(require("./provider-registry"));
const dedent_1 = __importDefault(require("dedent"));
function isErrorWithDetail(x) {
    if (!(x instanceof Error))
        return false;
    if (!('detail' in x) || typeof x.detail !== 'string')
        return false;
    return true;
}
// Save events are critical, so don't allow providers to block them.
exports.SAVE_TIMEOUT = 500;
function arrayToList(arr) {
    return arr.map(item => {
        return `* ${item}`;
    }).join('\n');
}
// Look up scope-specific settings for a particular editor. If `editor` is
// `undefined`, it'll return general settings for the same key.
function getScopedSettingsForKey(key, editor) {
    let schema = atom.config.getSchema(key);
    if (!schema)
        throw new Error(`Unknown config key: ${schema}`);
    let base = atom.config.get(key);
    if (!editor)
        return base;
    let grammar = editor.getGrammar();
    let scoped = atom.config.get(key, { scope: [grammar.scopeName] });
    if ((schema === null || schema === void 0 ? void 0 : schema.type) === 'object') {
        return Object.assign(Object.assign({}, base), scoped);
    }
    else {
        return scoped !== null && scoped !== void 0 ? scoped : base;
    }
}
function getFormatOnSave(editor) {
    return getScopedSettingsForKey(`pulsar-code-format.codeFormat.onSave`, editor);
}
function getFormatOnType(editor) {
    return getScopedSettingsForKey(`pulsar-code-format.codeFormat.onType`, editor);
}
// Apply a series of formatters to the editor in a pipeline pattern. Each
// formatter receives the buffer in the state it was left in by the previous
// formatter.
function applyCodeFormatPipelineToEditor(pipeline, editor, range) {
    return __awaiter(this, void 0, void 0, function* () {
        let marker = null;
        if (range) {
            marker = editor.markBufferRange(range);
        }
        for (let step of pipeline) {
            let edits;
            if (range && marker) {
                edits = yield step(editor, marker.getBufferRange());
            }
            else {
                edits = yield step(editor);
            }
            if (!edits)
                continue;
            let success = (0, apply_edits_1.applyEditsToOpenEditor)(editor, edits);
            if (!success) {
                throw new Error("Could not apply edits!");
            }
        }
    });
}
class CodeFormatManager {
    constructor() {
        this.watchedEditors = new WeakSet();
        this.watchedBuffers = new WeakSet();
        this.subscriptions = new atom_1.CompositeDisposable(
        // A command to format the file or the selected code.
        atom.commands.add("atom-text-editor", "pulsar-code-format:format-code", (event) => __awaiter(this, void 0, void 0, function* () {
            const editorElement = event.currentTarget;
            const editor = editorElement.getModel();
            let selectionRange = editor.getSelectedBufferRange();
            let pipeline = this.formatCodeInTextEditor(editor, selectionRange);
            try {
                yield applyCodeFormatPipelineToEditor(pipeline, editor, selectionRange);
            }
            catch (err) {
                if (isErrorWithDetail(err)) {
                    atom.notifications.addError(`Failed to format code: ${err.message}`, { detail: err.detail });
                }
            }
        })), 
        // A command to list the active providers.
        atom.commands.add("atom-text-editor", "pulsar-code-format:list-providers-for-current-editor", (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let editorElement = event.currentTarget;
            let editor = editorElement.getModel();
            let packageResults = {
                range: [],
                file: [],
                onSave: [],
                onType: []
            };
            let allPackages = atom.packages.getActivePackages();
            for (let pack of allPackages) {
                // @ts-ignore undocumented
                if (!((_a = pack === null || pack === void 0 ? void 0 : pack.metadata) === null || _a === void 0 ? void 0 : _a.providedServices))
                    continue;
                // @ts-ignore undocumented
                for (let svc of Object.keys(pack.metadata.providedServices)) {
                    if (!svc.startsWith('code-format.'))
                        continue;
                    if (svc.endsWith('.range')) {
                        packageResults.range.push(pack);
                    }
                    else if (svc.endsWith('.file')) {
                        packageResults.file.push(pack);
                    }
                    else if (svc.endsWith('.onSave')) {
                        packageResults.onSave.push(pack);
                    }
                    else if (svc.endsWith('.onType')) {
                        packageResults.onType.push(pack);
                    }
                }
            }
            let sections = [];
            if (packageResults.range.length > 0) {
                sections.push((0, dedent_1.default) `
            ### Range formatters

            ${arrayToList(packageResults.range.map(p => p.name))}
            `);
            }
            if (packageResults.file.length > 0) {
                sections.push((0, dedent_1.default) `
            ### File formatters

            ${arrayToList(packageResults.onSave.map(p => p.name))}
            `);
            }
            if (packageResults.onSave.length > 0) {
                sections.push((0, dedent_1.default) `
            ### On-save formatters

            ${arrayToList(packageResults.onSave.map(p => p.name))}
            `);
            }
            if (packageResults.file.length > 0) {
                sections.push((0, dedent_1.default) `
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
            let getPackagesForProviders = (providers) => {
                // @ts-ignore
                return providers.map(p => atom.packages.packageForService(p));
            };
            // @ts-ignore experimental API
            if (typeof ((_b = atom.packages) === null || _b === void 0 ? void 0 : _b.packageForService) === 'function') {
                let packages = {
                    range: getPackagesForProviders(providers.range),
                    file: getPackagesForProviders(providers.file),
                    onSave: getPackagesForProviders(providers.onSave),
                    onType: getPackagesForProviders(providers.onType)
                };
                console.log('PACKAGES!!!', packages);
            }
            sections.unshift((0, dedent_1.default) `
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
        })), 
        // Watch all editors
        atom.workspace.observeTextEditors((editor) => {
            if (this.watchedEditors.has(editor))
                return;
            this.watchedEditors.add(editor);
            let buffer = editor.getBuffer();
            let editorSubs = new atom_1.CompositeDisposable(
            // Format on type.
            //
            // TODO: Probably better not to attach this subscription at all in
            // the common case that someone will disable this setting.
            editor.getBuffer().onDidStopChanging((event) => __awaiter(this, void 0, void 0, function* () {
                if (!getFormatOnType(editor))
                    return;
                try {
                    yield this.formatCodeOnTypeInTextEditor(editor, event);
                }
                catch (err) {
                    console.warn(`Failed to format code on type:`, err);
                }
            })));
            if (!this.watchedBuffers.has(buffer)) {
                editorSubs.add(
                // Format on save. Formatters are applied before the buffer is
                // saved; because we return a promise here, committing to disk will
                // be deferred until the promise resolves.
                editor.getBuffer().onWillSave(() => __awaiter(this, void 0, void 0, function* () {
                    if (!getFormatOnSave(editor))
                        return;
                    let pipeline = yield this.formatCodeOnSaveInTextEditor(editor);
                    try {
                        yield applyCodeFormatPipelineToEditor(pipeline, editor);
                    }
                    catch (err) {
                        if (isErrorWithDetail(err)) {
                            atom.notifications.addError(`Failed to format code: ${err.message}`, { detail: err.detail });
                        }
                    }
                })));
            }
            this.watchedBuffers.add(buffer);
            editor.onDidDestroy(() => editorSubs.dispose());
        }));
        this.providers = {
            range: new provider_registry_1.default(),
            file: new provider_registry_1.default(),
            onType: new provider_registry_1.default(),
            onSave: new provider_registry_1.default()
        };
    }
    formatCodeInTextEditor(editor, selectionRange = null) {
        selectionRange !== null && selectionRange !== void 0 ? selectionRange : (selectionRange = editor.getSelectedBufferRange());
        let pipeline = [];
        // Range providers.
        let rangeProviders = [...this.providers.range.getConfiguredProvidersForEditor(editor)];
        // File providers.
        let fileProviders = [];
        if (selectionRange.isEmpty()) {
            fileProviders = [...this.providers.file.getConfiguredProvidersForEditor(editor)];
        }
        if (selectionRange.isEmpty() && fileProviders.length > 0) {
            for (let provider of fileProviders) {
                pipeline.push(() => __awaiter(this, void 0, void 0, function* () { return yield provider.formatEntireFile(editor); }));
            }
            return pipeline;
        }
        else {
            // Apply code formatters in order.
            for (let provider of rangeProviders) {
                pipeline.push((editor, range) => __awaiter(this, void 0, void 0, function* () {
                    range !== null && range !== void 0 ? range : (range = editor.getBuffer().getRange());
                    return yield provider.formatCode(editor, range);
                }));
            }
            return pipeline;
        }
    }
    formatCodeOnTypeInTextEditor(editor_1, _a) {
        return __awaiter(this, arguments, void 0, function* (editor, { changes }) {
            // Bail if there's more than one cursor.
            if (changes.length > 1)
                return [];
            // Bail if we have no providers.
            let providers = [...this.providers.onType.getConfiguredProvidersForEditor(editor)];
            if (providers.length === 0)
                return [];
            let [change] = changes;
            if (!shouldFormatOnType(change))
                return [];
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
            const allEdits = yield Promise.all(providers.map((p) => p.formatAtPosition(editor, editor.getCursorBufferPosition(), character)));
            const firstNonEmptyIndex = allEdits.findIndex((edits) => edits.length > 0);
            if (firstNonEmptyIndex === -1)
                return [];
            const edits = allEdits[firstNonEmptyIndex];
            const provider = providers[firstNonEmptyIndex];
            checkContentsAreSame(contents, editor.getText());
            // Note that this modification is not in a transaction, so it applies as a
            // separate editing event than the character typing. This means that you
            // can undo just the formatting by attempting to undo once, and then undo
            // your actual code by undoing again.
            if (!(0, apply_edits_1.applyEditsToOpenEditor)(editor, edits)) {
                throw new Error("Could not apply edits to text buffer.");
            }
            if (provider.keepCursorPosition) {
                editor.setCursorBufferPosition(cursorPosition);
            }
            return edits;
        });
    }
    formatCodeOnSaveInTextEditor(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!getFormatOnSave(editor))
                return [];
            let saveProviders = [...this.providers.onSave.getConfiguredProvidersForEditor(editor)];
            const pipeline = [];
            for (let provider of saveProviders) {
                pipeline.push(() => __awaiter(this, void 0, void 0, function* () {
                    return yield provider.formatOnSave(editor);
                }));
            }
            if (pipeline.length === 0) {
                // Fall back to a range provider (with the entire buffer as the range).
                return this.formatCodeInTextEditor(editor, editor.getBuffer().getRange());
            }
            return pipeline;
        });
    }
    addRangeProvider(provider) {
        if (!('formatCode' in provider)) {
            console.warn('Invalid provider:', provider);
            return;
            // throw new Error('Invalid provider!');
        }
        let result = this.providers.range.addProvider(provider);
        console.log('Provider count for range:', this.providers.range.providers.length);
        return result;
    }
    addFileProvider(provider) {
        if (!('formatEntireFile' in provider)) {
            console.warn('Invalid provider:', provider);
            return;
            // throw new Error('Invalid provider!');
        }
        let result = this.providers.file.addProvider(provider);
        console.log('Provider count for file:', this.providers.file.providers.length);
        return result;
    }
    addOnTypeProvider(provider) {
        if (!('formatAtPosition' in provider)) {
            console.warn('Invalid provider:', provider);
            return;
            // throw new Error('Invalid provider!');
        }
        let result = this.providers.onType.addProvider(provider);
        console.log('Provider count for onType:', this.providers.onType.providers.length);
        return result;
    }
    addOnSaveProvider(provider) {
        if (!('formatOnSave' in provider)) {
            console.warn('Invalid provider:', provider);
            return;
            // throw new Error('Invalid provider!');
        }
        let result = this.providers.onSave.addProvider(provider);
        console.log('Provider count for onSave:', this.providers.onSave.providers.length);
        return result;
    }
    dispose() {
        this.subscriptions.dispose();
    }
}
function shouldFormatOnType(change) {
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
    }
    else if (change.newText === "") {
        // Not sure what happened here; why did we get an event in this case? Bail
        // for safety.
        return false;
    }
    else if (change.newText.length > 1 && !isBracketPair(change.newText)) {
        return false;
    }
    return true;
}
// We can't tell the difference between a paste and the bracket-matcher package
// inserting an extra bracket, so we just assume that any pair of brackets that
// `bracket-matcher` recognizes was a pair matched by the package.
function isBracketPair(typedText) {
    if (atom.packages.getActivePackage("bracket-matcher") === undefined) {
        return false;
    }
    const validBracketPairs = atom.config.get("bracket-matcher.autocompleteCharacters");
    return validBracketPairs.includes(typedText);
}
function checkContentsAreSame(before, after) {
    if (before !== after) {
        throw new Error("The file contents were changed before formatting was complete.");
    }
}
exports.default = CodeFormatManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9jb2RlLWZvcm1hdC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUE4SDtBQUU5SCwrQ0FBdUQ7QUFHdkQsNEVBQW1EO0FBRW5ELG9EQUE0QjtBQU81QixTQUFTLGlCQUFpQixDQUFDLENBQVU7SUFDbkMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ3hDLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxNQUFNLEtBQUssUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ25FLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELG9FQUFvRTtBQUN2RCxRQUFBLFlBQVksR0FBRyxHQUFHLENBQUM7QUFFaEMsU0FBUyxXQUFXLENBQUMsR0FBYTtJQUNoQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDcEIsT0FBTyxLQUFLLElBQUksRUFBRSxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQixDQUFDO0FBRUQsMEVBQTBFO0FBQzFFLCtEQUErRDtBQUMvRCxTQUFTLHVCQUF1QixDQUFjLEdBQVcsRUFBRSxNQUFrQjtJQUMzRSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQW9CLENBQUM7SUFDM0QsSUFBSSxDQUFDLE1BQU07UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBRTlELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxN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eUU7UUFDekUsMkRBQTJEO1FBQzNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUNqQywwRUFBMEU7UUFDMUUsY0FBYztRQUNkLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztTQUFNLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ3ZFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdELCtFQUErRTtBQUMvRSwrRUFBK0U7QUFDL0Usa0VBQWtFO0FBQ2xFLFNBQVMsYUFBYSxDQUFDLFNBQWlCO0lBQ3RDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3BFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsQ0FBQztJQUNwRixPQUFPLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxNQUFjLEVBQUUsS0FBYTtJQUN6RCxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztRQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7SUFDcEYsQ0FBQztBQUNILENBQUM7QUFHRCxrQkFBZSxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJ1ZmZlclN0b3BwZWRDaGFuZ2luZ0V2ZW50LCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwbGF5TWFya2VyLCBQYWNrYWdlLCBSYW5nZSwgVGV4dEJ1ZmZlciwgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nO1xuXG5pbXBvcnQgeyBhcHBseUVkaXRzVG9PcGVuRWRpdG9yIH0gZnJvbSAnLi9hcHBseS1lZGl0cyc7XG5cbmltcG9ydCB7IFRleHRFZGl0IH0gZnJvbSAnYXRvbS1pZGUtYmFzZSc7XG5pbXBvcnQgUHJvdmlkZXJSZWdpc3RyeSBmcm9tICcuL3Byb3ZpZGVyLXJlZ2lzdHJ5JztcbmltcG9ydCB7IEZpbGVDb2RlRm9ybWF0UHJvdmlkZXIsIE9uU2F2ZUNvZGVGb3JtYXRQcm92aWRlciwgT25UeXBlQ29kZUZvcm1hdFByb3ZpZGVyLCBSYW5nZUNvZGVGb3JtYXRQcm92aWRlciB9IGZyb20gJy4vcHJvdmlkZXJzJztcbmltcG9ydCBkZWRlbnQgZnJvbSAnZGVkZW50JztcblxudHlwZSBDb25maWdTY2hlbWFUeXBlID0gJ2Jvb2xlYW4nIHwgJ29iamVjdCcgfCAnYXJyYXknIHwgJ251bWJlcicgfCAnc3RyaW5nJztcbnR5cGUgQ29uZmlnU2NoZW1hPFQgPSB1bmtub3duPiA9IHsgdHlwZTogQ29uZmlnU2NoZW1hVHlwZSwgZGVmYXVsdDogVDsgfTtcblxudHlwZSBFcnJvcldpdGhEZXRhaWwgPSBFcnJvciAmIHsgZGV0YWlsOiBzdHJpbmc7IH07XG5cbmZ1bmN0aW9uIGlzRXJyb3JXaXRoRGV0YWlsKHg6IHVua25vd24pOiB4IGlzIEVycm9yV2l0aERldGFpbCB7XG4gIGlmICghKHggaW5zdGFuY2VvZiBFcnJvcikpIHJldHVybiBmYWxzZTtcbiAgaWYgKCEoJ2RldGFpbCcgaW4geCkgfHwgdHlwZW9mIHguZGV0YWlsICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gU2F2ZSBldmVudHMgYXJlIGNyaXRpY2FsLCBzbyBkb24ndCBhbGxvdyBwcm92aWRlcnMgdG8gYmxvY2sgdGhlbS5cbmV4cG9ydCBjb25zdCBTQVZFX1RJTUVPVVQgPSA1MDA7XG5cbmZ1bmN0aW9uIGFycmF5VG9MaXN0KGFycjogc3RyaW5nW10pIHtcbiAgcmV0dXJuIGFyci5tYXAoaXRlbSA9PiB7XG4gICAgcmV0dXJuIGAqICR7aXRlbX1gO1xuICB9KS5qb2luKCdcXG4nKTtcbn1cblxuLy8gTG9vayB1cCBzY29wZS1zcGVjaWZpYyBzZXR0aW5ncyBmb3IgYSBwYXJ0aWN1bGFyIGVkaXRvci4gSWYgYGVkaXRvcmAgaXNcbi8vIGB1bmRlZmluZWRgLCBpdCdsbCByZXR1cm4gZ2VuZXJhbCBzZXR0aW5ncyBmb3IgdGhlIHNhbWUga2V5LlxuZnVuY3Rpb24gZ2V0U2NvcGVkU2V0dGluZ3NGb3JLZXk8VCA9IHVua25vd24+KGtleTogc3RyaW5nLCBlZGl0b3I6IFRleHRFZGl0b3IpOiBUIHwgbnVsbCB7XG4gIGxldCBzY2hlbWEgPSBhdG9tLmNvbmZpZy5nZXRTY2hlbWEoa2V5KSBhcyBDb25maWdTY2hlbWE8VD47XG4gIGlmICghc2NoZW1hKSB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gY29uZmlnIGtleTogJHtzY2hlbWF9YCk7XG5cbiAgbGV0IGJhc2UgPSBhdG9tLmNvbmZpZy5nZXQoa2V5KTtcbiAgaWYgKCFlZGl0b3IpIHJldHVybiBiYXNlIGFzIFQ7XG5cbiAgbGV0IGdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICBsZXQgc2NvcGVkID0gYXRvbS5jb25maWcuZ2V0KGtleSwgeyBzY29wZTogW2dyYW1tYXIuc2NvcGVOYW1lXSB9KTtcblxuICBpZiAoc2NoZW1hPy50eXBlID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7IC4uLmJhc2UsIC4uLnNjb3BlZCB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzY29wZWQgPz8gYmFzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRGb3JtYXRPblNhdmUoZWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gIHJldHVybiBnZXRTY29wZWRTZXR0aW5nc0ZvcktleTxib29sZWFuPihgcHVsc2FyLWNvZGUtZm9ybWF0LmNvZGVGb3JtYXQub25TYXZlYCwgZWRpdG9yKTtcbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybWF0T25UeXBlKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICByZXR1cm4gZ2V0U2NvcGVkU2V0dGluZ3NGb3JLZXk8Ym9vbGVhbj4oYHB1bHNhci1jb2RlLWZvcm1hdC5jb2RlRm9ybWF0Lm9uVHlwZWAsIGVkaXRvcik7XG59XG5cbnR5cGUgUHJvdmlkZXJSZWdpc3RyeUNvbGxlY3Rpb24gPSB7XG4gIHJhbmdlOiBQcm92aWRlclJlZ2lzdHJ5PFJhbmdlQ29kZUZvcm1hdFByb3ZpZGVyPixcbiAgZmlsZTogUHJvdmlkZXJSZWdpc3RyeTxGaWxlQ29kZUZvcm1hdFByb3ZpZGVyPixcbiAgb25UeXBlOiBQcm92aWRlclJlZ2lzdHJ5PE9uVHlwZUNvZGVGb3JtYXRQcm92aWRlcj4sXG4gIG9uU2F2ZTogUHJvdmlkZXJSZWdpc3RyeTxPblNhdmVDb2RlRm9ybWF0UHJvdmlkZXI+O1xufTtcblxudHlwZSBDb2RlRm9ybWF0U3RlcCA9IChlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlPzogUmFuZ2UpID0+IFByb21pc2U8VGV4dEVkaXRbXSB8IG51bGw+O1xuXG4vLyBBcHBseSBhIHNlcmllcyBvZiBmb3JtYXR0ZXJzIHRvIHRoZSBlZGl0b3IgaW4gYSBwaXBlbGluZSBwYXR0ZXJuLiBFYWNoXG4vLyBmb3JtYXR0ZXIgcmVjZWl2ZXMgdGhlIGJ1ZmZlciBpbiB0aGUgc3RhdGUgaXQgd2FzIGxlZnQgaW4gYnkgdGhlIHByZXZpb3VzXG4vLyBmb3JtYXR0ZXIuXG5hc3luYyBmdW5jdGlvbiBhcHBseUNvZGVGb3JtYXRQaXBlbGluZVRvRWRpdG9yKHBpcGVsaW5lOiBDb2RlRm9ybWF0U3RlcFtdLCBlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlPzogUmFuZ2UpIHtcbiAgbGV0IG1hcmtlcjogRGlzcGxheU1hcmtlciB8IG51bGwgPSBudWxsO1xuICBpZiAocmFuZ2UpIHtcbiAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcbiAgfVxuICBmb3IgKGxldCBzdGVwIG9mIHBpcGVsaW5lKSB7XG4gICAgbGV0IGVkaXRzO1xuICAgIGlmIChyYW5nZSAmJiBtYXJrZXIpIHtcbiAgICAgIGVkaXRzID0gYXdhaXQgc3RlcChlZGl0b3IsIG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWRpdHMgPSBhd2FpdCBzdGVwKGVkaXRvcik7XG4gICAgfVxuICAgIGlmICghZWRpdHMpIGNvbnRpbnVlO1xuICAgIGxldCBzdWNjZXNzID0gYXBwbHlFZGl0c1RvT3BlbkVkaXRvcihlZGl0b3IsIGVkaXRzKTtcbiAgICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBhcHBseSBlZGl0cyFcIik7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIENvZGVGb3JtYXRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBwcml2YXRlIHByb3ZpZGVyczogUHJvdmlkZXJSZWdpc3RyeUNvbGxlY3Rpb247XG4gIHByaXZhdGUgd2F0Y2hlZEVkaXRvcnM6IFdlYWtTZXQ8VGV4dEVkaXRvcj4gPSBuZXcgV2Vha1NldCgpO1xuICBwcml2YXRlIHdhdGNoZWRCdWZmZXJzOiBXZWFrU2V0PFRleHRCdWZmZXI+ID0gbmV3IFdlYWtTZXQoKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZShcbiAgICAgIC8vIEEgY29tbWFuZCB0byBmb3JtYXQgdGhlIGZpbGUgb3IgdGhlIHNlbGVjdGVkIGNvZGUuXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgXCJhdG9tLXRleHQtZWRpdG9yXCIsXG4gICAgICAgIFwicHVsc2FyLWNvZGUtZm9ybWF0OmZvcm1hdC1jb2RlXCIsXG4gICAgICAgIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKTtcbiAgICAgICAgICBsZXQgc2VsZWN0aW9uUmFuZ2UgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xuICAgICAgICAgIGxldCBwaXBlbGluZSA9IHRoaXMuZm9ybWF0Q29kZUluVGV4dEVkaXRvcihlZGl0b3IsIHNlbGVjdGlvblJhbmdlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwbHlDb2RlRm9ybWF0UGlwZWxpbmVUb0VkaXRvcihwaXBlbGluZSwgZWRpdG9yLCBzZWxlY3Rpb25SYW5nZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyOiB1bmtub3duKSB7XG4gICAgICAgICAgICBpZiAoaXNFcnJvcldpdGhEZXRhaWwoZXJyKSkge1xuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZhaWxlZCB0byBmb3JtYXQgY29kZTogJHtlcnIubWVzc2FnZX1gLFxuICAgICAgICAgICAgICAgIHsgZGV0YWlsOiBlcnIuZGV0YWlsIH1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICksXG5cbiAgICAgIC8vIEEgY29tbWFuZCB0byBsaXN0IHRoZSBhY3RpdmUgcHJvdmlkZXJzLlxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgIFwiYXRvbS10ZXh0LWVkaXRvclwiLFxuICAgICAgICBcInB1bHNhci1jb2RlLWZvcm1hdDpsaXN0LXByb3ZpZGVycy1mb3ItY3VycmVudC1lZGl0b3JcIixcbiAgICAgICAgYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbGV0IGVkaXRvckVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgICAgICAgIGxldCBlZGl0b3IgPSBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCk7XG5cbiAgICAgICAgICBsZXQgcGFja2FnZVJlc3VsdHM6IHsgcmFuZ2U6IFBhY2thZ2VbXSwgZmlsZTogUGFja2FnZVtdLCBvblNhdmU6IFBhY2thZ2VbXSwgb25UeXBlOiBQYWNrYWdlW107IH0gPSB7XG4gICAgICAgICAgICByYW5nZTogW10sXG4gICAgICAgICAgICBmaWxlOiBbXSxcbiAgICAgICAgICAgIG9uU2F2ZTogW10sXG4gICAgICAgICAgICBvblR5cGU6IFtdXG4gICAgICAgICAgfTtcbiAgICAgICAgICBsZXQgYWxsUGFja2FnZXMgPSBhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2VzKCk7XG4gICAgICAgICAgZm9yIChsZXQgcGFjayBvZiBhbGxQYWNrYWdlcykge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB1bmRvY3VtZW50ZWRcbiAgICAgICAgICAgIGlmICghcGFjaz8ubWV0YWRhdGE/LnByb3ZpZGVkU2VydmljZXMpIGNvbnRpbnVlO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB1bmRvY3VtZW50ZWRcbiAgICAgICAgICAgIGZvciAobGV0IHN2YyBvZiBPYmplY3Qua2V5cyhwYWNrLm1ldGFkYXRhLnByb3ZpZGVkU2VydmljZXMpKSB7XG4gICAgICAgICAgICAgIGlmICghc3ZjLnN0YXJ0c1dpdGgoJ2NvZGUtZm9ybWF0LicpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgaWYgKHN2Yy5lbmRzV2l0aCgnLnJhbmdlJykpIHtcbiAgICAgICAgICAgICAgICBwYWNrYWdlUmVzdWx0cy5yYW5nZS5wdXNoKHBhY2spO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN2Yy5lbmRzV2l0aCgnLmZpbGUnKSkge1xuICAgICAgICAgICAgICAgIHBhY2thZ2VSZXN1bHRzLmZpbGUucHVzaChwYWNrKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdmMuZW5kc1dpdGgoJy5vblNhdmUnKSkge1xuICAgICAgICAgICAgICAgIHBhY2thZ2VSZXN1bHRzLm9uU2F2ZS5wdXNoKHBhY2spO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN2Yy5lbmRzV2l0aCgnLm9uVHlwZScpKSB7XG4gICAgICAgICAgICAgICAgcGFja2FnZVJlc3VsdHMub25UeXBlLnB1c2gocGFjayk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgc2VjdGlvbnMgPSBbXTtcbiAgICAgICAgICBpZiAocGFja2FnZVJlc3VsdHMucmFuZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2VjdGlvbnMucHVzaChkZWRlbnRgXG4gICAgICAgICAgICAjIyMgUmFuZ2UgZm9ybWF0dGVyc1xuXG4gICAgICAgICAgICAke2FycmF5VG9MaXN0KHBhY2thZ2VSZXN1bHRzLnJhbmdlLm1hcChwID0+IHAubmFtZSkpfVxuICAgICAgICAgICAgYCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBhY2thZ2VSZXN1bHRzLmZpbGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2VjdGlvbnMucHVzaChkZWRlbnRgXG4gICAgICAgICAgICAjIyMgRmlsZSBmb3JtYXR0ZXJzXG5cbiAgICAgICAgICAgICR7YXJyYXlUb0xpc3QocGFja2FnZVJlc3VsdHMub25TYXZlLm1hcChwID0+IHAubmFtZSkpfVxuICAgICAgICAgICAgYCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBhY2thZ2VSZXN1bHRzLm9uU2F2ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzZWN0aW9ucy5wdXNoKGRlZGVudGBcbiAgICAgICAgICAgICMjIyBPbi1zYXZlIGZvcm1hdHRlcnNcblxuICAgICAgICAgICAgJHthcnJheVRvTGlzdChwYWNrYWdlUmVzdWx0cy5vblNhdmUubWFwKHAgPT4gcC5uYW1lKSl9XG4gICAgICAgICAgICBgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocGFja2FnZVJlc3VsdHMuZmlsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzZWN0aW9ucy5wdXNoKGRlZGVudGBcbiAgICAgICAgICAgICMjIyBPbi10eXBlIGZvcm1hdHRlcnNcblxuICAgICAgICAgICAgJHthcnJheVRvTGlzdChwYWNrYWdlUmVzdWx0cy5vblR5cGUubWFwKHAgPT4gcC5uYW1lKSl9XG4gICAgICAgICAgICBgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgcHJvdmlkZXJzID0ge1xuICAgICAgICAgICAgcmFuZ2U6IHRoaXMucHJvdmlkZXJzLnJhbmdlLmdldEFsbFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpLFxuICAgICAgICAgICAgZmlsZTogdGhpcy5wcm92aWRlcnMuZmlsZS5nZXRBbGxQcm92aWRlcnNGb3JFZGl0b3IoZWRpdG9yKSxcbiAgICAgICAgICAgIG9uU2F2ZTogdGhpcy5wcm92aWRlcnMub25TYXZlLmdldEFsbFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpLFxuICAgICAgICAgICAgb25UeXBlOiB0aGlzLnByb3ZpZGVycy5vblR5cGUuZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbGV0IGdldFBhY2thZ2VzRm9yUHJvdmlkZXJzID0gKHByb3ZpZGVyczogdW5rbm93bltdKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByZXR1cm4gcHJvdmlkZXJzLm1hcChwID0+IGF0b20ucGFja2FnZXMucGFja2FnZUZvclNlcnZpY2UocCkpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZSBleHBlcmltZW50YWwgQVBJXG4gICAgICAgICAgaWYgKHR5cGVvZiBhdG9tLnBhY2thZ2VzPy5wYWNrYWdlRm9yU2VydmljZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgbGV0IHBhY2thZ2VzID0ge1xuICAgICAgICAgICAgICByYW5nZTogZ2V0UGFja2FnZXNGb3JQcm92aWRlcnMocHJvdmlkZXJzLnJhbmdlKSxcbiAgICAgICAgICAgICAgZmlsZTogZ2V0UGFja2FnZXNGb3JQcm92aWRlcnMocHJvdmlkZXJzLmZpbGUpLFxuICAgICAgICAgICAgICBvblNhdmU6IGdldFBhY2thZ2VzRm9yUHJvdmlkZXJzKHByb3ZpZGVycy5vblNhdmUpLFxuICAgICAgICAgICAgICBvblR5cGU6IGdldFBhY2thZ2VzRm9yUHJvdmlkZXJzKHByb3ZpZGVycy5vblR5cGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1BBQ0tBR0VTISEhJywgcGFja2FnZXMpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHNlY3Rpb25zLnVuc2hpZnQoZGVkZW50YFxuICAgICAgICAgICMjIyBBY3RpdmUgcHJvdmlkZXJzIGluIHRoaXMgZWRpdG9yXG5cbiAgICAgICAgICAqIFJhbmdlOiAke3Byb3ZpZGVycy5yYW5nZS5sZW5ndGh9XG4gICAgICAgICAgKiBGaWxlOiAke3Byb3ZpZGVycy5maWxlLmxlbmd0aH1cbiAgICAgICAgICAqIE9uLXNhdmU6ICR7cHJvdmlkZXJzLm9uU2F2ZS5sZW5ndGh9XG4gICAgICAgICAgKiBPbi10eXBlOiAke3Byb3ZpZGVycy5vblR5cGUubGVuZ3RofVxuICAgICAgICAgIGApO1xuXG4gICAgICAgICAgbGV0IG1hcmtkb3duID0gc2VjdGlvbnMuam9pbignXFxuXFxuJyk7XG5cbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQ29kZSBmb3JtYXR0aW5nIHBhY2thZ2VzYCwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IG1hcmtkb3duXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICksXG5cbiAgICAgIC8vIFdhdGNoIGFsbCBlZGl0b3JzXG4gICAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoXG4gICAgICAgIChlZGl0b3IpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy53YXRjaGVkRWRpdG9ycy5oYXMoZWRpdG9yKSkgcmV0dXJuO1xuICAgICAgICAgIHRoaXMud2F0Y2hlZEVkaXRvcnMuYWRkKGVkaXRvcik7XG5cbiAgICAgICAgICBsZXQgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuXG4gICAgICAgICAgbGV0IGVkaXRvclN1YnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZShcbiAgICAgICAgICAgIC8vIEZvcm1hdCBvbiB0eXBlLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRPRE86IFByb2JhYmx5IGJldHRlciBub3QgdG8gYXR0YWNoIHRoaXMgc3Vic2NyaXB0aW9uIGF0IGFsbCBpblxuICAgICAgICAgICAgLy8gdGhlIGNvbW1vbiBjYXNlIHRoYXQgc29tZW9uZSB3aWxsIGRpc2FibGUgdGhpcyBzZXR0aW5nLlxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU3RvcENoYW5naW5nKGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWdldEZvcm1hdE9uVHlwZShlZGl0b3IpKSByZXR1cm47XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5mb3JtYXRDb2RlT25UeXBlSW5UZXh0RWRpdG9yKGVkaXRvciwgZXZlbnQpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBmb3JtYXQgY29kZSBvbiB0eXBlOmAsIGVycik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKCF0aGlzLndhdGNoZWRCdWZmZXJzLmhhcyhidWZmZXIpKSB7XG4gICAgICAgICAgICBlZGl0b3JTdWJzLmFkZChcbiAgICAgICAgICAgICAgLy8gRm9ybWF0IG9uIHNhdmUuIEZvcm1hdHRlcnMgYXJlIGFwcGxpZWQgYmVmb3JlIHRoZSBidWZmZXIgaXNcbiAgICAgICAgICAgICAgLy8gc2F2ZWQ7IGJlY2F1c2Ugd2UgcmV0dXJuIGEgcHJvbWlzZSBoZXJlLCBjb21taXR0aW5nIHRvIGRpc2sgd2lsbFxuICAgICAgICAgICAgICAvLyBiZSBkZWZlcnJlZCB1bnRpbCB0aGUgcHJvbWlzZSByZXNvbHZlcy5cbiAgICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLm9uV2lsbFNhdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZ2V0Rm9ybWF0T25TYXZlKGVkaXRvcikpIHJldHVybjtcbiAgICAgICAgICAgICAgICBsZXQgcGlwZWxpbmUgPSBhd2FpdCB0aGlzLmZvcm1hdENvZGVPblNhdmVJblRleHRFZGl0b3IoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgYXdhaXQgYXBwbHlDb2RlRm9ybWF0UGlwZWxpbmVUb0VkaXRvcihwaXBlbGluZSwgZWRpdG9yKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChpc0Vycm9yV2l0aERldGFpbChlcnIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIGZvcm1hdCBjb2RlOiAke2Vyci5tZXNzYWdlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgeyBkZXRhaWw6IGVyci5kZXRhaWwgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMud2F0Y2hlZEJ1ZmZlcnMuYWRkKGJ1ZmZlcik7XG4gICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiBlZGl0b3JTdWJzLmRpc3Bvc2UoKSk7XG4gICAgICAgIH1cbiAgICAgIClcbiAgICApO1xuXG4gICAgdGhpcy5wcm92aWRlcnMgPSB7XG4gICAgICByYW5nZTogbmV3IFByb3ZpZGVyUmVnaXN0cnkoKSxcbiAgICAgIGZpbGU6IG5ldyBQcm92aWRlclJlZ2lzdHJ5KCksXG4gICAgICBvblR5cGU6IG5ldyBQcm92aWRlclJlZ2lzdHJ5KCksXG4gICAgICBvblNhdmU6IG5ldyBQcm92aWRlclJlZ2lzdHJ5KClcbiAgICB9O1xuICB9XG5cbiAgZm9ybWF0Q29kZUluVGV4dEVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHNlbGVjdGlvblJhbmdlOiBSYW5nZSB8IG51bGwgPSBudWxsKSB7XG4gICAgc2VsZWN0aW9uUmFuZ2UgPz89IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XG5cbiAgICBsZXQgcGlwZWxpbmU6IENvZGVGb3JtYXRTdGVwW10gPSBbXTtcblxuICAgIC8vIFJhbmdlIHByb3ZpZGVycy5cbiAgICBsZXQgcmFuZ2VQcm92aWRlcnMgPSBbLi4udGhpcy5wcm92aWRlcnMucmFuZ2UuZ2V0Q29uZmlndXJlZFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpXTtcblxuICAgIC8vIEZpbGUgcHJvdmlkZXJzLlxuICAgIGxldCBmaWxlUHJvdmlkZXJzOiBGaWxlQ29kZUZvcm1hdFByb3ZpZGVyW10gPSBbXTtcbiAgICBpZiAoc2VsZWN0aW9uUmFuZ2UuaXNFbXB0eSgpKSB7XG4gICAgICBmaWxlUHJvdmlkZXJzID0gWy4uLnRoaXMucHJvdmlkZXJzLmZpbGUuZ2V0Q29uZmlndXJlZFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpXTtcbiAgICB9XG5cbiAgICBpZiAoc2VsZWN0aW9uUmFuZ2UuaXNFbXB0eSgpICYmIGZpbGVQcm92aWRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgcHJvdmlkZXIgb2YgZmlsZVByb3ZpZGVycykge1xuICAgICAgICBwaXBlbGluZS5wdXNoKGFzeW5jICgpID0+IGF3YWl0IHByb3ZpZGVyLmZvcm1hdEVudGlyZUZpbGUoZWRpdG9yKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGlwZWxpbmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFwcGx5IGNvZGUgZm9ybWF0dGVycyBpbiBvcmRlci5cbiAgICAgIGZvciAobGV0IHByb3ZpZGVyIG9mIHJhbmdlUHJvdmlkZXJzKSB7XG4gICAgICAgIHBpcGVsaW5lLnB1c2goXG4gICAgICAgICAgYXN5bmMgKGVkaXRvcjogVGV4dEVkaXRvciwgcmFuZ2U/OiBSYW5nZSkgPT4ge1xuICAgICAgICAgICAgcmFuZ2UgPz89IGVkaXRvci5nZXRCdWZmZXIoKS5nZXRSYW5nZSgpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHByb3ZpZGVyLmZvcm1hdENvZGUoZWRpdG9yLCByYW5nZSk7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBpcGVsaW5lO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZvcm1hdENvZGVPblR5cGVJblRleHRFZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yLCB7IGNoYW5nZXMgfTogQnVmZmVyU3RvcHBlZENoYW5naW5nRXZlbnQpIHtcbiAgICAvLyBCYWlsIGlmIHRoZXJlJ3MgbW9yZSB0aGFuIG9uZSBjdXJzb3IuXG4gICAgaWYgKGNoYW5nZXMubGVuZ3RoID4gMSkgcmV0dXJuIFtdO1xuXG4gICAgLy8gQmFpbCBpZiB3ZSBoYXZlIG5vIHByb3ZpZGVycy5cbiAgICBsZXQgcHJvdmlkZXJzID0gWy4uLnRoaXMucHJvdmlkZXJzLm9uVHlwZS5nZXRDb25maWd1cmVkUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcildO1xuICAgIGlmIChwcm92aWRlcnMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG5cbiAgICBsZXQgW2NoYW5nZV0gPSBjaGFuZ2VzO1xuICAgIGlmICghc2hvdWxkRm9ybWF0T25UeXBlKGNoYW5nZSkpIHJldHVybiBbXTtcblxuICAgIC8vIEluIHRoZSBjYXNlIG9mIGJyYWNrZXQtbWF0Y2hpbmcsIHdlIHVzZSB0aGUgbGFzdCBjaGFyYWN0ZXIgYmVjYXVzZVxuICAgIC8vIHRoYXQncyB0aGUgY2hhcmFjdGVyIHRoYXQgd2lsbCB1c3VhbGx5IGNhdXNlIGEgcmVmb3JtYXQgKGkuZS4gYH1gXG4gICAgLy8gaW5zdGVhZCBvZiBge2ApLlxuICAgIGNvbnN0IGNoYXJhY3RlciA9IGNoYW5nZS5uZXdUZXh0W2NoYW5nZS5uZXdUZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgY29uc3QgY29udGVudHMgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkuY29weSgpO1xuXG4gICAgLy8gVGhlIGJyYWNrZXQtbWF0Y2hpbmcgcGFja2FnZSBiYXNpY2FsbHkgb3ZlcndyaXRlc1xuICAgIC8vXG4gICAgLy8gICAgIGVkaXRvci5pbnNlcnRUZXh0KCd7Jyk7XG4gICAgLy9cbiAgICAvLyB3aXRoXG4gICAgLy9cbiAgICAvLyAgICAgZWRpdG9yLmluc2VydFRleHQoJ3t9Jyk7XG4gICAgLy8gICAgIGN1cnNvci5tb3ZlTGVmdCgpO1xuICAgIC8vXG4gICAgLy8gV2Ugd2FudCB0byB3YWl0IHVudGlsIHRoZSBjdXJzb3IgaGFzIGFjdHVhbGx5IG1vdmVkIGJlZm9yZSB3ZSBpc3N1ZSBhXG4gICAgLy8gZm9ybWF0IHJlcXVlc3QsIHNvIHRoYXQgd2UgZm9ybWF0IGF0IHRoZSByaWdodCBwb3NpdGlvbiAoYW5kIHBvdGVudGlhbGx5XG4gICAgLy8gYWxzbyBsZXQgYW55IG90aGVyIGV2ZW50IGhhbmRsZXJzIGhhdmUgdGhlaXIgZ28pLlxuICAgIGNvbnN0IGFsbEVkaXRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBwcm92aWRlcnMubWFwKChwKSA9PiBwLmZvcm1hdEF0UG9zaXRpb24oZWRpdG9yLCBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSwgY2hhcmFjdGVyKSlcbiAgICApO1xuICAgIGNvbnN0IGZpcnN0Tm9uRW1wdHlJbmRleCA9IGFsbEVkaXRzLmZpbmRJbmRleCgoZWRpdHMpID0+IGVkaXRzLmxlbmd0aCA+IDApO1xuICAgIGlmIChmaXJzdE5vbkVtcHR5SW5kZXggPT09IC0xKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBlZGl0cyA9IGFsbEVkaXRzW2ZpcnN0Tm9uRW1wdHlJbmRleF07XG4gICAgY29uc3QgcHJvdmlkZXIgPSBwcm92aWRlcnNbZmlyc3ROb25FbXB0eUluZGV4XTtcbiAgICBjaGVja0NvbnRlbnRzQXJlU2FtZShjb250ZW50cywgZWRpdG9yLmdldFRleHQoKSk7XG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgbW9kaWZpY2F0aW9uIGlzIG5vdCBpbiBhIHRyYW5zYWN0aW9uLCBzbyBpdCBhcHBsaWVzIGFzIGFcbiAgICAvLyBzZXBhcmF0ZSBlZGl0aW5nIGV2ZW50IHRoYW4gdGhlIGNoYXJhY3RlciB0eXBpbmcuIFRoaXMgbWVhbnMgdGhhdCB5b3VcbiAgICAvLyBjYW4gdW5kbyBqdXN0IHRoZSBmb3JtYXR0aW5nIGJ5IGF0dGVtcHRpbmcgdG8gdW5kbyBvbmNlLCBhbmQgdGhlbiB1bmRvXG4gICAgLy8geW91ciBhY3R1YWwgY29kZSBieSB1bmRvaW5nIGFnYWluLlxuICAgIGlmICghYXBwbHlFZGl0c1RvT3BlbkVkaXRvcihlZGl0b3IsIGVkaXRzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGFwcGx5IGVkaXRzIHRvIHRleHQgYnVmZmVyLlwiKTtcbiAgICB9XG5cbiAgICBpZiAocHJvdmlkZXIua2VlcEN1cnNvclBvc2l0aW9uKSB7XG4gICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oY3Vyc29yUG9zaXRpb24pO1xuICAgIH1cbiAgICByZXR1cm4gZWRpdHM7XG4gIH1cblxuICBhc3luYyBmb3JtYXRDb2RlT25TYXZlSW5UZXh0RWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGlmICghZ2V0Rm9ybWF0T25TYXZlKGVkaXRvcikpIHJldHVybiBbXTtcbiAgICBsZXQgc2F2ZVByb3ZpZGVycyA9IFsuLi50aGlzLnByb3ZpZGVycy5vblNhdmUuZ2V0Q29uZmlndXJlZFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpXTtcbiAgICBjb25zdCBwaXBlbGluZTogQ29kZUZvcm1hdFN0ZXBbXSA9IFtdO1xuICAgIGZvciAobGV0IHByb3ZpZGVyIG9mIHNhdmVQcm92aWRlcnMpIHtcbiAgICAgIHBpcGVsaW5lLnB1c2goXG4gICAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYXdhaXQgcHJvdmlkZXIuZm9ybWF0T25TYXZlKGVkaXRvcik7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChwaXBlbGluZS5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIEZhbGwgYmFjayB0byBhIHJhbmdlIHByb3ZpZGVyICh3aXRoIHRoZSBlbnRpcmUgYnVmZmVyIGFzIHRoZSByYW5nZSkuXG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXRDb2RlSW5UZXh0RWRpdG9yKGVkaXRvciwgZWRpdG9yLmdldEJ1ZmZlcigpLmdldFJhbmdlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcGlwZWxpbmU7XG4gIH1cblxuICBhZGRSYW5nZVByb3ZpZGVyKHByb3ZpZGVyOiBSYW5nZUNvZGVGb3JtYXRQcm92aWRlcikge1xuICAgIGlmICghKCdmb3JtYXRDb2RlJyBpbiBwcm92aWRlcikpIHtcbiAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBwcm92aWRlcjonLCBwcm92aWRlcik7XG4gICAgICByZXR1cm47XG4gICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcHJvdmlkZXIhJyk7XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSB0aGlzLnByb3ZpZGVycy5yYW5nZS5hZGRQcm92aWRlcihwcm92aWRlcik7XG4gICAgY29uc29sZS5sb2coJ1Byb3ZpZGVyIGNvdW50IGZvciByYW5nZTonLCB0aGlzLnByb3ZpZGVycy5yYW5nZS5wcm92aWRlcnMubGVuZ3RoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYWRkRmlsZVByb3ZpZGVyKHByb3ZpZGVyOiBGaWxlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgaWYgKCEoJ2Zvcm1hdEVudGlyZUZpbGUnIGluIHByb3ZpZGVyKSkge1xuICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHByb3ZpZGVyOicsIHByb3ZpZGVyKTtcbiAgICAgIHJldHVybjtcbiAgICAgIC8vIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcm92aWRlciEnKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucHJvdmlkZXJzLmZpbGUuYWRkUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIGNvbnNvbGUubG9nKCdQcm92aWRlciBjb3VudCBmb3IgZmlsZTonLCB0aGlzLnByb3ZpZGVycy5maWxlLnByb3ZpZGVycy5sZW5ndGgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhZGRPblR5cGVQcm92aWRlcihwcm92aWRlcjogT25UeXBlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgaWYgKCEoJ2Zvcm1hdEF0UG9zaXRpb24nIGluIHByb3ZpZGVyKSkge1xuICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHByb3ZpZGVyOicsIHByb3ZpZGVyKTtcbiAgICAgIHJldHVybjtcbiAgICAgIC8vIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBwcm92aWRlciEnKTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucHJvdmlkZXJzLm9uVHlwZS5hZGRQcm92aWRlcihwcm92aWRlcik7XG4gICAgY29uc29sZS5sb2coJ1Byb3ZpZGVyIGNvdW50IGZvciBvblR5cGU6JywgdGhpcy5wcm92aWRlcnMub25UeXBlLnByb3ZpZGVycy5sZW5ndGgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhZGRPblNhdmVQcm92aWRlcihwcm92aWRlcjogT25TYXZlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgaWYgKCEoJ2Zvcm1hdE9uU2F2ZScgaW4gcHJvdmlkZXIpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgcHJvdmlkZXI6JywgcHJvdmlkZXIpO1xuICAgICAgcmV0dXJuO1xuICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHByb3ZpZGVyIScpO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5wcm92aWRlcnMub25TYXZlLmFkZFByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICBjb25zb2xlLmxvZygnUHJvdmlkZXIgY291bnQgZm9yIG9uU2F2ZTonLCB0aGlzLnByb3ZpZGVycy5vblNhdmUucHJvdmlkZXJzLmxlbmd0aCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRGb3JtYXRPblR5cGUoY2hhbmdlOiBCdWZmZXJTdG9wcGVkQ2hhbmdpbmdFdmVudFsnY2hhbmdlcyddWzBdKSB7XG4gIC8vIFRoZXJlJ3Mgbm90IGEgZGlyZWN0IHdheSB0byBmaWd1cmUgb3V0IHdoYXQgY2F1c2VkIHRoaXMgZWRpdCBldmVudC4gVGhlcmVcbiAgLy8gYXJlIHRocmVlIGNhc2VzIHRoYXQgd2Ugd2FudCB0byBwYXkgYXR0ZW50aW9uIHRvOlxuICAvL1xuICAvLyAxKSBUaGUgdXNlciB0eXBlZCBhIGNoYXJhY3Rlci5cbiAgLy8gMikgVGhlIHVzZXIgdHlwZWQgYSBjaGFyYWN0ZXIsIGFuZCBicmFja2V0LW1hdGNoaW5nIGtpY2tlZCBpbiwgY2F1c2luZ1xuICAvLyAgICB0aGVyZSB0byBiZSB0d28gY2hhcmFjdGVycyB0eXBlZC5cbiAgLy8gMykgVGhlIHVzZXIgcGFzdGVkIGEgc3RyaW5nLlxuICAvL1xuICAvLyBXZSBvbmx5IHdhbnQgdG8gdHJpZ2dlciBhdXRvZm9ybWF0dGluZyBpbiB0aGUgZmlyc3QgdHdvIGNhc2VzLiBIb3dldmVyLFxuICAvLyB3ZSBjYW4gb25seSBsb29rIGF0IHdoYXQgbmV3IHN0cmluZyB3YXMgaW5zZXJ0ZWQsIGFuZCBub3Qgd2hhdCBhY3R1YWxseVxuICAvLyBjYXVzZWQgdGhlIGV2ZW50LCBzbyB3ZSBqdXN0IHVzZSBzb21lIGhldXJpc3RpY3MgdG8gZGV0ZXJtaW5lIHdoaWNoIG9mXG4gIC8vIHRoZXNlIHRoZSBldmVudCBwcm9iYWJseSB3YXMgZGVwZW5kaW5nIG9uIHdoYXQgd2FzIHR5cGVkLiBUaGlzIG1lYW5zLCBmb3JcbiAgLy8gZXhhbXBsZSwgd2UgbWF5IGlzc3VlIHNwdXJpb3VzIGZvcm1hdCByZXF1ZXN0cyB3aGVuIHRoZSB1c2VyIHBhc3RlcyBhXG4gIC8vIHNpbmdsZSBjaGFyYWN0ZXIsIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUuXG4gIGlmIChjaGFuZ2Uub2xkVGV4dCAhPT0gXCJcIikge1xuICAgIC8vIFdlIGVpdGhlciBqdXN0IGRlbGV0ZWQgc29tZXRoaW5nIG9yIHJlcGxhY2VkIGEgc2VsZWN0aW9uLiBGb3IgdGhlIHRpbWVcbiAgICAvLyBiZWluZywgd2UncmUgbm90IGdvaW5nIHRvIGlzc3VlIGEgcmVmb3JtYXQgaW4gdGhhdCBjYXNlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIGlmIChjaGFuZ2UubmV3VGV4dCA9PT0gXCJcIikge1xuICAgIC8vIE5vdCBzdXJlIHdoYXQgaGFwcGVuZWQgaGVyZTsgd2h5IGRpZCB3ZSBnZXQgYW4gZXZlbnQgaW4gdGhpcyBjYXNlPyBCYWlsXG4gICAgLy8gZm9yIHNhZmV0eS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSBpZiAoY2hhbmdlLm5ld1RleHQubGVuZ3RoID4gMSAmJiAhaXNCcmFja2V0UGFpcihjaGFuZ2UubmV3VGV4dCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cblxuLy8gV2UgY2FuJ3QgdGVsbCB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGEgcGFzdGUgYW5kIHRoZSBicmFja2V0LW1hdGNoZXIgcGFja2FnZVxuLy8gaW5zZXJ0aW5nIGFuIGV4dHJhIGJyYWNrZXQsIHNvIHdlIGp1c3QgYXNzdW1lIHRoYXQgYW55IHBhaXIgb2YgYnJhY2tldHMgdGhhdFxuLy8gYGJyYWNrZXQtbWF0Y2hlcmAgcmVjb2duaXplcyB3YXMgYSBwYWlyIG1hdGNoZWQgYnkgdGhlIHBhY2thZ2UuXG5mdW5jdGlvbiBpc0JyYWNrZXRQYWlyKHR5cGVkVGV4dDogc3RyaW5nKSB7XG4gIGlmIChhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2UoXCJicmFja2V0LW1hdGNoZXJcIikgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB2YWxpZEJyYWNrZXRQYWlycyA9IGF0b20uY29uZmlnLmdldChcImJyYWNrZXQtbWF0Y2hlci5hdXRvY29tcGxldGVDaGFyYWN0ZXJzXCIpO1xuICByZXR1cm4gdmFsaWRCcmFja2V0UGFpcnMuaW5jbHVkZXModHlwZWRUZXh0KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tDb250ZW50c0FyZVNhbWUoYmVmb3JlOiBzdHJpbmcsIGFmdGVyOiBzdHJpbmcpIHtcbiAgaWYgKGJlZm9yZSAhPT0gYWZ0ZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZmlsZSBjb250ZW50cyB3ZXJlIGNoYW5nZWQgYmVmb3JlIGZvcm1hdHRpbmcgd2FzIGNvbXBsZXRlLlwiKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IENvZGVGb3JtYXRNYW5hZ2VyO1xuIl19