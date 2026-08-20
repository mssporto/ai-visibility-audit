# Agent Instructions

You operate inside the **WAT framework** (Workflows, Agents, Tools). Probabilistic AI handles reasoning; deterministic code handles execution. That separation is what keeps output reliable and on-brand.

**This is a beta.** Fortnight Studio is the first and, right now, the only live client. But this engine exists to run for many clients. So the rule is simple: **shared code never knows it's Fortnight.** It's told who it's serving. Today that's always Fortnight. Adding the next client is dropping in a config directory, not a rewrite.

Don't build tenant *management* (onboarding flows, client registries, dashboards) until a real second client forces each piece to exist. Keep the seams ready; keep the machinery minimal.

## The WAT Architecture

**Workflows** — Markdown SOPs in `workflows/`. Each defines the objective, required inputs, which tools to call, expected outputs, edge cases, and its autonomy mode. Written in plain language and client-agnostic: a workflow says *what* to do, never whose brand or credentials to use.

**Agents** — Your role. Resolve the active client, read the relevant workflow, run tools in the right sequence, handle failures, record run status, and (interactive mode only) ask clarifying questions. You connect intent to execution without doing the work yourself. If a workflow needs data from a site, don't scrape it directly: read `workflows/scrape_website.md` and call `tools/scrape_single_site.py`.

**Tools** — Python in `tools/`. API calls, transforms, rendering, publishing. Tools receive the resolved client context as an argument and never hardcode credentials, brand rules, or client names. They are consistent, testable, and fast.

**Why this matters:** if each step is 90% accurate, five chained steps land at 59%. The recurring failure this system was built to solve is AI drifting off-brand and generic. Offloading execution to deterministic scripts, and keeping brand rules in config rather than in prompts, is what holds quality steady.

## Client Context

Every run is scoped to one client, resolved before any tool runs.

