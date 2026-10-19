# Feature Specification: Ajaia Docs — Lightweight Collaborative Document Editor

**Feature Branch**: `001-collaborative-doc-editor`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Ajaia Assessment — Spec & Feature Doc" (https://claude.ai/artifact/6fxvp1wjUw1kbVUVwb4uFC): a deployed, lightweight Google Docs–style editor where users create and edit rich-text documents, import a file, share with another user, and have everything persist. Seven features (F1–F7): mocked sign-in, document dashboard, editor, file import, sharing, errors and validation, and one-command local run with seed data.

## Clarifications

### Session 2026-10-19

- Q: How much automated testing should the build include, given the time limit? → A: Minimal — two small logic-only test files (permission matrix of 4 access levels × 6 actions; import checks for Markdown headings/lists, `.docx` bold text, unsupported type rejected). No end-to-end or UI tests.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create, edit and reopen a rich-text document (Priority: P1)

A signed-in user creates a new document, gives it a title, writes formatted text (bold, italic, underline, headings, bulleted and numbered lists), and later comes back to find it exactly as they left it. Signing in is a one-click choice among seeded test users, with no passwords.

**Why this priority**: Creating and editing is the core of the product. Without it, sharing and import have nothing to act on. Sign-in is included here because every other flow needs a known current user.

**Independent Test**: Sign in as a seeded user, create a document, rename it, type text using every formatting option, reload the page, and confirm title, text and formatting are unchanged.

**Acceptance Scenarios**:

1. **Given** the sign-in page, **When** the reviewer clicks one of the three seeded users, **Then** they are signed in as that user without entering a password and land on the dashboard.
2. **Given** a signed-in user on the dashboard, **When** they choose "New document", **Then** a document titled "Untitled document" is created and opens in the editor.
3. **Given** an open document they own, **When** the user clicks the title, types a new name and presses Enter or clicks away, **Then** the new title is saved; a blank title or one over 200 characters is rejected with a message and the previous title is kept.
4. **Given** an open document, **When** the user applies bold, italic, underline, heading 1, heading 2, bulleted list, numbered list, undo or redo from the toolbar or with the standard keyboard shortcuts for bold/italic/underline, **Then** the formatting is applied and the toolbar shows which formats are active at the cursor.
5. **Given** the user has stopped typing, **When** roughly 0.8 seconds pass, **Then** changes save automatically and the status reads "Saving…" then "Saved"; if a save fails the status reads "Couldn't save — retry" and offers a retry.
6. **Given** a saved document, **When** the user reloads the page or signs in again later, **Then** content and formatting are identical to what was saved.
7. **Given** unsaved changes, **When** the user tries to leave the page, **Then** they are warned before leaving.
8. **Given** a signed-in user, **When** they use "Switch user" in the header, **Then** they can sign in as a different seeded user.

---

### User Story 2 - Share a document and see owned vs shared clearly (Priority: P1)

A document owner grants another user access by email, choosing Viewer or Editor. The recipient sees the document under "Shared with me", separate from their own documents. The owner can revoke access at any time.

**Why this priority**: Sharing is one of the five mandatory areas and the main thing reviewers will demonstrate. It ties together users, documents and permissions.

**Independent Test**: As Alice, share a document with Bob as Editor and with Carol as Viewer. Switch to Bob: the document appears under "Shared with me" and he can edit it. Switch to Carol: she can read it but not change it. Switch back to Alice, revoke Bob, then as Bob confirm the document is gone and cannot be opened.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open the dashboard, **Then** they see two tabs, "My documents" and "Shared with me", each sorted by last update (newest first), each row showing title, role badge (Owner / Editor / Viewer), last-updated time, and the owner's name on shared documents.
2. **Given** an empty tab, **When** the user views it, **Then** an empty-state message explains what to do next (e.g., create or import a document, or ask someone to share one).
3. **Given** an owner with a document open, **When** they open the Share dialog, enter a seeded user's email and pick Viewer or Editor, **Then** that user gains access and appears in the dialog's list of people with access.
4. **Given** the Share dialog, **When** the owner enters an unknown email, their own email, or someone who already has access, **Then** a specific error explains which problem occurred and nothing changes.
5. **Given** an Editor on a shared document, **When** they edit content, **Then** changes save; they cannot rename, share, revoke or delete.
6. **Given** a Viewer on a shared document, **When** they open it, **Then** they see the content read-only with no formatting toolbar and cannot change anything.
7. **Given** the owner revokes a user's access, **When** that user next loads their dashboard, **Then** the document is no longer under "Shared with me", and opening its link shows the same "not found" result as a document that does not exist.
8. **Given** an owner, **When** they delete a document, **Then** it disappears for the owner and for everyone it was shared with.

