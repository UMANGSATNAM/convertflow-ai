import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';

export default function DashboardHeader({ pageCount, onCreateNew, searchQuery, onSearchChange }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6 mb-8"
        >
            {/* Top Row */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-txt-primary tracking-tight">
                        Visual Builder
                    </h1>
                    <p className="text-sm text-txt-secondary mt-1">
                        {pageCount === 0
                            ? 'Create your first custom page'
                            : `${pageCount} page${pageCount !== 1 ? 's' : ''} created`
                        }
                    </p>
                </div>

                <button
                    onClick={onCreateNew}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl shadow-soft hover:shadow-elevated transition-all duration-200 active:scale-[0.98]"
                >
                    <Plus size={18} strokeWidth={2} />
                    <span>New Page</span>
                </button>
            </div>

            {/* Search + Filters Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-tertiary" />
                    <input
                        type="text"
                        placeholder="Search pages..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-txt-primary placeholder:text-txt-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-200"
                    />
                </div>

                <div className="flex items-center bg-surface-secondary border border-border rounded-xl p-1">
                    <button className="px-3 py-1.5 text-xs font-medium text-txt-primary bg-surface rounded-lg shadow-soft border border-border-light transition-all">
                        All
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary rounded-lg transition-all">
                        Published
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary rounded-lg transition-all">
                        Drafts
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
