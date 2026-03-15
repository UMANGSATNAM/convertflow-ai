import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";

export const loader = async ({ params }) => {
  const token = params.token;
  if (!token) {
    throw new Response("Not Found", { status: 404 });
  }

  const item = await db.libraryItem.findUnique({ where: { shareToken: token } });

  if (!item) {
    throw new Response("Link invalid or expired", { status: 404 });
  }

  if (item.shareExpiresAt && new Date() > new Date(item.shareExpiresAt)) {
    throw new Response("This share link has expired", { status: 410 });
  }

  return json({
    name: item.name,
    code: item.liquidCode,
  });
};

export default function SharePage() {
  const { name, code } = useLoaderData();

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>{name}</h1>
      <p>This section code is shared via ConvertFlow - AI Section Builder.</p>
      <div style={{ background: "#1e1e1e", color: "#d4d4d4", padding: "1.5rem", borderRadius: "8px", overflowX: "auto" }}>
        <pre style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
