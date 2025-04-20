import {TextBuffer, TextEditor} from 'atom';
import {TextEdit} from "atom-ide-base";

const MARKER_LAYERS_FOR_EDITORS = new WeakMap();
const MARKER_LAYERS_FOR_BUFFERS = new WeakMap();

function findOrCreateMarkerLayerForEditor(editor: TextEditor) {
  let layer = MARKER_LAYERS_FOR_EDITORS.get(editor);
  if (!layer) {
    layer = editor.addMarkerLayer({maintainHistory: true});
    MARKER_LAYERS_FOR_EDITORS.set(editor, layer);
  }
  return layer;
}

function findOrCreateMarkerLayerForBuffer(buffer: TextBuffer) {
  let layer = MARKER_LAYERS_FOR_BUFFERS.get(buffer);
  if (!layer) {
    layer = buffer.addMarkerLayer({maintainHistory: true});
    MARKER_LAYERS_FOR_BUFFERS.set(buffer, layer);
  }
  return layer;
}

// Applies the given edits to a `TextEditor` instance that is present in the
// workspace.
export function applyEditsToOpenEditor(editor: TextEditor, edits: TextEdit[]) {
  let buffer = editor.getBuffer();
  const checkpoint = buffer.createCheckpoint();
  try {
    let layer = findOrCreateMarkerLayerForEditor(editor);
    let markerMap = new Map();
    for (let edit of edits) {
      let marker = layer.markBufferRange(edit.oldRange);
      markerMap.set(edit, marker);
    }

    for (let edit of edits) {
      let marker = markerMap.get(edit);
      if (!marker) throw new Error(`Marker missing range!`);
      buffer.setTextInRange(marker.getBufferRange(), edit.newText);
    }
    buffer.groupChangesSinceCheckpoint(checkpoint);
    return checkpoint;
  } catch (err) {
    buffer.revertToCheckpoint(checkpoint);
    throw err;
  }
}

// Applies the given edits to a `TextBuffer` instance representing a file
// that is not currently open in the workspace.
export function applyEditsToUnopenBuffer(buffer: TextBuffer, edits: TextEdit[]) {
  const checkpoint = buffer.createCheckpoint();
  try {
    let layer = findOrCreateMarkerLayerForBuffer(buffer);
    let markerMap = new Map();
    for (let edit of edits) {
      let marker = layer.markRange(edit.oldRange);
      markerMap.set(edit, marker);
    }

    for (let edit of edits) {
      let marker = markerMap.get(edit);
      if (!marker) throw new Error(`Marker missing range!`);
      buffer.setTextInRange(marker.getRange(), edit.newText);
    }
    buffer.groupChangesSinceCheckpoint(checkpoint);
    return checkpoint;
  } catch (err) {
    buffer.revertToCheckpoint(checkpoint);
    throw err;
  }
}
