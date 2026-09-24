# Embed the dashboard on a client website

The dashboard stays on a public HTTPS host (the README lists GitHub Pages).
The client website displays it in an iframe, so dashboard updates appear
without pasting new code. Squarespace does not need to host the React app.

**Production embed URL:**
`https://dillabee.github.io/growsmart-roadmaps-dashboard/?embed=1#/overview`

The server serves `/growsmart-roadmaps-dashboard/` with query `embed=1`.
React reads that query to select the compact layout; `#/overview` selects the
initial screen in the browser. This is not a separate `/embed` page. Hashes are
not sent to the server, so hosting rules cannot distinguish community routes.

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

### Production framing check (September 24, 2026)

A GET of the production embed URL returned **HTTP 200**, without redirects,
`X-Frame-Options`, `Content-Security-Policy`, or `Set-Cookie` response headers.
The HTML also has no CSP meta tag. The current response therefore allows external
iframe embedding. This is a point-in-time check; recheck after publishing or
changing hosts. A Chromium test also loaded the live URL in a cross-origin iframe
and rendered its charts. The live app still shows the regular header (no
`.app-embed` element), so the compact view needs to be published.

The app has no authentication, session, cookie, or browser-storage requirement.
Its JSON data and built assets load relative to the dashboard URL, on the
dashboard's own origin even when embedded. Third-party cookies are not required.
Google Fonts is the only external resource in the HTML, with system-font fallbacks.

The production host currently sends `Access-Control-Allow-Origin: *`. That is a
host-provided header, not a change made for embedding. CORS does not authorize
iframe navigation and need not be changed: the app's data fetch is same-origin.
The parent page cannot read the iframe DOM, and this implementation does not try
to do so or use cross-window messages.

### Optional client-domain allowlist

No security headers have been removed or weakened. GitHub Pages serves this
static build; there is no response-header configuration in the app. Vite dev or
preview headers do **not** configure the production host. If restricting framing
to the client is required, use a hosting service or reverse proxy that can set
HTTP response headers, then update the snippet if the production URL changes.

Configure that host with this rule structure (placeholders must be replaced):

| Response scope | Enforced CSP directive |
| --- | --- |
| Dashboard HTML with query parameter `embed=1` | `frame-ancestors 'self' https://CLIENT.example https://www.CLIENT.example https://CLIENT.squarespace.com;` |
| Other dashboard HTML | `frame-ancestors 'self';` |

Include only the exact HTTPS origins the client uses. Omit unused entries;
do not allow `*`, all HTTPS sites, or all of `*.squarespace.com`. Confirm any
additional ancestor origins needed for Squarespace's editor, or validate on the
published page instead. Every ancestor must match, not just the immediate parent.
If the host cannot match query parameters, use a dedicated embed path or host
before applying this split policy; a URL hash cannot scope an HTTP header rule.

Merge the directive into the host's existing **enforced**
`Content-Security-Policy` header, preserving other directives. A second permissive
CSP does not override an existing restrictive policy. Do not rely on
`Content-Security-Policy-Report-Only`, a CSP meta tag, or JavaScript to enforce
`frame-ancestors`. For the embed response only, avoid conflicting
`X-Frame-Options: DENY` or `SAMEORIGIN`; retain protections on other responses.
The obsolete `X-Frame-Options: ALLOW-FROM` is not a domain-allowlist solution.
See [MDN's frame-ancestors reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

If Squarespace itself sends a restrictive `frame-src`/`child-src` CSP, its policy
must allow `https://dillabee.github.io`. That is separate from the dashboard's
`frame-ancestors` policy. No parent-site policy change should be made unless an
actual blocking policy is present.

Before handing off, check that the dashboard URL loads publicly, charts fit on
mobile, community navigation and comparisons work, and the full-dashboard link
opens the selected view. Test the actual published Squarespace page as well;
the client's plan, layout, and parent-page policies need verification on their site.

To recheck actual production headers (use GET, not only HEAD):

```bash
curl -sS -L -D - -o /dev/null 'https://dillabee.github.io/growsmart-roadmaps-dashboard/?embed=1'
```

### Pre-deployment verification (September 24, 2026)

- Production build loaded inside an actual cross-origin iframe using the snippet
  with only the dashboard origin replaced by the local preview server.
- Chromium checked Overview, all six community pages, and Data Notes at parent
  widths of 1440, 1024, 768, 704, 640, 390, and 320 CSS pixels (16px parent gutters).
  All 56 combinations had no horizontal document overflow in either the parent
  or iframe and no uncaught JavaScript errors.
- Community navigation and comparison controls worked inside the frame. The
  full-dashboard link preserved the selected community and removed `embed=1`;
  iframe navigation left the parent's URL unchanged.
- Mobile embed tabs wrap. Data Notes panels stack at tablet widths; long code
  text wraps. The wide sources table intentionally scrolls **inside its own
  container**, preserving readable columns without making the page scroll sideways.
- `npm run build`, `npm run lint`, `git diff --check`, and the existing Python
  data suite passed (14 tests). Vite still reports a non-blocking bundle-size
  warning for the main JavaScript chunk.

These are Chromium viewport checks, not tests on physical devices or the client's
Squarespace account. After publication, repeat the check on the actual Squarespace
page, including mobile Safari, the site's desktop/mobile block layout, and any
client-specific policy or stylesheet. Nothing was deployed as part of this review.