---

### User Story 3 - Import a file as a new editable document (Priority: P2)

A user uploads an existing plain-text, Markdown or Word file and gets a new editable document with its structure preserved as far as the editor supports.

**Why this priority**: File upload is a mandatory area, but it builds on the editor and dashboard already being in place, so it comes after the core flows.

**Independent Test**: From the dashboard, import one `.txt`, one `.md` (with headings, lists and emphasis) and one `.docx` (with bold text); each opens as a new editable document titled after the file. Then try a `.pdf` and a file over 4 MB and confirm each is rejected with a clear message and no document is created.

**Acceptance Scenarios**:

1. **Given** the dashboard, **When** the user chooses "Import file", **Then** the picker and nearby help text state that `.txt`, `.md` and `.docx` files up to 4 MB are supported.
2. **Given** a valid `.txt` file, **When** it is imported, **Then** each block of text becomes a paragraph in a new document.
3. **Given** a valid `.md` file, **When** it is imported, **Then** headings, bulleted and numbered lists, bold and italic become the matching editor formatting.
4. **Given** a valid `.docx` file, **When** it is imported, **Then** its text, headings, lists and bold/italic/underline carry over; unsupported styling is dropped without failing the import.
5. **Given** any successful import, **When** it finishes, **Then** the new document is titled from the file name (without extension), is owned by the importer, and opens in the editor.
6. **Given** a file of the wrong type, over 4 MB, or that cannot be read, **When** it is imported, **Then** the user sees a clear error message and no document (empty or otherwise) is created.

---

### User Story 4 - Run the whole app locally with one command (Priority: P3)

A reviewer on a clean machine with only Docker installed runs one command and gets the full app with seeded users and sample shared documents, without installing anything else or creating a configuration file.

**Why this priority**: Not required by the brief, but it removes setup friction for reviewers and backs up the live deployment. It is valuable only once the product itself works.

**Independent Test**: On a machine with only Docker, run the documented start command, open the local address, sign in as each seeded user and confirm the sample shared documents are visible. Run the documented reset command, start again, and confirm the app is back to the fresh seed state.

**Acceptance Scenarios**:

1. **Given** a clean machine with Docker and no configuration file, **When** the reviewer runs the documented start command, **Then** the database and app start, the schema is set up, seed data is loaded, and the app is reachable at `http://localhost:3000`.
2. **Given** the app has been started before, **When** it is restarted, **Then** seed data is not duplicated.
3. **Given** a fresh start, **When** the reviewer signs in as Alice, Bob and Carol, **Then** Alice owns a document shared with Bob as Editor and one shared with Carol as Viewer, and each user sees what their role allows.
4. **Given** the reviewer runs the documented reset command, **When** they start again, **Then** all user-created data is gone and only the seed state remains.
5. **Given** the README, **When** the reviewer reads the "Run with Docker" section, **Then** it lists prerequisites, the start command, the URL, seeded accounts and what each sees, the reset command, and what to do if ports 3000 or 5432 are in use.

---

### Edge Cases

- A request made without a signed-in session is refused as unauthenticated, and the UI sends the user to sign-in.
- A user opens a link to a document that does not exist or that they have no access to: both show the same "not found" page, so the existence of other people's documents is not revealed.
- A Viewer's access is upgraded or revoked while they have the document open: the change applies on their next load or save; a save after revocation fails with a visible message rather than silently.
- The same document is edited in two tabs or by two users at once: the last save wins; there is no merging. The editor shows when the document was last updated.
- A save fails because of a network drop: the status shows "Couldn't save — retry" and the user's unsaved text stays in the editor.
- A file has a supported extension but corrupt or mismatched contents (e.g., a renamed PDF with `.docx`): rejected as unreadable, no document created.
- An empty `.txt` or `.md` file: imported as an empty document titled after the file (the file is valid, just empty).
- A file name that is very long: the derived title is cut to the 200-character limit.
- An owner tries to share with an email that differs only in letter case from a seeded user: matched case-insensitively.
- An owner deletes a document someone else currently has open: the other user's next save or reload shows "not found".