- Each client has a directory under `clients/<name>/` holding `config.yaml` (brand-context source, model tiers, enabled tools, channel credentials, MCP endpoints) and `.env` (that client's secrets, gitignored).
- **Only Fortnight Studio exists as a real client today**, split across two directories — `clients/fortnight-dev/` (testing/experiments) and `clients/fortnight-production/` (real credentials) — since 2026-07-16. That's still one real client, not a second one: the split is an environment seam, not a tenant seam. The path is the seam, not a promise of more configs yet.
- The agent loads the client's config once and passes a resolved context object down to tools. Tools never read `clients/` or global secrets themselves.
- Nothing about Fortnight (brand colours, voice rules, sheet IDs, credential IDs, channel setup) belongs in shared code or in a tool. If it's specific to a client, it lives in that client's config.

**Test for correct placement:** if a value would change for the next client, it's config. If it's the same for every client, it's code.

## Autonomy Modes

Workflows run **interactively** (a human is present) or **scheduled** (cron, no human). Every workflow declares which.

- **Interactive:** ask when genuinely blocked. Confirm before any irreversible or paid action.
- **Scheduled:** no one to ask. If a workflow would otherwise pause for a question, **fail safe**: log the reason, skip that item, mark it for review, and continue with the rest. Never guess past a blocking question in a scheduled run.

Paid or credit-consuming actions: interactive mode confirms before re-running after a failure; scheduled mode respects the client's spend limits in config and stops if exceeded.

## Capabilities and Providers

A workflow says *what* to do (publish a post); it never says *how* for a given client. "Publish to socials" is a **capability**. Metricool is one **provider** of it. Direct Facebook or Twitter APIs are other providers. The workflow calls the capability; the client's config names which provider backs it.

Each provider is its own small tool sharing the same shape (same inputs, same return): `publish_metricool.py`, `publish_facebook.py`, and so on. A thin resolver picks the right one from config at runtime. The agent and the workflow never know which fired.

**Two real examples of this pattern exist today:**
- `publish_socials` — only the Metricool provider exists, because Fortnight uses Metricool. Build a second the day a real client needs it, not before.
- Every plain-text LLM capability (`generate_social_content`, `generate_blog_content`, `generate_video_content`, `plan_content`, `summarize`, `generate_image_prompt`) — `tools/llm_providers/` holds `openrouter.py` and `fal.py`, each exposing the same `call(api_key, model, system, prompt, timeout) -> str` shape. `resolve_text_provider()` picks one by the capability's `provider` key in `config.yaml`. Switching is one config value; adding a third provider later is one new file in `tools/llm_providers/`, no changes to any caller. The matching pattern lives in the sibling `fortnight-asset-walker` repo too, as `service/providers/` (for its own vision-classification call), same shape, same idea. **Not every capability is abstracted this way** — `tools/content_reviewer.py`'s tool-calling review agent has no second working provider (needs real tool-calling + hosted web-search/fetch tools; not every provider supports that), so it stays hardcoded to OpenRouter on purpose. Don't abstract a capability until a second real provider for its *exact* shape actually exists — a resolver with only one option is ceremony, not flexibility.

**Pros:** the workflow never changes when a client swaps providers; each provider's mess (separate auth, rate limits, upload quirks) stays boxed inside one tool and can't spread to workflows or other clients; adding a client is config plus, at most, one new provider tool.

**Cons:** direct platform APIs are more work than Metricool (per-platform OAuth, token refresh, media sequences, Twitter/X access costs), so each new provider is real effort; and the shared "same shape" contract has to be respected, or the resolver can't stay thin. Neither cost is created by this pattern; it just contains costs that exist regardless.

## Run Visibility

The point of this system is one clear operating system a human can look at and understand. So every run reports its state where the client can see it (their calendar sheet, not a local log): what was created, what's awaiting review, what's blocked and why. Writing run status to the client's visible surface is a first-class step of every workflow, not an afterthought.

## How to Operate

**1. Resolve the client, then read the workflow.** Know who you're acting for before you read what to do.

**2. Reuse before you build.** Check `tools/` first. Only write a new tool when nothing fits.

**3. Recover, then report.** On error: read the full trace and diagnose. In interactive mode with approval, fix the tool and retest. In scheduled mode, log and mark for review, don't edit live code. Either way, record what you learned (rate limits, timing quirks) in the workflow.

**4. Keep workflows current, carefully.** Update a workflow when you find a better method or a recurring constraint. Never create or overwrite a workflow without asking, unless explicitly told to.

**5. Keep `README.md` current.** Update it on the first commit of any change, and again at least every 5 commits after that. The bar: if a change is visible to a human (a new capability, a changed setup step) or breaking (a config key renamed, a workflow removed), `README.md` reflects it before you move on — not as a separate cleanup pass later.

## Known Technical Gotchas

Worth checking before writing new code against these, since both have already caused a real, silent (non-erroring) failure once each in this project:

- **Google Drive API + Shared Drive folders.** `files().list()` against a folder living in a Shared Drive doesn't error without `supportsAllDrives=True, includeItemsFromAllDrives=True` — it just silently returns zero files. Bit `tools/drive_upload.py` once already and `fortnight-asset-walker`'s Drive-sync once more. Add both params to any new Drive `list()` call.
- **Image MIME type must match real file content, not an assumed default.** Any code building a `data:<mime>;base64,...` URI for a vision-model call must use the file's *actual* type, not a hardcoded `image/png` — some providers (fal.ai's vision endpoint, confirmed live) reject a mismatched declared type outright. Only surfaced once Drive-sourced images (which can be `.webp`, `.jpg`, anything) replaced Figma exports (always literal PNG) as an input source.
- **Modal web endpoints can't run long batch jobs — design external triggers around that, not through it.** Modal enforces a hard request timeout on anything reachable by a URL (`fortnight-asset-walker`'s is 5 minutes). A real full-folder classify batch already takes 5-6 minutes for ~83 images and only grows with the folder, so `drive_sync` is deliberately CLI/Modal-function-only, with no HTTP route — n8n or any other external, HTTP-only tool can't trigger it today, by design, not oversight. Don't "fix" that by wrapping it in a synchronous endpoint. If a future client genuinely needs an external tool to kick off batch work like this, the honest fix is an async-trigger-plus-status-check pattern (a thin endpoint that spawns the job and returns immediately, checked later), not a bigger timeout.
- **Modal images: `add_local_file`/`add_local_dir` must be the last calls chained onto an `Image` definition.** Modal 1.5.0 raises `InvalidError` (`_assert_no_mount_layers`, confirmed against the installed package's own source) if any build step — `pip_install`, `run_commands`, `.env()`, etc. — comes after a local-file-adding call. The natural instinct is to bundle local source early and keep adding install steps afterward; Modal rejects that order. Bundle local files/dirs last, after every other image-build step. Surfaced building `fortnight-video-hyperframes-service`'s `build` endpoint, which bakes `tools/hyperframes_project_builder.py` + `hyperframes_templates/` into the render image this way.
- **Figma's REST API has no numeric batch-size limit — only an undocumented compute-time budget, one shared rate-limit bucket across discovery and rendering, and a seat-based cap that looks exactly like a code bug.** `GET /v1/images/:key?ids=...` doesn't cap ID count; it 500s ("very large image render requests") or 400s (timeout) once a request gets too big or complex, so chunk into low tens of IDs per call, not hundreds, and back off rather than retry the same giant batch. A 200 response can legitimately return `null` for individual node IDs inside the `images` map (invisible or nonexistent nodes — documented, expected behavior) — that's not proof the batch was too big, so always retry `null` entries individually instead of resizing the whole request. `GET /v1/files`, `/v1/files/:key/nodes`, and `GET /v1/images` all draw from one shared Tier-1 rate-limit bucket (429 + `Retry-After` header on exhaustion), so a discover-then-render pipeline spends one budget across both calls, not two independent ones. Sharpest finding: Tier-1's per-minute limits are Dev/Full-seat only — a Viewer/Collab seat is capped at *up to 6 requests a month*, determined by the token holder's seat on that specific file's owning team, not their best seat anywhere else; an absurd, hours-long `Retry-After` value is a sign of this seat mismatch, not a client-code problem, and no amount of chunking logic works around it. Full research, sources, and secondary/anecdotal findings: `docs/superpowers/specs/2026-07-08-figma-api-batching-research.md`.
- **A Google service account has ZERO personal Drive storage quota — it can only create files inside a genuine Shared Drive, never a personal "My Drive" folder, no matter how that folder is shared.** Uploading into a plain My Drive folder (even one explicitly shared as writer, or made "visible to anyone") fails outright with `403 storageQuotaExceeded: "Service Accounts do not have storage quota. Leverage shared drives... or use OAuth delegation instead."` — confirmed live: changing a folder's sharing to "anyone" did not fix this, because the error is about who *owns* the new file's storage, not who can *access* the folder. Shared Drives sidestep this because the Shared Drive itself owns the storage, not any individual member. Before pointing `CLIENT_PROVISION_DRIVE_FOLDER_ID` (or any other Drive-upload target) at a folder, confirm it's actually inside a Shared Drive — `drive.files().get(fileId=..., fields='driveId')` returns a real `driveId` for Shared Drive content and nothing for plain My Drive content. Note: **creating a folder (as opposed to a file with content) costs zero storage, so `get_or_create_client_folder`-style calls will silently succeed even in a personal-Drive location** — an empty subfolder appearing where you expected uploads is the symptom, not proof the write path works; check for actual file content, not just folder existence, before trusting a rehost ran. Bit this project once when a "Client Onboarding Docs" folder got reorganized into a personal-Drive location without noticing the distinction.
- **Google Forms' File Upload question responses are always stored in the form owner's personal My Drive, never a Shared Drive — this is inherent to Forms, not a misconfiguration, and there's no setting to change it.** Any pipeline that reads `brand_guide_url`/`logo_files`-style Drive links sourced from a Forms file-upload question is reading from that personal-Drive folder — fine for reads (no quota needed to download/read metadata), but it means that exact folder can never be the target of an automated service-account *upload* (see the storage-quota gotcha above). Don't try to "fix" this by reorganizing the Forms response folder itself; instead keep automated rehost destinations (like `CLIENT_PROVISION_DRIVE_FOLDER_ID`) pointed at a real, separate Shared Drive, and treat any human-populated personal-Drive folder as manual-input-only.
- **A new client environment split (e.g. `fortnight-dev` → `fortnight-production`) doesn't just need `.env` credentials filled in — it needs every client-specific resource a sibling client already has, and a missing one fails differently every time, never with a clear "not configured" message.** Splitting `fortnight-production` off from `fortnight-dev` on 2026-07-16 silently left three real gaps, each discovered only when a specific rare code path hit it, weeks apart: `SOCIAL_DRIVE_FOLDER_ID` missing from `.env` entirely (`upload_public_image` fell back to a bare `parents: [None]`, hitting the Shared-Drive storage-quota gotcha above); `ASSET_LIBRARY_SHEET_ID` missing (`tools/asset_library.py` bypasses `google_sheets.py`'s section resolution and reads its own env key directly, so this doesn't show up as a wrong-spreadsheet error, it shows up as "Missing required parameter \"spreadsheetId\""); and the entire `clients/fortnight-production/assets/icons/` + `.../sfx/` directories never existing at all (silent until a video's `body-step-list` text happened to match an icon keyword, then crashed the whole render). None of these are secrets — they're generic, safely-copyable resources (icons/sfx are brand-neutral SVGs/MP3s; the asset-library/Drive-folder *values* need judgment about dev-vs-prod separation, but their *absence* is never correct). Before trusting a freshly-split client directory, diff its `.env` keys and `clients/<name>/` subdirectory tree against a fully-working sibling client's — don't wait for each gap to surface on its own schedule.
- **A local code or asset fix in this repo does NOT take effect on a Modal service that bakes its own copy of that code/data into its deployed image — verify against the LIVE endpoint, not just local tests.** `fortnight-video-hyperframes-service`'s `/build` endpoint bakes `tools/hyperframes_project_builder.py` + `hyperframes_templates/` at image-build time (see the `add_local_file` gotcha above). Fixing a crash in that module locally (confirmed by local unit tests) and even fixing the missing data files it depends on locally does **nothing** for the actual production traffic until that separate service is redeployed — confirmed live: the exact same request that 500'd before the local fix 500'd identically after it, against the same URL. Don't report a Modal-hosted bug as "fixed" from a local code change alone; re-run the real request against the live endpoint, and treat redeploying that service with the same care as any other prod Modal deploy (see the `-e dev` gotcha in the self-improvement/deploy-safety history — a bare deploy has taken prod down before).
- **Redeploying a Modal app does NOT guarantee the next request hits the new code — a still-warm container can keep serving from its old mounted-file snapshot until it's cycled out.** Hit this live fixing `fortnight-video-hyperframes-service`'s bed-audio-looping bug: `python3 -m modal deploy -e dev service/app.py` succeeded and even a direct build-endpoint zip inspection showed the fix's output, yet the next full render still showed the OLD broken behavior — because a container that had started before the redeploy was still alive and got reused (`add_local_file`/`add_local_dir` with `copy=False` mounts at container *startup*, not into an image layer, so an already-running container never re-reads it). `python3 -m modal app stop -e <env> <app-name> --yes` (force-kill every running container) immediately before redeploying is what actually made the fix take effect on the next request. If a redeploy "didn't work" but the code and the deploy output both look right, suspect a stale warm container before suspecting the fix itself.
- **Client-supplied files (PDFs, images) are parsed by native C libraries — treat the bytes as untrusted input, not as safe because "a client sent them."** `tools/extract_brand_guide.py` hands a client's uploaded `brand_guide_url` PDF straight to PyMuPDF (`fitz`) for page rasterization, and uploaded `logo_files` images to a vision endpoint. A malformed file can only ever exercise the parser's own memory safety — there is no in-repo sanitization, by design (rasterizing *is* the operation). Two mitigations are already in place and must stay: the PDF page count is hard-capped (`_MAX_PDF_PAGES`) so an adversarial many-page file can't blow up cost/time/memory, and the whole extraction runs during interactive, operator-supervised provisioning — never an unattended path. Keep PyMuPDF current, keep the page cap, and if brand-guide intake ever moves to an unsupervised/scheduled trigger, revisit sandboxing the parse (a separate process/container) before it does — an unattended native parse of arbitrary client bytes is a different risk class than a watched one. Surfaced in the 2026-07-22 security review as a Low/informational finding.

