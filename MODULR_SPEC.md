# Modulr: Project Specification

> **Read this first (instructions for Claude):**
> This document is the single source of truth for building **Modulr**. Work in the milestone order in §14. Finish one milestone, stop, and give a short summary: what was built, how to run it, how to test it, and anything you assumed. If two requirements conflict or something is unclear, **ask before assuming**. Items in §16 (Open decisions) are not decided yet, so build them as configurable settings rather than hard-coding a choice. Never invent academic content; use the clearly-marked dummy seed data in §14 (M0) for development.

---

## 1. Summary

**Modulr** is a paid, subscription-based learning platform (website + Android app) for engineering students. It teaches each module of their college syllabus through:

- short **animated explainer videos**,
- one-page **short notes** with memory tricks and exam tips,
- **formula sheets** (what each symbol means, when to use it),
- **solved previous-year questions (PYQs)**, important questions and viva prep.

**Promise to students:** understand every module "inside out" and prepare for exams without needing any other app, channel or AI tool, across all 4 years of engineering.

**Owner:** Aditya Nikam, IT student (D10C) and freelance web developer, Mumbai.

---

## 2. Target users and scope

| | |
|---|---|
| **Launch audience** | Engineering students at one college in Mumbai (VESIT), **Information Technology branch, one semester** first |
| **Later** | All 8 semesters → other branches → other colleges |
| **Language** | English UI and content (Hinglish explanations may come later) |
| **Devices** | Mostly Android phones on 4G; laptops for longer study sessions |

The data model **must** support multiple colleges, branches, semesters and **syllabus versions** from day one, even though the UI starts with one of each (see §16, Q1).

### Roles
| Role | Access |
|---|---|
| Visitor | Landing, pricing, legal pages, public list of subjects/modules (titles only) |
| Free student | Everything marked **free preview** (default: Module 1 of every subject) |
| Subscriber | All published content |
| Admin | Admin panel: content, users, subscriptions, plans, reports |
| Contributor *(Phase 2)* | Can draft content for assigned subjects; an admin reviews and publishes it |

Roles are enforced **server-side and in database policies**, never only in the UI.

---

## 3. Brand

The logo is final ("The Stack": three stacked rounded bars). The logo kit (SVG + PNG + app icons + favicon) is in `Modulr_Logo_Kit.zip` and should be placed in `packages/shared/brand/` (or `apps/web/public/brand/`).

### Colours
| Token | Hex | Use |
|---|---|---|
| `cobalt` | `#2343FF` | Primary brand, buttons, links |
| `periwinkle` | `#5C73FF` | Secondary brand, logo middle bar |
| `sunflower` | `#FFC629` | Highlights, memory-trick callouts, logo top bar |
| `ink` | `#111018` | Text, dark surfaces |
| `cream` | `#FFF4E2` | Warm light surface |
| `orange` | `#FF5B1F` | Accent (promo/marketing), alerts that aren't errors |
| `mint` | `#1FD49E` | Success, "done", free-preview badges |
| `pink` | `#FF5FA2` | Accent (marketing only) |
| `red` | `#FF2E4D` | Errors, attendance below 75% |

### Type
- **Display / headings:** Unbounded (700–900), tight letter-spacing (about -0.03em)
- **Body / UI:** Manrope (500–800)
- **Formulas, code, numbers in tables:** JetBrains Mono (600)

### Feel
Bold, friendly and confident, like the promo reel: big type, colour blocks, playful motion. Study screens are calmer: light surface, generous spacing, readable 16px+ body text. Dark mode is supported. No emoji in the UI.

---

## 4. The content model ("module pack")

Every module has the same set of content types, so students always know where to look:

```
College → Branch → Syllabus version → Semester → Subject → Module
  Module
   ├─ Videos            ordered list, each with chapters (timestamps)
   ├─ Short notes       one rich document per module
   ├─ Formula sheet     one rich document per module (structured cards)
   ├─ PYQs              questions + answers, tagged by marks and exam session(s)
   ├─ Important Qs      questions + answers, with a frequency level
   └─ Viva questions    short Q&A pairs
```

