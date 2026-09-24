# Embed the dashboard on a client website

The dashboard stays on a public HTTPS host (the README lists GitHub Pages).
The client website displays it in an iframe, so dashboard updates appear
without pasting new code. Squarespace does not need to host the React app.

## Squarespace setup

1. Publish the latest dashboard build to its host. The changes in this repository
   must be deployed before the compact embed view is available.
2. Edit the client's Squarespace page and add a **Code** block in a wide section.
3. Set the block to **HTML**, turn **Display Source** off, and paste the contents of
   [`deploy/squarespace-embed.html`](../deploy/squarespace-embed.html).
4. Give the block enough vertical space in both desktop and mobile layouts.
   The dashboard scrolls inside its frame; the new-tab link offers a full-page view.
5. Save and check the published page in a logged-out/private browser window,
   including mobile. Custom code may be disabled in the Squarespace editor.

Squarespace's [Code blocks documentation](https://support.squarespace.com/hc/en-us/articles/206543167-Code-blocks)
lists JavaScript and iframe support on Core, Plus, Advanced, Business,
Commerce Basic, and Commerce Advanced plans (checked September 24, 2026).
If the client's plan does not support iframes, use a regular link to the dashboard
or upgrade to a supported plan.

## Options

- `?embed=1` uses a compact header and replaces Print with a link to the current
  view in the full dashboard. Navigation, comparisons, and data notes remain available.
- Start on a town by changing `#/overview` to `#/community/Houlton` (or, for example,
  `#/community/Presque%20Isle`). Keep `?embed=1` **before** the hash.
- Remove `?embed=1` to embed the regular dashboard header instead.
- Adjust the iframe's inline `height`, `min-height`, and `max-height` to suit
  the client page. This is a scrolling frame with no parent-page JavaScript required.
- If the dashboard moves to another host, update both URLs in the snippet.

## Hosting and verification

Build with `npm ci` and `npm run build`, then publish `dist/` using the existing
hosting process. This checkout includes a GitHub Actions workflow **example** in
`deploy/`; it does not include an active `.github/workflows/deploy.yml`.

The dashboard host must allow the client's site to frame it. If the browser
reports a framing-policy error, check the host's `X-Frame-Options` and CSP
`frame-ancestors` headers. On a host with configurable headers, allow the client's
actual domains. CORS changes are not needed for iframe embedding.

Before handing off, check that the dashboard URL loads publicly, charts fit on
mobile, community navigation and comparisons work, and the full-dashboard link
opens the selected view. Test the actual published Squarespace page as well;
the client's plan, layout, and hosting headers cannot be verified from this repo.
