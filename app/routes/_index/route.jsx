import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    // Auto redirect to auth with all shopify params preserved
    throw redirect(`/auth?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>ConvertFlow AI App</h1>
      <p>Redirecting to Shopify Login...</p>
      {showForm && (
        <Form method="post" action="/auth/login" style={{ marginTop: "20px" }}>
          <label>
            <span>Shop domain: </span>
            <input type="text" name="shop" placeholder="my-shop.myshopify.com" style={{ padding: "8px", width: "250px" }} />
          </label>
          <button type="submit" style={{ padding: "8px 16px", marginLeft: "10px", background: "black", color: "white", borderRadius: "4px" }}>
            Log in
          </button>
        </Form>
      )}
    </div>
  );
}