### Content authoring format (admin side)
- Notes and formula sheets are **Markdown + LaTeX** (KaTeX), with custom callout blocks:
  - `:::trick` **Memory trick**: mnemonics are a core product feature, so use them generously
  - `:::tip` **Exam tip**
  - `:::mistake` **Common mistake**
  - `:::definition` **Definition**
- Formula cards have three fields: **formula**, **symbol meanings**, **when to use**.
- Questions have: `question_md`, `answer_md`, `marks` (2/5/10…), `sessions` (e.g. "May 2024"), `frequency` (`very_frequent` / `frequent` / `sometimes`), `module_id` (nullable; some questions span modules), `subject_id`.
- Everything has `is_published`, `order`, `updated_at`, `version`.

### Content rules
- **All content must be original.** No copying of professors' slides, textbook pages or diagrams. This is both a legal requirement and the product's value.
- Every item has a **"Report an error"** button; reports go to an admin inbox.

---

## 5. Features

Priority: **M** = must have for MVP · **S** = should have (MVP if time allows) · **L** = later phase, but keep the design compatible.

### 5.1 Accounts & onboarding
| Feature | P |
|---|---|
| Sign in with Google and with email OTP (no passwords) | M |
| Onboarding: name, college, branch, current semester (editable later) | M |
| Home defaults to the user's semester; switcher for other semesters | M |
| Sign out of this device / all devices | M |

### 5.2 Learning
| Feature | P |
|---|---|
| Subject page: modules with content counts; lock icon on paid modules | M |
| Module page with tabs: Videos · Short notes · Formulas · PYQs · Important Qs · Viva | M |
| Video player: adaptive streaming, speed (0.75–2×), resume where you left off, chapters, "up next" | M |
| Notes and formula rendering: Markdown + KaTeX + callouts, readable on a 360 px screen | M |
| PYQs: filter by marks and session; answers hidden behind "Show answer" | M |
| Important Qs with frequency badge; viva as expandable Q&A | M |
| Mark module as done; per-subject progress | S |
| Search within the user's semester | S |
| Bookmarks ("Saved") | S |
| Dark mode | S |
| Night-before mode: one-page subject summary + short recap video | L |

### 5.3 Coming-soon features (Phase 2–3)
These were shown in the promo video as "coming soon". Design the schema and navigation so they slot in without rework.

| Feature | Description |
|---|---|
| **Practical notes + printable PDFs** | For every lab experiment: Aim, Theory, Code, Output, Conclusion, plus viva questions. Server-generated, watermarked, print-ready PDF (A4). |
| **Topic tracker** | Per module, every topic moves through **To do → Doing → Done** (personal, per student). Feeds subject progress. |
| **Attendance manager** | Per subject, per semester, across all years. The student logs attended/total lectures. Shows % per subject against a **75%** line and computes "attend the next N lectures to reach 75%" or "safe margin: N lectures". Purely personal; no college integration. |
| **AI doubt solver** | Chat per subject/module that answers **only** from Modulr's own content (RAG over notes, formulas, questions and video transcripts), cites the exact note section or video timestamp, and refuses off-syllabus questions. |
| **Quizzes & flashcards** | Per-module MCQs and flashcards with scores and a weak-topics view. |

**Attendance formula (for reference):** with `a` attended and `t` total, and target `p = 0.75`:
- lectures needed to reach target: `n = ceil((p·t − a) / (1 − p))` when `a/t < p`
- lectures you can miss and stay at target: `m = floor(a/p − t)` when `a/t ≥ p`

### 5.4 Subscription & payments
| Feature | P |
|---|---|
| Plans stored in the database (price, interval, provider plan id, active flag); **never hard-code prices** | M |
| Launch plan: **₹100 / month** (see §16, Q2 for exam-pack pricing) | M |
| Free preview: Module 1 of every subject (configurable per module) | M |
| Razorpay Subscriptions (UPI Autopay + cards) on the **website** | M |
| Webhooks: verify signature, store event ids, process idempotently | M |
| Subscription states: created, active, pending, halted, cancelled, completed, expired. Access while active, or while cancelled/pending until the paid period (+3-day grace) ends | M |
| Account page: plan, status, next billing date, payment history, cancel at period end | M |
| Admin can grant free access for a date range (reviewers, contributors) | M |
| Coupons / referral codes | L |

