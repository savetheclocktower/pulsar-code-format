import CodeFormatManager from './code-format-manager';
import { FileCodeFormatProvider, OnSaveCodeFormatProvider, OnTypeCodeFormatProvider, RangeCodeFormatProvider } from './providers';

let codeFormatManager: CodeFormatManager;

function activate () {
  console.log('[pulsar-code-format] activate!');
  codeFormatManager = new CodeFormatManager();
}

function consumeFileProvider (provider: FileCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding file provider:', provider);
  return codeFormatManager.addFileProvider(provider);
}

function consumeRangeProvider (provider: RangeCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding range provider:', provider);
  return codeFormatManager.addRangeProvider(provider);
}

function consumeOnTypeProvider (provider: OnTypeCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding onType provider:', provider);
  return codeFormatManager.addOnTypeProvider(provider);
}

function consumeOnSaveProvider (provider: OnSaveCodeFormatProvider) {
  console.log('[pulsar-code-format] Adding onSave provider:', provider);
  return codeFormatManager.addOnSaveProvider(provider);
}


module.exports = {
  activate,
  consumeFileProvider,
  consumeRangeProvider,
  consumeOnTypeProvider,
  consumeOnSaveProvider
};
