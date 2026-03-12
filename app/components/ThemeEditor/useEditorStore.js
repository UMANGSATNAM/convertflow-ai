/**
 * useEditorStore.js — THE ZUSTAND BRAIN
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY ZUSTAND INSTEAD OF CONTEXT?
 * ─────────────────────────────────
 * React Context re-renders EVERY consumer when ANY value changes.
 * With 15+ state variables and 14+ actions, that means typing in a
 * text field re-renders the Canvas, SidebarLeft, SidebarRight, and
 * TemplatePicker — all at once. Performance nightmare.
 *
 * Zustand uses SELECTOR-BASED subscriptions. Components only
 * re-render when the SPECIFIC slice they subscribe to changes:
 *   const blocks = useEditorStore(s => s.blocks);     // Only re-renders when blocks change
 *   const device = useEditorStore(s => s.device);     // Only re-renders when device changes
 *
 * This is critical for Phase 3 (flyout previews) — we can't have
 * the hover preview re-rendering every time the user types.
 *
 * ARCHITECTURE
 * ────────────
 * The store is organized into 4 slices:
 *   1. THEME STATE   — blocks, templateFile, settings, history
 *   2. SCHEMA STATE  — categories, themeId, shop, themeName, sectionSchemas
 *   3. EDITOR UI     — selectedBlockId, activeTab, device, popover state, etc.
 *   4. ACTIONS       — all mutations (updateSettings, addSection, removeSection, etc.)
 *
 * UNDO/REDO
 * ─────────
 * History is stored inside the store itself (not a separate hook).
 * Max 50 steps. Undo/redo pops from the history stack.
 *
 * FETCHER BRIDGE
 * ──────────────
 * Zustand can't use React hooks directly (no useFetcher inside create()).
 * Instead, we expose `setFetcher()` and `setShopify()` to inject the
 * Remix fetcher and Shopify App Bridge from a thin React wrapper.
 * The store actions use these injected refs to submit forms.
 *
 * ══════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ─── Constants ────────────────────────────────────────────────────
const MAX_HISTORY = 50;
const AUTOSAVE_DELAY_MS = 2000;

// ─── Undo/Redo helpers ───────────────────────────────────────────
function createHistorySlice(initialBlocks) {
    return {
        _history: [initialBlocks],
        _cursor: 0,
    };
}

// ═══════════════════════════════════════════════════════════════════
//  THE STORE
// ═══════════════════════════════════════════════════════════════════
const useEditorStore = create(
    subscribeWithSelector((set, get) => ({

        // ────────────────────────────────────────────────────────
        //  1. THEME STATE — the merchant's actual storefront data
        // ────────────────────────────────────────────────────────

        /** @type {Array<{id: string, type: string, name: string, settings: object, disabled?: boolean, blocks?: object, block_order?: string[], isCf?: boolean}>} */
        blocks: [],

        /** Server-synced override (takes precedence over history blocks when set) */
        _serverBlocks: null,

        /** Computed: returns serverBlocks if set, else history[cursor] */
        // NOTE: This is recalculated manually via _getActiveBlocks()
        // because Zustand getters don't auto-memoize.

        /** Current template file path */
        templateFile: 'templates/index.json',

        /** Current setting values for the selected section/block */
        settings: {},

        /** Timestamp of last successful save (used by Canvas) */
        lastSavedAt: null,

        /** Whether current settings differ from saved state */
        hasUnsavedChanges: false,

        // History state
        ...createHistorySlice([]),

        // ────────────────────────────────────────────────────────
        //  2. SCHEMA STATE — theme metadata and section registry
        // ────────────────────────────────────────────────────────

        /** Section categories from the loader (for the section picker) */
        categories: {},

        /** Active Shopify theme ID */
        themeId: '',

        /** Store domain (e.g., "mystore.myshopify.com") */
        shop: '',

        /** Active theme name */
        themeName: '',

        /** Cached section schemas: { [sectionType]: { settings, blocks, name, max_blocks } } */
        sectionSchemas: {},

        // ────────────────────────────────────────────────────────
        //  3. EDITOR UI STATE — sidebar, tabs, popovers
        // ────────────────────────────────────────────────────────

        /** Which sidebar tab is active: 'sections' | 'templates' | 'titan' */
        activeTab: 'sections',

        /** Currently selected section/block ID in the outline */
        selectedBlockId: null,

        /** Type of the selected item: 'section' | 'block' */
        selectedBlockType: null,

        /** Template being previewed in TemplatePicker */
        previewTemplateId: null,

        /** Preview device: 'desktop' | 'mobile' */
        device: 'desktop',

        /** Insert target — the section after which to insert a new section */
        insertTargetId: null,

        /** Swap target — the section to replace */
        swapTargetId: null,

        // ────────────────────────────────────────────────────────
        //  4. INJECTED REFS — fetcher & shopify (set from React)
        // ────────────────────────────────────────────────────────

        /** @type {import('@remix-run/react').FetcherWithComponents | null} */
        _fetcher: null,

        /** @type {import('@shopify/app-bridge-react').ShopifyGlobal | null} */
        _shopify: null,

        /** Debounce timer ID for auto-save */
        _autoSaveTimer: null,

        /** Callback for Canvas preview reload (registered by Canvas) */
        _previewReloadFn: null,

        // ────────────────────────────────────────────────────────
        //  INITIALIZATION (called once from React with loader data)
        // ────────────────────────────────────────────────────────

        /**
         * Hydrate the store with data from the Remix loader.
         * Called once in the route component.
         */
        hydrate: ({ pageBlocks, categories, themeId, shop, themeName, templateFile }) => {
            set({
                blocks: pageBlocks || [],
                categories: categories || {},
                themeId: themeId || '',
                shop: shop || '',
                themeName: themeName || '',
                templateFile: templateFile || 'templates/index.json',
                _serverBlocks: null,
                ...createHistorySlice(pageBlocks || []),
            });
        },

        /** Inject the Remix fetcher (called once from React wrapper) */
        setFetcher: (fetcher) => set({ _fetcher: fetcher }),

        /** Inject the Shopify App Bridge instance */
        setShopify: (shopify) => set({ _shopify: shopify }),

        /** Register Canvas preview reload callback */
        registerPreviewReload: (fn) => set({ _previewReloadFn: fn }),

        // ────────────────────────────────────────────────────────
        //  COMPUTED GETTERS
        // ────────────────────────────────────────────────────────

        /** Get the active blocks list (server override or history). */
        getActiveBlocks: () => {
            const s = get();
            return s._serverBlocks !== null ? s._serverBlocks : s._history[s._cursor] || s.blocks;
        },

        /** Get the currently selected block object. */
        getActiveBlock: () => {
            const blocks = get().getActiveBlocks();
            return blocks.find(b => b.id === get().selectedBlockId) || null;
        },

        // ────────────────────────────────────────────────────────
        //  UI SETTERS (simple state updates)
        // ────────────────────────────────────────────────────────

        setActiveTab:         (v) => set({ activeTab: v }),
        setDevice:            (v) => set({ device: v }),
        setTemplateFile:      (v) => set({ templateFile: v }),
        setPreviewTemplateId: (v) => set({ previewTemplateId: v }),
        setInsertTargetId:    (v) => set({ insertTargetId: v }),
        setSwapTargetId:      (v) => set({ swapTargetId: v }),
        setSelectedBlockType: (v) => set({ selectedBlockType: v }),

        /**
         * Select a section/block in the sidebar.
         * Also syncs the settings form with the selected block's settings.
         */
        setSelectedBlockId: (blockId) => {
            const blocks = get().getActiveBlocks();
            const block = blocks.find(b => b.id === blockId);
            set({
                selectedBlockId: blockId,
                settings: block?.settings || {},
                hasUnsavedChanges: false,
            });
        },

        // ────────────────────────────────────────────────────────
        //  SETTINGS ACTIONS
        // ────────────────────────────────────────────────────────

        /**
         * Update one or more settings values (debounced auto-save).
         * WHY debounce: Typing "Hello" fires 5 onChange events.
         * We batch them and auto-save after 2s of inactivity.
         */
        updateSettings: (newValues) => {
            const timer = get()._autoSaveTimer;
            if (timer) clearTimeout(timer);

            set(s => ({
                settings: { ...s.settings, ...newValues },
                hasUnsavedChanges: true,
                _autoSaveTimer: setTimeout(() => {
                    get().saveSettings();
                }, AUTOSAVE_DELAY_MS),
            }));
        },

        /**
         * Manually save the current settings to the theme.
         * Submits via the injected fetcher → server action.
         */
        saveSettings: () => {
            const { selectedBlockId, settings, templateFile, _fetcher } = get();
            if (!selectedBlockId || !_fetcher) return;

            _fetcher.submit(
                {
                    intent: 'update_settings',
                    blockId: selectedBlockId,
                    settings: JSON.stringify(settings),
                    templateFile,
                },
                { method: 'post' }
            );

            // Optimistic local update
            set(s => {
                const base = s._serverBlocks || s.getActiveBlocks();
                return {
                    hasUnsavedChanges: false,
                    _serverBlocks: base.map(b =>
                        b.id === selectedBlockId ? { ...b, settings } : b
                    ),
                };
            });
        },

        // ────────────────────────────────────────────────────────
        //  SECTION ACTIONS
        // ────────────────────────────────────────────────────────

        /** Add a section to the bottom of the page. */
        addSection: (sectionId) => {
            const { _fetcher, templateFile, getActiveBlocks } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'inject_section',
                    sectionId,
                    placement: 'bottom',
                    trustedOrder: JSON.stringify(getActiveBlocks().map(b => b.id)),
                    templateFile,
                },
                { method: 'post' }
            );
            set({ insertTargetId: null, activeTab: 'sections' });
        },

        /** Insert a section after a specific block. */
        insertSection: (sectionId, afterBlockId) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'insert_at',
                    sectionId,
                    afterBlockId: afterBlockId || '',
                    settings: '{}',
                    templateFile,
                },
                { method: 'post' }
            );
            set({ insertTargetId: null, activeTab: 'sections' });
        },

        /** Swap/replace a section in-place. */
        swapSection: (targetBlockId, newSectionId) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'swap_section',
                    targetBlockId,
                    newSectionId,
                    templateFile,
                },
                { method: 'post' }
            );
            set({ swapTargetId: null, activeTab: 'sections' });
        },

        /** Apply a Titan pre-built template. */
        applyTitan: (titanId) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                { intent: 'apply_titan', titanId, templateFile },
                { method: 'post' }
            );
            set({ activeTab: 'sections' });
        },

        /** Remove a section from the page (optimistic). */
        removeSection: (blockId) => {
            const { _fetcher, templateFile, selectedBlockId, getActiveBlocks } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                { intent: 'remove_section', blockId, templateFile },
                { method: 'post' }
            );
            set({
                selectedBlockId: selectedBlockId === blockId ? null : selectedBlockId,
                _serverBlocks: getActiveBlocks().filter(b => b.id !== blockId),
            });
        },

        /** Reorder sections (drag-and-drop result). */
        reorderSections: (newOrderArray) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'reorder',
                    order: JSON.stringify(newOrderArray),
                    templateFile,
                },
                { method: 'post' }
            );
        },

        /** Toggle section visibility (hide/show). */
        toggleSectionVisibility: (blockId, hidden) => {
            const { _fetcher, templateFile, getActiveBlocks } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'toggle_section_visibility',
                    blockId,
                    hidden: String(hidden),
                    templateFile,
                },
                { method: 'post' }
            );
            // Optimistic
            set({
                _serverBlocks: getActiveBlocks().map(b =>
                    b.id === blockId ? { ...b, disabled: hidden } : b
                ),
            });
        },

        // ────────────────────────────────────────────────────────
        //  BLOCK ACTIONS (sub-items within a section)
        // ────────────────────────────────────────────────────────

        addBlock: (sectionId, blockType, blockSettings = {}) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'add_block',
                    sectionId,
                    blockType,
                    settings: JSON.stringify(blockSettings),
                    templateFile,
                },
                { method: 'post' }
            );
        },

        removeBlock: (sectionId, blockKey) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                { intent: 'remove_block', sectionId, blockKey, templateFile },
                { method: 'post' }
            );
        },

        reorderBlocks: (sectionId, blockOrder) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'reorder_blocks',
                    sectionId,
                    blockOrder: JSON.stringify(blockOrder),
                    templateFile,
                },
                { method: 'post' }
            );
        },

        saveBlockSettings: (sectionId, blockKey, blockSettings) => {
            const { _fetcher, templateFile } = get();
            if (!_fetcher) return;
            _fetcher.submit(
                {
                    intent: 'update_block_settings',
                    sectionId,
                    blockKey,
                    settings: JSON.stringify(blockSettings),
                    templateFile,
                },
                { method: 'post' }
            );
        },

        // ────────────────────────────────────────────────────────
        //  UNDO / REDO (50-step history stack)
        // ────────────────────────────────────────────────────────

        /** Push a snapshot onto the history stack. */
        _pushHistory: (newBlocks) => {
            set(s => {
                const trimmed = s._history.slice(0, s._cursor + 1);
                const next = [...trimmed, newBlocks].slice(-MAX_HISTORY);
                return {
                    _history: next,
                    _cursor: Math.min(s._cursor + 1, MAX_HISTORY - 1),
                    _serverBlocks: null,
                    blocks: newBlocks,
                };
            });
        },

        /** Set blocks with history tracking. */
        setBlocks: (updaterOrValue) => {
            const currentBlocks = get().getActiveBlocks();
            const newBlocks = typeof updaterOrValue === 'function'
                ? updaterOrValue(currentBlocks)
                : updaterOrValue;
            get()._pushHistory(newBlocks);
        },

        undo: () => {
            set(s => {
                if (s._cursor <= 0) return {};
                const nc = s._cursor - 1;
                return {
                    _cursor: nc,
                    _serverBlocks: null,
                    blocks: s._history[nc],
                };
            });
        },

        redo: () => {
            set(s => {
                if (s._cursor >= s._history.length - 1) return {};
                const nc = s._cursor + 1;
                return {
                    _cursor: nc,
                    _serverBlocks: null,
                    blocks: s._history[nc],
                };
            });
        },

        /** Can the user undo? */
        canUndo: () => get()._cursor > 0,

        /** Can the user redo? */
        canRedo: () => get()._cursor < get()._history.length - 1,

        // ────────────────────────────────────────────────────────
        //  SERVER SYNC — called when fetcher returns data
        // ────────────────────────────────────────────────────────

        /**
         * Process a successful fetcher response.
         * This is called from the React bridge component.
         */
        handleFetcherSuccess: (data) => {
            const s = get();
            if (data.pageBlocks) {
                set({ _serverBlocks: data.pageBlocks, blocks: data.pageBlocks });
            }
            if (data.newBlockId) {
                get().setSelectedBlockId(data.newBlockId);
            }

            set({ lastSavedAt: Date.now(), hasUnsavedChanges: false });

            // Show toast
            if (s._shopify) {
                s._shopify.toast.show(data.message || 'Saved ✓');
            }

            // 🔑 Fire Canvas preview reload IMMEDIATELY
            const intent = data.intent;
            if (intent !== 'reorder' && s._previewReloadFn) {
                s._previewReloadFn({
                    blockId: data.blockId,
                    sectionType: data.sectionType,
                    isRemove: intent === 'remove_section',
                    isStructural: [
                        'inject_section', 'insert_section',
                        'swap_section', 'apply_titan', 'reorder',
                    ].includes(intent),
                });
            }
        },

        /**
         * Handle a fetcher error response.
         */
        handleFetcherError: (errorMessage) => {
            const s = get();
            if (s._shopify) {
                s._shopify.toast.show(errorMessage, { isError: true });
            }
        },

        // ────────────────────────────────────────────────────────
        //  SECTION SCHEMA CACHE
        // ────────────────────────────────────────────────────────

        /**
         * Fetch and cache a section's schema.
         * Used by SidebarRight and the future AddPopover.
         * @param {string} sectionType
         * @returns {Promise<{settings: Array, blocks: Array, name: string, max_blocks: number}>}
         */
        fetchSectionSchema: async (sectionType) => {
            if (!sectionType) return { settings: [], blocks: [], name: '', max_blocks: 16 };

            // Return from cache if available
            const cached = get().sectionSchemas[sectionType];
            if (cached) return cached;

            // Fetch from API
            try {
                const res = await fetch(`/app/api/section-schema?id=${encodeURIComponent(sectionType)}`);
                const data = await res.json();
                const schema = {
                    settings: data.settings || [],
                    blocks: data.blocks || [],
                    name: data.name || sectionType,
                    max_blocks: data.max_blocks || 16,
                };

                // Cache it
                set(s => ({
                    sectionSchemas: { ...s.sectionSchemas, [sectionType]: schema },
                }));

                return schema;
            } catch (e) {
                console.error('[EditorStore] Failed to fetch schema:', e);
                return { settings: [], blocks: [], name: sectionType, max_blocks: 16 };
            }
        },
    }))
);

export default useEditorStore;

// ─── Convenience selectors (prevents object allocation on every render) ──
// Usage: const blocks = useEditorStore(selectBlocks);
export const selectBlocks            = (s) => s._serverBlocks ?? s.blocks;
export const selectSettings          = (s) => s.settings;
export const selectSelectedBlockId   = (s) => s.selectedBlockId;
export const selectActiveTab         = (s) => s.activeTab;
export const selectDevice            = (s) => s.device;
export const selectTemplateFile      = (s) => s.templateFile;
export const selectThemeId           = (s) => s.themeId;
export const selectShop              = (s) => s.shop;
export const selectThemeName         = (s) => s.themeName;
export const selectCategories        = (s) => s.categories;
export const selectHasUnsavedChanges = (s) => s.hasUnsavedChanges;
export const selectLastSavedAt       = (s) => s.lastSavedAt;
export const selectInsertTargetId    = (s) => s.insertTargetId;
export const selectSwapTargetId      = (s) => s.swapTargetId;
export const selectPreviewTemplateId = (s) => s.previewTemplateId;
