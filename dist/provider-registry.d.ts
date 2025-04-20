import { Disposable, TextEditor } from 'atom';
import { BaseCodeFormatProvider } from './providers';
export default class ProviderRegistry<TProvider extends BaseCodeFormatProvider = BaseCodeFormatProvider> {
    providers: TProvider[];
    addProvider(provider: TProvider): Disposable;
    removeProvider(provider: TProvider): void;
    getAllProvidersForEditor(editor: TextEditor): TProvider[];
    getConfiguredProvidersForEditor(editor: TextEditor): TProvider[];
    getFirstProviderForEditor(editor: TextEditor): TProvider | null;
}
