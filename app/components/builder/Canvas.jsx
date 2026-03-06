import React from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { useBuilderStore } from '../../store/builderStore';
import CanvasElement from './CanvasElement';
import { BLOCK_CONFIGS } from '../../store/blockConfigs';

export default function Canvas() {
    const { elements, addElement, moveElement, deviceMode } = useBuilderStore();

    // The root element must exist
    const rootNode = elements.find(el => el.id === 'root');

    // Monitor global drag and drop events
    useDndMonitor({
        onDragEnd(event) {
            const { active, over } = event;

            if (!over) {
                // Dropped outside any valid container
                return;
            }

            // Are we dragging a new template from the sidebar?
            const isTemplate = active.data.current?.isTemplate;
            const isBlock = active.data.current?.isBlock;
            const blockType = active.data.current?.blockType;
            const elementConfig = active.data.current;

            const overId = over.id; // The ID of the container we dropped onto

            if (isTemplate) {
                if (isBlock) {
                    console.log(`Dropped new BLOCK ${blockType} onto ${overId}`);
                    const newTree = BLOCK_CONFIGS[blockType].buildTree();
                    addElement(overId, newTree);
                } else {
                    // We dropped a new single element onto the canvas
                    console.log(`Dropped new ${elementConfig.type} onto ${overId}`);

                    // Add it to AST under the target container
                    addElement(overId, {
                        type: elementConfig.type,
                        settings: { ...elementConfig.defaultProps }
                    });
                }
            } else {
                // Moving an existing element
                console.log(`Moved ${active.id} to ${overId}`);
                // moveElement(active.id, overId, -1);
            }
        }
    });

    if (!rootNode) return <div className="p-8 text-white">Critical Error: Root node not found in AST.</div>;

    return (
        <div className="flex-1 bg-[#f1f5f9] relative overflow-auto custom-scrollbar flex p-8 justify-center">
            {/* The actual "Page" container simulating the website body */}
            <div
                className="bg-white shadow-2xl transition-all duration-300 relative mx-auto"
                style={{
                    width: '100%',
                    maxWidth: deviceMode === 'mobile' ? '390px' : '1200px',
                    minHeight: deviceMode === 'mobile' ? '844px' : '800px',
                    transformOrigin: 'top center',
                    overflowX: 'hidden'
                }}
            >
                <CanvasElement node={rootNode} />
            </div>
        </div>
    );
}
