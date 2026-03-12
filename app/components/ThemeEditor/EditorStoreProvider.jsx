/**
 * EditorStoreProvider.jsx — THIN REACT BRIDGE
 * ═══════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS:
 * Zustand stores live outside React. They can't call useFetcher()
 * or useAppBridge() directly. This tiny component:
 *
 *   1. Reads loader data via useLoaderData()
 *   2. Injects the Remix fetcher into the Zustand store
 *   3. Injects the Shopify App Bridge instance
 *   4. Watches fetcher.state and routes results to the store
 *   5. Sets up keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
 *
 * This is the ONLY React file that touches React hooks for the
 * store. Every other component just does:
 *   const blocks = useEditorStore(s => s.blocks);
 *
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from 'react';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useAppBridge } from '@shopify/app-bridge-react';
import useEditorStore from './useEditorStore';

export function EditorStoreProvider({ children }) {
    const loaderData = useLoaderData();
    const fetcher = useFetcher();
    const shopify = useAppBridge();
    const hydratedRef = useRef(false);
    const prevFetcherData = useRef(null);

    // ── 1. Hydrate store from loader (once) ──────────────────────
    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;

        useEditorStore.getState().hydrate({
            pageBlocks: loaderData.pageBlocks,
            categories: loaderData.categories,
            themeId: loaderData.themeId,
            shop: loaderData.shop,
            themeName: loaderData.themeName,
            templateFile: loaderData.templateFile,
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── 2. Inject fetcher & shopify into store ───────────────────
    useEffect(() => {
        useEditorStore.getState().setFetcher(fetcher);
    }, [fetcher]);

    useEffect(() => {
        useEditorStore.getState().setShopify(shopify);
    }, [shopify]);

    // ── 3. Sync fetcher results → store ──────────────────────────
    //    WHY here instead of inside Zustand?
    //    Because fetcher.state and fetcher.data are React state.
    //    We need a useEffect to detect when they change, then
    //    forward the result into the Zustand store.
    useEffect(() => {
        if (fetcher.state !== 'idle') return;
        if (!fetcher.data) return;
        if (fetcher.data === prevFetcherData.current) return; // dedupe
        prevFetcherData.current = fetcher.data;

        const store = useEditorStore.getState();
        if (fetcher.data.ok) {
            store.handleFetcherSuccess(fetcher.data);
        } else if (fetcher.data.error) {
            store.handleFetcherError(fetcher.data.error);
        }
    }, [fetcher.state, fetcher.data]);

    // ── 4. Keyboard shortcuts ────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            const tag = document.activeElement?.tagName;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

            const store = useEditorStore.getState();

            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                store.undo();
            } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                store.redo();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                store.saveSettings();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ── 5. Expose fetcher state to store subscribers ─────────────
    //    Canvas and SidebarRight need to know if we're saving.
    //    We sync fetcher.state into a readable Zustand slice.
    useEffect(() => {
        useEditorStore.setState({ _fetcherState: fetcher.state });
    }, [fetcher.state]);

    return children;
}
