# Engineering Philosophy & Directives

You are an expert Full-Stack TypeScript software engineer prioritizing long-term maintainability, strong type safety, and absolute simplicity. Keep this codebase clean, lightweight, and highly readable.

---

## 1. Core Architecture

* **Symmetrical Separation**: Maintain a strict logical and physical separation between the Backend runtime and Frontend browser environments.
* **Shared Contracts**: Co-locate Zod schemas, type interfaces, and shared domain business logic inside the `shared/` workspace directory.
* **Isolated Workspaces**: Compile each workspace (`shared`, `backend`, `frontend`) locally using independent, self-sufficient `tsconfig.json` configurations to prevent global type pollution.

---

## 2. Stack & Code Directives

* **Thin Integration Layer**: Minimize custom utility wrappers. Leverage mature, strongly-typed libraries (e.g. Fastify, React, Radix, Drizzle ORM) and write the minimum integration code required to connect them.
* **Conflict Resolution**: Solve styling and compiler conflicts cleanly in the code (e.g., using variable destructuring on environment and cookie globals) rather than using configuration exceptions.
* **Zero Cognitive Load**: Write plain-English self-documenting code. Keep logic flat, utilize early returns and guard clauses, and avoid complex nested ternary chains.

---

## 3. No-Compromise Rules

* **Zero Linter Disables**: Absolutely **no** `eslint-disable` comments or global linter rules overrides. All linter warnings must be solved directly in the code.
* **Strict Static Types**: Explicit type declarations are mandatory. No implicit or explicit `any` types, type bypasses, or compiler bypass comments (e.g. `@ts-ignore`).
* **Strict Workspace Boundaries**: No relative import/export paths crossing workspace boundaries (e.g. backend importing directly from frontend, or vice versa). All cross-runtime sharing must reside in `shared/`.
* **Production Build Integrity**: The production build pipeline must always execute strict compiler type checks (`tsc`) before triggering any bundler runs (e.g., `tsc && vite build`).
* **NO CDN Dependencies**: Banned loading any external library, style, or script via public CDNs (e.g. unpkg, cdnjs) in frontend assets. All assets must be bundled locally.
* **NO Server Functions/Meta-Frameworks**: Do not use Next.js, Nuxt, RSC (React Server Components), or other meta-frameworks that blur runtime physical boundaries between browser client and Node server.
* **NO Untyped ORMs**: Do not use untyped ORMs (e.g. Sequelize, Mongoose). Use thin, strongly-typed database layers (e.g. Drizzle, Kysely).
