"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const code_format_manager_1 = __importDefault(require("./code-format-manager"));
const console = __importStar(require("./console"));
let codeFormatManager;
let subscriptions;
function activate() {
    console.log('[pulsar-code-format] activate!');
    subscriptions = new atom_1.CompositeDisposable();
    subscriptions.add(atom.config.observe('pulsar-code-format.advanced.enableDebugLogging', (newValue) => {
        console.setEnabled(newValue);
    }));
    codeFormatManager = new code_format_manager_1.default();
}
function deactivate() {
    subscriptions.dispose();
}
function consumeFileProvider(provider) {
    console.log('[pulsar-code-format] Adding file provider:', provider);
    return codeFormatManager.addFileProvider(provider);
}
function consumeRangeProvider(provider) {
    console.log('[pulsar-code-format] Adding range provider:', provider);
    return codeFormatManager.addRangeProvider(provider);
}
function consumeOnTypeProvider(provider) {
    console.log('[pulsar-code-format] Adding onType provider:', provider);
    return codeFormatManager.addOnTypeProvider(provider);
}
function consumeOnSaveProvider(provider) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBMkM7QUFDM0MsZ0ZBQXNEO0FBRXRELG1EQUFxQztBQUVyQyxJQUFJLGlCQUFvQyxDQUFDO0FBRXpDLElBQUksYUFBa0MsQ0FBQztBQUV2QyxTQUFTLFFBQVE7SUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDOUMsYUFBYSxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQztJQUMxQyxhQUFhLENBQUMsR0FBRyxDQUNmLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUNqQixnREFBZ0QsRUFDaEQsQ0FBQyxRQUFRLEVBQUUsRUFBRTtRQUNYLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUNGLENBQ0YsQ0FBQztJQUNGLGlCQUFpQixHQUFHLElBQUksNkJBQWlCLEVBQUUsQ0FBQztBQUM5QyxDQUFDO0FBRUQsU0FBUyxVQUFVO0lBQ2pCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMxQixDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxRQUFnQztJQUMzRCxPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BFLE9BQU8saUJBQWlCLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLFFBQWlDO0lBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsNkNBQTZDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckUsT0FBTyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxRQUFrQztJQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLDhDQUE4QyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3RFLE9BQU8saUJBQWlCLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkQsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsUUFBa0M7SUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4Q0FBOEMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RSxPQUFPLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFHRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsUUFBUTtJQUNSLFVBQVU7SUFDVixtQkFBbUI7SUFDbkIsb0JBQW9CO0lBQ3BCLHFCQUFxQjtJQUNyQixxQkFBcUI7Q0FDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJztcbmltcG9ydCBDb2RlRm9ybWF0TWFuYWdlciBmcm9tICcuL2NvZGUtZm9ybWF0LW1hbmFnZXInO1xuaW1wb3J0IHsgRmlsZUNvZGVGb3JtYXRQcm92aWRlciwgT25TYXZlQ29kZUZvcm1hdFByb3ZpZGVyLCBPblR5cGVDb2RlRm9ybWF0UHJvdmlkZXIsIFJhbmdlQ29kZUZvcm1hdFByb3ZpZGVyIH0gZnJvbSAnLi9wcm92aWRlcnMnO1xuaW1wb3J0ICogYXMgY29uc29sZSBmcm9tICcuL2NvbnNvbGUnO1xuXG5sZXQgY29kZUZvcm1hdE1hbmFnZXI6IENvZGVGb3JtYXRNYW5hZ2VyO1xuXG5sZXQgc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuZnVuY3Rpb24gYWN0aXZhdGUoKSB7XG4gIGNvbnNvbGUubG9nKCdbcHVsc2FyLWNvZGUtZm9ybWF0XSBhY3RpdmF0ZSEnKTtcbiAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gIHN1YnNjcmlwdGlvbnMuYWRkKFxuICAgIGF0b20uY29uZmlnLm9ic2VydmUoXG4gICAgICAncHVsc2FyLWNvZGUtZm9ybWF0LmFkdmFuY2VkLmVuYWJsZURlYnVnTG9nZ2luZycsXG4gICAgICAobmV3VmFsdWUpID0+IHtcbiAgICAgICAgY29uc29sZS5zZXRFbmFibGVkKG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICApXG4gICk7XG4gIGNvZGVGb3JtYXRNYW5hZ2VyID0gbmV3IENvZGVGb3JtYXRNYW5hZ2VyKCk7XG59XG5cbmZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xufVxuXG5mdW5jdGlvbiBjb25zdW1lRmlsZVByb3ZpZGVyKHByb3ZpZGVyOiBGaWxlQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gIGNvbnNvbGUubG9nKCdbcHVsc2FyLWNvZGUtZm9ybWF0XSBBZGRpbmcgZmlsZSBwcm92aWRlcjonLCBwcm92aWRlcik7XG4gIHJldHVybiBjb2RlRm9ybWF0TWFuYWdlci5hZGRGaWxlUHJvdmlkZXIocHJvdmlkZXIpO1xufVxuXG5mdW5jdGlvbiBjb25zdW1lUmFuZ2VQcm92aWRlcihwcm92aWRlcjogUmFuZ2VDb2RlRm9ybWF0UHJvdmlkZXIpIHtcbiAgY29uc29sZS5sb2coJ1twdWxzYXItY29kZS1mb3JtYXRdIEFkZGluZyByYW5nZSBwcm92aWRlcjonLCBwcm92aWRlcik7XG4gIHJldHVybiBjb2RlRm9ybWF0TWFuYWdlci5hZGRSYW5nZVByb3ZpZGVyKHByb3ZpZGVyKTtcbn1cblxuZnVuY3Rpb24gY29uc3VtZU9uVHlwZVByb3ZpZGVyKHByb3ZpZGVyOiBPblR5cGVDb2RlRm9ybWF0UHJvdmlkZXIpIHtcbiAgY29uc29sZS5sb2coJ1twdWxzYXItY29kZS1mb3JtYXRdIEFkZGluZyBvblR5cGUgcHJvdmlkZXI6JywgcHJvdmlkZXIpO1xuICByZXR1cm4gY29kZUZvcm1hdE1hbmFnZXIuYWRkT25UeXBlUHJvdmlkZXIocHJvdmlkZXIpO1xufVxuXG5mdW5jdGlvbiBjb25zdW1lT25TYXZlUHJvdmlkZXIocHJvdmlkZXI6IE9uU2F2ZUNvZGVGb3JtYXRQcm92aWRlcikge1xuICBjb25zb2xlLmxvZygnW3B1bHNhci1jb2RlLWZvcm1hdF0gQWRkaW5nIG9uU2F2ZSBwcm92aWRlcjonLCBwcm92aWRlcik7XG4gIHJldHVybiBjb2RlRm9ybWF0TWFuYWdlci5hZGRPblNhdmVQcm92aWRlcihwcm92aWRlcik7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjdGl2YXRlLFxuICBkZWFjdGl2YXRlLFxuICBjb25zdW1lRmlsZVByb3ZpZGVyLFxuICBjb25zdW1lUmFuZ2VQcm92aWRlcixcbiAgY29uc3VtZU9uVHlwZVByb3ZpZGVyLFxuICBjb25zdW1lT25TYXZlUHJvdmlkZXJcbn07XG4iXX0=