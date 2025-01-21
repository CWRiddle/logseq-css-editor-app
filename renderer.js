class CellManager {
    constructor() {
        this.cells = [];
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
        const editor = cellDiv.querySelector('.cell-editor');
        
        titleInput.value = cell.title || '';
        editor.value = cell.content || '';

        // Setup cell controls
        cellDiv.querySelector('.move-up-button').addEventListener('click', () => this.moveCell(cell.id, 'up'));
        cellDiv.querySelector('.move-down-button').addEventListener('click', () => this.moveCell(cell.id, 'down'));
        cellDiv.querySelector('.delete-cell-button').addEventListener('click', () => this.deleteCell(cell.id));

        // Enable save button when content changes
        titleInput.addEventListener('input', () => this.enableSave());
        editor.addEventListener('input', () => this.enableSave());

        return cellDiv;
    }

    async newFile() {
        try {
            await window.api.newFile();
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
            return {
                id: cellElement.dataset.cellId,
                title: cellElement.querySelector('.cell-title').value,
                content: cellElement.querySelector('.cell-editor').value
            };
        });
    }

    renderCells() {
        this.cellsList.innerHTML = '';
        this.cells.forEach(cell => {
            this.cellsList.appendChild(this.createCellElement(cell));
        });
    }

    enableSave() {
        this.saveButton.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CellManager();
});
