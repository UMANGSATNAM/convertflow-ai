/**
 * Iframe PostMessage Bridge (ConvertFlow AI)
 * 
 * Handles bidirectional communication between the app (Parent) and the Theme Editor Iframe (Child).
 * 
 * PARENT (App) -> CHILD (Iframe)
 * - sendThemeSettingUpdate: Instantly update a CSS variable or setting without reload
 * - sendSectionSettingsUpdate: Update specific block/section scoped variables
 * 
 * CHILD (Iframe) -> PARENT (App)
 * - listenForInspectorSelect: Catch clicks on sections inside the iframe to open the right sidebar panel
 */

export class EditorPostMessageBridge {
    constructor(iframeRef, onInspectorSelect) {
        this.iframeRef = iframeRef;
        this.onInspectorSelect = onInspectorSelect;
        this.handleMessage = this.handleMessage.bind(this);
    }

    /**
     * Start listening to messages from the iframe child
     */
    connect() {
        window.addEventListener('message', this.handleMessage);
    }

    /**
     * Stop listening
     */
    disconnect() {
        window.removeEventListener('message', this.handleMessage);
    }

    /**
     * Handles incoming messages from the Iframe
     */
    handleMessage(event) {
        // In production, verify event.origin matches the shop domain
        // if (event.origin !== 'https://your-shop.myshopify.com') return;

        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            if (data.type === 'theme_editor:select_section') {
                if (this.onInspectorSelect) {
                    // Forward the section/block ID that was clicked inside the injected theme code
                    this.onInspectorSelect(data.sectionId, data.blockId);
                }
            }
            
            // Handle other events like "theme_editor:drag_stop", etc.
        } catch (e) {
            // Not a JSON message or unrelated extension message
        }
    }

    /**
     * Send a live CSS variable update to the Iframe for instant preview
     * @param {string} variableName - e.g., '--color-primary'
     * @param {string} value - e.g., '#ff0000'
     * @param {string} scopeId - Optional section scope (e.g., 'shopify-section-123')
     */
    sendLiveCssUpdate(variableName, value, scopeId = ':root') {
        this.sendMessageToIframe({
            type: 'theme_editor:css_variable_update',
            variable: variableName,
            value: value,
            scope: scopeId
        });
    }

    /**
     * Send a full settings object update for a specific section
     * @param {string} sectionId 
     * @param {object} settings 
     */
    sendSectionUpdate(sectionId, settings) {
        this.sendMessageToIframe({
            type: 'theme_editor:section_update',
            sectionId,
            settings
        });
    }

    /**
     * Internal generic sender
     */
    sendMessageToIframe(messagePayload) {
        if (this.iframeRef.current && this.iframeRef.current.contentWindow) {
            this.iframeRef.current.contentWindow.postMessage(
                JSON.stringify(messagePayload), 
                '*' // Use target origin in production
            );
        }
    }
}

/**
 * COMPANION SCRIPT (To be injected into the Theme's layout/theme.liquid or loaded via App Proxy)
 * 
 * <script>
 * window.addEventListener('message', function(event) {
 *     try {
 *         var data = JSON.parse(event.data);
 *         if (data.type === 'theme_editor:css_variable_update') {
 *             var target = data.scope === ':root' ? document.documentElement : document.querySelector('.' + data.scope);
 *             if (target) {
 *                 target.style.setProperty(data.variable, data.value);
 *             }
 *         }
 *     } catch(e) {}
 * });
 * 
 * // Send clicks up to parent app
 * document.addEventListener('click', function(e) {
 *     var section = e.target.closest('.shopify-section');
 *     if (section && window.parent !== window) {
 *         window.parent.postMessage(JSON.stringify({
 *             type: 'theme_editor:select_section',
 *             sectionId: section.id.replace('shopify-section-', '')
 *         }), '*');
 *     }
 * });
 * </script>
 */
