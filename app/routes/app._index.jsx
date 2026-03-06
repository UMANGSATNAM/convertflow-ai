import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { readSectionFile, publishSection } from "../lib/shopify.server";
import { SECTION_FILES } from "../lib/constants";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "publish_section") {
    const sectionId = formData.get("sectionId");
    const sectionMeta = SECTION_FILES[sectionId];

    if (!sectionMeta) {
      return json({ ok: false, error: "Section not found" }, { status: 404 });
    }

    const liquid = readSectionFile(sectionMeta.file);
    if (!liquid) {
      return json({ ok: false, error: "Section file missing" }, { status: 404 });
    }

    try {
      const result = await publishSection(
        session.shop,
        session.accessToken,
        `cf-${sectionId}`,
        liquid
      );
      return json({ ok: true, message: `Published! Asset: ${result.assetKey}` });
    } catch (e) {
      return json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

export default function AppIndex() {
  const { shop } = useLoaderData();
  const fetcher = useFetcher();
  const isPublishing = fetcher.state !== "idle";
  const result = fetcher.data;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h1 style={styles.title}>Section Builder</h1>
        </div>

        <p style={styles.subtitle}>
          Connected to <strong>{shop}</strong>
        </p>

        {/* Section Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Header 01: Split Nav</h2>
              <p style={styles.cardDesc}>Centered logo with split navigation and search/cart icons</p>
            </div>
            <span style={styles.badge}>HEADER</span>
          </div>

          <div style={styles.preview}>
            <div style={styles.previewHeader}>
              <div style={styles.previewNav}>
                <span style={styles.previewLink}>Shop</span>
                <span style={styles.previewLink}>Collections</span>
              </div>
              <div style={styles.previewLogo}>LOGO</div>
              <div style={styles.previewNav}>
                <span style={styles.previewLink}>About</span>
                <span style={styles.previewLink}>Contact</span>
                <span style={styles.previewIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <span style={styles.previewIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </span>
              </div>
            </div>
          </div>

          <div style={styles.cardActions}>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="publish_section" />
              <input type="hidden" name="sectionId" value="header-01-split-nav" />
              <button
                type="submit"
                disabled={isPublishing}
                style={{
                  ...styles.publishBtn,
                  opacity: isPublishing ? 0.7 : 1,
                }}
              >
                {isPublishing ? (
                  <span style={styles.btnContent}>
                    <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.49-8.49l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" /></svg>
                    Publishing...
                  </span>
                ) : (
                  <span style={styles.btnContent}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m-7-7l7-7 7 7" /></svg>
                    Publish to Theme
                  </span>
                )}
              </button>
            </fetcher.Form>
          </div>

          {/* Result toast */}
          {result && (
            <div style={{
              ...styles.toast,
              background: result.ok ? '#ecfdf5' : '#fef2f2',
              color: result.ok ? '#065f46' : '#991b1b',
              borderColor: result.ok ? '#a7f3d0' : '#fecaca',
            }}>
              {result.ok ? (
                <span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 6 }}><path d="M20 6L9 17l-5-5" /></svg>
                  {result.message}
                </span>
              ) : (
                <span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 6 }}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6m0-6l6 6" /></svg>
                  {result.error}
                </span>
              )}
            </div>
          )}
        </div>

        <p style={styles.hint}>
          After publishing, go to your Shopify Theme Editor and add the section "Header 01: Split Nav" to any page.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#fafafa',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '40px 20px',
  },
  container: {
    maxWidth: 640,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    margin: '0 0 32px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px 16px',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111',
    margin: '0 0 4px',
  },
  cardDesc: {
    fontSize: 13,
    color: '#888',
    margin: 0,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    color: '#4f46e5',
    background: '#eef2ff',
    padding: '3px 8px',
    borderRadius: 4,
    letterSpacing: '0.5px',
  },
  preview: {
    margin: '0 24px 20px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#fff',
    padding: 16,
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewNav: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flex: 1,
  },
  previewLink: {
    fontSize: 11,
    fontWeight: 500,
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  previewLogo: {
    fontSize: 16,
    fontWeight: 700,
    color: '#111',
    textAlign: 'center',
    flex: 1,
  },
  previewIcon: {
    color: '#555',
    display: 'flex',
  },
  cardActions: {
    padding: '16px 24px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  publishBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  toast: {
    margin: '0 24px 20px',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: '1.5',
  },
};
