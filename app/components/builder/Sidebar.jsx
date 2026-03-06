import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import * as LucideIcons from 'lucide-react';
import { ELEMENT_CONFIGS } from '../../store/elementConfigs';
import { BLOCK_CONFIGS } from '../../store/blockConfigs';

const DraggableItem = ({ type }) => {
    const config = ELEMENT_CONFIGS[type];
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `template_${type}`,
        data: {
            ...config,
            isTemplate: true // Tells the drop zone this is a new block being dragged in
        }
    });

    const Icon = LucideIcons[config.icon] || LucideIcons.Box;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 9999, // Ensure it stays on top while dragging
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`
                flex flex-col items-center justify-center p-3 mb-3 
                bg-white border border-gray-200 rounded-lg cursor-grab
                hover:border-blue-500 hover:shadow-sm transition-all
                ${isDragging ? 'opacity-50 border-blue-500 scale-105 shadow-md bg-blue-50' : 'opacity-100'}
            `}
        >
            <Icon size={24} className="text-gray-500 mb-2" strokeWidth={1.5} />
            <span className="text-xs font-medium text-gray-700">{config.label}</span>
        </div>
    );
};

const DraggableBlock = ({ type }) => {
    const config = BLOCK_CONFIGS[type];
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `template_block_${type}`,
        data: {
            isTemplate: true,
            isBlock: true,
            blockType: type
        }
    });

    const Icon = LucideIcons[config.icon] || LucideIcons.LayoutTemplate;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 9999,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className={`
                flex items-center p-3 mb-3 gap-3
                bg-white border border-gray-200 rounded-lg cursor-grab
                hover:border-blue-500 hover:shadow-sm transition-all
                ${isDragging ? 'opacity-50 border-blue-500 scale-105 shadow-md bg-blue-50' : 'opacity-100'}
            `}
        >
            <div className="p-2 bg-gray-50 rounded text-gray-500">
                <Icon size={20} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-800">{config.label}</span>
                <span className="text-[10px] text-gray-500">{config.category}</span>
            </div>
        </div>
    );
};

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState('elements');

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-56px)] flex flex-col shrink-0 relative z-10">
            <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-widest">Library</h3>
                <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200 w-full">
                    <button
                        className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'elements' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('elements')}
                    >
                        Elements
                    </button>
                    <button
                        className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${activeTab === 'blocks' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('blocks')}
                    >
                        Blocks
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {activeTab === 'elements' && (
                    <>
                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Layout</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <DraggableItem type="Row" />
                                <DraggableItem type="Column" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Basic</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <DraggableItem type="Heading" />
                                <DraggableItem type="Paragraph" />
                                <DraggableItem type="Button" />
                                <DraggableItem type="Image" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Utils</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <DraggableItem type="Spacer" />
                                <DraggableItem type="Divider" />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'blocks' && (
                    <div className="flex flex-col gap-1">
                        <DraggableBlock type="HeroLeftLight" />
                        <DraggableBlock type="FeatureGrid3" />
                        <DraggableBlock type="CTASection" />
                    </div>
                )}
            </div>
        </div>
    );
}
