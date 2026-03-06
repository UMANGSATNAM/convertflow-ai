import { create } from 'zustand';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial empty page structure
const initialElements = [
    {
        id: 'root',
        type: 'Root',
        children: [],
        settings: {
            styles: {
                backgroundColor: '#ffffff',
                minHeight: '100vh',
                padding: '0px'
            }
        }
    }
];

// Helper to manage history stack
const pushToHistory = (state, newElements, additionalStateUpdate = {}) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newElements);

    // Limit history length to 50 items to prevent huge memory usage in browser
    if (newHistory.length > 50) {
        newHistory.shift();
    }

    return {
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        ...additionalStateUpdate
    };
};

export const useBuilderStore = create((set, get) => ({
    elements: initialElements,

    // History stack for Undo/Redo
    history: [initialElements],
    historyIndex: 0,

    selectedId: null,
    hoveredId: null,
    deviceMode: 'desktop', // 'desktop', 'mobile'

    // Setters
    setSelectedId: (id) => set({ selectedId: id }),
    setHoveredId: (id) => set({ hoveredId: id }),
    setDeviceMode: (mode) => set({ adviceMode: mode, deviceMode: mode }),

    // Undo / Redo Actions
    undo: () => set((state) => {
        if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            return { historyIndex: newIndex, elements: state.history[newIndex] };
        }
        return state;
    }),

    redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            return { historyIndex: newIndex, elements: state.history[newIndex] };
        }
        return state;
    }),

    // AST Manipulation
    setElements: (elements) => set((state) => pushToHistory(state, elements)),

    addElement: (parentElementId, elementData, index = -1) => set((state) => {
        const newElement = {
            id: `el_${generateId()}`,
            ...elementData,
        };

        const newElements = JSON.parse(JSON.stringify(state.elements));

        // Recursive function to find the parent and insert the child
        const insertNode = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === parentElementId) {
                    if (!nodes[i].children) nodes[i].children = [];
                    if (index === -1) {
                        nodes[i].children.push(newElement);
                    } else {
                        nodes[i].children.splice(index, 0, newElement);
                    }
                    return true;
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    if (insertNode(nodes[i].children)) return true;
                }
            }
            return false;
        };

        if (insertNode(newElements)) {
            return pushToHistory(state, newElements, { selectedId: newElement.id });
        }
        return state;
    }),

    removeElement: (id) => set((state) => {
        if (id === 'root') return state; // Can't delete root

        const newElements = JSON.parse(JSON.stringify(state.elements));

        const deleteNode = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].children) {
                    const childIndex = nodes[i].children.findIndex(c => c.id === id);
                    if (childIndex !== -1) {
                        nodes[i].children.splice(childIndex, 1);
                        return true;
                    }
                    if (deleteNode(nodes[i].children)) return true;
                }
            }
            return false;
        };

        if (deleteNode(newElements)) {
            // Deselect if we deleted the selected item
            return pushToHistory(state, newElements, {
                selectedId: state.selectedId === id ? null : state.selectedId,
                hoveredId: state.hoveredId === id ? null : state.hoveredId
            });
        }
        return state;
    }),

    updateElementSettings: (id, newSettings) => set((state) => {
        const newElements = JSON.parse(JSON.stringify(state.elements));

        const updateNode = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    // Deep merge settings
                    nodes[i].settings = {
                        ...nodes[i].settings,
                        ...newSettings,
                        styles: {
                            ...nodes[i].settings?.styles,
                            ...newSettings.styles
                        }
                    };
                    return true;
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    if (updateNode(nodes[i].children)) return true;
                }
            }
            return false;
        };

        if (updateNode(newElements)) {
            return pushToHistory(state, newElements);
        }
        return state;
    }),

    moveElement: (activeId, overId, newIndex) => set((state) => {
        // Implement drag and drop reordering logic later
        // It requires removing from old parent and inserting into new parent at index
        return state;
    }),

    // Utility: Find element by ID
    getElementById: (id) => {
        const state = get();
        let found = null;
        const findNode = (nodes) => {
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].id === id) {
                    found = nodes[i];
                    return true;
                }
                if (nodes[i].children && nodes[i].children.length > 0) {
                    if (findNode(nodes[i].children)) return true;
                }
            }
            return false;
        };
        findNode(state.elements);
        return found;
    }
}));
