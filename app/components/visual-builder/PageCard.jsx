import React from 'react';
import { motion } from 'framer-motion';
import { FileText, MoreHorizontal, ExternalLink, Copy, Trash2, Clock } from 'lucide-react';

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PageCard({ page, index, onEdit, onDuplicate, onDelete }) {
    const [showMenu, setShowMenu] = React.useState(false);

    const statusColors = {
        published: 'bg-status-success/10 text-status-success border-status-success/20',
        draft: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="group relative bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-elevated hover:border-border-light transition-all duration-200 cursor-pointer"
            onClick={() => onEdit(page.id)}
        >
            {/* Page Preview Thumbnail */}
            <div className="h-44 bg-surface-tertiary relative overflow-hidden">
                {page.thumbnail ? (
                    <img src={page.thumbnail} alt={page.title} className="w-full h-full object-cover object-top" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                            <FileText size={22} className="text-txt-tertiary" />
                        </div>
                        <span className="text-xs text-txt-tertiary font-medium">No preview</span>
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <span className="px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg shadow-elevated opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                        Edit Page
                    </span>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-txt-primary truncate flex-1">
                        {page.title}
                    </h3>

                    {/* More Actions - stop propagation to prevent card click */}
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="p-1 rounded-md text-txt-tertiary hover:text-txt-primary hover:bg-surface-secondary opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        {showMenu && (
                            <div
                                className="absolute right-0 top-8 w-40 bg-surface border border-border rounded-xl shadow-float z-50 py-1 animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { onEdit(page.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary transition-colors"
                                >
                                    <ExternalLink size={14} /> Open Editor
                                </button>
                                <button
                                    onClick={() => { onDuplicate(page.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary hover:bg-surface-secondary transition-colors"
                                >
                                    <Copy size={14} /> Duplicate
                                </button>
                                <div className="h-px bg-border mx-2 my-1" />
                                <button
                                    onClick={() => { onDelete(page.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-status-danger hover:bg-status-danger-bg transition-colors"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${statusColors[page.status] || statusColors.draft}`}>
                        {page.status === 'published' ? 'Published' : 'Draft'}
                    </span>

                    <span className="flex items-center gap-1 text-[11px] text-txt-tertiary">
                        <Clock size={11} />
                        {formatDate(page.updatedAt)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
