"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
function isEditorSupported(editor, provider) {
    var _a;
    return provider.grammarScopes.includes((_a = editor.getGrammar()) === null || _a === void 0 ? void 0 : _a.scopeName);
}
class ProviderRegistry {
    constructor() {
        this.providers = [];
    }
    addProvider(provider) {
        this.providers.push(provider);
        return new atom_1.Disposable(() => this.removeProvider(provider));
    }
    removeProvider(provider) {
        const index = this.providers.indexOf(provider);
        if (index > -1)
            this.providers.splice(index, 1);
    }
    getAllProvidersForEditor(editor) {
        return this.providers.filter(provider => {
            var _a;
            let result = isEditorSupported(editor, provider);
            console.log('Does provider support editor?', result, (_a = editor.getGrammar()) === null || _a === void 0 ? void 0 : _a.scopeName, provider.grammarScopes, provider);
            return result;
        });
    }
    getConfiguredProvidersForEditor(editor) {
        let useAll = atom.config.get('pulsar-code-format.useAllProviders');
        let providers = this.getAllProvidersForEditor(editor);
        if (providers.length === 0)
            return [];
        return useAll ? providers : [providers[0]];
    }
    getFirstProviderForEditor(editor) {
        for (let provider of this.getAllProvidersForEditor(editor))
            return provider;
        return null;
    }
}
exports.default = ProviderRegistry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXItcmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvcHJvdmlkZXItcmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBOEM7QUFHOUMsU0FBUyxpQkFBaUIsQ0FBbUMsTUFBa0IsRUFBRSxRQUFXOztJQUMxRixPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE1BQUEsTUFBTSxDQUFDLFVBQVUsRUFBRSwwQ0FBRSxTQUFTLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBRUQsTUFBcUIsZ0JBQWdCO0lBQXJDO1FBQ1MsY0FBUyxHQUFnQixFQUFFLENBQUM7SUFnQ3JDLENBQUM7SUE5QkMsV0FBVyxDQUFDLFFBQW1CO1FBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLE9BQU8sSUFBSSxpQkFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsY0FBYyxDQUFDLFFBQW1CO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsd0JBQXdCLENBQUMsTUFBa0I7UUFDekMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTs7WUFDdEMsSUFBSSxNQUFNLEdBQUcsaUJBQWlCLENBQVksTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUUsTUFBTSxFQUFFLE1BQUEsTUFBTSxDQUFDLFVBQVUsRUFBRSwwQ0FBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2SCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCwrQkFBK0IsQ0FBQyxNQUFrQjtRQUNoRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1FBQ25FLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3RDLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELHlCQUF5QixDQUFDLE1BQWtCO1FBQzFDLEtBQUssSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQztZQUN4RCxPQUFPLFFBQVEsQ0FBQztRQUNsQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQWpDRCxtQ0FpQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXNwb3NhYmxlLCBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSc7XG5pbXBvcnQgeyBCYXNlQ29kZUZvcm1hdFByb3ZpZGVyIH0gZnJvbSAnLi9wcm92aWRlcnMnO1xuXG5mdW5jdGlvbiBpc0VkaXRvclN1cHBvcnRlZDxUIGV4dGVuZHMgQmFzZUNvZGVGb3JtYXRQcm92aWRlcj4oZWRpdG9yOiBUZXh0RWRpdG9yLCBwcm92aWRlcjogVCkge1xuICByZXR1cm4gcHJvdmlkZXIuZ3JhbW1hclNjb3Blcy5pbmNsdWRlcyhlZGl0b3IuZ2V0R3JhbW1hcigpPy5zY29wZU5hbWUpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm92aWRlclJlZ2lzdHJ5PFRQcm92aWRlciBleHRlbmRzIEJhc2VDb2RlRm9ybWF0UHJvdmlkZXIgPSBCYXNlQ29kZUZvcm1hdFByb3ZpZGVyPiB7XG4gIHB1YmxpYyBwcm92aWRlcnM6IFRQcm92aWRlcltdID0gW107XG5cbiAgYWRkUHJvdmlkZXIocHJvdmlkZXI6IFRQcm92aWRlcikge1xuICAgIHRoaXMucHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB0aGlzLnJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyKSk7XG4gIH1cblxuICByZW1vdmVQcm92aWRlcihwcm92aWRlcjogVFByb3ZpZGVyKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLnByb3ZpZGVycy5pbmRleE9mKHByb3ZpZGVyKTtcbiAgICBpZiAoaW5kZXggPiAtMSkgdGhpcy5wcm92aWRlcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxuXG4gIGdldEFsbFByb3ZpZGVyc0ZvckVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5wcm92aWRlcnMuZmlsdGVyKHByb3ZpZGVyID0+IHtcbiAgICAgIGxldCByZXN1bHQgPSBpc0VkaXRvclN1cHBvcnRlZDxUUHJvdmlkZXI+KGVkaXRvciwgcHJvdmlkZXIpO1xuICAgICAgY29uc29sZS5sb2coJ0RvZXMgcHJvdmlkZXIgc3VwcG9ydCBlZGl0b3I/JywgcmVzdWx0LCBlZGl0b3IuZ2V0R3JhbW1hcigpPy5zY29wZU5hbWUsIHByb3ZpZGVyLmdyYW1tYXJTY29wZXMsIHByb3ZpZGVyKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb25maWd1cmVkUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IFRQcm92aWRlcltdIHtcbiAgICBsZXQgdXNlQWxsID0gYXRvbS5jb25maWcuZ2V0KCdwdWxzYXItY29kZS1mb3JtYXQudXNlQWxsUHJvdmlkZXJzJyk7XG4gICAgbGV0IHByb3ZpZGVycyA9IHRoaXMuZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcik7XG4gICAgaWYgKHByb3ZpZGVycy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgICByZXR1cm4gdXNlQWxsID8gcHJvdmlkZXJzIDogW3Byb3ZpZGVyc1swXV07XG4gIH1cblxuICBnZXRGaXJzdFByb3ZpZGVyRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGZvciAobGV0IHByb3ZpZGVyIG9mIHRoaXMuZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICByZXR1cm4gcHJvdmlkZXI7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==