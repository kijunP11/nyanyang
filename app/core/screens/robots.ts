export async function loader() {
  return new Response(
    `User-agent: *
Disallow: /dashboard
Disallow: /account
Disallow: /settings
Disallow: /payments
Disallow: /api
Allow: /

Sitemap: ${process.env.SITE_URL}/sitemap.xml`,
    {
      headers: {
        "Content-Type": "text/plain",
      },
    },
  );
}
