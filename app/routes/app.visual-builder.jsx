import React from 'react';
import { Outlet } from "@remix-run/react";

// Load Inter font via CDN (SSR-safe for production)
export const links = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
];

// This is a layout route — it renders child routes via <Outlet />
// Children:
//   app.visual-builder._index.jsx  → Dashboard (page list)
//   app.visual-builder.$pageId.jsx → Editor
export default function VisualBuilderLayout() {
    return <Outlet />;
}
