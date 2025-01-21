document.addEventListener('DOMContentLoaded', () => {
    const openButton = document.getElementById('openButton');
    const saveButton = document.getElementById('saveButton');
    const cssContent = document.getElementById('cssContent');

    openButton.addEventListener('click', async () => {
        try {
            const result = await window.api.openCssFile();
            if (result.success) {
                cssContent.value = result.content;
                saveButton.disabled = false;
            } else {
                if (result.error !== 'No file selected') {
                    cssContent.value = `Error reading file: ${result.error}`;
                }
                saveButton.disabled = true;
            }
        } catch (error) {
            cssContent.value = `Error reading file: ${error.message}`;
            saveButton.disabled = true;
        }
    });

    saveButton.addEventListener('click', async () => {
        try {
            const result = await window.api.saveCssFile(cssContent.value);
            if (result.success) {
                alert('File saved successfully!');
            } else {
                alert(`Error saving file: ${result.error}`);
            }
        } catch (error) {
            alert(`Error saving file: ${error.message}`);
        }
    });

    // Enable save button when content changes if a file is loaded
    cssContent.addEventListener('input', () => {
        if (!saveButton.disabled) {
            saveButton.disabled = false;
        }
    });
});
