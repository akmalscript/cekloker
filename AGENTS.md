# Agent Guidelines — CekLoker

This document outlines instructions and standards for AI coding assistants working in the **CekLoker** repository.

---

## 1. Git Commit Message Conventions

All agents **MUST** follow a strict conventional commit format **without scopes**. Consistency is essential for clean collaboration and history readability.

### Format

```text
<type>: <short imperative description>

[optional longer description / body explaining why and what changed]
```

### Strict Rules

1. **NEVER use scopes in parentheses (`(scope)`):**
   - ✅ **CORRECT:** `feat: add result.html prototype with interactive red flag bounding boxes`
   - ❌ **INCORRECT:** `feat(proto): add result.html prototype with interactive red flag bounding boxes`
   - ❌ **INCORRECT:** `feat(ui): add result.html ...`
   - ❌ **INCORRECT:** `fix(api): handle missing image upload ...`
2. **Use imperative mood in lowercase** for the commit subject:
   - Use `"add"`, `"fix"`, `"update"`, `"remove"`, `"refactor"`.
   - Avoid past tense (`"added"`, `"fixed"`) or third-person (`"adds"`, `"fixes"`).
3. **No trailing punctuation:** Do not end the commit subject with a period (`.`).
4. **Subject line length:** Keep the first line under 72 characters when possible.
5. **Body (optional):** If additional context is needed, separate the subject from the body with a blank line.

### Allowed Types

| Type       | Usage                                                     | Example                                                     |
| :--------- | :-------------------------------------------------------- | :---------------------------------------------------------- |
| `feat`     | New feature or user-facing addition                       | `feat: add interactive bounding boxes for scam flags`       |
| `fix`      | Bug fix or visual correction                              | `fix: correct red flag badge alignment on mobile screens`   |
| `docs`     | Documentation changes only                                | `docs: update setup steps in services/ai readme`            |
| `style`    | Formatting or styling without logic changes               | `style: reformat tailwind classes in login page`            |
| `refactor` | Code restructuring without adding features or fixing bugs | `refactor: simplify bounding box coordinate calculation`    |
| `perf`     | Performance improvements                                  | `perf: optimize image preprocessing before model inference` |
| `test`     | Adding or modifying tests                                 | `test: add unit test for gemini scam analysis parser`       |
| `chore`    | Maintenance, configuration, dependencies, or tooling      | `chore: update python dependencies in services/ai`          |

---

## 2. Repository Overview & Architecture

- `prototypes/`: Standalone HTML + Tailwind CSS mockups/prototypes for fast UI testing.
- `apps/web/`: Web application frontend & backend.
- `services/ai/`: FastAPI microservice for AI scam detection and OCR analysis.
- `docs/`: Product documentation and SRS files.

---

## 3. General Agent Behavior

- **Atomic Commits:** Prefer small, single-purpose commits over giant multi-feature commits.
- **Explain Intent:** When generating commit messages or making changes, focus on the _why_ and the _impact_.
- **Preserve Existing Structure:** Do not rearrange existing files or directories without explicit user instruction.

## 4. Boundaries

- Never commit `.env`, API keys, or real user screenshots.
- Do not edit `docs/` unless requested.

## 5. Language

- Code, comments, commits: English. UI copy: Indonesian.
