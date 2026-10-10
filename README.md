# eglesson

*Every note. Every subject. One place.*

A free learning library for students in Nepal: Class 8–10, SEE, +2 (NEB), Engineering (IOE), Medical (IOM), Management, IT, entrance prep and Loksewa. Students search and read notes; a small content team writes them in a blogger-style admin portal.

```
frontend/  Angular 17 (standalone, signals) · Bootstrap 5 · ngx-quill (Quill 2) · KaTeX · Chart.js · ngx-toastr
backend/   Spring Boot 3.5 · Java 17 · JPA · Flyway · MySQL 8 · JWT
```

One WAR serves the API (`/api/**`), uploaded files (`/uploads/**`) and the Angular app (everything else).

## Run locally

```bash
# API on :8090 against local MySQL (schema eglesson_dev is created automatically, with demo content)
cd backend && ./restart-dev.sh          # or: mvn spring-boot:run   (profile "dev")

# Angular dev server on :4200 (proxies /api and /uploads to :8090)
cd frontend && npx ng serve
```

- Student site: http://localhost:4200 — register any account.
- Admin portal: http://localhost:4200/admin — `admin` / `Admin@123` in dev (you must change it at first sign-in).

Build everything into one WAR: `./build.sh` → `backend/target/eglesson.war`.

## What students get

- **Browse** stream → class/program → semester/year → subject → chapter. Every level is configurable.
- **Search everywhere**: `/` or `Ctrl/⌘+K` opens a command palette with as-you-type suggestions. The full search page lists matching subjects plus posts, filtered by content type.
- **Reader**: table of contents, reading-progress bar, KaTeX formulas, tables, code, YouTube embeds, PDF downloads, font size, focus mode, print/save as PDF, share to WhatsApp/Viber/Facebook, previous/next in the same subject, related notes.
- **Doubts & discussion** under every note (one level of replies). Team answers get a badge.
- **My learning**: daily study streak and a 13-week activity grid, continue reading, saved notes, quiz scores, profile with "my class" (personalises the home page).
- **Practice quizzes** (MCQ): timer, instant results with explanations, saved scores.
- **Request a note**: students ask for a chapter; when the team links the finished post, the student sees it in their dashboard.
- Notices with a site-wide ticker for important ones, banners and ads, dark mode, mobile bottom navigation, Nepali-language posts (Mukta font).

## What the admin portal does

| Screen | Purpose |
|---|---|
| Dashboard | Reads today vs yesterday, students, active learners, charts; top notes; **content-team output today/this week**; what students search; **searches with no results** and **empty subjects** (what to write next); recent activity |
| Posts | List with status tabs (published, scheduled, in review, drafts, archived), filters, quick publish/unpublish |
| Post editor | Big title, rich text (headings, lists, formulas, tables, code, images, video), summary, downloads, category, content type, language, level, tags, cover, YouTube, comments on/off, featured, schedule, SEO preview, per-post reads chart. Autosaves locally; `Ctrl/⌘+S` saves |
| Categories | The browse tree: add, edit, move, reorder, hide; icon, colour, cover, "quick link on home" |
| Types & levels | Content types (Notes, Solutions, Old Questions…) and level names (Stream, Class, Semester…) |
| Quizzes | MCQ editor with explanations, plus bulk import from plain text |
| Comments | Approve, hide, delete, reply as the team |
| Note requests | Mark in progress, done or rejected; link the post; leave a note for the student |
| Notices | Rich text, category, attachment, publish/expiry dates, ticker flag |
| Banners & ads | Placements: home slider, home strip, category top, reader sidebar, after note, daily popup. Optional category targeting, schedule, impressions, clicks and CTR |
| Students | Search, block and unblock |
| Admin users / Roles | Role-based permissions (like mbank's profiles). Built in: Super Admin, Content Manager, Content Writer (posts go to review), Moderator |
| Settings / Audit log | Site text, contact and social links, comment moderation, sign-up switch; who changed what |

## Database

- Schema **`eglesson`** on the server's MySQL 8.0.46 (`172.16.56.111`, `127.0.0.1:3306`). App user `eglesson_app` has rights on that schema only. **`group_expenses` is untouched.** Credentials are in `backend/deploy/server-172.16.56.111.credentials.txt` (gitignored).
- **Flyway owns the schema** (`backend/src/main/resources/db/migration`). In every profile Hibernate only validates. Add schema changes as `V2__…sql`.
- On first start into an empty database, the app seeds roles, the `admin` account and the Nepal catalog (9 streams, 276 categories). Demo posts, notices, banners and quizzes are seeded in **dev only**.
- Timestamps are stored in UTC; "today" in statistics is the Nepal calendar day.
- The production schema is already initialised: migration V1 applied, catalog seeded, `admin` created with the one-time password in the credentials file.

## Deploy (172.16.56.111)

The existing Tomcat serves group-expenses as `ROOT.war`, so eglesson runs as its **own process** and leaves that Tomcat alone:

```bash
./build.sh
ssh mbank@172.16.56.111 'mkdir -p ~/eglesson/uploads'
scp backend/target/eglesson.war backend/deploy/eglesson.env mbank@172.16.56.111:~/eglesson/   # eglesson.env from eglesson.env.example + credentials file
scp backend/deploy/eglesson.service mbank@172.16.56.111:/tmp/
ssh mbank@172.16.56.111 'sudo mv /tmp/eglesson.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now eglesson'
# then open the port (e.g. sudo ufw allow 7799/tcp) and ask DevOps to route a public address/domain to it
```

Backups: `backend/deploy/backup.sh` (DB dump plus uploads, kept 14 days) for a nightly cron.

## Security notes

- Passwords are hashed with BCrypt. JWTs are HMAC-signed: admins 12 h, students 30 days. Admin permissions are re-read from the database on every request, so disabling an admin takes effect immediately.
- A new admin must change their password before the portal unlocks.
- After 8 failed sign-ins, that login name is locked for 15 minutes.
- Editor HTML is sanitised server-side with a jsoup allow-list (iframes only for YouTube and Vimeo).
- Uploads are limited to JPG, PNG, WebP, GIF and PDF (no SVG), with random file names.

## Not built yet

- Password reset by SMS or email: no provider is connected. An admin can set a temporary password under Students (key icon).
- Google sign-in, push notifications and Bikram Sambat (BS) dates.
