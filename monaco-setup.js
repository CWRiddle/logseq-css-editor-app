// Monaco Editor setup and configuration
(function() {
    // Configure AMD loader for Monaco
    require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' }});

    // Configure Monaco's base path and workers
    window.MonacoEnvironment = {
        getWorkerUrl: function(workerId, label) {
            const code = `
                self.MonacoEnvironment = { baseUrl: '${window.location.origin}' };

                // Load appropriate worker based on label
                if (${JSON.stringify(label)} === 'css') {
                    importScripts('${window.location.origin}/node_modules/monaco-editor/min/vs/language/css/css.worker.js');
                } else {
                    importScripts('${window.location.origin}/node_modules/monaco-editor/min/vs/editor/editor.worker.js');
                }
            `;

            const blob = new Blob([code], { type: 'application/javascript' });
            return URL.createObjectURL(blob);
        }
    };

    // Load Monaco Editor and configure it
    require(['vs/editor/editor.main'], function() {
        // Configure CSS language features
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

        // Signal that Monaco is ready
        window.dispatchEvent(new Event('monaco-ready'));
    });
})();
