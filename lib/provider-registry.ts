import { Disposable, TextEditor } from 'atom';
import { BaseCodeFormatProvider } from './providers';

function isEditorSupported<T extends BaseCodeFormatProvider>(editor: TextEditor, provider: T) {
  return provider.grammarScopes.includes(editor.getGrammar()?.scopeName);
}

export default class ProviderRegistry<TProvider extends BaseCodeFormatProvider = BaseCodeFormatProvider> {
  public providers: TProvider[] = [];

  addProvider(provider: TProvider) {
    this.providers.push(provider);
    return new Disposable(() => this.removeProvider(provider));
  }

  removeProvider(provider: TProvider) {
    const index = this.providers.indexOf(provider);
    if (index > -1) this.providers.splice(index, 1);
  }

  getAllProvidersForEditor(editor: TextEditor) {
    return this.providers.filter(provider => {
      let result = isEditorSupported<TProvider>(editor, provider);
      console.log('Does provider support editor?', result, editor.getGrammar()?.scopeName, provider.grammarScopes, provider);
      return result;
    });
  }

  getConfiguredProvidersForEditor(editor: TextEditor): TProvider[] {
    let useAll = atom.config.get('pulsar-code-format.useAllProviders');
    let providers = this.getAllProvidersForEditor(editor);
    if (providers.length === 0) return [];
    return useAll ? providers : [providers[0]];
  }

  getFirstProviderForEditor(editor: TextEditor) {
    for (let provider of this.getAllProvidersForEditor(editor))
      return provider;
    return null;
  }
}
