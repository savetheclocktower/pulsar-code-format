import { CompositeDisposable } from 'atom';
import CodeFormatManager from './code-format-manager';
import { FileCodeFormatProvider, OnSaveCodeFormatProvider, OnTypeCodeFormatProvider, RangeCodeFormatProvider } from './providers';
import * as console from './console';

let codeFormatManager: CodeFormatManager;

let subscriptions: CompositeDisposable;

function activate() {
  console.log('[pulsar-code-format] activate!');
  subscriptions = new CompositeDisposable();
  subscriptions.add(
    atom.config.observe(
      'pulsar-code-format.advanced.enableDebugLogging',
      (newValue) => {
        console.setEnabled(newValue);
      }
    )
  );
  codeFormatManager = new CodeFormatManager();
}

function deactivate() {
  subscriptions.dispose();
}

function consumeFileProvider(provider: FileCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding file provider:', provider);
  return codeFormatManager.addFileProvider(provider);
}

function consumeRangeProvider(provider: RangeCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding range provider:', provider);
  return codeFormatManager.addRangeProvider(provider);
}

function consumeOnTypeProvider(provider: OnTypeCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding onType provider:', provider);
  return codeFormatManager.addOnTypeProvider(provider);
}

function consumeOnSaveProvider(provider: OnSaveCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding onSave provider:', provider);
  return codeFormatManager.addOnSaveProvider(provider);
}


module.exports = {
  activate,
  deactivate,
  consumeFileProvider,
  consumeRangeProvider,
  consumeOnTypeProvider,
  consumeOnSaveProvider
};
