# HOW TO BUILD ANY FEATURE — NirmaN
> Your personal guide. You do not need to know how to code.
> Last updated: April 2026

---

## THE GOLDEN RULE

You describe **what you want the product to do**.
The agent figures out everything technical — database, code, security, structure.
You never need to write table names, field types, SQL, or API routes.

---

## THE STARTING MESSAGE (Copy This Every Time)

Paste this at the start of every new Claude conversation — no exceptions:

```
Read these two files completely before doing anything:
- /Users/shawon/Desktop/personal-projects/NirmanApp/NIRMAN_CONTEXT.md
- /Users/shawon/Desktop/personal-projects/NirmanApp/AGENT_RULES.md

These are the source of truth for my project. Once you've read both, help me with:

[YOUR DESCRIPTION GOES HERE — see templates below]

---
MANDATORY AFTER COMPLETION:
When the task is fully done, update NIRMAN_CONTEXT.md with everything
that changed — new files, new data, new rules, new workflows — and confirm:

✅ [Feature name] complete.
Files changed: [list every file]
NIRMAN_CONTEXT.md updated: [list what was added or changed]
```

---

## YOUR DESCRIPTION — TEMPLATES BY SITUATION

Pick the one that matches what you want to do. Fill in the `[ ]` parts only.

---

### SITUATION 1 — New Feature

```
I want to add a new feature to NirmaN.

What I want it to do:
[Describe it like you're explaining to a friend. What happens, 
who does it, what they see, what gets saved.]

Who uses this:
[Project Admin / Shareholder / Super Admin]

Where in the app:
[Which section — e.g. inside a project, on the shareholder 
dashboard, in the super admin panel]

What it should NOT do:
[Any limits — or just write "none"]

Why we need this:
[The problem it solves]
```

**Example:**
```
I want to add a new feature to NirmaN.

What I want it to do:
When a Project Admin visits the construction site, I want them to 
be able to log that visit. They write the date, who went, and what 
they saw. Shareholders can see the completed visits so they know 
the project is being actively checked.

Who uses this:
Project Admin logs visits. Shareholders can only view them.

Where in the app:
Inside the project — new section in the sidebar called "Site Visits"

What it should NOT do:
Shareholders should not be able to add or edit visits — view only.

Why we need this:
Shareholders have no visibility into whether the site is being 
physically monitored. This builds trust.
```

---

### SITUATION 2 — Something Is Broken

```
Something is broken. Here is exactly what happens:

Page or section: [where in the app]
What I did: [what I clicked or typed]
What I expected: [what should have happened]
What actually happened: [what went wrong]
Error message: [paste exactly what you see — on screen or in browser]
```

**Example:**
```
Something is broken. Here is exactly what happens:

Page or section: Expenses page inside the project
What I did: Clicked "Submit for Approval" on a draft expense
What I expected: The expense status changes to "Submitted"
What actually happened: Nothing happened. The button spun and stopped.
Error message: Failed to fetch — 404
```

---

### SITUATION 3 — Change How Something Looks

```
I want to change how something looks. No new data needed.

Page or section: [where in the app]
What it looks like now: [describe current state]
What I want it to look like: [describe what you want]
```

**Example:**
```
I want to change how something looks. No new data needed.

Page or section: Milestones page
What it looks like now: Each milestone just shows the name and dates
What I want it to look like: Add a progress bar under each milestone —
green and full for Completed, blue and half for In Progress, 
grey and empty for Upcoming
```

---

### SITUATION 4 — Add Something Small to an Existing Feature

```
I want to add something small to an existing feature.

Feature: [which existing feature]
What I want to add: [describe it]
Who should see it: [Project Admin / Shareholder / both]
Any rules: [e.g. only show it when status is X, or hide it from shareholders]
```

**Example:**
```
I want to add something small to an existing feature.

Feature: Payment records
What I want to add: A "Reference Number" field — for example a bank 
transaction ID or bKash number. Optional, not required.
Who should see it: Project Admin can add it. Shareholder can see it.
Any rules: None — just store it and display it.
```

---

### SITUATION 5 — Remove or Restrict Something

```
I want to remove or restrict something.

What: [which feature or action]
Current behaviour: [how it works now]
What I want instead: [the new rule]
```

**Example:**
```
I want to remove or restrict something.

What: Deleting a milestone
Current behaviour: Any Project Admin can delete any milestone including 
completed ones
What I want instead: Completed milestones cannot be deleted. Show a 
message explaining why. Upcoming and In Progress can still be deleted.
```

---

## THE PROCESS — WHAT HAPPENS AFTER YOU SEND THE PROMPT

| Step | Who | What happens |
|------|-----|-------------|
| 1 | Agent | Reads NIRMAN_CONTEXT.md and AGENT_RULES.md |
| 2 | Agent | Announces the plan — what it will build and how |
| 3 | You | Review the plan. Say "go ahead" if it looks right. Say what's wrong if it doesn't. |
| 4 | Agent | Builds everything — database, API, page, UI |
| 5 | Agent | Updates NIRMAN_CONTEXT.md |
| 6 | Agent | Confirms done with ✅ and lists every file changed |
| 7 | You | Test it in the browser at http://localhost:3000 |
| 8 | You | If broken, paste the error back and the agent fixes it |

---

## THINGS THAT SLOW EVERYTHING DOWN

| Do this | What happens |
|---------|-------------|
| Describe vaguely | Agent guesses wrong, builds the wrong thing |
| Skip the starting message | Agent has no context, makes mistakes |
| Ask for two unrelated things at once | Agent gets confused — one task per conversation |
| Open a new conversation mid-task | Agent loses memory — start fresh with the starting message |
| Run SQL in Supabase yourself without telling the agent | Source of truth breaks, bugs appear later |

---

## WHAT YOU NEVER NEED TO PROVIDE

The agent works these out on its own from the context files:

- Table names and field types
- Database structure or SQL
- API routes and endpoints
- Security rules (RLS)
- Which code files to edit
- How to connect the UI to the data
- Design tokens and styling

Your only job is to describe the product behaviour in plain language.

---

## FILE LOCATIONS

| File | What it is | Who reads it |
|------|-----------|-------------|
| `NIRMAN_CONTEXT.md` | Full project knowledge — updated after every task | Agent |
| `AGENT_RULES.md` | Rules, patterns, checklists | Agent |
| `HOW_TO_BUILD.md` | This file — your guide | You |
| `.claude/worktrees/cool-mestorf/` | The actual codebase | Agent |
| `.env.local` | Supabase keys — never share this file | No one |
