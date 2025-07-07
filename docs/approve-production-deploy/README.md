# CI / CD Manual‑Approval Pattern (GitHub Actions + AWS SES)

This repository is a **plug‑and‑play blueprint** that adds a human “ship gate” to any production branch:

- `approval-check.yml` ‑ opens an approval issue that lists the exact commits about to be deployed and pauses the workflow until an approver says **approved/denied**.
- `approval-issue-email.yml` ‑ instantly e‑mails the approvers (or any distribution list) when that issue is opened.

> **Why?** — Gives you the safety of a change‑log review plus an out‑of‑band ping, with minimal boilerplate and least‑privilege AWS access.

---

## 1  Folder Structure

```text
.github/
└── workflows/
    ├── approval-check.yml          # main job – creates Issue & waits
    └── approval-issue-email.yml    # notifier – sends e‑mail via SES
```

---

## 2  Prerequisites

| Requirement                          | Why it matters                                                              | Quick check                                        |
| ------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------- |
| **GitHub Actions enabled**           | runs the workflows                                                          | Settings → Actions → General                       |
| **AWS SES – Prod access**            | sends e‑mail to any address                                                 | SES console → Account dashboard – Status ✔         |
| **Verified identity**                | the `From:` address (`ci@example.com`) must be a verified domain or mailbox | SES console → Verified identities – ✔              |
| **Outbound port 587 or 465 allowed** | runner must reach `email-smtp.<region>.amazonaws.com`                       | `nc -vz email-smtp.eu-central-1.amazonaws.com 587` |

---

## 3  AWS Setup (one‑time)

\### 3.1  Create an IAM sender user (least‑privilege)

1. **IAM → Users → Add user**\
   *User name*: `ses-smtp-ci-bot`\
   *Access type*: **Programmatic access**
2. Skip permissions for now.
3. **Create user**, download the *Access key ID* & *Secret access key*.
4. Attach this inline policy (replace account, region, identities):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ses:SendRawEmail",
      "Resource": [
        "arn:aws:ses:eu-central-1:123456789012:identity/example.com",
        "arn:aws:ses:eu-central-1:123456789012:identity/ci@example.com"
      ]
    }
  ]
}
```

\### 3.2  Generate SMTP credentials in the console

SES → **SMTP settings** → *Create SMTP credentials* → choose the user you just created → *Create*.\
Copy the **SMTP username** & **SMTP password** shown **once**.

> These are **not** the IAM keys; SES hashes them for SMTP.

---

## 4  GitHub Secrets

| Secret key                | Value                                         |
| ------------------------- | --------------------------------------------- |
| `SMTP_USER`               | *SMTP username* (starts with `AKIA…`/`ASIA…`) |
| `SMTP_PASS`               | *SMTP password* (44‑char base64)              |
| (*optional*) `RECIPIENTS` | Comma‑separated e‑mail list                   |

Add via **Settings → Secrets and variables → Actions → New secret**.

---

## 5  Workflow Files – How They Work

\### 5.1  `approval-check.yml`

- **Triggers**: push to `main` or manual *Run workflow*.
- **Steps**
    1. Checkout full history.
    2. Compare `HEAD` against `payload.before` (or HEAD’s parent) to build a neat commit list.
    3. Run [`trstringer/manual-approval`](https://github.com/trstringer/manual-approval) which:
        - Opens an Issue titled `[deploy-approval] Production deploy <sha>` with a hidden marker `<!-- deploy-approval -->`.
        - Assigns your approver(s) and pauses until they comment **approved**/**denied**.
- **Customise**\
  *`approvers`*: GitHub usernames or team slugs\
  *`branches`*: update the `on.push.branches` array\
  *`issue-title`****/****`body`*: free‑text, keep the marker if you rely on it elsewhere.

\### 5.2  `approval-issue-email.yml`

- **Trigger**: GitHub `issues` event (type `opened`).
- **Filter**: runs **only** if:
    - Issue author == `github-actions[bot]` **and**
    - Body contains `<!-- deploy-approval -->`.
- **Action**: [`dawidd6/action-send-mail`](https://github.com/dawidd6/action-send-mail) sends an HTML/text mail via SES.
- **Customise**\
  `from`: change display name/address (must match a verified identity)\
  `to`: static list or `${{ secrets.RECIPIENTS }}`\
  `server_address`: choose your SES region\
  `server_port`: `587` (STARTTLS) or `465` (TLS‑wrapper).

---

## 6  End‑to‑End Setup Steps

1. **Fork / clone** this repo.
2. Follow **AWS Setup** (Section 3) and **GitHub Secrets** (Section 4).
3. Commit or copy both workflow files into `.github/workflows/` of your target repo.
4. Push a dummy commit to `main` (or click *Run workflow* on `approval-check`).
5. Check:
    - Issue appears in *Issues* tab, assigned to approver.
    - Approver mail received.
    - Comment `approved` — the workflow resumes; comment `denied` — it cancels.

---

## 7  Troubleshooting

| Symptom                                                            | Likely cause                            | Remedy                                                                                                          |
| ------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Approval Issue created but no e‑mail**                           | Wrong SMTP creds / port blocked         | Test with `openssl s_client -starttls smtp -connect email-smtp.eu-central-1.amazonaws.com:587` or use port 465. |
| **Workflow fails: 403 ‑ “Resource not accessible by integration”** | Workflow token lacks *issues*\*:write\* | The file already sets `permissions.issues: write`; double‑check repo settings.                                  |
| **CLI ****\`\`**** not found**                                     | AWS CLI < 2.31                          | Use console wizard or upgrade CLI.                                                                              |

---

## 8  Extending This Blueprint

- **Deploy after approval** – append deploy steps *after* the `manual-approval` step. They run only if approved.
- **Multiple environments** – duplicate the job with different approver lists / branches.
- **Slack or Teams alerts** – swap `action-send-mail` with a chat‑ops action.

---

## 9  References

- GitHub Actions manual‑approval action: [https://github.com/trstringer/manual-approval](https://github.com/trstringer/manual-approval)
- Send mail action: [https://github.com/dawidd6/action-send-mail](https://github.com/dawidd6/action-send-mail)
- AWS SES SMTP endpoints: [https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- AWS minimal `SendRawEmail` policy: [https://docs.aws.amazon.com/ses/latest/dg/using-ses-iam.html#using-iam-permissions](https://docs.aws.amazon.com/ses/latest/dg/using-ses-iam.html#using-iam-permissions)
- RFC 6409 (port 587): [https://www.rfc-editor.org/rfc/rfc6409](https://www.rfc-editor.org/rfc/rfc6409)

