import { TextBuffer, TextEditor } from 'atom';
import { TextEdit } from "atom-ide-base";
export declare function applyEditsToOpenEditor(editor: TextEditor, edits: TextEdit[]): number;
export declare function applyEditsToUnopenBuffer(buffer: TextBuffer, edits: TextEdit[]): number;
