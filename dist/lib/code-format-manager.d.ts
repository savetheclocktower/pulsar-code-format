import { BufferStoppedChangingEvent, Range, TextEditor } from 'atom';
import { TextEdit } from 'atom-ide-base';
import { FileCodeFormatProvider, OnSaveCodeFormatProvider, OnTypeCodeFormatProvider, RangeCodeFormatProvider } from './providers';
export declare const SAVE_TIMEOUT = 500;
type CodeFormatStep = (editor: TextEditor, range?: Range) => Promise<TextEdit[] | null>;
declare class CodeFormatManager {
    private subscriptions;
    private providers;
    private watchedEditors;
    private watchedBuffers;
    private bufferModificationTimes;
    constructor();
    guardVersion(fn: (editor: TextEditor, range?: Range) => Promise<TextEdit[]>): (editor: TextEditor, range?: Range) => Promise<TextEdit[]>;
    formatCodeInTextEditor(editor: TextEditor, selectionRange?: Range | null): CodeFormatStep[];
    formatCodeOnTypeInTextEditor(editor: TextEditor, { changes }: BufferStoppedChangingEvent): Promise<TextEdit[]>;
    formatCodeOnSaveInTextEditor(editor: TextEditor): Promise<CodeFormatStep[]>;
    addRangeProvider(provider: RangeCodeFormatProvider): import("atom").Disposable | undefined;
    addFileProvider(provider: FileCodeFormatProvider): import("atom").Disposable | undefined;
    addOnTypeProvider(provider: OnTypeCodeFormatProvider): import("atom").Disposable | undefined;
    addOnSaveProvider(provider: OnSaveCodeFormatProvider): import("atom").Disposable | undefined;
    dispose(): void;
}
export default CodeFormatManager;
