import React from 'react';
import { useVisualBuilderStore } from '../../store/visualBuilderStore';
import {
    Undo2, Redo2, Monitor, Tablet, Smartphone,
    Save, Upload, Eye, PanelLeftClose, PanelRightClose,
    ChevronLeft
} from 'lucide-react';

export default function EditorToolbar({ onSave, onPublish, onBack }) {
    const {
        pageTitle, pageStatus, deviceMode, setDeviceMode,
        undo, redo, historyIndex, history,
        isDirty, isSaving,
        toggleLeftPanel, toggleRightPanel, leftPanelOpen, rightPanelOpen
    } = useVisualBuilderStore();

    const devices = [
        { id: 'desktop', icon: Monitor, label: '1280px' },
        { id: 'tablet', icon: Tablet, label: '768px' },
        { id: 'mobile', icon: Smartphone, label: '390px' },
    ];

    return (
        <div className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-3 shrink-0 z-50">
            {/* Left: Back + Page Info */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-surface-secondary rounded-lg text-txt-secondary hover:text-txt-primary transition-colors"
                    title="Back to dashboard"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="h-5 w-px bg-border" />

                <button
                    onClick={toggleLeftPanel}
                    className={`p-2 rounded-lg transition-colors ${leftPanelOpen ? 'text-accent bg-accent/5' : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-secondary'}`}
                    title="Toggle sidebar"
                >
                    <PanelLeftClose size={16} />
                </button>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-txt-primary leading-tight truncate max-w-[160px]">
                        {pageTitle}
                    </span>
                    <span className="text-[10px] text-txt-tertiary">
                        {pageStatus === 'published' ? '● Published' : '○ Unpublished'}
                    </span>
                </div>
            </div>

            {/* Center: Device Modes + Dimensions */}
            <div className="flex items-center gap-1 bg-surface-secondary border border-border rounded-lg p-0.5">
                {devices.map(d => (
                    <button
                        key={d.id}
                        onClick={() => setDeviceMode(d.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${deviceMode === d.id
                                ? 'bg-surface text-txt-primary shadow-soft border border-border-light'
                                : 'text-txt-tertiary hover:text-txt-secondary'
                            }`}
                        title={d.label}
                    >
                        <d.icon size={14} />
                        {deviceMode === d.id && <span>{d.label}</span>}
                    </button>
                ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5 mr-2">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary rounded-lg disabled:opacity-25 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2 text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary rounded-lg disabled:opacity-25 transition-colors"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>

                <div className="h-5 w-px bg-border" />

                <button
                    onClick={toggleRightPanel}
                    className={`p-2 rounded-lg transition-colors ${rightPanelOpen ? 'text-accent bg-accent/5' : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-secondary'}`}
                    title="Toggle properties"
                >
                    <PanelRightClose size={16} />
                </button>

                <div className="h-5 w-px bg-border" />

                {/* Save */}
                <button
                    onClick={onSave}
                    disabled={!isDirty || isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary rounded-lg disabled:opacity-40 transition-colors"
                >
                    <Save size={15} />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>

                {/* Publish */}
                <button
                    onClick={onPublish}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg shadow-soft hover:shadow-elevated transition-all active:scale-[0.98]"
                >
                    <Upload size={15} />
                    <span>Publish</span>
                </button>
            </div>
        </div>
    );
}