### 5.5 Content protection
| Feature | P |
|---|---|
| Video via a provider with **DRM** + signed short-lived URLs (VdoCipher or Bunny Stream with DRM) | M |
| Moving **watermark** (name + email) over the player | M |
| Max **2 active devices** per account; device list with remote sign-out; limit device swaps (e.g. 2 per month) | M |
| One video stream at a time per account | S |
| Android: block screenshots/recording on content screens (`FLAG_SECURE`) | M |
| PDFs (when offered): watermarked with user name + email on every page | S |
| Admin alert for suspicious use (many devices, many cities, mass PDF generation) | L |
| Terms of Service: account sharing → ban, no refund | M |

### 5.6 Admin panel (web, `/admin`)
| Feature | P |
|---|---|
| Dashboard: users, active subscribers, new this month, MRR, open error reports | M |
| CRUD for colleges, branches, syllabus versions, subjects, modules; drag-to-reorder; publish/unpublish; free-preview toggle | M |
| Video upload straight to the provider (resumable), with title, chapters, thumbnail, processing status | M |
| Markdown editor with **live preview using the same renderer as the student app** | M |
| Question manager + **CSV bulk import** with per-row validation before saving | M |
| "Preview as student" for any module (including drafts) | S |
| Users, subscriptions, payments, plans | M |
| Error-report inbox linking to the item's edit screen | M |
| Contributor drafts → review → publish workflow | L |
| Audit log of admin actions | L |

