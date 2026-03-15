import { useEffect, useRef, useState } from "react";

export function MonacoEditor({
  value,
  onChange,
  language = "liquid",
  readOnly = false,
  height = "500px",
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  useEffect(() => {
    // Load Monaco from CDN per specification requirements
    if (window.monaco) {
      setMonacoLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/loader.js";
    script.async = true;
    script.onload = () => {
      window.require.config({
        paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor/min/vs" },
      });
      window.require(["vs/editor/editor.main"], () => {
        setMonacoLoaded(true);
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if necessary, though leaving it is usually fine for SPAs
    };
  }, []);

  useEffect(() => {
    if (monacoLoaded && containerRef.current && !editorRef.current) {
      // Register basic Liquid language highlighting if it doesn't exist
      if (!window.monaco.languages.getLanguages().some((l) => l.id === "liquid")) {
        window.monaco.languages.register({ id: "liquid" });
        window.monaco.languages.setMonarchTokensProvider("liquid", {
          tokenizer: {
            root: [
              [/\\{%[-+]?\\s*comment\\s*[-+]?%\\}/, "comment", "@comment"],
              [/\\{%[-+]?/, "keyword", "@tag"],
              [/\\{\\{[-+]?/, "keyword", "@output"],
              [/"([^"\\\\]|\\\\.)*$/, "string.invalid"], 
              [/'([^'\\\\]|\\\\.)*$/, "string.invalid"], 
              [/"/, "string", "@string_double"],
              [/'/, "string", "@string_single"],
              [/<[^>]+>/, "tag"],
            ],
            comment: [
              [/\\{%[-+]?\\s*endcomment\\s*[-+]?%\\}/, "comment", "@pop"],
              [/./, "comment"],
            ],
            tag: [
              [/[-+]?%\\}/, "keyword", "@pop"],
              [/[a-zA-Z_]\\w*/, "variable"],
              [/"([^"\\\\]|\\\\.)*$/, "string.invalid"],
              [/'([^'\\\\]|\\\\.)*$/, "string.invalid"],
              [/"/, "string", "@string_double"],
              [/'/, "string", "@string_single"],
            ],
            output: [
              [/[-+]?\\}\\}/, "keyword", "@pop"],
              [/[a-zA-Z_]\\w*/, "variable"],
              [/\\|/, "operator"],
              [/"([^"\\\\]|\\\\.)*$/, "string.invalid"],
              [/'([^'\\\\]|\\\\.)*$/, "string.invalid"],
              [/"/, "string", "@string_double"],
              [/'/, "string", "@string_single"],
            ],
            string_double: [
              [/[^\\\\"]+/, "string"],
              [/\\\\./, "string.escape"],
              [/"/, "string", "@pop"],
            ],
            string_single: [
              [/[^\\\\']+/, "string"],
              [/\\\\./, "string.escape"],
              [/'/, "string", "@pop"],
            ],
          },
        });
        
        window.monaco.editor.defineTheme("liquidDark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "c586c0" }, // Purple for tags
            { token: "variable", foreground: "9cdcfe" }, // Blue for output/variables
            { token: "string", foreground: "ce9178" }, // Yellow/Orange for strings
            { token: "comment", foreground: "6a9955" }, 
            { token: "tag", foreground: "569cd6" },
          ],
          colors: {},
        });
      }

      editorRef.current = window.monaco.editor.create(containerRef.current, {
        value: value,
        language: language,
        theme: "liquidDark",
        readOnly: readOnly,
        minimap: { enabled: false },
        automaticLayout: true,
        wordWrap: "on",
      });

      editorRef.current.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(editorRef.current.getValue());
        }
      });
    }
  }, [monacoLoaded, language, readOnly]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly });
    }
  }, [readOnly]);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
