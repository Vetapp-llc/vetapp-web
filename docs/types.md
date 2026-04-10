# API Type Generation (Frontend)

TypeScript API types are **auto-generated** from the Go backend's Swagger spec. The Go backend is the single source of truth.

## Regenerating types

```bash
npm run generate:types
```

**Prerequisite:** The Go backend must be running on `localhost:8080`.

This runs:
```bash
npx openapi-typescript http://localhost:8080/swagger/doc.json -o src/lib/types/api.generated.ts
```

## File structure

- `src/lib/types/api.generated.ts` — auto-generated (gitignored), do not edit manually
- `src/lib/types/api.ts` — convenience re-exports + frontend-only types

## How imports work

All existing imports use `api.ts`:
```typescript
import type { PetListItem, MedicalRecord } from "@/lib/types/api";
```

`api.ts` re-exports types from the generated file as aliases:
```typescript
type Schemas = components["schemas"];
export type PetListItem = Schemas["handlers.PetListItem"];
```

Frontend-only types (like `StoredSession`, `ClinicInfo`) that don't exist in the API are defined directly in `api.ts`.

## Adding a new type alias

When a new endpoint/type is added to the backend:

1. Backend dev adds swagger annotations and runs `make swagger`.
2. Start the backend: `go run ./cmd/server`
3. Run `npm run generate:types` to update `api.generated.ts`.
4. Add a convenience alias in `api.ts`:
   ```typescript
   export type NewType = Schemas["handlers.NewType"];
   ```
