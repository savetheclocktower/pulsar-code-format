import { Point, Range, TextEditor } from "atom"
import { TextEdit } from "atom-ide-base"

export interface BaseCodeFormatProvider {
  priority: number
  grammarScopes: string[],
  keepCursorPosition?: boolean,
  packageName?: string
}

export interface FileCodeFormatProvider extends BaseCodeFormatProvider {
  formatEntireFile: (editor: TextEditor) => Promise<TextEdit[]>
}

export interface RangeCodeFormatProvider extends BaseCodeFormatProvider {
  formatCode: (editor: TextEditor, range: Range) => Promise<TextEdit[]>
}

export interface OnSaveCodeFormatProvider extends BaseCodeFormatProvider {
  formatOnSave: (editor: TextEditor) => Promise<TextEdit[]>
}

export interface OnTypeCodeFormatProvider extends BaseCodeFormatProvider {
  formatAtPosition: (editor: TextEditor, position: Point, character: string) => Promise<TextEdit[]>
}
