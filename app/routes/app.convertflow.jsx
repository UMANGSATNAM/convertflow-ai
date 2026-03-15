import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Card, Text, BlockStack, Select, Button, TextField, InlineStack, Badge, Banner, Box } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { getThemes, getThemeAssets } from "../services/convertflow.server";
import { MonacoEditor } from "../components/convertflow/MonacoEditor";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const themes = await getThemes(request);
  
  const mainTheme = themes.find((t) => t.role === "main");
  let sections = [];
  
  if (mainTheme) {
    const assets = await getThemeAssets(request, mainTheme.id);
    sections = assets.filter((a) => a.key.startsWith("sections/") && a.key.endsWith(".liquid"));
  }

  const devTheme = themes.find((t) => t.role === "development");

  return json({
    themes,
    mainTheme,
    devTheme,
    sections,
  });
};

export default function ConvertFlow() {
  const { themes, mainTheme, devTheme, sections } = useLoaderData();
  const fetcher = useFetcher();
  const pushFetcher = useFetcher();
  const [selectedAsset, setSelectedAsset] = useState("");
  const [sectionName, setSectionName] = useState("");
  
  const [editorMode, setEditorMode] = useState("COMBINED"); 
  const [codeContent, setCodeContent] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  
  const [extractionData, setExtractionData] = useState(null);
  const [themeCheckResult, setThemeCheckResult] = useState(null);
  
  const [targetThemeId, setTargetThemeId] = useState(devTheme?.id?.toString() || mainTheme?.id?.toString() || "");

  const handleExtract = useCallback(() => {
    if (!selectedAsset) return;
    
    fetcher.submit(
      { themeId: mainTheme.id, assetKey: selectedAsset, sectionName },
      { method: "post", action: "/app/convertflow/extract" }
    );
  }, [selectedAsset, sectionName, mainTheme, fetcher]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setExtractionData(fetcher.data.extracted);
      setThemeCheckResult(fetcher.data.checkResult);
      setCodeContent(fetcher.data.extracted.combinedCode);
      setEditorMode("COMBINED");
    }
  }, [fetcher.data]);

  const handleModeChange = (mode) => {
    setEditorMode(mode);
    if (!extractionData) return;
    
    switch (mode) {
      case "LIQUID": setCodeContent(extractionData.liquidCode); break;
      case "CSS": setCodeContent(extractionData.cssCode); break;
      case "SCHEMA": setCodeContent(extractionData.schemaCode); break;
      case "COMBINED": setCodeContent(extractionData.combinedCode); break;
    }
  };

  const handlePush = useCallback(() => {
    if (!codeContent) return;
    
    if (confirm(`Are you sure you want to push this code to Theme ID: ${targetThemeId}?`)) {
      pushFetcher.submit(
        { 
          themeId: targetThemeId, 
          assetKey: selectedAsset || "sections/new-section.liquid",
          code: codeContent 
        },
        { method: "post", action: "/app/convertflow/push" }
      );
    }
  }, [codeContent, targetThemeId, selectedAsset, pushFetcher]);

  return (
    <Page title="ConvertFlow - AI Section Builder">
      <Layout>
        <Layout.Section secondary>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Select Section</Text>
              <Select
                label="Theme File"
                options={[
                  { label: "Select a Section from Active Theme", value: "" },
                  ...sections.map(s => ({ label: s.key, value: s.key }))
                ]}
                value={selectedAsset}
                onChange={setSelectedAsset}
              />
              <TextField 
                label="New Section Name" 
                value={sectionName} 
                onChange={setSectionName}
                helpText="Optional: Override extracted section name autocomplete"
              />
              <Button 
                primary 
                onClick={handleExtract} 
                loading={fetcher.state === "submitting"}
                disabled={!selectedAsset}
              >
                Extract & Process with Claude
              </Button>
            </BlockStack>
          </Card>

          <Box paddingBlockStart="400">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Push Settings</Text>
                <Select
                  label="Target Theme"
                  options={themes.map(t => ({ 
                    label: `${t.name} ${t.role === 'development' ? '(Dev)' : ''} ${t.role === 'main' ? '(Active)' : ''}`, 
                    value: t.id.toString() 
                  }))}
                  value={targetThemeId}
                  onChange={setTargetThemeId}
                  helpText="Defaults to your Development theme to avoid overwriting live."
                />
                
                {themeCheckResult && (
                  <BlockStack gap="200">
                    <Text variant="headingSm">Theme Check Validation</Text>
                    {themeCheckResult.pass ? (
                      <Badge tone="success">Theme Checker: PASS</Badge>
                    ) : (
                      <Badge tone="critical">Theme Checker: FAIL</Badge>
                    )}
                    {themeCheckResult.errors?.map((err, i) => (
                      <Text key={i} color="critical" variant="bodySm">Line {err.row}: {err.message}</Text>
                    ))}
                    {themeCheckResult.warnings?.map((warn, i) => (
                      <Text key={i} color="warning" variant="bodySm">Line {warn.row}: {warn.message}</Text>
                    ))}
                  </BlockStack>
                )}

                <Button 
                  primary 
                  onClick={handlePush}
                  disabled={!codeContent || (themeCheckResult && !themeCheckResult.pass)}
                  loading={pushFetcher.state === "submitting"}
                >
                  Push to Theme
                </Button>

                {pushFetcher.data?.success && (
                  <InlineStack align="center">
                    <Text color="success">Successfully pushed to theme!</Text>
                  </InlineStack>
                )}
                {pushFetcher.data?.error && (
                  <Banner title="Push Failed" tone="critical">
                    {pushFetcher.data.error}
                  </Banner>
                )}
              </BlockStack>
            </Card>
          </Box>
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <BlockStack gap="0">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #ebebeb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <InlineStack gap="200">
                  {["COMBINED", "LIQUID", "CSS", "SCHEMA"].map(mode => (
                    <Button 
                      key={mode} 
                      pressed={editorMode === mode} 
                      onClick={() => handleModeChange(mode)}
                      size="micro"
                    >
                      {mode}
                    </Button>
                  ))}
                </InlineStack>
                <InlineStack gap="200" align="center">
                  <Button size="micro" onClick={() => setReadOnly(!readOnly)}>
                    {readOnly ? "Enable Editing" : "Disable Editing"}
                  </Button>
                </InlineStack>
              </div>
              
              <div style={{ height: "600px", width: "100%" }}>
                <MonacoEditor 
                  value={codeContent} 
                  onChange={setCodeContent}
                  readOnly={readOnly}
                  height="600px"
                  language={editorMode === "CSS" ? "css" : "liquid"}
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
