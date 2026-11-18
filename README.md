# 📝 ScribeBoard

A full-stack blog CMS with a responsive writing interface, a REST API, role-based publishing workflows, and secure browser sessions. The frontend and backend are deployed separately on Render from this repository, while application data is stored in PostgreSQL.

## 🌐 Live Application

- **Frontend:** https://scribeboard-urif.onrender.com
- **API:** https://scribeboard-api.onrender.com/api/v1

## ✨ Features

- **User Roles**: Admin, Editor, Author, Reader
- **Blog Posts**: Full CRUD with safe plain-text content
- **Publishing Workflow**: Draft → Review → Publish → Unpublish
- **Categories & Tags**: Organize content effectively
- **Comment System**: Nested comments with moderation
- **Search & Filter**: Find posts by category, tag, author, or keyword
- **Pagination**: Efficient data loading
- **Revision History**: Track post changes
- **Responsive Frontend**: Explore stories, write drafts, publish, and moderate comments
- **Persistent Login**: Secure HttpOnly refresh cookie restores browser sessions after reload

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| PostgreSQL | Database |
| Prisma | ORM |
| JWT | Authentication |
| HTML, CSS & JavaScript | Responsive Frontend |
| Joi | Validation |
| Helmet | Security |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Clone repository
git clone https://github.com/coder21-sp/scribeboard-main.git
cd scribeboard-main

# Run setup script
chmod +x setup.sh
./setup.sh

# Or on Windows PowerShell
.\setup.ps1

# Start development server
npm run dev
```

### Manual Setup

```bash
# Install dependencies
npm install

# Create .env file
cp env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database
npm run db:seed

# Start server
npm run dev
```

## 🖥️ Frontend

The production-ready static frontend is in `frontend/dist`. It connects to the deployed API by default and includes public reading and search, account registration and login, draft editing, publishing, comment moderation for editors/admins, and persistent login after page refresh.

Open `frontend/dist/index.html` through a local HTTP server for development. Use the Settings screen to connect it to another ScribeBoard API deployment.

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh-tokens | Refresh tokens |
| POST | /api/v1/auth/logout | Logout |
| GET | /api/v1/auth/profile | Get profile |
| PATCH | /api/v1/auth/profile | Update profile |
| POST | /api/v1/auth/change-password | Change password |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/posts | List posts (with filters) |
| GET | /api/v1/posts/:id | Get single post |
| POST | /api/v1/posts | Create post (draft) |
| PATCH | /api/v1/posts/:id | Update post |
| DELETE | /api/v1/posts/:id | Delete post |
| POST | /api/v1/posts/:id/publish | Publish post |
| POST | /api/v1/posts/:id/unpublish | Unpublish post |
| POST | /api/v1/posts/:id/submit-review | Submit for review |
| GET | /api/v1/posts/:id/revisions | Get revision history |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/categories | List categories |
| GET | /api/v1/categories/:id | Get category |
| POST | /api/v1/categories | Create category |
| PATCH | /api/v1/categories/:id | Update category |
| DELETE | /api/v1/categories/:id | Delete category |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/posts/:postId/comments | Get post comments |
| POST | /api/v1/posts/:postId/comments | Add comment |
| GET | /api/v1/comments | List all comments (admin) |
| POST | /api/v1/comments/:id/approve | Approve comment |
| POST | /api/v1/comments/:id/reject | Reject comment |
| POST | /api/v1/comments/:id/spam | Mark as spam |
| DELETE | /api/v1/comments/:id | Delete comment |

### Authors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/authors/:id | Get author profile |
| GET | /api/v1/authors/:id/posts | Get author's posts |

## 🔍 Query Parameters

### Posts

```bash
# Filter by status
GET /api/v1/posts?status=PUBLISHED

# Filter by category
GET /api/v1/posts?category=technology

# Filter by tag
GET /api/v1/posts?tag=nodejs

# Search
GET /api/v1/posts?search=javascript

# Featured posts
GET /api/v1/posts?featured=true

# Pagination
GET /api/v1/posts?page=1&limit=10

