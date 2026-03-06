import { create } from 'zustand';

const generateId = () => `el_${Math.random().toString(36).substring(2, 9)}`;

const createDefaultRoot = () => ({
    id: 'root',
    type: 'Root',
    label: 'PageFly body',
    children: [],
    settings: {
        styles: {
            backgroundColor: '#ffffff',
            minHeight: '100vh',
            padding: '0px',
            width: '100%',
        }
    }
});

// Deep clone helper
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Recursively find a node by ID
const findNode = (nodes, id) => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children?.length) {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

// Recursively remove a node by ID, returns the removed node
const removeNode = (nodes, id) => {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) {
            return nodes.splice(i, 1)[0];
        }
        if (nodes[i].children?.length) {
            const removed = removeNode(nodes[i].children, id);
            if (removed) return removed;
        }
    }
    return null;
};

// Push to history helper
const pushHistory = (state, newElements, extra = {}) => {
    const history = state.history.slice(0, state.historyIndex + 1);
    history.push(newElements);
    if (history.length > 50) history.shift();
    return {
        elements: newElements,
        history,
        historyIndex: history.length - 1,
        isDirty: true,
        ...extra,
    };
};

export const useVisualBuilderStore = create((set, get) => ({
    // Page metadata
    pageId: null,
    pageTitle: 'Untitled',
    pageStatus: 'draft',

    // AST
    elements: [createDefaultRoot()],

    // History
    history: [[createDefaultRoot()]],
    historyIndex: 0,

    // UI State
    selectedId: null,
    hoveredId: null,
    deviceMode: 'desktop',
    leftPanelOpen: true,
    rightPanelOpen: true,
    leftPanelTab: 'tree', // 'tree' | 'elements' | 'blocks'
    isDirty: false,
    isSaving: false,

    // --- Page Metadata ---
    setPageMeta: (meta) => set(meta),

    // --- UI Actions ---
    setSelectedId: (id) => set({ selectedId: id }),
    setHoveredId: (id) => set({ hoveredId: id }),
    setDeviceMode: (mode) => set({ deviceMode: mode }),
    toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
    toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
    setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),

    // --- History ---
    undo: () => set((state) => {
        if (state.historyIndex <= 0) return state;
        const i = state.historyIndex - 1;
        return { historyIndex: i, elements: state.history[i], isDirty: true };
    }),
    redo: () => set((state) => {
        if (state.historyIndex >= state.history.length - 1) return state;
        const i = state.historyIndex + 1;
        return { historyIndex: i, elements: state.history[i], isDirty: true };
    }),

    // --- Load from DB ---
    loadPage: (pageData) => {
        let elements;
        try {
            elements = typeof pageData.elements_json === 'string'
                ? JSON.parse(pageData.elements_json)
                : pageData.elements_json;
        } catch {
            elements = [createDefaultRoot()];
        }
        if (!elements || !elements.length) elements = [createDefaultRoot()];

        set({
            pageId: pageData.id,
            pageTitle: pageData.title || 'Untitled',
            pageStatus: pageData.status || 'draft',
            elements,
            history: [elements],
            historyIndex: 0,
            selectedId: null,
            isDirty: false,
        });
    },

    // --- AST Mutations ---
    addElement: (parentId, elementData, index = -1) => set((state) => {
        const newEl = { id: generateId(), ...elementData };
        if (!newEl.children && (newEl.type === 'Row' || newEl.type === 'Column' || newEl.type === 'Section' || newEl.type === 'Root')) {
            newEl.children = [];
        }
        const tree = clone(state.elements);
        const parent = findNode(tree, parentId);
        if (!parent) return state;
        if (!parent.children) parent.children = [];
        if (index === -1) parent.children.push(newEl);
        else parent.children.splice(index, 0, newEl);
        return pushHistory(state, tree, { selectedId: newEl.id });
    }),

    removeElement: (id) => set((state) => {
        if (id === 'root') return state;
        const tree = clone(state.elements);
        removeNode(tree, id);
        return pushHistory(state, tree, {
            selectedId: state.selectedId === id ? null : state.selectedId,
        });
    }),

    updateElement: (id, newSettings) => set((state) => {
        const tree = clone(state.elements);
        const node = findNode(tree, id);
        if (!node) return state;
        node.settings = {
            ...node.settings,
            ...newSettings,
            styles: { ...node.settings?.styles, ...newSettings.styles },
        };
        if (newSettings.text !== undefined) node.settings.text = newSettings.text;
        if (newSettings.src !== undefined) node.settings.src = newSettings.src;
        if (newSettings.alt !== undefined) node.settings.alt = newSettings.alt;
        if (newSettings.url !== undefined) node.settings.url = newSettings.url;
        if (newSettings.tag !== undefined) node.settings.tag = newSettings.tag;
        if (newSettings.label !== undefined) node.label = newSettings.label;
        return pushHistory(state, tree);
    }),

    duplicateElement: (id) => set((state) => {
        if (id === 'root') return state;
        const tree = clone(state.elements);

        // Find parent and index
        const findParentAndIndex = (nodes, targetId) => {
            for (const node of nodes) {
                if (node.children) {
                    const idx = node.children.findIndex(c => c.id === targetId);
                    if (idx !== -1) return { parent: node, index: idx };
                    const found = findParentAndIndex(node.children, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        const result = findParentAndIndex(tree, id);
        if (!result) return state;

        // Deep clone the element and regenerate all IDs
        const regenerateIds = (node) => {
            node.id = generateId();
            if (node.children) node.children.forEach(regenerateIds);
            return node;
        };

        const duplicate = regenerateIds(clone(result.parent.children[result.index]));
        result.parent.children.splice(result.index + 1, 0, duplicate);
        return pushHistory(state, tree, { selectedId: duplicate.id });
    }),

    // --- Save status ---
    setSaving: (val) => set({ isSaving: val }),
    setDirty: (val) => set({ isDirty: val }),

    // --- Utility ---
    getElementById: (id) => findNode(get().elements, id),
    getElementsJSON: () => JSON.stringify(get().elements),
}));