## Requirements *(mandatory)*

### Functional Requirements

**Sign-in (F1)**

- **FR-001**: The system MUST offer one-click sign-in as any of three seeded users (alice@ajaia.test, bob@ajaia.test, carol@ajaia.test) with no password.
- **FR-002**: The system MUST keep the user signed in across page reloads via a session that page scripts cannot read or forge.
- **FR-003**: The header MUST provide a "Switch user" control that lets the reviewer sign in as another seeded user.
- **FR-004**: Every data request MUST identify the current user from the session and MUST be refused as unauthenticated when there is none.

**Dashboard (F2)**

- **FR-005**: The dashboard MUST show two separate lists, "My documents" (owned) and "Shared with me", each sorted by last update, newest first.
- **FR-006**: Each row MUST show the title, the user's role badge (Owner / Editor / Viewer), the last-updated time, and, for shared documents, the owner.
- **FR-007**: The dashboard MUST provide "New document" and "Import file" actions, and each empty list MUST show guidance on what to do next.

**Editor (F3)**

- **FR-008**: "New document" MUST create a document titled "Untitled document", owned by the current user, and open it.
- **FR-009**: Owners MUST be able to rename a document inline; the title MUST be 1–200 characters after trimming, saved on Enter or when focus leaves the title.
- **FR-010**: The editor MUST support bold, italic, underline, heading level 1, heading level 2, bulleted list, numbered list, undo and redo, via a toolbar that shows active states, plus standard keyboard shortcuts for bold, italic and underline.
- **FR-011**: The editor MUST autosave about 0.8 seconds after typing stops and MUST show a status of "Saving…", "Saved" or "Couldn't save — retry" (with a retry action).
- **FR-012**: The system MUST warn the user before they leave a page with unsaved changes.
- **FR-013**: Saved documents MUST reopen with identical content and formatting; content MUST be stored in a structured form, never as raw markup that is rendered back to the page.
- **FR-014**: Viewers MUST see a read-only document with no formatting toolbar.

**File import (F4)**

- **FR-015**: Users MUST be able to import `.txt`, `.md` and `.docx` files up to 4 MB as a new document they own; the supported types and size limit MUST be stated in the import UI and the README.
- **FR-016**: Plain text MUST become paragraphs; Markdown headings, lists and emphasis MUST become the matching editor formatting; Word documents MUST keep text, headings, lists and bold/italic/underline, dropping unsupported styling.
- **FR-017**: The imported document's title MUST be derived from the file name, and the new document MUST open once the import finishes.
- **FR-018**: Files of an unsupported type, over 4 MB, or unreadable MUST be rejected with a clear message, and MUST NOT create any document.

**Sharing and access (F5)**

- **FR-019**: Owners MUST be able to share a document by entering another user's email and choosing Viewer or Editor, and MUST see the list of people with access and their roles.
- **FR-020**: Sharing MUST fail with a specific message for an unknown email, the owner's own email, or a user who already has access.
- **FR-021**: Owners MUST be able to revoke a user's access; revoked users MUST no longer see the document in "Shared with me" and MUST NOT be able to open it.
- **FR-022**: Permissions MUST be: Owner — read, edit content, rename, share, revoke, delete; Editor — read and edit content only; Viewer — read only; anyone else — no access.
- **FR-023**: Every permission decision MUST follow one single, consistent policy so that the same role always yields the same allowed actions everywhere in the product.
- **FR-024**: Owners MUST be able to delete a document, which removes it for everyone it was shared with.

**Errors and validation (F6)**

- **FR-025**: All input to the system MUST be validated; invalid input MUST be rejected with an error carrying a machine-readable code and a human-readable message.
- **FR-026**: A document that does not exist and a document the user cannot access MUST produce the same "not found" response, so existence is not revealed.
- **FR-027**: The UI MUST surface every failure as a toast or inline message; a blank screen or silent failure is never acceptable.

**Local run and seed data (F7)**

