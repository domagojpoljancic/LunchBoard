# Agents

The human says **start with auto model** or runs **`/build-lunchboard`**. The Orchestrator does the rest.

| Role | Spec | Responsibility |
| --- | --- | --- |
| Orchestrator | `agents/orchestrator.md` | Run `prompts/execute.md` until the app is done |
| Product guardian | `agents/product_guardian.md` | Keep the build inside the locked product |
| Backend | `agents/backend_agent.md` | Data, list math, auth, tests |
| Content chef | `agents/content_chef_agent.md` | Twelve seed meals |
| Principal UX / frontend | `agents/ux_frontend_agent.md` | The board, library, lists, and cook view |
| QA | `agents/qa_agent.md` | Acceptance against `docs/07-definition-of-done.md` |

Rules: `CURSOR_RULES.md`. Map: `PLAN.md`. Build steps: `prompts/execute.md`.
