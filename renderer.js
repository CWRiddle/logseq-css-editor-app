// Configure Monaco's base path for workers
self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'css' || label === 'scss' || label === 'less') {
            return './node_modules/monaco-editor/min/vs/language/css/css.worker.js';
        }
        return './node_modules/monaco-editor/min/vs/editor/editor.worker.js';
    }
};

class CellManager {
    constructor() {
        this.cells = [];
        this.editors = new Map(); // Store Monaco editor instances
        this.cellsList = document.getElementById('cellsList');
        this.template = document.getElementById('cellTemplate');
        this.saveButton = document.getElementById('saveButton');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File operations
        document.getElementById('newFileButton').addEventListener('click', () => this.newFile());
        document.getElementById('openButton').addEventListener('click', () => this.openFile());
        document.getElementById('saveButton').addEventListener('click', () => this.saveFile());
        document.getElementById('addCellButton').addEventListener('click', () => this.addCell());
    }

    createCellElement(cell) {
        const clone = this.template.content.cloneNode(true);
        const cellDiv = clone.querySelector('.cell');
        
        cellDiv.dataset.cellId = cell.id;
        const titleInput = cellDiv.querySelector('.cell-title');
        const editorContainer = cellDiv.querySelector('.monaco-editor-container');
        
        titleInput.value = cell.title || '';

        // Create Monaco editor instance
        const editor = monaco.editor.create(editorContainer, {
            value: cell.content || '',
            language: 'css',
            theme: 'vs',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: true,
            automaticLayout: true,
            wordWrap: 'on',
            fontSize: 14,
            tabSize: 2,
            renderWhitespace: 'selection',
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
                other: true,
                comments: true,
                strings: true
            },
            snippetSuggestions: 'inline',
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            colorDecorators: true,
            folding: true,
            links: true
        });

        // Store editor instance
        this.editors.set(cell.id, editor);

        // Setup cell controls
        cellDiv.querySelector('.move-up-button').addEventListener('click', () => this.moveCell(cell.id, 'up'));
        cellDiv.querySelector('.move-down-button').addEventListener('click', () => this.moveCell(cell.id, 'down'));
        cellDiv.querySelector('.delete-cell-button').addEventListener('click', () => this.deleteCell(cell.id));

        // Enable save button when content changes
        titleInput.addEventListener('input', () => this.enableSave());
        editor.onDidChangeModelContent(() => this.enableSave());

        return cellDiv;
    }

    async newFile() {
        try {
            await window.api.newFile();
            this.disposeCellEditors(); // Clean up old editors
            this.cells = [];
            this.cellsList.innerHTML = '';
            this.addCell(); // Add one empty cell
            this.saveButton.disabled = true;
        } catch (error) {
            alert(`Error creating new file: ${error.message}`);
        }
    }

    async openFile() {
        try {
            const result = await window.api.openCssFile();
            if (result.success) {
                this.disposeCellEditors(); // Clean up old editors
                this.cells = result.cells;
                this.renderCells();
                this.saveButton.disabled = false;
            } else if (result.error !== 'No file selected') {
                alert(`Error opening file: ${result.error}`);
            }
        } catch (error) {
            alert(`Error opening file: ${error.message}`);
        }
    }

    async saveFile() {
        try {
            const cells = this.getCellsData();
            const result = await window.api.saveCssFile(cells);
            if (result.success) {
                this.saveButton.disabled = true;
                alert('File saved successfully!');
            } else {
                alert(`Error saving file: ${result.error}`);
            }
        } catch (error) {
            alert(`Error saving file: ${error.message}`);
        }
    }

    addCell() {
        const cell = {
            id: Date.now().toString(),
            title: '',
            content: ''
        };
        this.cells.push(cell);
        this.cellsList.appendChild(this.createCellElement(cell));
        this.enableSave();
    }

    deleteCell(cellId) {
        const index = this.cells.findIndex(cell => cell.id === cellId);
        if (index !== -1) {
            const editor = this.editors.get(cellId);
            if (editor) {
                editor.dispose();
                this.editors.delete(cellId);
            }
            this.cells.splice(index, 1);
            this.renderCells();
            this.enableSave();
        }
    }

    moveCell(cellId, direction) {
        const index = this.cells.findIndex(cell => cell.id === cellId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < this.cells.length) {
            const cell = this.cells.splice(index, 1)[0];
            this.cells.splice(newIndex, 0, cell);
            this.renderCells();
            this.enableSave();
        }
    }

    getCellsData() {
        return Array.from(this.cellsList.children).map(cellElement => {
            const cellId = cellElement.dataset.cellId;
            const editor = this.editors.get(cellId);
            return {
                id: cellId,
                title: cellElement.querySelector('.cell-title').value,
                content: editor ? editor.getValue() : ''
            };
        });
    }

    renderCells() {
        this.disposeCellEditors(); // Clean up old editors
        this.cellsList.innerHTML = '';
        this.cells.forEach(cell => {
            this.cellsList.appendChild(this.createCellElement(cell));
        });
    }

    disposeCellEditors() {
        // Clean up Monaco editor instances
        this.editors.forEach(editor => editor.dispose());
        this.editors.clear();
    }

    enableSave() {
        this.saveButton.disabled = false;
    }
}

// Wait for Monaco to be loaded before initializing
require(['vs/editor/editor.main'], () => {
    // Configure Monaco CSS defaults
    monaco.languages.css.cssDefaults.setOptions({
        validate: true,
        lint: {
            compatibleVendorPrefixes: 'warning',
            vendorPrefix: 'warning',
            duplicateProperties: 'warning',
            emptyRules: 'warning',
            importStatement: 'warning',
            boxModel: 'warning',
            universalSelector: 'warning',
            zeroUnits: 'warning',
            fontFaceProperties: 'warning',
            hexColorLength: 'warning',
            argumentsInColorFunction: 'warning',
            unknownProperties: 'warning',
            ieHack: 'warning',
            unknownVendorSpecificProperties: 'warning',
            propertyIgnoredDueToDisplay: 'warning',
            important: 'warning',
            float: 'warning',
            idSelector: 'warning'
        },
        completion: {
            triggerSuggestOnEnter: true,
            completePropertyWithSemicolon: true,
        },
        format: {
            enable: true,
            newlineBetweenSelectors: true,
            newlineBetweenRules: true,
            spaceAroundSelectorSeparator: true
        },
        colorDecorators: true,
        diagnostics: true,
        hover: true,
        suggestions: true
    });

    // Initialize the CellManager after Monaco is ready
    new CellManager();
});
