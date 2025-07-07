# CI / CD Manual‑Approval Gate (GitHub Actions)

This repo is a **ready‑to‑drop‑in template** that adds a human “ship gate” to your production branch. One workflow file (`approval-check.yml`) opens a GitHub Issue showing the exact commits that will be deployed and pauses the pipeline until an approver comments **approved** or **denied**.

> **Why?** — Gives you a quick, auditable checkpoint between “merge to main” and “deploy to prod”, using only built‑in GitHub features—no extra services, no outgoing e‑mail setup.

---

## 1  Folder Structure

```text
.github/
└── workflows/
    └── approval-check.yml          # main job – creates Issue & waits
```

---

## 2  Prerequisites

| Requirement                                      | Why it matters             | Quick check                    |
| ------------------------------------------------ | -------------------------- | ------------------------------ |
| **GitHub Actions enabled**                       | runs the workflow          | Settings → Actions → General   |
| **Repo owner has email or web notifications ON** | so approvers see the Issue | GitHub profile → Notifications |

> *If approvers have disabled issue notifications, make sure they watch the repo or rely on another alerting channel.*

---

## 3  Workflow‑internal Logic (`approval-check.yml`)

| Step                                    | What it does                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **checkout**                            | Fetches full history so we can diff commits.                                                                     |
| **Collect commit list (github‑script)** | Compares `HEAD` of the push with the previous commit (`payload.before`). Produces a neat bullet list of commits. |
| **manual‑approval action**              | Opens an Issue titled `[deploy‑approval] Production deploy <sha>` that:                                          |

1. embeds the commit list
2. assigns/mentions the approvers you list
3. blocks the job until an approver comments `approved` (or a denial word). |

### Key inputs to tweak

| Where                        | Name                                                 | Description                                                                                   |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `on.push.branches`           | target branches                                      | Default = `main`. Change if your prod branch differs.                                         |
| `approvers`                  | comma‑separated GitHub usernames or `org/team‑slug`s | People/teams allowed to approve.                                                              |
| `issue‑title` / `issue‑body` | free text                                            | Keep the `<!-- deploy‑approval -->` marker if you build other automations that search for it. |
| `minimum‑approvals`          | integer                                              | `1` by default. Increase for multi‑sign‑off.                                                  |

---

## 4  How to Use

1. **Copy** `approval-check.yml` into `.github/workflows/` of your repository.
2. Commit & push (or click *Run workflow* → *Run*).
3. On every push to `main`:
    1. Workflow opens an Issue and assigns approvers.
    2. GitHub automatically mails / notifies those users.
    3. The pipeline pauses until someone comments `approved` (or a denial word). You can chain your deploy steps **after** the manual‑approval step so they run only when approved.

---

## 5  Extending the Pattern

| Goal                                       | How                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deploy after approval**                  | Add your deploy job/steps **after** the `manual-approval` step in the same job, or in a downstream job that needs it.                           |
| **Multiple environments**                  | Duplicate the job with filters like `branches: [staging]`, different approvers, etc.                                                            |
| **External alerts (e.g. Slack, SES mail)** | Add a second workflow triggered by `issues.opened` that filters for the `<!-- deploy‑approval -->` marker and posts to your chat/e‑mail system. |

---

## 6  Troubleshooting

| Symptom                                                         | Likely cause                       | Fix                                                                                   |
| --------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| Workflow fails with `Resource not accessible by integration`    | `issues: write` permission missing | File already sets it; ensure repo / org policy doesn’t override.                      |
| Issue opens but pipeline never resumes after `approved` comment | Comment text not matched           | Use one of the default words `approved`, `approve`, `lgtm`, `yes` (case‑insensitive). |
| Approvers don’t get e‑mails                                     | They disabled GitHub notifications | Check their Notification settings or add an external alert workflow.                  |

---

## 7  References

- **manual‑approval action** – [https://github.com/trstringer/manual-approval](https://github.com/trstringer/manual-approval)
- **GitHub docs: job permissions** – [https://docs.github.com/actions/using-jobs/assigning-permissions-to-jobs](https://docs.github.com/actions/using-jobs/assigning-permissions-to-jobs)
- **Commit comparison API** – [https://docs.github.com/rest/repos/commits#compare-two-commits](https://docs.github.com/rest/repos/commits#compare-two-commits)

