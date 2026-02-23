import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // If authenticate.admin somehow resolves without throwing a redirect (which it shouldn't, but is causing the null page),
  // we catch it and force the redirect to the app.
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop) {
    return redirect(`/app?shop=${shop}&host=${url.searchParams.get("host") || ""}`);
  }

  return redirect("/app");
};
