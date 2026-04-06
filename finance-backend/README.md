# Finance Data Processing and Access Control Backend
Finance Data Processing and Access Control Backend — A REST API for managing financial records with role-based access control, aggregated analytics, and audit logging.

## Tech Stack
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | HTTP server and routing |
| MongoDB | Database |
| Mongoose | ODM and schema layer |
| JWT (`jsonwebtoken`) | Authentication |
| `bcryptjs` | Password hashing |
| `express-validator` | Request validation |
| `express-rate-limit` | Auth route throttling |
| Jest | Test runner |
| Supertest | HTTP integration testing |

## Features
- JWT authentication
- Role-based access control (viewer / analyst / admin) via middleware factory pattern
- Financial transaction CRUD with soft delete
- Filtering by type, category, date range, tags, full-text search on description
- Pagination on all list endpoints
- Dashboard summary, trends, category breakdown, recent activity
- Budget management with monthly limit alerts
- Audit logging on all write operations (append-only)
- CSV export for transactions
- Rate limiting on auth routes
- Input validation via express-validator
- Integration tests (Jest + Supertest + mongodb-memory-server)

## Project Structure
```text
finance-backend/
├── src/
│   ├── config/
│   │   ├── config.js                    # Environment loading
│   │   └── db.js                        # MongoDB connection
│   ├── models/
│   │   ├── User.js                      # User schema and password serialization rules
│   │   ├── Transaction.js               # Transaction schema, indexes, soft-delete hooks
│   │   ├── AuditLog.js                  # Audit log schema with dynamic entity references
│   │   └── Budget.js                    # Budget schema for category monthly limits
│   ├── middleware/
│   │   ├── authenticate.js              # JWT verification, attaches req.user
│   │   ├── authorize.js                 # RBAC factory: authorize("admin", "analyst")
│   │   ├── errorHandler.js              # Global error normalization and response handling
│   │   ├── rateLimiter.js               # Auth route rate limiting
│   │   ├── validate.js                  # express-validator result handler
│   │   └── validators/
│   │       ├── auth.validator.js        # Register/login request rules
│   │       ├── transaction.validator.js # Transaction create/update rules
│   │       ├── user.validator.js        # User role/status update rules
│   │       └── budget.validator.js      # Budget create/update rules
│   ├── controllers/
│   │   ├── auth.controller.js           # register, login, getMe
│   │   ├── user.controller.js           # getUsers, updateRole, updateStatus
│   │   ├── transaction.controller.js    # CRUD + CSV export
│   │   ├── dashboard.controller.js      # summary, trends, category breakdown, alerts
│   │   ├── budget.controller.js         # budget CRUD handlers
│   │   └── audit.controller.js          # audit log listing
│   ├── services/
│   │   ├── auth.service.js              # JWT and authentication business logic
│   │   ├── user.service.js              # User management logic
│   │   ├── transaction.service.js       # Transaction logic + audit logging
│   │   ├── dashboard.service.js         # Aggregation pipelines and dashboard analytics
│   │   ├── budget.service.js            # Budget logic + audit logging
│   │   └── audit.service.js             # Audit query filtering and pagination
│   ├── routes/
│   │   ├── auth.routes.js               # Auth endpoints
│   │   ├── user.routes.js               # Admin user management endpoints
│   │   ├── transaction.routes.js        # Transaction CRUD and export endpoints
│   │   ├── dashboard.routes.js          # Dashboard analytics endpoints
│   │   ├── budget.routes.js             # Budget management endpoints
│   │   └── audit.routes.js              # Audit log endpoints
│   ├── utils/
│   │   ├── paginate.js                  # Pagination helper
│   │   ├── buildFilter.js               # Transaction query filter builder
│   │   ├── csvExport.js                 # CSV serializer for transactions
│   │   ├── catchAsync.js                # Async controller wrapper
│   │   └── appError.js                  # Operational error class
│ 
├── test/
│   ├── helpers/
│   │   ├── auth.js                      # Test auth helpers
│   │   ├── db.js                        # mongodb-memory-server setup/teardown
│   │   └── seed.js                      # Seed users and test data helpers
│   ├── auth.test.js                     # Auth integration tests
│   ├── transaction.test.js              # Transaction integration tests
│   └── dashboard.test.js                # Dashboard integration tests
├── docs/
│   ├── postman-collection.json                  # Render/deployed Postman collection
│   └── postman-collection.localhost.json        # Localhost Postman collection
├── .env.example
├── README.md
├── app.js                               # Express app composition
└── server.js                            # Process entrypoint
```

