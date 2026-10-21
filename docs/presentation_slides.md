# 🎤 Presentation Slides (Talk Outline)

A ready-to-use outline for presenting GreenAlert. Each `---` is one slide. Speaker notes are in italics.

---

## Slide 1 — Title

# GreenAlert 🌱
### Reporting environmental problems, one report at a time

*Speaker: Introduce yourself and the one-line pitch. This is a web platform that connects citizens who spot environmental problems with the agencies responsible for fixing them.*

---

## Slide 2 — The Problem

**Environmental issues go unreported or get lost.**

- Citizens spot illegal dumping, blocked drainage, oil spills, flooding
- No easy way to report with evidence and location
- Reports get lost in phone calls and WhatsApp groups
- No tracking — people never know if anything happened
- Agencies lack a single view of what needs attention

*Speaker: Make it relatable — everyone has seen something wrong in their neighbourhood and not known who to tell.*

---

## Slide 3 — The Solution

**A single platform with a clear workflow.**

> Citizen reports → Admin assigns → Agency fixes → Everyone tracks

- Report with photo + map location
- A transparent status pipeline
- Three role-based dashboards
- One shared map of everything happening

---

## Slide 4 — Who It's For (3 Roles)

| Role | What they do |
|------|--------------|
| **Citizen** | Report issues, browse the map, track their reports |
| **Agency** | See assigned reports, mark progress, upload proof of resolution |
| **Admin** | Oversee everything, assign reports, manage users, verify agencies |

*Speaker: Emphasize that each role only sees what it needs — separation of concerns.*

---

## Slide 5 — Key Feature: The Status Pipeline

```
Submitted → Under Review → Assigned → In Progress → Resolved → Closed
```

- Every report is always in exactly one stage
- Citizens watch the status change in real time
- Closed = done, locked from further edits

*Speaker: This is the heart of the app — a predictable, fair workflow.*

---

## Slide 6 — Key Feature: Reports with Evidence

- Title, description, category, priority
- **Map location** (latitude/longitude) picked on a map
- **Photos uploaded to Cloudinary**
- Resolution proof: agencies attach after-photos + notes

*Speaker: Evidence is what makes a report actionable.*

---

## Slide 7 — Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite · Tailwind CSS · React Router · MapLibre GL |
| Backend | Node.js · Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (cookie + bearer) |
| Uploads | Cloudinary |
| Config | envalid |

*Speaker: Standard, well-supported MERN stack.*

---

## Slide 8 — Architecture

```
React (SPA) ──HTTP/JSON──► Express API ──► MongoDB
      ▲                          │
      └────── Cloudinary ◄────────┘ (image URLs)
```

- Client never talks to the database directly
- Server owns all business logic and permissions
- Cookie/bearer token on every authenticated request

*Speaker: Point out the clean separation: UI, API, data.*

---

## Slide 9 — Security Model

- Passwords hashed with **bcrypt** (never returned)
- **JWT** carries only the user id
- Every protected request re-loads the user → role & ban status always current
- `protect` (are you logged in?) + `authorize(...roles)` (are you allowed?)
- Agencies can't log in until an admin verifies them

*Speaker: The two-layer middleware is the key idea — authentication vs authorization.*

---

## Slide 10 — Data Model

- **User** — identity, role, status, settings
- **Report** — the incident, author, assigned agency, status, evidence
- **Organization** — an agency's profile + verification state

*Speaker: Three collections, straightforward relationships.*

---

## Slide 11 — Demo

1. Register as a citizen → create a report with a photo + map pin
2. Log in as admin → assign the report to an agency
3. Log in as agency → move it to In Progress → Resolved (with proof)
4. Back as citizen → see the status updated

*Speaker: This is the money slide. Do it live if possible; keep a backup recording.*

---

## Slide 12 — What We Simplified

- Removed AI/chatbot, forums, gamification, push notifications, social login
- Focused on the **core loop**: report → assign → resolve
- Result: a smaller, clearer, easier-to-maintain codebase

*Speaker: Scope control is a strength — a focused product beats a bloated one.*

---

## Slide 13 — What's Next

- Notifications (email/SMS) on status changes
- Mobile app
- Analytics for agencies
- Map clustering & heatmaps for hotspots

---

## Slide 14 — Thank You

**Questions?**

*Speaker: Keep contact details on screen. Thank the audience.*

---

## Appendix — Likely Questions & Answers

**Q: Why Mongo instead of SQL?**
Flexible document model, quick to iterate, great fit for nested report data, easy Atlas hosting.

**Q: How do you stop fake reports?**
Accounts are authenticated; admins can ban users; agencies verify resolution with photos.

**Q: How is security handled?**
Hashed passwords, JWT auth, server-side role checks on every route, banned-user blocking at the auth layer.

**Q: How do images work?**
Uploaded to Cloudinary; only the URL is stored in MongoDB.

**Q: How would it scale?**
Stateless Express API (scale horizontally), MongoDB Atlas, Cloudinary CDN for media.