## The Self-Improvement Loop

Failures make the system stronger, but fixes to shared code are *proposed*, not applied mid-run:

1. Identify what broke and for which client.
2. Draft the fix (tool change or workflow update).
3. Verify it against the failing case without breaking the shared layer.
4. Get approval, then apply. Tool changes go through review, since every client depends on them.
5. Record the learning in the workflow.

A fix that helps Fortnight can't be allowed to silently break client two. That's why tools stay reviewed code, not agent-edited live.

## File Structure

- **Deliverables** go to the client's cloud services (Sheets, Slides, Drive) where they're directly accessible.
- **Intermediates** are disposable and regenerated as needed.

```
clients/
  fortnight-dev/        # testing/experiments -- same real business as production, below
    config.yaml   # brand source, model tiers, enabled tools, channel creds, spend limits
    .env          # secrets (gitignored)
  fortnight-production/ # real credentials, the live environment
    config.yaml
    .env
tools/            # client-agnostic Python; receives client context, returns results
workflows/        # markdown SOPs: objective, inputs, tools, outputs, edge cases, mode
.tmp/             # scratch: scraped data, intermediate exports. Regenerated freely.
```

Secrets live only in a client's `.env`, never in tools, workflows, or `.tmp/`. Local files are for processing; anything a client needs lives in the cloud.

## Bottom Line

You sit between what the client wants (workflows), who they are (client config), and what gets done (tools). Fortnight is the beta and the only live client today, but you build as if the next one lands tomorrow: nothing hardcoded, brand in config, tools client-agnostic. Read the workflow, resolve the client, call the right tools, recover from errors, report state where humans can see it, and propose improvements without breaking the shared layer.

Stay pragmatic. Stay reliable. Don't hardcode the client.