### 5.7 Public site
Landing page (value, what's inside a module, how it works, pricing, FAQ), pricing page driven by the plans table, legal pages (Terms, Privacy, Refunds, Contact; mark them `TODO: legal review`), and SEO-friendly public subject pages that show titles only.

---

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Module page interactive in < 2.5 s on a mid-range Android phone on 4G; video starts in < 3 s |
| Mobile-first | Design every student screen at 360 px first |
| Security | Entitlement checks on the server and in Row Level Security; paid content (notes, answers, video tokens) is never sent to unentitled clients; secrets only in env vars |
| Privacy | India DPDP Act basics: consent at sign-up, privacy policy, account deletion on request. Some first-years may be **under 18**: collect the minimum data and add a "confirm you are 18+ or have parental consent" step |
| Reliability | Idempotent webhooks; daily database backups |
| Accessibility | ≥ 16 px body, 4.5:1 contrast, captions supported on videos |
| Code quality | TypeScript strict; ESLint + Prettier; shared types; tests for entitlement logic, webhook state transitions and the attendance formula |

---

## 7. Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm: `apps/web`, `apps/mobile`, `packages/shared` |
| Web + admin | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Android | Expo (React Native) + Expo Router |
| Backend | Supabase (Postgres, Auth, Storage, RLS) + Next.js route handlers |
| Video | VdoCipher **or** Bunny Stream (DRM), wrapped in a `VideoProvider` interface |
| Payments | Razorpay Subscriptions, wrapped in a `PaymentProvider` interface |
| Notes rendering | `react-markdown` + `remark-math` + `rehype-katex` (web); a renderer for mobile whose output matches the admin preview |
| PDF | Server-side HTML → PDF (Playwright) with a per-user watermark |
| Email | Supabase Auth emails + Resend |
| Analytics / errors | PostHog + Sentry |
| AI (Phase 2) | pgvector in Supabase for retrieval; LLM via API; strict "answer only from sources" prompt |
| Hosting | Vercel (web), EAS Build → Google Play (Android) |

---

## 8. Data model (Postgres)

All tables: `id uuid pk`, `created_at`, `updated_at` unless stated.

| Table | Key columns |
|---|---|
| `colleges` | name, short_code |
| `branches` | college_id, name, code |
| `syllabus_versions` | branch_id, label (e.g. "2024 scheme"), is_current |
| `profiles` | id = auth user id, full_name, email, college_id, branch_id, semester, role, comp_access_until, age_confirmed_at |
| `subjects` | syllabus_version_id, semester, code, name, description, order, is_published |
| `modules` | subject_id, number, title, order, is_free_preview, is_published |
| `videos` | module_id, title, provider, provider_video_id, duration_sec, chapters jsonb, captions_url, transcript_md, order, is_published, processing_status |
| `documents` | module_id, kind (`short_notes` / `formula_sheet` / `practical`), title, content_md, version, is_published (unique per module + kind, except `practical`) |
| `formula_cards` | module_id, title, formula_latex, symbols jsonb, when_to_use, order |
| `questions` | subject_id, module_id null, kind (`pyq` / `important` / `viva`), question_md, answer_md, marks, sessions text[], frequency, order, is_published |
| `experiments` *(L)* | subject_id, number, title, aim_md, theory_md, code_md, output_md, conclusion_md, viva jsonb |
| `topics` *(L)* | module_id, title, order |
| `topic_progress` *(L)* | user_id, topic_id, status (`todo` / `doing` / `done`), updated_at |
| `attendance_subjects` *(L)* | user_id, label, semester, academic_year |
| `attendance_entries` *(L)* | attendance_subject_id, date, attended bool (or running totals) |
| `plans` | name, price_paise, interval (`month` / `one_time`), scope (`all` / `subject` / `semester`), razorpay_plan_id, is_active |
| `subscriptions` | user_id, plan_id, provider_subscription_id, status, current_period_start/end, cancel_at_period_end, grace_until |
| `purchases` *(for exam packs, if chosen)* | user_id, plan_id, scope_id, valid_until |
| `payments` | user_id, subscription_id null, purchase_id null, provider_payment_id, amount_paise, status |
| `webhook_events` | provider, event_id unique, type, payload, processed_at, error |
| `devices` | user_id, device_id, platform, label, last_seen_at, revoked_at |
| `watch_progress` | user_id, video_id, position_sec, completed (pk user + video) |
| `module_completion` | user_id, module_id |
| `bookmarks` | user_id, item_type, item_id |
| `content_reports` | user_id, item_type, item_id, reason, message, status, resolved_by |
| `admin_audit_log` *(L)* | admin_id, action, entity, diff |

**Entitlement (single source of truth, in `packages/shared` and a SQL function `has_access(user, module)`):** access is granted if the user is an admin, **or** `comp_access_until > now()`, **or** they have an active subscription (or cancelled/pending within period + grace), **or** a valid purchase covers the module's subject/semester, **or** the module is a free preview.

---

## 9. Key endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/video/token` | Check entitlement + device → return short-lived DRM playback token |
| `POST /api/progress` | Save watch position |
| `POST /api/billing/subscribe` · `/cancel` | Create / cancel Razorpay subscription |
| `POST /api/webhooks/razorpay` | Verify, dedupe, update subscriptions/payments |
| `POST /api/devices/register` | Register device, enforce the 2-device limit |
| `POST /api/pdf/:documentId` | Watermarked PDF for entitled users |
| `POST /api/reports` | Content error report |
| `/api/admin/*` | Admin only (checked server-side) |

---

## 10. Screens

**Student (web + Android):** Onboarding · Home (continue watching, my subjects) · Subject · Module (tabs) · Video player · Notes reader · Formula sheet · Question lists · Search · Saved · Paywall · Account (profile, plan, payments, devices) · Report-error sheet.
**Later:** Practicals list + experiment page · Topic tracker board · Attendance dashboard · Doubt-solver chat · Quiz.

**Public:** Landing · Pricing · Sign in · Legal pages · Public subject pages.

**Admin:** Dashboard · Catalog tree · Module editor (videos / notes / formulas / questions) · Video upload · CSV import · Users · Subscriptions & payments · Plans · Reports inbox.

A clickable demo of the student experience exists (built earlier as an HTML prototype). Match its information architecture; the brand in §3 supersedes the demo's colours.

---

## 11. Content pipeline (how content gets made)

Content volume is the biggest risk, so the admin tooling must make producing a module fast.

1. **Outline:** the admin enters the module's syllabus topics.
2. **Draft:** notes, formula cards and questions are written in the admin editor (Phase 2: an AI assistant drafts them from the syllabus for human editing).
3. **Video:** recorded or animated outside the platform, then uploaded with chapters.
4. **Review:** a second person (topper / faculty reviewer) checks accuracy before publishing.
5. **Publish** and monitor error reports.

Target: one complete module pack in **≤ 1 working day** once the pipeline is running.

---

## 12. Analytics to track

- Free-preview → paid conversion (per subject)
- Weekly active students, especially in the 3 weeks before exams
- Videos watched, notes opened, answers revealed per active user
- Subscriber retention **across semesters** (the key metric)
- Error reports per module, and time to fix them
- Suspected account sharing (device churn)

---

## 13. Validation before heavy building (Phase 0)

Do this alongside M0–M1, not after:

1. Fully produce **2 module packs** for the hardest subject of the launch semester.
2. Two weeks before exams, offer them to classmates (landing page + UPI link is enough).
3. **Go/no-go:** ≥ 30 paying students, or ≥ 10% of free users trying to pay. If it falls short, revisit pricing and content before building Phase 2.

---

## 14. Milestones (build in this order)

Each milestone ends with working code, migrations applied, updated seed data, and a "How to test" note.

**M0 — Foundation:** monorepo, TypeScript strict, lint/format, Supabase config, full schema (§8) + RLS, `.env.example`. Seed: 1 college, IT branch, 1 syllabus version, 1 semester, 2 subjects × 3 modules, dummy videos, notes with LaTeX and every callout type, 10 questions of each kind, 1 plan at ₹100/month. Mark all seed content **DUMMY**.

**M1 — Auth, onboarding, catalog (web):** sign-in, onboarding, home, subject and module pages with tabs (locked except free preview), landing, pricing, legal placeholders.

**M2 — Content rendering + admin content tools:** notes/formula renderer, question lists, admin catalog CRUD, Markdown editor with live preview, CSV import, preview-as-student.

**M3 — Video:** provider integration behind `VideoProvider`, admin upload, DRM playback, watermark, resume, chapters.

**M4 — Payments & entitlement:** plans, Razorpay subscriptions (test mode), webhooks, paywall, account billing, comp access. Tests for entitlement + webhook state transitions.

**M5 — Protection & reports:** device limit and management, error reporting + admin inbox, Terms clause.

**M6 — Android app:** all student screens in Expo, `FLAG_SECURE`, payments via website (see §16, Q3), EAS build.

**M7 — Polish & launch:** search, progress, bookmarks, dark mode, analytics, Sentry, performance pass, empty/loading/error states, Play Store assets.

**Phase 2:** practical notes + PDFs, topic tracker, attendance manager, quizzes/flashcards, contributor workflow.
**Phase 3:** AI doubt solver, AI drafting assistant, more semesters/branches/colleges, iOS.

---

## 15. Out of scope (for now)

iOS app · offline video downloads · forums/comments · live classes · college ERP integration · features that use the college's name or logo (Modulr is independent; refer to "University of Mumbai syllabus" descriptively only).

---

## 16. Open decisions (ask the owner; build as configurable)

1. **Syllabus scope:** does the college follow the common University of Mumbai syllabus, or its own autonomous syllabus? This decides how content is shared across colleges. The schema already supports both via `syllabus_versions`.
2. **Pricing model:** *(decided: ₹100/month subscription at launch)* launch with **₹100/month**, or per-subject/per-semester **exam packs** (e.g. ₹99–149 one-time) to match how students study around exams? Support both via `plans.interval` + `purchases`.
3. **Android payments:** keep purchases on the website only (default, avoids Google Play billing), or add Play Billing?
4. **Free preview rule:** Module 1 of every subject (default) and/or a time-limited trial?
5. **Devices per account:** 2 (default) or 1?
6. **PDF downloads** of notes: allowed (watermarked) or view-only?
7. **Who reviews content accuracy:** toppers, a faculty member, or both?
8. Domain name, support email, refund policy wording.

---

## 17. Known risks (keep these in mind while building)

| Risk | Product/engineering response |
|---|---|
| Students use free YouTube/notes instead | Generous free tier; make the paid value obvious inside each module (solved PYQs, exam tips) |
| Seasonal usage (only before exams) | Exam-pack pricing option; progress/streak features; "night-before mode" |
| Content volume and accuracy | Fast admin tooling, CSV import, contributor workflow, error reports, review step |
| Piracy inside class groups | DRM, watermarks, device limits, features that need an account (progress, tracker, doubt solver) |
| Syllabus changes | `syllabus_versions`; content can be cloned to a new version and edited |
| Running costs (video, DRM, AI) | Provider interfaces so vendors can be swapped; usage caps on AI |
| Under-18 users | Minimal data, age/consent confirmation |
