import React, { useState } from 'react';
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { compileToLiquid } from '../utils/compiler/liquidCompiler';

// Builder Components
import Sidebar from '../components/builder/Sidebar';
import Canvas from '../components/builder/Canvas';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import { useBuilderStore } from '../store/builderStore';

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return json({});
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("action");

    if (actionType === "compile_and_upload") {
        const elementsJSON = formData.get("elements");
        const elements = JSON.parse(elementsJSON);

        // 1. Compile AST to Liquid
        const compiledLiquid = compileToLiquid(elements, 'My Custom Page');

        // 2. Fetch the Active Theme ID
        const activeThemeRes = await admin.rest.resources.Theme.all({
            session: session,
            role: "main",
        });
        const activeTheme = activeThemeRes.data[0];

        if (!activeTheme) {
            return json({ error: "No active theme found" }, { status: 400 });
        }

        // 3. Upload the compiled Liquid as a new Section
        const sectionTimestamp = Date.now();
        const sectionKey = `sections/cf-builder-page-${sectionTimestamp}.liquid`;

        const asset = new admin.rest.resources.Asset({ session: session });
        asset.theme_id = activeTheme.id;
        asset.key = sectionKey;
        asset.value = compiledLiquid;

        try {
            await asset.save({ update: true });

            // 4. Ideally, here we would also generate a templates/page.XXXX.json 
            // that references this section, and create the Page object in Shopify.
            // For now, testing section upload.

            return json({ success: true, message: `Compiled and pushed to ${sectionKey}` });
        } catch (error) {
            console.error("Asset Upload Error:", error);
            return json({ error: "Failed to upload compiled liquid" }, { status: 500 });
        }
    }

    return json({ error: "Invalid action" });
};

export default function PageBuilderEditor() {
    const navigate = useNavigate();
    const { deviceMode, setDeviceMode, elements, undo, redo, historyIndex, history } = useBuilderStore();

    // Setup drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement before drag starts, allows clicking elements without dragging
            },
        })
    );

    const fetcher = useFetcher();

    const handleSave = async () => {
        // Output the JSON tree for debugging
        console.log("Current Page AST:", JSON.stringify(elements, null, 2));

        // Send AST to the compiler action
        fetcher.submit(
            { action: "compile_and_upload", elements: JSON.stringify(elements) },
            { method: "POST" }
        );
    };

    return (
        <div className="flex flex-col h-screen w-full bg-[#f8f9fa] overflow-hidden font-sans text-gray-800">

            {/* Top Navigation Bar */}
            <header className="h-[56px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                    >
                        ← Back
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <div>
                        <h1 className="text-gray-800 font-semibold text-[14px] leading-none mb-1">ConvertFlow Page Builder</h1>
                        <span className="text-gray-400 text-[10px] uppercase tracking-widest font-medium font-mono">Draft</span>
                    </div>
                </div>

                {/* Device Toggles */}
                <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
                    <button
                        className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${deviceMode === 'desktop' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setDeviceMode('desktop')}
                    >
                        Desktop
                    </button>
                    <button
                        className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${deviceMode === 'mobile' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setDeviceMode('mobile')}
                    >
                        Mobile
                    </button>
                </div>

                {/* History & Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md p-1 mr-2">
                        <button
                            onClick={undo}
                            disabled={historyIndex === 0}
                            className="p-1 px-3 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                            title="Undo"
                        >
                            ↺ Undo
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-1 px-3 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded disabled:opacity-30 transition-colors"
                            title="Redo"
                        >
                            ↻ Redo
                        </button>
                    </div>

                    <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                        Preview
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={fetcher.state !== "idle"}
                        className="px-5 py-1.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {fetcher.state !== "idle" ? "Publishing..." : "Publish to Theme"}
                    </button>
                    {fetcher.data?.success && (
                        <span className="text-emerald-600 text-[11px] font-semibold absolute right-6 top-[60px] bg-emerald-50 px-2 py-1 rounded shadow-sm border border-emerald-100">Saved successfully!</span>
                    )}
                </div>
            </header>

            {/* Main Builder Area - DND Context Wraps Everything */}
            <DndContext sensors={sensors}>
                <div className="flex flex-1 overflow-hidden relative">
                    <Sidebar />
                    <Canvas />
                    <PropertiesPanel />
                </div>
            </DndContext>

        </div>
    );
}
