# EduSphere AI — Error & Solution Log

> Never delete historical entries.
> Every implementation error that affects development must be recorded.

## Error ID Format

`ERR-###`

## Entry Template

```markdown
### ERR-XXX — Short description

- **Date:** YYYY-MM-DDTHH:MM:SSZ (ISO 8601)
- **Task:** EDU-XXX
- **Severity:** LOW / MEDIUM / HIGH / CRITICAL
- **Status:** OPEN / SOLVED / WONT_FIX
- **Environment:** local / CI / staging / production
- **Symptom:**
- **Exact error:**
- **Reproduction:**
- **Root cause:**
- **Solution:**
- **Files changed:**
- **Verification:**
- **Prevention rule:**
- **Related decision/task:** DEC-XXX / EDU-XXX
- **Related activity:** PROJECT_CONTEXT.md entry [YYYY-MM-DD HH:MM]
```

---

## ERR-INDEX

| Error ID | Date | Task | Summary | Status |
|---|---|---|---|---|
| — | — | — | No errors recorded yet | — |

---

## Error Records

No errors have been encountered yet. This section will be populated as implementation progresses.

---

## Important Recording Rules

When an error is solved, do not only write "fixed".

Record:
1. **What failed** — the visible symptom
2. **Why it failed** — the root cause
3. **What changed** — the exact solution
4. **How it was verified** — tests, checks, manual verification
5. **How to prevent recurrence** — prevention rule or pattern

If the error reveals a reusable engineering lesson, also update `PROJECT_MEMORY.md` with the architectural or technical insight.

Cross-reference:
- Link from `PROJECT_CONTEXT.md` to the ERR-ID
- Link from `PROGRESS.md` task to the ERR-ID if it blocked progress
- Link from this file to relevant decision IDs (DEC-XXX)

---

## Error Severity Guidelines

**CRITICAL:** System cannot function, data at risk, security breach, production down
- Example: Database credentials exposed, RLS completely broken, data loss

**HIGH:** Major feature broken, significant security issue, deployment blocked
- Example: Authentication fails, build broken, cross-tenant data leak

**MEDIUM:** Feature partially broken, development blocked, test failures, non-critical security issue
- Example: TypeScript errors, failing tests, linting issues, minor XSS vector

**LOW:** Minor issue, documentation gap, code smell, performance degradation
- Example: Console warnings, missing type annotation, slow query

---

## State File Cross-Reference

- Long-term memory: `PROJECT_MEMORY.md`
- Task status: `PROGRESS.md`
- Detailed change log: `PROJECT_CONTEXT.md`
- AI operating rules: `01_AI_BUILD_RULES.md`
