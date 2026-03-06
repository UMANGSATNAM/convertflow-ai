import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Layers, Sparkles } from 'lucide-react';

export default function EmptyState({ onCreateNew }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center py-24 px-8"
        >
            {/* Icon Stack */}
            <div className="relative mb-8">
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="w-20 h-20 bg-accent-light border border-accent/10 rounded-2xl flex items-center justify-center"
                >
                    <Layers size={36} className="text-accent" strokeWidth={1.5} />
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 15 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-elevated"
                >
                    <Sparkles size={16} className="text-white" />
                </motion.div>
            </div>

            {/* Text Content */}
            <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.35 }}
                className="text-center max-w-sm"
            >
                <h2 className="text-xl font-semibold text-txt-primary mb-2 tracking-tight">
                    Create your first page
                </h2>
                <p className="text-sm text-txt-secondary leading-relaxed mb-8">
                    Build stunning landing pages, product pages, and homepages with our drag-and-drop visual editor. No coding needed.
                </p>
            </motion.div>

            {/* CTA Button */}
            <motion.button
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl shadow-soft hover:shadow-elevated transition-all duration-200"
            >
                <Plus size={18} strokeWidth={2.5} />
                <span>Create New Page</span>
            </motion.button>

            {/* Quick Start Templates Hint */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-6 text-xs text-txt-tertiary"
            >
                Or start from a <button onClick={onCreateNew} className="text-accent hover:text-accent-hover font-medium transition-colors underline underline-offset-2">pre-built template</button>
            </motion.p>
        </motion.div>
    );
}
