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
            let result = isEditorSupported(editor, provider);
            // console.log(
            //   'Does provider support editor?',
            //   result,
            //   editor.getGrammar()?.scopeName,
            //   provider.grammarScopes,
            //   provider
            // );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXItcmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcHJvdmlkZXItcmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBOEM7QUFHOUMsU0FBUyxpQkFBaUIsQ0FBbUMsTUFBa0IsRUFBRSxRQUFXOztJQUMxRixPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE1BQUEsTUFBTSxDQUFDLFVBQVUsRUFBRSwwQ0FBRSxTQUFTLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBRUQsTUFBcUIsZ0JBQWdCO0lBQXJDO1FBQ1MsY0FBUyxHQUFnQixFQUFFLENBQUM7SUFzQ3JDLENBQUM7SUFwQ0MsV0FBVyxDQUFDLFFBQW1CO1FBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLE9BQU8sSUFBSSxpQkFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsY0FBYyxDQUFDLFFBQW1CO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsd0JBQXdCLENBQUMsTUFBa0I7UUFDekMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN0QyxJQUFJLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakQsZUFBZTtZQUNmLHFDQUFxQztZQUNyQyxZQUFZO1lBQ1osb0NBQW9DO1lBQ3BDLDRCQUE0QjtZQUM1QixhQUFhO1lBQ2IsS0FBSztZQUNMLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELCtCQUErQixDQUFDLE1BQWtCO1FBQ2hELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7UUFDbkUsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RELElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDO1lBQUUsT0FBTyxFQUFFLENBQUM7UUFDdEMsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRUQseUJBQXlCLENBQUMsTUFBa0I7UUFDMUMsS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDO1lBQ3hELE9BQU8sUUFBUSxDQUFDO1FBQ2xCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBdkNELG1DQXVDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERpc3Bvc2FibGUsIFRleHRFZGl0b3IgfSBmcm9tICdhdG9tJztcbmltcG9ydCB7IEJhc2VDb2RlRm9ybWF0UHJvdmlkZXIgfSBmcm9tICcuL3Byb3ZpZGVycyc7XG5cbmZ1bmN0aW9uIGlzRWRpdG9yU3VwcG9ydGVkPFQgZXh0ZW5kcyBCYXNlQ29kZUZvcm1hdFByb3ZpZGVyPihlZGl0b3I6IFRleHRFZGl0b3IsIHByb3ZpZGVyOiBUKSB7XG4gIHJldHVybiBwcm92aWRlci5ncmFtbWFyU2NvcGVzLmluY2x1ZGVzKGVkaXRvci5nZXRHcmFtbWFyKCk/LnNjb3BlTmFtZSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb3ZpZGVyUmVnaXN0cnk8VFByb3ZpZGVyIGV4dGVuZHMgQmFzZUNvZGVGb3JtYXRQcm92aWRlciA9IEJhc2VDb2RlRm9ybWF0UHJvdmlkZXI+IHtcbiAgcHVibGljIHByb3ZpZGVyczogVFByb3ZpZGVyW10gPSBbXTtcblxuICBhZGRQcm92aWRlcihwcm92aWRlcjogVFByb3ZpZGVyKSB7XG4gICAgdGhpcy5wcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHRoaXMucmVtb3ZlUHJvdmlkZXIocHJvdmlkZXIpKTtcbiAgfVxuXG4gIHJlbW92ZVByb3ZpZGVyKHByb3ZpZGVyOiBUUHJvdmlkZXIpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMucHJvdmlkZXJzLmluZGV4T2YocHJvdmlkZXIpO1xuICAgIGlmIChpbmRleCA+IC0xKSB0aGlzLnByb3ZpZGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG5cbiAgZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVycy5maWx0ZXIocHJvdmlkZXIgPT4ge1xuICAgICAgbGV0IHJlc3VsdCA9IGlzRWRpdG9yU3VwcG9ydGVkKGVkaXRvciwgcHJvdmlkZXIpO1xuICAgICAgLy8gY29uc29sZS5sb2coXG4gICAgICAvLyAgICdEb2VzIHByb3ZpZGVyIHN1cHBvcnQgZWRpdG9yPycsXG4gICAgICAvLyAgIHJlc3VsdCxcbiAgICAgIC8vICAgZWRpdG9yLmdldEdyYW1tYXIoKT8uc2NvcGVOYW1lLFxuICAgICAgLy8gICBwcm92aWRlci5ncmFtbWFyU2NvcGVzLFxuICAgICAgLy8gICBwcm92aWRlclxuICAgICAgLy8gKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb25maWd1cmVkUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcik6IFRQcm92aWRlcltdIHtcbiAgICBsZXQgdXNlQWxsID0gYXRvbS5jb25maWcuZ2V0KCdwdWxzYXItY29kZS1mb3JtYXQudXNlQWxsUHJvdmlkZXJzJyk7XG4gICAgbGV0IHByb3ZpZGVycyA9IHRoaXMuZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcik7XG4gICAgaWYgKHByb3ZpZGVycy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgICByZXR1cm4gdXNlQWxsID8gcHJvdmlkZXJzIDogW3Byb3ZpZGVyc1swXV07XG4gIH1cblxuICBnZXRGaXJzdFByb3ZpZGVyRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGZvciAobGV0IHByb3ZpZGVyIG9mIHRoaXMuZ2V0QWxsUHJvdmlkZXJzRm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICByZXR1cm4gcHJvdmlkZXI7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==