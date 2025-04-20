# pulsar-code-format

A pluggable code formatting package for Pulsar.

Designed to work with IDE packages in particular, but can support any code formatter.

## Avoiding conflicts with other packages

Depending on your language and ecosystem, there may be other packages that are automatically formatting your code as you type or as you save. This may vary on a project-by-project basis; sometimes it’s [ESLint](https://eslint.org/), sometimes it’s [Prettier](https://eslint.org/), sometimes it’s [Biome](https://biomejs.dev/).

Some of these tools can do code formatting through one of the `code-format` services — in which case this package can attempt to manage the order in which they run or pick a “winner” among them.

Others do their code formatting through different means, such as rewriting the file in place on disk after the save is complete. This is harder to detect and _much_ harder to untangle.

You are encouraged to use and customize the `pulsar-code-format.codeFormat` settings on a per-project basis as needed so that you can opt into our out of various behaviors.

For example, if you have a project you contribute to that uses ESLint, you’ll probably want to define a project-specific override using [atomic-management](https://web.pulsar-edit.dev/packages/atomic-management) like this:

```coffeescript
"*":
  "pulsar-code-format":
    "codeFormat":
      "onSave": false
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

## Commands

### `code-format:format-code`

Formats a file or selection. When the selection is empty, attempts to format the whole file; otherwise formats only what is selected.

### `code-format:list-providers-for-current-editor`

Lists how many of each sort of code formatter are active in the current editor, then shows a list of all packages that claim to provide one of the `code-format` services.
