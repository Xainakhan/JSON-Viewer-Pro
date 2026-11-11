# JSON Viewer Pro

A lightweight Manifest V3 Chrome extension for viewing raw JSON as a clean, searchable, collapsible tree.

## Features

- Collapsible JSON tree with type-aware values
- Search keys and values with highlighted, expanded matches
- Copy key paths as dot paths, JSONPath, or optional-chaining paths
- Helpful invalid-JSON errors with positions
- Raw/pretty display, expand/collapse, and light/dark theme controls
- Format a raw-JSON page directly from the Chrome toolbar

## Screenshots

_Screenshots will be added as the viewer is built._

## Install

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this project folder.

## Usage

Open the extension viewer to paste JSON, or use the extension toolbar icon while a tab displays raw JSON.

## Project structure

```
json-viewer-pro/
├── manifest.json
├── background.js
├── src/
│   ├── shared/
│   ├── core/
│   ├── ui/
│   ├── pages/
│   └── content/
├── test/
└── README.md
```

## How it works

1. The viewer accepts pasted JSON or detects JSON in the current tab.
2. A parser validates the input and reports useful errors.
3. A lazy tree model renders only the nodes a user opens.
4. The UI searches, formats, and copies safe paths without injecting JSON as HTML.

## Roadmap

- Build the viewer page and JSON parser
- Add lazy tree rendering and path copying
- Add search, themes, and toolbar controls
- Add raw-tab formatting and automated tests

## License

This project is licensed under the [MIT License](LICENSE).
