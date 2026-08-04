# Production security headers

The site is deployed through GitHub Pages. Repository files alone cannot prove that every HTTP response carries the desired security headers.

The deployment check expects:

- `Content-Security-Policy` without `unsafe-eval`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` with unused capabilities disabled
- `Strict-Transport-Security` on HTTPS
- `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` where compatible

Apply these at the real response layer, such as an approved reverse proxy or CDN, then run `npm run verify:production`. Do not add a `_headers` file and assume GitHub Pages applies it. Verify the `guildgate.js.org` custom domain in GitHub account settings and keep HTTPS enforcement enabled.
