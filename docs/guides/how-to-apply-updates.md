# How to Apply Updates from AI Suggestions

This guide walks through the simplest way to copy the plans and review notes in this repository into the live project without needing prior Git experience. If you prefer to collaborate through GitHub later, the second section explains what a pull request (PR) is and how to make one entirely from the browser.

## Option A – Make Quick Edits Without Pull Requests

If you just want to copy the latest plan or review into your main branch:

1. Open the file you want to update (for example, [`docs/plans/day2-priority-plan.md`](../plans/day2-priority-plan.md) or [`docs/reviews/2024-05-elder-care-review.md`](../reviews/2024-05-elder-care-review.md)) in GitHub.
2. Click the **pencil icon** in the top right of the file view. GitHub will fork the repository into your account automatically if you don’t already have write access.
3. Make your edits in the browser editor.
4. Scroll to the bottom, write a short commit message (e.g., “Update Day 2 plan with owner notes”), and press **Commit changes**. Choose “Commit directly to the `main` branch” if you do not plan to open a pull request.
5. Repeat for any other files.

This approach is best for small documentation tweaks or when you are the only person updating the plan.

## Option B – Collaborate With Pull Requests

A pull request (PR) lets you propose a bundle of changes, review them, and merge when ready. It keeps history organized when multiple collaborators are involved.

1. Open the repository on GitHub and click **Fork** if you do not have write access.
2. In your fork, navigate to the file(s) you want to edit and click the **pencil icon**.
3. After editing, scroll down and choose **Commit changes…** → **Commit to a new branch**. Give the branch a descriptive name (e.g., `update-day2-plan`).
4. When prompted, click **Compare & pull request**. GitHub will open a PR draft showing your changes.
5. Add a short summary and, if relevant, link to the plan or review you are updating.
6. Click **Create pull request**. Teammates can now comment, request tweaks, or approve the PR.
7. Once everyone is satisfied, click **Merge pull request** → **Confirm merge** to apply the updates to `main`.

## When to Use Each Option

| Scenario | Recommended Path |
| --- | --- |
| Personal notes, typo fixes, or fast documentation tweaks | Option A |
| Sharing new plans or multi-file updates with collaborators | Option B |
| Coordinating engineering work that touches application code | Option B |

## Need More Help?

If you are new to GitHub, the [official “Hello World” guide](https://docs.github.com/en/get-started/start-your-journey/hello-world) covers the same workflow with screenshots. Feel free to drop questions into the project issue tracker, and we can add more screenshots or even record a short Loom walkthrough if that would help.