## Role & Permission Matrix
| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| Register / login | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes |
| List transactions | Yes | Yes | Yes |
| View single transaction | Yes | Yes | Yes |
| Search & filter transactions | Yes | Yes | Yes |
| Export CSV | No | Yes | Yes |
| Create transaction | No | No | Yes |
| Update transaction | No | No | Yes |
| Delete transaction | No | No | Yes |
| Dashboard summary | Yes | Yes | Yes |
| Trends | No | Yes | Yes |
| Category breakdown | No | Yes | Yes |
| Budget alerts | No | Yes | Yes |
| List users | No | No | Yes |
| Update role / status | No | No | Yes |
| View audit logs | No | No | Yes |
| Manage budgets | No | No | Yes |

## API Reference
Base URL: `/api/v1/finance-backend`

### Auth
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Authenticate and receive a JWT | Public |
| GET | `/auth/me` | Return the authenticated user's profile | Private |

### Users
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users` | List users with pagination | Admin |
| PATCH | `/users/:id/role` | Update a user's role | Admin |
| PATCH | `/users/:id/status` | Activate or deactivate a user | Admin |

### Transactions
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/transactions` | List transactions with filters and pagination | Viewer, Analyst, Admin |
| GET | `/transactions/:id` | Fetch a single transaction | Viewer, Analyst, Admin |
| POST | `/transactions` | Create a transaction | Admin |
| PUT | `/transactions/:id` | Update a transaction | Admin |
| DELETE | `/transactions/:id` | Soft-delete a transaction | Admin |
| GET | `/transactions/export` | Export filtered transactions as CSV | Analyst, Admin |

#### GET `/transactions` Query Parameters
| Parameter | Type | Description |
|---|---|---|
| `type` | string | Filter by `income` or `expense` |
| `category` | string | Filter by category |
| `startDate` | ISO 8601 date | Lower bound for transaction date |
| `endDate` | ISO 8601 date | Upper bound for transaction date |
| `search` | string | Case-insensitive search over `description` and `tags` |
| `tags` | comma-separated string | Require all listed tags |
| `page` | integer | Page number, default `1` |
| `limit` | integer | Page size, default `20`, max `100` |

### Dashboard
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/dashboard/summary` | Return total income, expenses, and net balance | Viewer, Analyst, Admin |
| GET | `/dashboard/trends` | Return monthly income and expense totals | Analyst, Admin |
| GET | `/dashboard/category-breakdown` | Return expense totals grouped by category | Analyst, Admin |
| GET | `/dashboard/recent-activity` | Return recent transactions | Viewer, Analyst, Admin |
| GET | `/dashboard/budget-alerts` | Return categories over monthly budget | Analyst, Admin |

`GET /dashboard/trends` supports `?months=` and caps the value at `24`.

### Budgets
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/budgets` | List budgets with pagination | Admin |
| POST | `/budgets` | Create a budget | Admin |
| PUT | `/budgets/:id` | Update a budget | Admin |
| DELETE | `/budgets/:id` | Delete a budget | Admin |

### Audit
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/audit` | List audit logs with pagination and optional filters | Admin |

## Setup & Running Locally
### Prerequisites
- Node.js v18+
- MongoDB

### Steps
```bash
git clone <repository-url>
cd finance-backend
npm install
cp .env.example .env
npm run dev
```

The server defaults to `http://localhost:7500`.

`DATABASE` should contain a MongoDB URI template with a `<PASSWORD>` placeholder. `DATABASE_PASSWORD` is injected into that placeholder at runtime.

`npm test` uses `mongodb-memory-server` and does not require a live MongoDB instance.

## Environment Variables
| Variable | Description |
|---|---|
| `PORT` | HTTP port for the API server |
| `DATABASE` | MongoDB connection string template containing `<PASSWORD>` |
| `DATABASE_PASSWORD` | Password substituted into `DATABASE` |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime passed to `jsonwebtoken` |
| `NODE_ENV` | Runtime mode, typically `development` or `production` |

