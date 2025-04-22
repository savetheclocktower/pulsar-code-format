# pulsar-code-format

A pluggable code formatting package for [Pulsar](https://pulsar-edit.dev). Relies on other packages to provide code-formatting strategies for various languages.

Designed to work with IDE packages in particular — packages whose names start with `pulsar-ide-` — but can support any code formatter.

## Usage

### Commands

#### `code-format:format-code`

Formats a file or selection. When the selection is empty, attempts to format the whole file; otherwise formats only what is selected.

Mapped to <kbd>Cmd-Shift-C</kbd> on macOS; <kbd>Ctrl-Shift-C</kbd> on Windows and Linux.

#### `code-format:list-providers-for-current-editor`

Lists how many of each sort of code formatter are active in the current editor, then shows a list of all packages that claim to provide one of the `code-format` services.

No keybinding; invoke it from the command palette.

### Config

- **Format On Save**: Whether to attempt to format code on save. Unchecked by default; enable it if your project does not have an existing package that does format-on-save.

- **Format On Type**: Whether to attempt to format code as you type. Unchecked by default; enable it if your IDE package offers it.

- **Use All Providers**: Determines how this package acts when more than one provider is available for a certain kind of code formatting. Defaults to unchecked, meaning only the provider with the highest priority “wins”; when checked, all providers are used, and priority simply determines the order in which they act. When multiple providers are used, they act in “pipeline” fashion, each one formatting the output of the last.

### Avoiding conflicts with other packages

There are a number of ways that existing Pulsar packages attempt to lint/format a file on save. To use JavaScript as an example: you might already be using [linter-eslint-node](https://web.pulsar-edit.dev/packages/linter-eslint-node) or [prettier-atom](https://web.pulsar-edit.dev/packages/prettier-atom).

For this reason, format-on-save behavior is disabled by default. You may want to enable it on a project-by-project basis; information about how to do that is included below.

Still, this package tries to be robust even in strange situations. Consider:

* You save a JavaScript file.
* This package asks a code formatting provider to tell us how to reformat the file and waits for the instructions.
* While it waits, the buffer is changed via some other source, like an ESLint automatic fix. The file is now different on disk.
* We receive the instructions from the provider. We now have no idea if those instructions are fresh; they might’ve been generated against the previous version of the buffer!
* So we’ll retry once — asking the provider a second time so we can be sure.
* If the same thing somehow happens again, we’ll give up instead of applying edits that may be stale.

After all, data integrity is more important than code formatting.

### Changing settings on a per-project basis

Code formatting conventions and toolchains often vary from project to project, so the settings in this package might need to vary on a per-project basis as well. A package like [atomic-management](https://web.pulsar-edit.dev/packages/atomic-management) can help you manage this complexity by defining project-specific settings.

For instance, you can disable this package’s format-on-save in projects where it isn’t necessary by adding the following config override to `.atom/config.cson` within your project:

```coffeescript
"*":
  "pulsar-code-format":
    "formatOnSave": false
```

You can also, for example, disable ESLint in projects where you want a `code-format.onSave` provider to be in charge:

```coffeescript
"*":
  "linter":
    "disabledProviders": [
      "ESLint (Node)"
    ],
  "pulsar-code-format":
    "formatOnSave": true
```

## Services

This package consumes the full suite of `code-format` services that are provided by many IDE packages:

### `code-format.file`

Formats an entire file.

### `code-format.range`

Formats an arbitrary range of a file.

### `code-format.onSave`

Automatically formats a file when saving.

### `code-format.onType`

Automatically formats a file as you type.
