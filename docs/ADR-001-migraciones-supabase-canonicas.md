# ADR-001: Fuente canónica de migraciones Supabase (HOSIX)

## Estado

Aceptado — 2026-04-12

## Contexto

Existían definiciones duplicadas o solo en `supabase/code/supabase/migrations/` (p. ej. laboratorio ASIS), mientras el CLI de Supabase y CI suelen aplicar solo `supabase/migrations/`. Eso provocaba **drift**: entornos sin tablas `hosix_laboratorio_*` aunque el código React ya las consumía.

## Decisión

1. **`supabase/migrations/`** es la **única fuente canónica** aplicada por `supabase db push` / migraciones del proyecto enlazado.
2. Los archivos bajo `supabase/code/supabase/migrations/` quedan como **referencia histórica** hasta que se fusionen o eliminen de forma explícita (otro ADR o PR dedicado).
3. La carpeta anidada `supabase/migrations/supabase/migrations/` debe **vacarse o fusionarse** hacia el padre en un PR aparte (riesgo de orden de timestamps).

## Consecuencias

- Toda nueva tabla HOSIX debe llegar como archivo timestamped bajo `supabase/migrations/`.
- Si se copia contenido desde `supabase/code/`, las migraciones deben ser **idempotentes** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`, etc.).
