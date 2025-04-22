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
exports.SAVE_TIMEOUT = void 0;
const atom_1 = require("atom");
const apply_edits_1 = require("./apply-edits");
const provider_registry_1 = __importDefault(require("./provider-registry"));
const dedent_1 = __importDefault(require("dedent"));
const console = __importStar(require("./console"));
function isErrorWithDetail(x) {
    if (!(x instanceof Error))
        return false;
    if (!('detail' in x) || typeof x.detail !== 'string')
        return false;
    return true;
}
// Save events are critical, so don't allow providers to block them.
exports.SAVE_TIMEOUT = 500;
function wait(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(r => setTimeout(r, ms));
    });
}
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
    return getScopedSettingsForKey(`pulsar-code-format.formatOnSave`, editor);
}
function getFormatOnType(editor) {
    return getScopedSettingsForKey(`pulsar-code-format.formatOnType`, editor);
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
        this.bufferModificationTimes = new WeakMap();
        this.subscriptions = new atom_1.CompositeDisposable(
        // A command to format the file or the selected code.
        atom.commands.add("atom-text-editor", "pulsar-code-format:format-code", (event) => __awaiter(this, void 0, void 0, function* () {
            const editorElement = event.currentTarget;
            const editor = editorElement.getModel();
            let selectionRange = editor.getSelectedBufferRange();
            if (selectionRange.isEmpty()) {
                selectionRange = editor.getBuffer().getRange();
            }
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
            var _a;
            let editorElement = event.currentTarget;
            let editor = editorElement.getModel();
            let packageResults = {
                range: [],
                file: [],
                onSave: [],
                onType: []
            };
            let allPackages = atom.packages.getActivePackages();
            // Search all packages to see which ones advertise themselves as
            // providing a `code-format.*` service.
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
            // Also look up the actual providers that have been registered with
            // us. We can't match these up to the packages they came from (yet),
            // but this will help indicate how many of these providers are
            // actually active in the current editor.
            let providers = {
                range: this.providers.range.getAllProvidersForEditor(editor),
                file: this.providers.file.getAllProvidersForEditor(editor),
                onSave: this.providers.onSave.getAllProvidersForEditor(editor),
                onType: this.providers.onType.getAllProvidersForEditor(editor)
            };
            // let getPackagesForProviders = (providers: unknown[]) => {
            //   // @ts-ignore
            //   return providers.map(p => atom.packages.packageForService(p));
            // };
            // @ts-ignore experimental API
            // if (typeof atom.packages?.packageForService === 'function') {
            //   let packages = {
            //     range: getPackagesForProviders(providers.range),
            //     file: getPackagesForProviders(providers.file),
            //     onSave: getPackagesForProviders(providers.onSave),
            //     onType: getPackagesForProviders(providers.onType)
            //   };
            // }
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
                // A simple versioning strategy: record buffer modification
                // timestamps so we know if they change while we're waiting for a
                // provider.
                //
                // The `onDidChange` callback fires very often, so we should not
                // do any more work in this callback than we absolutely have to.
                buffer.onDidChange(() => {
                    this.bufferModificationTimes.set(buffer, Date.now());
                }), 
                // Format on save. Formatters are applied before the buffer is
                // saved; because we return a promise here, committing to disk will
                // be deferred until the promise resolves.
                buffer.onWillSave(() => {
                    return Promise.race([
                        wait(exports.SAVE_TIMEOUT),
                        (() => __awaiter(this, void 0, void 0, function* () {
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
                        }))()
                    ]);
                }));
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
    // A wrapper around an arbitrary pipeline action. Will try to detect when a
    // code formatting result is stale and fail silently instead of doing
    // something destructive.
    guardVersion(fn) {
        return (editor, range) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let buffer = editor.getBuffer();
            let before = (_a = this.bufferModificationTimes.get(buffer)) !== null && _a !== void 0 ? _a : -1;
            let edits = yield fn(editor, range);
            let after = (_b = this.bufferModificationTimes.get(buffer)) !== null && _b !== void 0 ? _b : -1;
            if (before !== after) {
                console.warn("Warning: Code format provider failed to act because of a version mismatch.");
                return [];
            }
            return edits;
        });
    }
    formatCodeInTextEditor(editor, selectionRange = null) {
        selectionRange !== null && selectionRange !== void 0 ? selectionRange : (selectionRange = editor.getSelectedBufferRange());
        let pipeline = [];
        // Range providers.
        let rangeProviders = [...this.providers.range.getConfiguredProvidersForEditor(editor)];
        // File providers.
        let fileProviders = [];
        let isEntireFile = selectionRange.isEqual(editor.getBuffer().getRange());
        if (isEntireFile) {
            fileProviders = [...this.providers.file.getConfiguredProvidersForEditor(editor)];
        }
        if (isEntireFile && fileProviders.length > 0) {
            for (let provider of fileProviders) {
                pipeline.push(this.guardVersion((editor) => __awaiter(this, void 0, void 0, function* () { return yield provider.formatEntireFile(editor); })));
            }
            return pipeline;
        }
        else {
            // Apply code formatters in order.
            for (let provider of rangeProviders) {
                pipeline.push(this.guardVersion((editor, range) => __awaiter(this, void 0, void 0, function* () {
                    range !== null && range !== void 0 ? range : (range = editor.getBuffer().getRange());
                    return yield provider.formatCode(editor, range);
                })));
            }
            return pipeline;
        }
    }
    formatCodeOnTypeInTextEditor(editor_1, _a) {
        return __awaiter(this, arguments, void 0, function* (editor, { changes }) {
            // Bail if there's more than one cursor.
            if (changes.length > 1) {
                return [];
            }
            // Bail if we have no providers.
            let providers = [...this.providers.onType.getConfiguredProvidersForEditor(editor)];
            if (providers.length === 0) {
                return [];
            }
            let [change] = changes;
            if (!shouldFormatOnType(change)) {
                return [];
            }
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
                pipeline.push(this.guardVersion((editor) => __awaiter(this, void 0, void 0, function* () {
                    return yield provider.formatOnSave(editor);
                })));
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
        }
        let result = this.providers.range.addProvider(provider);
        console.log('Provider count for range:', this.providers.range.providers.length);
        return result;
    }
    addFileProvider(provider) {
        if (!('formatEntireFile' in provider)) {
            console.warn('Invalid provider:', provider);
            return;
        }
        let result = this.providers.file.addProvider(provider);
        console.log('Provider count for file:', this.providers.file.providers.length);
        return result;
    }
    addOnTypeProvider(provider) {
        if (!('formatAtPosition' in provider)) {
            console.warn('Invalid provider:', provider);
            return;
        }
        let result = this.providers.onType.addProvider(provider);
        console.log('Provider count for onType:', this.providers.onType.providers.length);
        return result;
    }
    addOnSaveProvider(provider) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1mb3JtYXQtbWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jb2RlLWZvcm1hdC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQThIO0FBRTlILCtDQUF1RDtBQUd2RCw0RUFBbUQ7QUFFbkQsb0RBQTRCO0FBQzVCLG1EQUFxQztBQU9yQyxTQUFTLGlCQUFpQixDQUFDLENBQVU7SUFDbkMsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLEtBQUssQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ3hDLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxNQUFNLEtBQUssUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ25FLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELG9FQUFvRTtBQUN2RCxRQUFBLFlBQVksR0FBRyxHQUFHLENBQUM7QUFFaEMsU0FBZSxJQUFJLENBQUMsRUFBVTs7UUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQUE7QUFFRCxTQUFTLFdBQVcsQ0FBQyxHQUFhO0lBQ2hDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNwQixPQUFPLEtBQUssSUFBSSxFQUFFLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hCLENBQUM7QUFFRCwwRUFBMEU7QUFDMUUsK0RBQStEO0FBQy9ELFNBQVMsdUJBQXVCLENBQWMsR0FBVyxFQUFFLE1BQWtCO0lBQzNFLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcs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aW1wb3J0IHsgQnVmZmVyU3RvcHBlZENoYW5naW5nRXZlbnQsIENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3BsYXlNYXJrZXIsIFBhY2thZ2UsIFJhbmdlLCBUZXh0QnVmZmVyLCBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSc7XG5cbmltcG9ydCB7IGFwcGx5RWRpdHNUb09wZW5FZGl0b3IgfSBmcm9tICcuL2FwcGx5LWVkaXRzJztcblxuaW1wb3J0IHsgVGV4dEVkaXQgfSBmcm9tICdhdG9tLWlkZS1iYXNlJztcbmltcG9ydCBQcm92aWRlclJlZ2lzdHJ5IGZyb20gJy4vcHJvdmlkZXItcmVnaXN0cnknO1xuaW1wb3J0IHsgRmlsZUNvZGVGb3JtYXRQcm92aWRlciwgT25TYXZlQ29kZUZvcm1hdFByb3ZpZGVyLCBPblR5cGVDb2RlRm9ybWF0UHJvdmlkZXIsIFJhbmdlQ29kZUZvcm1hdFByb3ZpZGVyIH0gZnJvbSAnLi9wcm92aWRlcnMnO1xuaW1wb3J0IGRlZGVudCBmcm9tICdkZWRlbnQnO1xuaW1wb3J0ICogYXMgY29uc29sZSBmcm9tICcuL2NvbnNvbGUnO1xuXG50eXBlIENvbmZpZ1NjaGVtYVR5cGUgPSAnYm9vbGVhbicgfCAnb2JqZWN0JyB8ICdhcnJheScgfCAnbnVtYmVyJyB8ICdzdHJpbmcnO1xudHlwZSBDb25maWdTY2hlbWE8VCA9IHVua25vd24+ID0geyB0eXBlOiBDb25maWdTY2hlbWFUeXBlLCBkZWZhdWx0OiBUOyB9O1xuXG50eXBlIEVycm9yV2l0aERldGFpbCA9IEVycm9yICYgeyBkZXRhaWw6IHN0cmluZzsgfTtcblxuZnVuY3Rpb24gaXNFcnJvcldpdGhEZXRhaWwoeDogdW5rbm93bik6IHggaXMgRXJyb3JXaXRoRGV0YWlsIHtcbiAgaWYgKCEoeCBpbnN0YW5jZW9mIEVycm9yKSkgcmV0dXJuIGZhbHNlO1xuICBpZiAoISgnZGV0YWlsJyBpbiB4KSB8fCB0eXBlb2YgeC5kZXRhaWwgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBTYXZlIGV2ZW50cyBhcmUgY3JpdGljYWwsIHNvIGRvbid0IGFsbG93IHByb3ZpZGVycyB0byBibG9jayB0aGVtLlxuZXhwb3J0IGNvbnN0IFNBVkVfVElNRU9VVCA9IDUwMDtcblxuYXN5bmMgZnVuY3Rpb24gd2FpdChtczogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPihyID0+IHNldFRpbWVvdXQociwgbXMpKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlUb0xpc3QoYXJyOiBzdHJpbmdbXSkge1xuICByZXR1cm4gYXJyLm1hcChpdGVtID0+IHtcbiAgICByZXR1cm4gYCogJHtpdGVtfWA7XG4gIH0pLmpvaW4oJ1xcbicpO1xufVxuXG4vLyBMb29rIHVwIHNjb3BlLXNwZWNpZmljIHNldHRpbmdzIGZvciBhIHBhcnRpY3VsYXIgZWRpdG9yLiBJZiBgZWRpdG9yYCBpc1xuLy8gYHVuZGVmaW5lZGAsIGl0J2xsIHJldHVybiBnZW5lcmFsIHNldHRpbmdzIGZvciB0aGUgc2FtZSBrZXkuXG5mdW5jdGlvbiBnZXRTY29wZWRTZXR0aW5nc0ZvcktleTxUID0gdW5rbm93bj4oa2V5OiBzdHJpbmcsIGVkaXRvcjogVGV4dEVkaXRvcik6IFQgfCBudWxsIHtcbiAgbGV0IHNjaGVtYSA9IGF0b20uY29uZmlnLmdldFNjaGVtYShrZXkpIGFzIENvbmZpZ1NjaGVtYTxUPjtcbiAgaWYgKCFzY2hlbWEpIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBjb25maWcga2V5OiAke3NjaGVtYX1gKTtcblxuICBsZXQgYmFzZSA9IGF0b20uY29uZmlnLmdldChrZXkpO1xuICBpZiAoIWVkaXRvcikgcmV0dXJuIGJhc2UgYXMgVDtcblxuICBsZXQgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gIGxldCBzY29wZWQgPSBhdG9tLmNvbmZpZy5nZXQoa2V5LCB7IHNjb3BlOiBbZ3JhbW1hci5zY29wZU5hbWVdIH0pO1xuXG4gIGlmIChzY2hlbWE/LnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHsgLi4uYmFzZSwgLi4uc2NvcGVkIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHNjb3BlZCA/PyBiYXNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEZvcm1hdE9uU2F2ZShlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgcmV0dXJuIGdldFNjb3BlZFNldHRpbmdzRm9yS2V5PGJvb2xlYW4+KGBwdWxzYXItY29kZS1mb3JtYXQuZm9ybWF0T25TYXZlYCwgZWRpdG9yKTtcbn1cblxuZnVuY3Rpb24gZ2V0Rm9ybWF0T25UeXBlKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICByZXR1cm4gZ2V0U2NvcGVkU2V0dGluZ3NGb3JLZXk8Ym9vbGVhbj4oYHB1bHNhci1jb2RlLWZvcm1hdC5mb3JtYXRPblR5cGVgLCBlZGl0b3IpO1xufVxuXG50eXBlIFByb3ZpZGVyUmVnaXN0cnlDb2xsZWN0aW9uID0ge1xuICByYW5nZTogUHJvdmlkZXJSZWdpc3RyeTxSYW5nZUNvZGVGb3JtYXRQcm92aWRlcj4sXG4gIGZpbGU6IFByb3ZpZGVyUmVnaXN0cnk8RmlsZUNvZGVGb3JtYXRQcm92aWRlcj4sXG4gIG9uVHlwZTogUHJvdmlkZXJSZWdpc3RyeTxPblR5cGVDb2RlRm9ybWF0UHJvdmlkZXI+LFxuICBvblNhdmU6IFByb3ZpZGVyUmVnaXN0cnk8T25TYXZlQ29kZUZvcm1hdFByb3ZpZGVyPjtcbn07XG5cbnR5cGUgQ29kZUZvcm1hdFN0ZXAgPSAoZWRpdG9yOiBUZXh0RWRpdG9yLCByYW5nZT86IFJhbmdlKSA9PiBQcm9taXNlPFRleHRFZGl0W10gfCBudWxsPjtcblxuLy8gQXBwbHkgYSBzZXJpZXMgb2YgZm9ybWF0dGVycyB0byB0aGUgZWRpdG9yIGluIGEgcGlwZWxpbmUgcGF0dGVybi4gRWFjaFxuLy8gZm9ybWF0dGVyIHJlY2VpdmVzIHRoZSBidWZmZXIgaW4gdGhlIHN0YXRlIGl0IHdhcyBsZWZ0IGluIGJ5IHRoZSBwcmV2aW91c1xuLy8gZm9ybWF0dGVyLlxuYXN5bmMgZnVuY3Rpb24gYXBwbHlDb2RlRm9ybWF0UGlwZWxpbmVUb0VkaXRvcihwaXBlbGluZTogQ29kZUZvcm1hdFN0ZXBbXSwgZWRpdG9yOiBUZXh0RWRpdG9yLCByYW5nZT86IFJhbmdlKSB7XG4gIGxldCBtYXJrZXI6IERpc3BsYXlNYXJrZXIgfCBudWxsID0gbnVsbDtcbiAgaWYgKHJhbmdlKSB7XG4gICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XG4gIH1cbiAgZm9yIChsZXQgc3RlcCBvZiBwaXBlbGluZSkge1xuICAgIGxldCBlZGl0cztcbiAgICBpZiAocmFuZ2UgJiYgbWFya2VyKSB7XG4gICAgICBlZGl0cyA9IGF3YWl0IHN0ZXAoZWRpdG9yLCBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVkaXRzID0gYXdhaXQgc3RlcChlZGl0b3IpO1xuICAgIH1cbiAgICBpZiAoIWVkaXRzKSBjb250aW51ZTtcbiAgICBsZXQgc3VjY2VzcyA9IGFwcGx5RWRpdHNUb09wZW5FZGl0b3IoZWRpdG9yLCBlZGl0cyk7XG4gICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgYXBwbHkgZWRpdHMhXCIpO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBDb2RlRm9ybWF0TWFuYWdlciB7XG4gIHByaXZhdGUgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgcHJpdmF0ZSBwcm92aWRlcnM6IFByb3ZpZGVyUmVnaXN0cnlDb2xsZWN0aW9uO1xuICBwcml2YXRlIHdhdGNoZWRFZGl0b3JzOiBXZWFrU2V0PFRleHRFZGl0b3I+ID0gbmV3IFdlYWtTZXQoKTtcbiAgcHJpdmF0ZSB3YXRjaGVkQnVmZmVyczogV2Vha1NldDxUZXh0QnVmZmVyPiA9IG5ldyBXZWFrU2V0KCk7XG5cbiAgcHJpdmF0ZSBidWZmZXJNb2RpZmljYXRpb25UaW1lczogV2Vha01hcDxUZXh0QnVmZmVyLCBudW1iZXI+ID0gbmV3IFdlYWtNYXAoKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZShcbiAgICAgIC8vIEEgY29tbWFuZCB0byBmb3JtYXQgdGhlIGZpbGUgb3IgdGhlIHNlbGVjdGVkIGNvZGUuXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgXCJhdG9tLXRleHQtZWRpdG9yXCIsXG4gICAgICAgIFwicHVsc2FyLWNvZGUtZm9ybWF0OmZvcm1hdC1jb2RlXCIsXG4gICAgICAgIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKTtcbiAgICAgICAgICBsZXQgc2VsZWN0aW9uUmFuZ2UgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xuICAgICAgICAgIGlmIChzZWxlY3Rpb25SYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAgIHNlbGVjdGlvblJhbmdlID0gZWRpdG9yLmdldEJ1ZmZlcigpLmdldFJhbmdlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBwaXBlbGluZSA9IHRoaXMuZm9ybWF0Q29kZUluVGV4dEVkaXRvcihlZGl0b3IsIHNlbGVjdGlvblJhbmdlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBwbHlDb2RlRm9ybWF0UGlwZWxpbmVUb0VkaXRvcihwaXBlbGluZSwgZWRpdG9yLCBzZWxlY3Rpb25SYW5nZSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyOiB1bmtub3duKSB7XG4gICAgICAgICAgICBpZiAoaXNFcnJvcldpdGhEZXRhaWwoZXJyKSkge1xuICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZhaWxlZCB0byBmb3JtYXQgY29kZTogJHtlcnIubWVzc2FnZX1gLFxuICAgICAgICAgICAgICAgIHsgZGV0YWlsOiBlcnIuZGV0YWlsIH1cbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICksXG5cbiAgICAgIC8vIEEgY29tbWFuZCB0byBsaXN0IHRoZSBhY3RpdmUgcHJvdmlkZXJzLlxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgIFwiYXRvbS10ZXh0LWVkaXRvclwiLFxuICAgICAgICBcInB1bHNhci1jb2RlLWZvcm1hdDpsaXN0LXByb3ZpZGVycy1mb3ItY3VycmVudC1lZGl0b3JcIixcbiAgICAgICAgYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgbGV0IGVkaXRvckVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgICAgICAgIGxldCBlZGl0b3IgPSBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCk7XG5cbiAgICAgICAgICBsZXQgcGFja2FnZVJlc3VsdHM6IHtcbiAgICAgICAgICAgIHJhbmdlOiBQYWNrYWdlW10sXG4gICAgICAgICAgICBmaWxlOiBQYWNrYWdlW10sXG4gICAgICAgICAgICBvblNhdmU6IFBhY2thZ2VbXSxcbiAgICAgICAgICAgIG9uVHlwZTogUGFja2FnZVtdO1xuICAgICAgICAgIH0gPSB7XG4gICAgICAgICAgICByYW5nZTogW10sXG4gICAgICAgICAgICBmaWxlOiBbXSxcbiAgICAgICAgICAgIG9uU2F2ZTogW10sXG4gICAgICAgICAgICBvblR5cGU6IFtdXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGxldCBhbGxQYWNrYWdlcyA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZXMoKTtcbiAgICAgICAgICAvLyBTZWFyY2ggYWxsIHBhY2thZ2VzIHRvIHNlZSB3aGljaCBvbmVzIGFkdmVydGlzZSB0aGVtc2VsdmVzIGFzXG4gICAgICAgICAgLy8gcHJvdmlkaW5nIGEgYGNvZGUtZm9ybWF0LipgIHNlcnZpY2UuXG4gICAgICAgICAgZm9yIChsZXQgcGFjayBvZiBhbGxQYWNrYWdlcykge1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB1bmRvY3VtZW50ZWRcbiAgICAgICAgICAgIGlmICghcGFjaz8ubWV0YWRhdGE/LnByb3ZpZGVkU2VydmljZXMpIGNvbnRpbnVlO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSB1bmRvY3VtZW50ZWRcbiAgICAgICAgICAgIGZvciAobGV0IHN2YyBvZiBPYmplY3Qua2V5cyhwYWNrLm1ldGFkYXRhLnByb3ZpZGVkU2VydmljZXMpKSB7XG4gICAgICAgICAgICAgIGlmICghc3ZjLnN0YXJ0c1dpdGgoJ2NvZGUtZm9ybWF0LicpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgaWYgKHN2Yy5lbmRzV2l0aCgnLnJhbmdlJykpIHtcbiAgICAgICAgICAgICAgICBwYWNrYWdlUmVzdWx0cy5yYW5nZS5wdXNoKHBhY2spO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN2Yy5lbmRzV2l0aCgnLmZpbGUnKSkge1xuICAgICAgICAgICAgICAgIHBhY2thZ2VSZXN1bHRzLmZpbGUucHVzaChwYWNrKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdmMuZW5kc1dpdGgoJy5vblNhdmUnKSkge1xuICAgICAgICAgICAgICAgIHBhY2thZ2VSZXN1bHRzLm9uU2F2ZS5wdXNoKHBhY2spO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN2Yy5lbmRzV2l0aCgnLm9uVHlwZScpKSB7XG4gICAgICAgICAgICAgICAgcGFja2FnZVJlc3VsdHMub25UeXBlLnB1c2gocGFjayk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgc2VjdGlvbnMgPSBbXTtcbiAgICAgICAgICBpZiAocGFja2FnZVJlc3VsdHMucmFuZ2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2VjdGlvbnMucHVzaChkZWRlbnRgXG4gICAgICAgICAgICAjIyMgUmFuZ2UgZm9ybWF0dGVyc1xuXG4gICAgICAgICAgICAke2FycmF5VG9MaXN0KHBhY2thZ2VSZXN1bHRzLnJhbmdlLm1hcChwID0+IHAubmFtZSkpfVxuICAgICAgICAgICAgYCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBhY2thZ2VSZXN1bHRzLmZpbGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc2VjdGlvbnMucHVzaChkZWRlbnRgXG4gICAgICAgICAgICAjIyMgRmlsZSBmb3JtYXR0ZXJzXG5cbiAgICAgICAgICAgICR7YXJyYXlUb0xpc3QocGFja2FnZVJlc3VsdHMub25TYXZlLm1hcChwID0+IHAubmFtZSkpfVxuICAgICAgICAgICAgYCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHBhY2thZ2VSZXN1bHRzLm9uU2F2ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzZWN0aW9ucy5wdXNoKGRlZGVudGBcbiAgICAgICAgICAgICMjIyBPbi1zYXZlIGZvcm1hdHRlcnNcblxuICAgICAgICAgICAgJHthcnJheVRvTGlzdChwYWNrYWdlUmVzdWx0cy5vblNhdmUubWFwKHAgPT4gcC5uYW1lKSl9XG4gICAgICAgICAgICBgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocGFja2FnZVJlc3VsdHMuZmlsZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzZWN0aW9ucy5wdXNoKGRlZGVudGBcbiAgICAgICAgICAgICMjIyBPbi10eXBlIGZvcm1hdHRlcnNcblxuICAgICAgICAgICAgJHthcnJheVRvTGlzdChwYWNrYWdlUmVzdWx0cy5vblR5cGUubWFwKHAgPT4gcC5uYW1lKSl9XG4gICAgICAgICAgICBgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBbHNvIGxvb2sgdXAgdGhlIGFjdHVhbCBwcm92aWRlcnMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCB3aXRoXG4gICAgICAgICAgLy8gdXMuIFdlIGNhbid0IG1hdGNoIHRoZXNlIHVwIHRvIHRoZSBwYWNrYWdlcyB0aGV5IGNhbWUgZnJvbSAoeWV0KSxcbiAgICAgICAgICAvLyBidXQgdGhpcyB3aWxsIGhlbHAgaW5kaWNhdGUgaG93IG1hbnkgb2YgdGhlc2UgcHJvdmlkZXJzIGFyZVxuICAgICAgICAgIC8vIGFjdHVhbGx5IGFjdGl2ZSBpbiB0aGUgY3VycmVudCBlZGl0b3IuXG4gICAgICAgICAgbGV0IHByb3ZpZGVycyA9IHtcbiAgICAgICAgICAgIHJhbmdlOiB0aGlzLnByb3ZpZGVycy5yYW5nZS5nZXRBbGxQcm92aWRlcnNGb3JFZGl0b3IoZWRpdG9yKSxcbiAgICAgICAgICAgIGZpbGU6IHRoaXMucHJvdmlkZXJzLmZpbGUuZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvciksXG4gICAgICAgICAgICBvblNhdmU6IHRoaXMucHJvdmlkZXJzLm9uU2F2ZS5nZXRBbGxQcm92aWRlcnNGb3JFZGl0b3IoZWRpdG9yKSxcbiAgICAgICAgICAgIG9uVHlwZTogdGhpcy5wcm92aWRlcnMub25UeXBlLmdldEFsbFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIC8vIGxldCBnZXRQYWNrYWdlc0ZvclByb3ZpZGVycyA9IChwcm92aWRlcnM6IHVua25vd25bXSkgPT4ge1xuICAgICAgICAgIC8vICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIC8vICAgcmV0dXJuIHByb3ZpZGVycy5tYXAocCA9PiBhdG9tLnBhY2thZ2VzLnBhY2thZ2VGb3JTZXJ2aWNlKHApKTtcbiAgICAgICAgICAvLyB9O1xuXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZSBleHBlcmltZW50YWwgQVBJXG4gICAgICAgICAgLy8gaWYgKHR5cGVvZiBhdG9tLnBhY2thZ2VzPy5wYWNrYWdlRm9yU2VydmljZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIC8vICAgbGV0IHBhY2thZ2VzID0ge1xuICAgICAgICAgIC8vICAgICByYW5nZTogZ2V0UGFja2FnZXNGb3JQcm92aWRlcnMocHJvdmlkZXJzLnJhbmdlKSxcbiAgICAgICAgICAvLyAgICAgZmlsZTogZ2V0UGFja2FnZXNGb3JQcm92aWRlcnMocHJvdmlkZXJzLmZpbGUpLFxuICAgICAgICAgIC8vICAgICBvblNhdmU6IGdldFBhY2thZ2VzRm9yUHJvdmlkZXJzKHByb3ZpZGVycy5vblNhdmUpLFxuICAgICAgICAgIC8vICAgICBvblR5cGU6IGdldFBhY2thZ2VzRm9yUHJvdmlkZXJzKHByb3ZpZGVycy5vblR5cGUpXG4gICAgICAgICAgLy8gICB9O1xuICAgICAgICAgIC8vIH1cblxuICAgICAgICAgIHNlY3Rpb25zLnVuc2hpZnQoZGVkZW50YFxuICAgICAgICAgICMjIyBBY3RpdmUgcHJvdmlkZXJzIGluIHRoaXMgZWRpdG9yXG5cbiAgICAgICAgICAqIFJhbmdlOiAke3Byb3ZpZGVycy5yYW5nZS5sZW5ndGh9XG4gICAgICAgICAgKiBGaWxlOiAke3Byb3ZpZGVycy5maWxlLmxlbmd0aH1cbiAgICAgICAgICAqIE9uLXNhdmU6ICR7cHJvdmlkZXJzLm9uU2F2ZS5sZW5ndGh9XG4gICAgICAgICAgKiBPbi10eXBlOiAke3Byb3ZpZGVycy5vblR5cGUubGVuZ3RofVxuICAgICAgICAgIGApO1xuXG4gICAgICAgICAgbGV0IG1hcmtkb3duID0gc2VjdGlvbnMuam9pbignXFxuXFxuJyk7XG5cbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQ29kZSBmb3JtYXR0aW5nIHBhY2thZ2VzYCwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IG1hcmtkb3duXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICksXG5cbiAgICAgIC8vIFdhdGNoIGFsbCBlZGl0b3JzXG4gICAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMoXG4gICAgICAgIChlZGl0b3IpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy53YXRjaGVkRWRpdG9ycy5oYXMoZWRpdG9yKSkgcmV0dXJuO1xuICAgICAgICAgIHRoaXMud2F0Y2hlZEVkaXRvcnMuYWRkKGVkaXRvcik7XG5cbiAgICAgICAgICBsZXQgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuXG4gICAgICAgICAgbGV0IGVkaXRvclN1YnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZShcbiAgICAgICAgICAgIC8vIEZvcm1hdCBvbiB0eXBlLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRPRE86IFByb2JhYmx5IGJldHRlciBub3QgdG8gYXR0YWNoIHRoaXMgc3Vic2NyaXB0aW9uIGF0IGFsbCBpblxuICAgICAgICAgICAgLy8gdGhlIGNvbW1vbiBjYXNlIHRoYXQgc29tZW9uZSB3aWxsIGRpc2FibGUgdGhpcyBzZXR0aW5nLlxuICAgICAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU3RvcENoYW5naW5nKGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoIWdldEZvcm1hdE9uVHlwZShlZGl0b3IpKSByZXR1cm47XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5mb3JtYXRDb2RlT25UeXBlSW5UZXh0RWRpdG9yKGVkaXRvciwgZXZlbnQpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byBmb3JtYXQgY29kZSBvbiB0eXBlOmAsIGVycik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoIXRoaXMud2F0Y2hlZEJ1ZmZlcnMuaGFzKGJ1ZmZlcikpIHtcbiAgICAgICAgICAgIGVkaXRvclN1YnMuYWRkKFxuICAgICAgICAgICAgICAvLyBBIHNpbXBsZSB2ZXJzaW9uaW5nIHN0cmF0ZWd5OiByZWNvcmQgYnVmZmVyIG1vZGlmaWNhdGlvblxuICAgICAgICAgICAgICAvLyB0aW1lc3RhbXBzIHNvIHdlIGtub3cgaWYgdGhleSBjaGFuZ2Ugd2hpbGUgd2UncmUgd2FpdGluZyBmb3IgYVxuICAgICAgICAgICAgICAvLyBwcm92aWRlci5cbiAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgLy8gVGhlIGBvbkRpZENoYW5nZWAgY2FsbGJhY2sgZmlyZXMgdmVyeSBvZnRlbiwgc28gd2Ugc2hvdWxkIG5vdFxuICAgICAgICAgICAgICAvLyBkbyBhbnkgbW9yZSB3b3JrIGluIHRoaXMgY2FsbGJhY2sgdGhhbiB3ZSBhYnNvbHV0ZWx5IGhhdmUgdG8uXG4gICAgICAgICAgICAgIGJ1ZmZlci5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJNb2RpZmljYXRpb25UaW1lcy5zZXQoYnVmZmVyLCBEYXRlLm5vdygpKTtcbiAgICAgICAgICAgICAgfSksXG5cbiAgICAgICAgICAgICAgLy8gRm9ybWF0IG9uIHNhdmUuIEZvcm1hdHRlcnMgYXJlIGFwcGxpZWQgYmVmb3JlIHRoZSBidWZmZXIgaXNcbiAgICAgICAgICAgICAgLy8gc2F2ZWQ7IGJlY2F1c2Ugd2UgcmV0dXJuIGEgcHJvbWlzZSBoZXJlLCBjb21taXR0aW5nIHRvIGRpc2sgd2lsbFxuICAgICAgICAgICAgICAvLyBiZSBkZWZlcnJlZCB1bnRpbCB0aGUgcHJvbWlzZSByZXNvbHZlcy5cbiAgICAgICAgICAgICAgYnVmZmVyLm9uV2lsbFNhdmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgd2FpdChTQVZFX1RJTUVPVVQpLFxuICAgICAgICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFnZXRGb3JtYXRPblNhdmUoZWRpdG9yKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcGlwZWxpbmUgPSBhd2FpdCB0aGlzLmZvcm1hdENvZGVPblNhdmVJblRleHRFZGl0b3IoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBhcHBseUNvZGVGb3JtYXRQaXBlbGluZVRvRWRpdG9yKHBpcGVsaW5lLCBlZGl0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNFcnJvcldpdGhEZXRhaWwoZXJyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIGZvcm1hdCBjb2RlOiAke2Vyci5tZXNzYWdlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHsgZGV0YWlsOiBlcnIuZGV0YWlsIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KSgpXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLndhdGNoZWRCdWZmZXJzLmFkZChidWZmZXIpO1xuICAgICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gZWRpdG9yU3Vicy5kaXNwb3NlKCkpO1xuICAgICAgICB9XG4gICAgICApXG4gICAgKTtcblxuICAgIHRoaXMucHJvdmlkZXJzID0ge1xuICAgICAgcmFuZ2U6IG5ldyBQcm92aWRlclJlZ2lzdHJ5KCksXG4gICAgICBmaWxlOiBuZXcgUHJvdmlkZXJSZWdpc3RyeSgpLFxuICAgICAgb25UeXBlOiBuZXcgUHJvdmlkZXJSZWdpc3RyeSgpLFxuICAgICAgb25TYXZlOiBuZXcgUHJvdmlkZXJSZWdpc3RyeSgpXG4gICAgfTtcbiAgfVxuXG4gIC8vIEEgd3JhcHBlciBhcm91bmQgYW4gYXJiaXRyYXJ5IHBpcGVsaW5lIGFjdGlvbi4gV2lsbCB0cnkgdG8gZGV0ZWN0IHdoZW4gYVxuICAvLyBjb2RlIGZvcm1hdHRpbmcgcmVzdWx0IGlzIHN0YWxlIGFuZCBmYWlsIHNpbGVudGx5IGluc3RlYWQgb2YgZG9pbmdcbiAgLy8gc29tZXRoaW5nIGRlc3RydWN0aXZlLlxuICBndWFyZFZlcnNpb24oZm46IChlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlPzogUmFuZ2UpID0+IFByb21pc2U8VGV4dEVkaXRbXT4pIHtcbiAgICByZXR1cm4gYXN5bmMgKGVkaXRvcjogVGV4dEVkaXRvciwgcmFuZ2U/OiBSYW5nZSkgPT4ge1xuICAgICAgbGV0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgIGxldCBiZWZvcmUgPSB0aGlzLmJ1ZmZlck1vZGlmaWNhdGlvblRpbWVzLmdldChidWZmZXIpID8/IC0xO1xuICAgICAgbGV0IGVkaXRzID0gYXdhaXQgZm4oZWRpdG9yLCByYW5nZSk7XG4gICAgICBsZXQgYWZ0ZXIgPSB0aGlzLmJ1ZmZlck1vZGlmaWNhdGlvblRpbWVzLmdldChidWZmZXIpID8/IC0xO1xuICAgICAgaWYgKGJlZm9yZSAhPT0gYWZ0ZXIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiV2FybmluZzogQ29kZSBmb3JtYXQgcHJvdmlkZXIgZmFpbGVkIHRvIGFjdCBiZWNhdXNlIG9mIGEgdmVyc2lvbiBtaXNtYXRjaC5cIik7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlZGl0cztcbiAgICB9O1xuICB9XG5cbiAgZm9ybWF0Q29kZUluVGV4dEVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHNlbGVjdGlvblJhbmdlOiBSYW5nZSB8IG51bGwgPSBudWxsKSB7XG4gICAgc2VsZWN0aW9uUmFuZ2UgPz89IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XG5cbiAgICBsZXQgcGlwZWxpbmU6IENvZGVGb3JtYXRTdGVwW10gPSBbXTtcblxuICAgIC8vIFJhbmdlIHByb3ZpZGVycy5cbiAgICBsZXQgcmFuZ2VQcm92aWRlcnMgPSBbLi4udGhpcy5wcm92aWRlcnMucmFuZ2UuZ2V0Q29uZmlndXJlZFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpXTtcblxuICAgIC8vIEZpbGUgcHJvdmlkZXJzLlxuICAgIGxldCBmaWxlUHJvdmlkZXJzOiBGaWxlQ29kZUZvcm1hdFByb3ZpZGVyW10gPSBbXTtcbiAgICBsZXQgaXNFbnRpcmVGaWxlID0gc2VsZWN0aW9uUmFuZ2UuaXNFcXVhbChlZGl0b3IuZ2V0QnVmZmVyKCkuZ2V0UmFuZ2UoKSk7XG4gICAgaWYgKGlzRW50aXJlRmlsZSkge1xuICAgICAgZmlsZVByb3ZpZGVycyA9IFsuLi50aGlzLnByb3ZpZGVycy5maWxlLmdldENvbmZpZ3VyZWRQcm92aWRlcnNGb3JFZGl0b3IoZWRpdG9yKV07XG4gICAgfVxuXG4gICAgaWYgKGlzRW50aXJlRmlsZSAmJiBmaWxlUHJvdmlkZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IHByb3ZpZGVyIG9mIGZpbGVQcm92aWRlcnMpIHtcbiAgICAgICAgcGlwZWxpbmUucHVzaChcbiAgICAgICAgICB0aGlzLmd1YXJkVmVyc2lvbihcbiAgICAgICAgICAgIGFzeW5jIChlZGl0b3I6IFRleHRFZGl0b3IpID0+IGF3YWl0IHByb3ZpZGVyLmZvcm1hdEVudGlyZUZpbGUoZWRpdG9yKVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwaXBlbGluZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQXBwbHkgY29kZSBmb3JtYXR0ZXJzIGluIG9yZGVyLlxuICAgICAgZm9yIChsZXQgcHJvdmlkZXIgb2YgcmFuZ2VQcm92aWRlcnMpIHtcbiAgICAgICAgcGlwZWxpbmUucHVzaChcbiAgICAgICAgICB0aGlzLmd1YXJkVmVyc2lvbihcbiAgICAgICAgICAgIGFzeW5jIChlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlPzogUmFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgcmFuZ2UgPz89IGVkaXRvci5nZXRCdWZmZXIoKS5nZXRSYW5nZSgpO1xuICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgcHJvdmlkZXIuZm9ybWF0Q29kZShlZGl0b3IsIHJhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGlwZWxpbmU7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZm9ybWF0Q29kZU9uVHlwZUluVGV4dEVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHsgY2hhbmdlcyB9OiBCdWZmZXJTdG9wcGVkQ2hhbmdpbmdFdmVudCkge1xuICAgIC8vIEJhaWwgaWYgdGhlcmUncyBtb3JlIHRoYW4gb25lIGN1cnNvci5cbiAgICBpZiAoY2hhbmdlcy5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgLy8gQmFpbCBpZiB3ZSBoYXZlIG5vIHByb3ZpZGVycy5cbiAgICBsZXQgcHJvdmlkZXJzID0gWy4uLnRoaXMucHJvdmlkZXJzLm9uVHlwZS5nZXRDb25maWd1cmVkUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcildO1xuICAgIGlmIChwcm92aWRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGxldCBbY2hhbmdlXSA9IGNoYW5nZXM7XG4gICAgaWYgKCFzaG91bGRGb3JtYXRPblR5cGUoY2hhbmdlKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIC8vIEluIHRoZSBjYXNlIG9mIGJyYWNrZXQtbWF0Y2hpbmcsIHdlIHVzZSB0aGUgbGFzdCBjaGFyYWN0ZXIgYmVjYXVzZVxuICAgIC8vIHRoYXQncyB0aGUgY2hhcmFjdGVyIHRoYXQgd2lsbCB1c3VhbGx5IGNhdXNlIGEgcmVmb3JtYXQgKGkuZS4gYH1gXG4gICAgLy8gaW5zdGVhZCBvZiBge2ApLlxuICAgIGNvbnN0IGNoYXJhY3RlciA9IGNoYW5nZS5uZXdUZXh0W2NoYW5nZS5uZXdUZXh0Lmxlbmd0aCAtIDFdO1xuXG4gICAgY29uc3QgY29udGVudHMgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkuY29weSgpO1xuXG4gICAgLy8gVGhlIGJyYWNrZXQtbWF0Y2hpbmcgcGFja2FnZSBiYXNpY2FsbHkgb3ZlcndyaXRlc1xuICAgIC8vXG4gICAgLy8gICAgIGVkaXRvci5pbnNlcnRUZXh0KCd7Jyk7XG4gICAgLy9cbiAgICAvLyB3aXRoXG4gICAgLy9cbiAgICAvLyAgICAgZWRpdG9yLmluc2VydFRleHQoJ3t9Jyk7XG4gICAgLy8gICAgIGN1cnNvci5tb3ZlTGVmdCgpO1xuICAgIC8vXG4gICAgLy8gV2Ugd2FudCB0byB3YWl0IHVudGlsIHRoZSBjdXJzb3IgaGFzIGFjdHVhbGx5IG1vdmVkIGJlZm9yZSB3ZSBpc3N1ZSBhXG4gICAgLy8gZm9ybWF0IHJlcXVlc3QsIHNvIHRoYXQgd2UgZm9ybWF0IGF0IHRoZSByaWdodCBwb3NpdGlvbiAoYW5kIHBvdGVudGlhbGx5XG4gICAgLy8gYWxzbyBsZXQgYW55IG90aGVyIGV2ZW50IGhhbmRsZXJzIGhhdmUgdGhlaXIgZ28pLlxuICAgIGNvbnN0IGFsbEVkaXRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICBwcm92aWRlcnMubWFwKChwKSA9PiBwLmZvcm1hdEF0UG9zaXRpb24oZWRpdG9yLCBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSwgY2hhcmFjdGVyKSlcbiAgICApO1xuICAgIGNvbnN0IGZpcnN0Tm9uRW1wdHlJbmRleCA9IGFsbEVkaXRzLmZpbmRJbmRleCgoZWRpdHMpID0+IGVkaXRzLmxlbmd0aCA+IDApO1xuICAgIGlmIChmaXJzdE5vbkVtcHR5SW5kZXggPT09IC0xKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBlZGl0cyA9IGFsbEVkaXRzW2ZpcnN0Tm9uRW1wdHlJbmRleF07XG4gICAgY29uc3QgcHJvdmlkZXIgPSBwcm92aWRlcnNbZmlyc3ROb25FbXB0eUluZGV4XTtcbiAgICBjaGVja0NvbnRlbnRzQXJlU2FtZShjb250ZW50cywgZWRpdG9yLmdldFRleHQoKSk7XG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgbW9kaWZpY2F0aW9uIGlzIG5vdCBpbiBhIHRyYW5zYWN0aW9uLCBzbyBpdCBhcHBsaWVzIGFzIGFcbiAgICAvLyBzZXBhcmF0ZSBlZGl0aW5nIGV2ZW50IHRoYW4gdGhlIGNoYXJhY3RlciB0eXBpbmcuIFRoaXMgbWVhbnMgdGhhdCB5b3VcbiAgICAvLyBjYW4gdW5kbyBqdXN0IHRoZSBmb3JtYXR0aW5nIGJ5IGF0dGVtcHRpbmcgdG8gdW5kbyBvbmNlLCBhbmQgdGhlbiB1bmRvXG4gICAgLy8geW91ciBhY3R1YWwgY29kZSBieSB1bmRvaW5nIGFnYWluLlxuICAgIGlmICghYXBwbHlFZGl0c1RvT3BlbkVkaXRvcihlZGl0b3IsIGVkaXRzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGFwcGx5IGVkaXRzIHRvIHRleHQgYnVmZmVyLlwiKTtcbiAgICB9XG5cbiAgICBpZiAocHJvdmlkZXIua2VlcEN1cnNvclBvc2l0aW9uKSB7XG4gICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oY3Vyc29yUG9zaXRpb24pO1xuICAgIH1cbiAgICByZXR1cm4gZWRpdHM7XG4gIH1cblxuICBhc3luYyBmb3JtYXRDb2RlT25TYXZlSW5UZXh0RWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGlmICghZ2V0Rm9ybWF0T25TYXZlKGVkaXRvcikpIHJldHVybiBbXTtcbiAgICBsZXQgc2F2ZVByb3ZpZGVycyA9IFsuLi50aGlzLnByb3ZpZGVycy5vblNhdmUuZ2V0Q29uZmlndXJlZFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3IpXTtcbiAgICBjb25zdCBwaXBlbGluZTogQ29kZUZvcm1hdFN0ZXBbXSA9IFtdO1xuICAgIGZvciAobGV0IHByb3ZpZGVyIG9mIHNhdmVQcm92aWRlcnMpIHtcbiAgICAgIHBpcGVsaW5lLnB1c2goXG4gICAgICAgIHRoaXMuZ3VhcmRWZXJzaW9uKFxuICAgICAgICAgIGFzeW5jIChlZGl0b3I6IFRleHRFZGl0b3IpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBwcm92aWRlci5mb3JtYXRPblNhdmUoZWRpdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChwaXBlbGluZS5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIEZhbGwgYmFjayB0byBhIHJhbmdlIHByb3ZpZGVyICh3aXRoIHRoZSBlbnRpcmUgYnVmZmVyIGFzIHRoZSByYW5nZSkuXG4gICAgICByZXR1cm4gdGhpcy5mb3JtYXRDb2RlSW5UZXh0RWRpdG9yKGVkaXRvciwgZWRpdG9yLmdldEJ1ZmZlcigpLmdldFJhbmdlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcGlwZWxpbmU7XG4gIH1cblxuICBhZGRSYW5nZVByb3ZpZGVyKHByb3ZpZGVyOiBSYW5nZUNvZGVGb3JtYXRQcm92aWRlcikge1xuICAgIGlmICghKCdmb3JtYXRDb2RlJyBpbiBwcm92aWRlcikpIHtcbiAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBwcm92aWRlcjonLCBwcm92aWRlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSB0aGlzLnByb3ZpZGVycy5yYW5nZS5hZGRQcm92aWRlcihwcm92aWRlcik7XG4gICAgY29uc29sZS5sb2coJ1Byb3ZpZGVyIGNvdW50IGZvciByYW5nZTonLCB0aGlzLnByb3ZpZGVycy5yYW5nZS5wcm92aWRlcnMubGVuZ3RoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYWRkRmlsZVByb3ZpZGVyKHByb3ZpZGVyOiBGaWxlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgaWYgKCEoJ2Zvcm1hdEVudGlyZUZpbGUnIGluIHByb3ZpZGVyKSkge1xuICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHByb3ZpZGVyOicsIHByb3ZpZGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucHJvdmlkZXJzLmZpbGUuYWRkUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIGNvbnNvbGUubG9nKCdQcm92aWRlciBjb3VudCBmb3IgZmlsZTonLCB0aGlzLnByb3ZpZGVycy5maWxlLnByb3ZpZGVycy5sZW5ndGgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhZGRPblR5cGVQcm92aWRlcihwcm92aWRlcjogT25UeXBlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgaWYgKCEoJ2Zvcm1hdEF0UG9zaXRpb24nIGluIHByb3ZpZGVyKSkge1xuICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHByb3ZpZGVyOicsIHByb3ZpZGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IHRoaXMucHJvdmlkZXJzLm9uVHlwZS5hZGRQcm92aWRlcihwcm92aWRlcik7XG4gICAgY29uc29sZS5sb2coJ1Byb3ZpZGVyIGNvdW50IGZvciBvblR5cGU6JywgdGhpcy5wcm92aWRlcnMub25UeXBlLnByb3ZpZGVycy5sZW5ndGgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhZGRPblNhdmVQcm92aWRlcihwcm92aWRlcjogT25TYXZlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgaWYgKCEoJ2Zvcm1hdE9uU2F2ZScgaW4gcHJvdmlkZXIpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgcHJvdmlkZXI6JywgcHJvdmlkZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gdGhpcy5wcm92aWRlcnMub25TYXZlLmFkZFByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICBjb25zb2xlLmxvZygnUHJvdmlkZXIgY291bnQgZm9yIG9uU2F2ZTonLCB0aGlzLnByb3ZpZGVycy5vblNhdmUucHJvdmlkZXJzLmxlbmd0aCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRGb3JtYXRPblR5cGUoY2hhbmdlOiBCdWZmZXJTdG9wcGVkQ2hhbmdpbmdFdmVudFsnY2hhbmdlcyddWzBdKSB7XG4gIC8vIFRoZXJlJ3Mgbm90IGEgZGlyZWN0IHdheSB0byBmaWd1cmUgb3V0IHdoYXQgY2F1c2VkIHRoaXMgZWRpdCBldmVudC4gVGhlcmVcbiAgLy8gYXJlIHRocmVlIGNhc2VzIHRoYXQgd2Ugd2FudCB0byBwYXkgYXR0ZW50aW9uIHRvOlxuICAvL1xuICAvLyAxKSBUaGUgdXNlciB0eXBlZCBhIGNoYXJhY3Rlci5cbiAgLy8gMikgVGhlIHVzZXIgdHlwZWQgYSBjaGFyYWN0ZXIsIGFuZCBicmFja2V0LW1hdGNoaW5nIGtpY2tlZCBpbiwgY2F1c2luZ1xuICAvLyAgICB0aGVyZSB0byBiZSB0d28gY2hhcmFjdGVycyB0eXBlZC5cbiAgLy8gMykgVGhlIHVzZXIgcGFzdGVkIGEgc3RyaW5nLlxuICAvL1xuICAvLyBXZSBvbmx5IHdhbnQgdG8gdHJpZ2dlciBhdXRvZm9ybWF0dGluZyBpbiB0aGUgZmlyc3QgdHdvIGNhc2VzLiBIb3dldmVyLFxuICAvLyB3ZSBjYW4gb25seSBsb29rIGF0IHdoYXQgbmV3IHN0cmluZyB3YXMgaW5zZXJ0ZWQsIGFuZCBub3Qgd2hhdCBhY3R1YWxseVxuICAvLyBjYXVzZWQgdGhlIGV2ZW50LCBzbyB3ZSBqdXN0IHVzZSBzb21lIGhldXJpc3RpY3MgdG8gZGV0ZXJtaW5lIHdoaWNoIG9mXG4gIC8vIHRoZXNlIHRoZSBldmVudCBwcm9iYWJseSB3YXMgZGVwZW5kaW5nIG9uIHdoYXQgd2FzIHR5cGVkLiBUaGlzIG1lYW5zLCBmb3JcbiAgLy8gZXhhbXBsZSwgd2UgbWF5IGlzc3VlIHNwdXJpb3VzIGZvcm1hdCByZXF1ZXN0cyB3aGVuIHRoZSB1c2VyIHBhc3RlcyBhXG4gIC8vIHNpbmdsZSBjaGFyYWN0ZXIsIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUuXG4gIGlmIChjaGFuZ2Uub2xkVGV4dCAhPT0gXCJcIikge1xuICAgIC8vIFdlIGVpdGhlciBqdXN0IGRlbGV0ZWQgc29tZXRoaW5nIG9yIHJlcGxhY2VkIGEgc2VsZWN0aW9uLiBGb3IgdGhlIHRpbWVcbiAgICAvLyBiZWluZywgd2UncmUgbm90IGdvaW5nIHRvIGlzc3VlIGEgcmVmb3JtYXQgaW4gdGhhdCBjYXNlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIGlmIChjaGFuZ2UubmV3VGV4dCA9PT0gXCJcIikge1xuICAgIC8vIE5vdCBzdXJlIHdoYXQgaGFwcGVuZWQgaGVyZTsgd2h5IGRpZCB3ZSBnZXQgYW4gZXZlbnQgaW4gdGhpcyBjYXNlPyBCYWlsXG4gICAgLy8gZm9yIHNhZmV0eS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSBpZiAoY2hhbmdlLm5ld1RleHQubGVuZ3RoID4gMSAmJiAhaXNCcmFja2V0UGFpcihjaGFuZ2UubmV3VGV4dCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cblxuLy8gV2UgY2FuJ3QgdGVsbCB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGEgcGFzdGUgYW5kIHRoZSBicmFja2V0LW1hdGNoZXIgcGFja2FnZVxuLy8gaW5zZXJ0aW5nIGFuIGV4dHJhIGJyYWNrZXQsIHNvIHdlIGp1c3QgYXNzdW1lIHRoYXQgYW55IHBhaXIgb2YgYnJhY2tldHMgdGhhdFxuLy8gYGJyYWNrZXQtbWF0Y2hlcmAgcmVjb2duaXplcyB3YXMgYSBwYWlyIG1hdGNoZWQgYnkgdGhlIHBhY2thZ2UuXG5mdW5jdGlvbiBpc0JyYWNrZXRQYWlyKHR5cGVkVGV4dDogc3RyaW5nKSB7XG4gIGlmIChhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2UoXCJicmFja2V0LW1hdGNoZXJcIikgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCB2YWxpZEJyYWNrZXRQYWlycyA9IGF0b20uY29uZmlnLmdldChcImJyYWNrZXQtbWF0Y2hlci5hdXRvY29tcGxldGVDaGFyYWN0ZXJzXCIpO1xuICByZXR1cm4gdmFsaWRCcmFja2V0UGFpcnMuaW5jbHVkZXModHlwZWRUZXh0KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tDb250ZW50c0FyZVNhbWUoYmVmb3JlOiBzdHJpbmcsIGFmdGVyOiBzdHJpbmcpIHtcbiAgaWYgKGJlZm9yZSAhPT0gYWZ0ZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZmlsZSBjb250ZW50cyB3ZXJlIGNoYW5nZWQgYmVmb3JlIGZvcm1hdHRpbmcgd2FzIGNvbXBsZXRlLlwiKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IENvZGVGb3JtYXRNYW5hZ2VyO1xuIl19