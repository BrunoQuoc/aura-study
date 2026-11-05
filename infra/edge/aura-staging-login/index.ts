// Supabase Edge GET HTML is forced to text/plain. This endpoint is a
// backwards-compatible redirect to the isolated GitHub Pages STAGING form.
// All authentication remains in Supabase. No learner data here.
Deno.serve((req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD")
    return new Response("Method not allowed", {status:405, headers:{"Allow":"GET, HEAD"}});
  const url = new URL(req.url);
  const target = new URL("https://brunoquoc.github.io/aura-study/aura-staging-login.html");
  // Preserve PKCE query if an old Auth redirect URL is still configured.
  target.search = url.search;
  return Response.redirect(target, 302);
});
