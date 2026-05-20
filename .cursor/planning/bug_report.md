# Bug Report — Lucky Draw SaaS

> Log every bug here so Cursor agents can fix them without losing context.  
> Reference bugs in prompts: `Fix BUG-001 from @.cursor/planning/bug_report.md`

---

## How to use

1. **Found a bug?** Add a row to **Open bugs** below.
2. **Fixed?** Move to **Resolved** with fix notes and phase.
3. **Regressions?** Re-open with new ID (e.g. `BUG-001-R1`).

### Severity

| Level      | Meaning                                  |
| ---------- | ---------------------------------------- |
| `critical` | Blocks release / data loss / auth bypass |
| `high`     | Major feature broken                     |
| `medium`   | Workaround exists                        |
| `low`      | Cosmetic / minor UX                      |

### Status

`open` · `in_progress` · `resolved` · `wont_fix`

---

## Open bugs

| ID     | Phase | Severity | Summary | Steps to reproduce | Expected | Actual | Notes |
| ------ | ----- | -------- | ------- | ------------------ | -------- | ------ | ----- |
| _none_ | —     | —        | —       | —                  | —        | —      | —     |

---

## In progress

| ID     | Assignee / session | Started |
| ------ | ------------------ | ------- |
| _none_ | —                  | —       |

---

## Resolved

| ID     | Phase | Severity | Summary | Fix | Resolved date |
| ------ | ----- | -------- | ------- | --- | ------------- |
| _none_ | —     | —        | —       | —   | —             |

---

## Template (copy for new bugs)

```markdown
### BUG-XXX

- **Phase:**
- **Severity:** medium
- **Status:** open
- **Summary:**
- **Steps to reproduce:**
  1.
  2.
- **Expected:**
- **Actual:**
- **Environment:** local / staging / prod
- **Screenshots / logs:**
- **Related files:**
```

---

## Auth-specific bug checklist (Phase 2+)

Use when testing Google OAuth:

- [ ] Redirect URI mismatch (`redirect_uri_mismatch`)
- [ ] Google sign-in works but no tenant assigned
- [ ] Duplicate user created (email exists + Google new account)
- [ ] Session lost after OAuth callback
- [ ] RBAC wrong after Google login
- [ ] `accounts` table missing or duplicate provider rows

---

## Regression log

| Date   | Bug ID | What regressed | Phase |
| ------ | ------ | -------------- | ----- |
| _none_ | —      | —              | —     |
