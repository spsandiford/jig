# jig

A browser-based JSON workbench for editing, exploring, transforming, and comparing JSON documents.

## Features

### Editor
A CodeMirror-powered JSON editor with syntax highlighting, real-time error detection, and a status bar showing document size and error count.

Toolbar actions:
- **Open File** — load a JSON file from disk
- **Format** — pretty-print the document
- **Minify** — compact the document to a single line
- **Repair** — auto-fix common JSON syntax errors
- **Copy** — copy the current content to the clipboard

### Tree
Browse the parsed JSON as an interactive tree. Selecting a node shows its path in the status bar.

### Transform
Apply [jq](https://jqlang.org/) expressions to the document using a WebAssembly jq engine. Results appear in a read-only output pane; the Transform output can also be copied from the toolbar.

### Compare
Side-by-side diff of two JSON documents. Differences are highlighted inline in both panes.

## Development

```bash
npm install
npm run dev       # start dev server
npm test          # run unit tests
npm run build     # production build
```

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev)
- [CodeMirror 6](https://codemirror.net/) — editor
- [jq-web](https://github.com/nicowillis/jq-web) — WebAssembly jq engine
- [jsondiffpatch](https://github.com/benjamine/jsondiffpatch) — JSON diffing
- [jsonrepair](https://github.com/josdejong/jsonrepair) — JSON repair
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — styling
