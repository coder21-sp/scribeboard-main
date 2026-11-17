# ScribeBoard frontend

A responsive reading room and writing dashboard for the ScribeBoard Express/PostgreSQL API. Built with semantic HTML, CSS, and JavaScript modules; no runtime framework or build step is required.

## Features

- Public story browsing, search, categories, sorting, and pagination
- Registration and sign-in using the existing API
- Author dashboard, draft creation/editing, publishing, unpublishing, review submission, and confirmed deletion
- Plain-text article editor, excerpts, categories, tags, and comment settings
- Public comments and an editor/admin moderation queue
- Separate, clearly labeled demo mode with tab-scoped sample data
- API connection settings, loading/empty/error states, unsaved-change prompts
- In-memory login tokens and single-flight refresh-token rotation
- Responsive navigation, native form labels, keyboard focus styles, and live feedback

## Run locally

Serve `dist/` with any static HTTP server, for example:

```sh
python3 -m http.server 5173 --directory dist
```

Open `http://localhost:5173`. There is no production build command: `dist/` is the deployable frontend source.

## Connect the backend

The hosted frontend now defaults to `https://scribeboard-api.onrender.com/api/v1`. Demo mode is available in Settings. An explicitly saved connection choice takes precedence. Render Free can take around a minute to wake up; GET requests allow up to 90 seconds.

Use the ScribeBoard backend with the security/session fixes in PR #1 applied. Start its PostgreSQL database, apply its Prisma migrations, and run the API using the backend instructions.

1. Open Connection settings in the frontend. Use Settings in the main navigation, or Sign in → Connect my backend while in demo mode.
2. Enter your API base URL including `/api/v1`, e.g. `http://localhost:3003/api/v1` for local development or `https://your-api.example.com/api/v1` for production.
3. Set backend `CORS_ORIGIN` to your frontend origin, e.g. `http://localhost:5173` or your hosted frontend URL. Restart the backend after changing its environment.
4. Select Test & connect, then create an account or sign in. Public signup creates an AUTHOR. Editor/admin roles must be managed through your backend administration process.

A hosted HTTPS frontend needs an HTTPS backend. A localhost API address only works on the machine running that backend, subject to browser local-network restrictions. Configure and test local development from a local frontend origin.

The frontend does not deploy or provision the backend/database. The API address is saved locally per browser. Demo mode never pretends that sample posts are live server data. Real tokens remain in memory; reload requires another sign-in. Backend logout revokes all sessions for that account.

The editor intentionally handles plain text, with paragraphs and line breaks. Existing HTML content is displayed as text rather than executed. Rich text, uploads, password-reset email, scheduling, user administration, and category management are outside this version's scope. The backend must enforce permissions; hiding UI controls is not an authorization boundary.

## Tests

Requires Node.js 22+ (development tests only).

```sh
npm ci
npm run check
npm test
```

The DOM tests exercise search, draft save, publish, comments, moderation, delete, and escaping. Client tests cover concurrent token refresh, failed refresh, connection validation, and network errors. These are not browser-rendering tests.

To run the real API integration test, use a disposable database named `scribeboard_test` with backend migrations applied:

```sh
SCRIBE_BACKEND_DIR=/absolute/path/to/scribeboard-main \
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/scribeboard_test \
node --test tests/integration.test.js
```

It exercises the actual frontend API client against Express and PostgreSQL, creates its own temporary user/posts, and removes them afterward. Without `SCRIBE_BACKEND_DIR`, this integration test is skipped by `npm test`.

## Hosting

Deploy `dist/` to any static host. Hash routing requires no server fallback configuration. `.openai/hosting.json` identifies the private Sites deployment; omit that file if using another host. No backend secrets belong in frontend source.

Validation performed: five client/DOM tests and the real API integration test passed. Visual browser QA was unavailable in the build environment; verify mobile layouts and your deployment's CORS configuration in a browser before making the app public.