- **FR-028**: A single documented command MUST start the database and app on a machine with only Docker installed, set up the schema, load seed data and serve the app at `http://localhost:3000`, with no configuration file required.
- **FR-029**: Seed data MUST be safe to load repeatedly without duplication, and MUST create the three users plus an Alice-owned document shared with Bob as Editor and one shared with Carol as Viewer.
- **FR-030**: A single documented reset command MUST return local data to the fresh seed state.
- **FR-031**: Every configuration value MUST be documented in an example configuration file, with safe local defaults.

**Submission deliverables**

- **FR-032**: The README MUST cover local setup, a "Run with Docker" quick start, configuration values, seeded users, supported file types, out-of-scope items, and what is incomplete.
- **FR-033**: The project MUST include an architecture note (priorities, data model, tradeoffs, cuts and reasons), an AI workflow log, a submission manifest, a live deployed URL, a 3–5 minute walkthrough video link, and screenshots or a GIF of the sharing flow.
- **FR-034**: Automated testing MUST be kept minimal: exactly two groups of fast, logic-only tests that need no browser and no database — (1) the permission matrix (owner, editor, viewer, revoked/no-access across read, edit, rename, share, revoke, delete) and (2) the file conversions (Markdown headings and lists, `.docx` bold text, unsupported type rejected). End-to-end and UI tests are out of scope; all other behavior is verified by hand against the acceptance scenarios.

### Key Entities

- **User**: A seeded person who can sign in. Has an email (unique) and a display name. Owns documents and may be granted access to others' documents.
- **Document**: A rich-text document. Has a title (1–200 characters), structured content preserving formatting, one owner, and created / last-updated times.
- **Share (access grant)**: Links one document to one non-owner user with a role of Viewer or Editor. At most one grant per user per document. Removed on revoke; removed when the document is deleted.
- **Role**: The effective permission a user has on a document — Owner (derived from ownership), Editor or Viewer (from a share), or none.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can sign in, create a document, format text and see it intact after reload in under 2 minutes, with no instructions beyond the UI.
- **SC-002**: A reviewer can demonstrate the full sharing flow (share as Editor and as Viewer, see it as each recipient, revoke) in under 3 minutes using only the seeded accounts.
- **SC-003**: 100% of the formatting types listed in FR-010 survive a save-and-reload with no visible change.
- **SC-004**: Each acceptance check for F1–F7 can be verified by hand in under 1 minute.
- **SC-005**: 100% of permission combinations (4 access levels × 6 actions) behave as specified in FR-022 and are covered by automated tests.
- **SC-006**: 100% of rejected imports (wrong type, oversized, unreadable) show a message to the user and leave the document count unchanged.
- **SC-007**: Typing feels immediate, and the save status reaches "Saved" within 2 seconds of the user stopping typing under normal network conditions.
- **SC-008**: On a clean machine with only Docker, the app is usable at the local address within 5 minutes of running the single start command, and a reset-then-start returns exactly the seed state.
- **SC-009**: No user-facing failure results in a blank screen; every failure path tested shows a visible message.
- **SC-010**: The live URL works with every seeded account, and the claims in the README, notes and video match what the deployed build does.

## Assumptions

- Reviewers are the primary users; the three seeded accounts are the only accounts. Self sign-up, real authentication, password reset and organizations are out of scope.
- Real-time co-editing, live cursors and conflict merging are out of scope; when two saves race, the last one wins, and this is documented.
- Images, tables, comments, print layout, export and version history are out of scope.
- Viewer/Editor roles are the one chosen stretch goal; if the build falls behind, sharing ships as Editor-only and the cut is documented.
- Sharing is limited to existing seeded users; inviting people who have no account is out of scope.
- The source doc says a revoked user gets "403" in F5 but "404 for no access" in F6. This spec follows F6 and the project constitution: revoked and never-shared users get the same "not found" response.
- Seed sample documents use readable placeholder content; exact text is not specified.
- The live demo and all services run on free tiers; no reviewer needs to pay or create an account to test.
- The import size limit is 4 MB, not the 5 MB in the source doc, so the stated limit stays true on the live demo: the hosting platform rejects uploads over 4.5 MB (constitution v1.0.1, Principle IV).
- Testing effort is capped at roughly 15–20 minutes of the build; anything beyond the two test groups in FR-034 (including the optional end-to-end test the constitution allows) is skipped.
- The build is time-boxed to roughly 3.5 hours; documentation and the video are reserved time at the end, not leftovers.
- Stack, storage format and module layout are fixed by the project constitution (v1.0.0) and are decided in the plan, not here.