## Running Tests
```bash
npm test
```

The test suite currently has 3 suites and 22 passing tests.

Tests use `mongodb-memory-server`, so no live database is required.

The `--experimental-vm-modules` flag is required for ES modules and is already included in the `npm test` script.

## Architecture Decision Records (ADRs)
### ADR-001: Node.js + Express + MongoDB
Decision: Use Node.js + Express + MongoDB.

Reasoning: Flexible schema suits transactions with optional fields/tags; aggregation pipeline is ideal for dashboard analytics.

Tradeoff: PostgreSQL would provide stronger referential integrity. That tradeoff is accepted and documented.

### ADR-002: Layered Architecture (Routes -> Controllers -> Services -> Models)
Decision: Use a layered architecture: Routes -> Controllers -> Services -> Models.

Reasoning: Controllers are thin: parse `req`, call a service, and send `res`. All business logic lives in services, which makes services independently testable.

Tradeoff: The structure adds more files and indirection, but keeps responsibilities explicit.

### ADR-003: RBAC via Middleware Factory
Decision: Implement role-based access control through `authorize(...roles)`.

Reasoning: `authorize(...roles)` is composable, access rules stay co-located with route definitions, and the permission surface is easy to audit.

Tradeoff: Access is enforced at the route layer rather than inside services.

### ADR-004: Soft Deletes on Transactions
Decision: Use soft deletes for transactions.

Reasoning: Financial records should not be permanently destroyed. Audit logs can continue to reference deleted transactions, and all queries filter `isDeleted: false` by default via a Mongoose pre-hook.

Tradeoff: Query behavior is slightly more complex because delete state must be handled consistently.

### ADR-005: Audit Logging as Separate Collection
Decision: Store audit logs in a separate collection.

Reasoning: Finance systems require traceability. Keeping logs separate keeps the transaction schema clean.

Tradeoff: Every write triggers a second database write, which is acceptable at this scale.

### ADR-006: MongoDB Aggregation Pipeline for Dashboard
Decision: Compute dashboard data with MongoDB aggregation pipelines.

Reasoning: Computation stays server-side and is more efficient than in-memory JavaScript for large datasets. All aggregation logic is isolated in `DashboardService`.

Tradeoff: Aggregation pipelines are more verbose than equivalent in-memory transformations.

### ADR-007: Rate Limiting on Auth Routes
Decision: Rate-limit authentication routes.

Reasoning: The current implementation uses the default in-memory store.

Tradeoff: It resets on restart and does not work across multiple instances. A Redis-backed store would be required for production.

### ADR-008: toJSON Transform for Response Serialization
Decision: Strip the password at the model layer using `toJSON` / `toObject` transforms.

Reasoning: Password stripping is centralized instead of being reimplemented in each controller response. Adding or removing fields does not require touching every controller.

Tradeoff: Response shape is partially defined at the model layer, not only at the controller layer.

### ADR-009: AuditLog `entityId` Uses `refPath` for Dynamic Population
Decision: Use `refPath: "entity"` for `AuditLog.entityId`.

Reasoning: `refPath: "entity"` allows Mongoose to resolve the correct collection at runtime based on the `entity` field value. It supports `Transaction`, `User`, and `Budget`.

Tradeoff: The enum must stay in sync with model names.

## Assumptions & Tradeoffs
- Registration defaults to viewer role — role elevation requires admin action
- Soft-deleted transactions excluded from all dashboard calculations
- Audit logs are append-only — no delete endpoint even for admins, by design
- Budget alerts are informational only — does not block transaction creation
- Rate limiting uses in-memory store — known limitation for multi-instance deployments
- No email verification — would require SMTP infrastructure, out of scope
- CSV export builds in memory — streaming approach better for large datasets, not implemented for simplicity

## API Testing
Postman collections are included at:

- `docs/postman-collection.json` for the deployed Render API
- `docs/postman-collection.localhost.json` for local development on `http://localhost:7500`

It covers all routes, all three roles, and edge cases (`403`, `401`, `400`, `404`, `409`).

Collection variables auto-capture tokens and IDs from test scripts.

## Live Demo
Base URL: `https://zorvyn-finance-backend-29i4.onrender.com/api/v1/finance-backend`

Note: deployed on Render free tier, may take 30-50 seconds to cold start.