# Sort
GET /api/v1/posts?sort=-publishedAt  # Newest first
GET /api/v1/posts?sort=title          # A-Z
```

## 📂 Project Structure

```
scribeboard/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Seed data
├── src/
│   ├── config/            # Configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Helpers
│   ├── validators/        # Joi schemas
│   ├── app.js             # Express app
│   └── server.js          # Entry point
├── frontend/
│   ├── dist/              # Deployable frontend
│   └── tests/             # Frontend and integration tests
├── env.example
├── tests/                 # API integration tests
├── package.json
└── README.md
```

## 🔄 Publishing Workflow

```
┌─────────┐     ┌─────────────────┐     ┌───────────┐
│  DRAFT  │────▶│ PENDING_REVIEW  │────▶│ PUBLISHED │
└─────────┘     └─────────────────┘     └─────┬─────┘
     │                                        │
     │                                        ▼
     │                               ┌─────────────┐
     └──────────────────────────────▶│ UNPUBLISHED │
                                     └─────────────┘
```

| Status | Description |
|--------|-------------|
| DRAFT | Work in progress, not visible to public |
| PENDING_REVIEW | Submitted for editor review |
| PUBLISHED | Live and visible to public |
| UNPUBLISHED | Removed from public but not deleted |
| ARCHIVED | Long-term storage |

## 🛡️ User Roles

| Role | Permissions |
|------|-------------|
| ADMIN | Full access, manage users |
| EDITOR | Manage all posts, moderate comments, manage categories |
| AUTHOR | Create/edit own posts, comment |
| READER | View posts, comment (when logged in) |

## 📝 Example Requests

### Login
```bash
curl -X POST http://localhost:3003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"author@scribeboard.com","password":"Admin@123"}'
```

### Create Post
```bash
curl -X POST http://localhost:3003/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "content": "This is the content of my blog post...",
    "categoryId": "CATEGORY_ID",
    "tags": ["tutorial", "beginner"]
  }'
```

### Publish Post
```bash
curl -X POST http://localhost:3003/api/v1/posts/POST_ID/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Comment
```bash
curl -X POST http://localhost:3003/api/v1/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great article!"}'
```

## 📄 License

MIT

---

Made with ❤️ for content creators


## Verified permissions and testing

This API uses **PostgreSQL and Prisma**, not MongoDB. Public signup always creates an AUTHOR. Authors can manage their own posts and publish them; editors/admins can moderate comments. The current workflow permits authors to publish directly; review submission is optional, and scheduled publishing is not implemented.

Drafts are visible by ID/slug only to their author or editors/admins. List/search filters preserve the public-or-own visibility rule. GET `/api/v1/posts/mine` lists the authenticated user's posts. Public comment responses omit guest email, IP address, user agent and moderator IDs. Comments require moderation unless `AUTO_APPROVE_COMMENTS=true`.

Access and refresh tokens are unique and stored for revocation. Logout revokes all of that user's sessions; password changes revoke existing sessions too. Existing access tokens issued before this change are not in the token table: log in again after upgrading. No schema change is required.

To run regression tests, create a disposable PostgreSQL database named `scribeboard_test`, set DATABASE_URL to it, then run:

```sh
npm ci
npm run db:generate
npm run db:push
npm test
```

Never point tests or seed scripts at production data. Tests cover signup role injection, repeated login, draft visibility by ID/slug and query filters, edit ownership and rollback, tag responses, comment moderation/privacy, refresh-token races, logout and password revocation. Post edits update revisions and tags in the same transaction. Multi-field sorting is supported.

For production, set distinct JWT_ACCESS_SECRET and JWT_REFRESH_SECRET values of at least 32 characters. The static frontend is served from `frontend/dist` and must use an API origin allowed by `CORS_ORIGIN`.


### Persistent browser sessions

Browser clients send `X-Scribe-Session: cookie` and credentials with auth requests. The server requires an exact match with `CORS_ORIGIN`, places the rotating refresh token in an HttpOnly cookie, and omits it from browser JSON responses. Production cookies are Secure, SameSite=None, Partitioned, scoped to `/api/v1/auth`, and expire with the refresh JWT. This supports the frontend/API on separate Render sites in browsers supporting partitioned cookies. Access tokens stay in memory; reload calls refresh then profile. Logout revokes all user sessions and expires the cookie. Legacy explicit JSON refresh-token clients remain supported. No database migration is needed. Existing users must sign in once after this release to establish the cookie.

Validation: 7 backend tests, 8 frontend/client tests, and a real Chromium cross-site HTTPS reload/second-tab/logout check passed against a disposable PostgreSQL database.
