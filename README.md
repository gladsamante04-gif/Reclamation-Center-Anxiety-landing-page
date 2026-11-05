# Reclamation Center – Anxiety Support Landing Page

A standalone landing page for Meta (Facebook/Instagram) ad traffic.
Built with Vite, hosted on GitHub Pages, with form submissions saved in your Wix site.

## Requirements

- **Node.js 20.19 or newer** (22 LTS recommended) – download from https://nodejs.org
- Check your version in Command Prompt: `node -v`

## Run it on your computer

Open **Command Prompt** (cmd), go to this folder, and run:

```
cd path\to\reclamation-anxiety-landing
npm install
npm run dev
```

The page opens at **http://localhost:5173**. The form page is at **http://localhost:5173/get-started.html**. Any change you save in `index.html` shows up right away.
Press `Ctrl + C` in Command Prompt to stop it.

Other commands:

| Command | What it does |
|---|---|
| `npm run dev` | Runs the page locally while you edit |
| `npm run build` | Creates the final website in the `dist` folder |
| `npm run preview` | Previews the finished `dist` build locally |

Note: the form sends to your live Wix site, so it only saves test leads after the Wix setup (Step 3) is done.

## Project files

| File / folder | What it is |
|---|---|
| `index.html` | The landing page. Every "Let Us Help You Reclaim Your Life Today" button opens the form page |
| `get-started.html` | The form page ("Get Started Today" form with the booking calendar) |
| `thank-you.html` | Shown after someone submits the form |
| `styles.css` | Shared design for all three pages |
| `assets/images/` | Logo pieces and the six photos |
| `public/CNAME` | The web address: `care.reclamationcntr.com` (change if you pick another) |
| `public/og-image.jpg` | Preview image when the link is shared |
| `.github/workflows/deploy.yml` | Automatically publishes the site to GitHub Pages whenever you push |
| `wix-backend/http-functions.js` | Code for **Wix**, not GitHub: receives the form submissions |

## Step 1 – Put it on GitHub

```
git init
git add .
git commit -m "Anxiety support landing page"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/anxiety-support.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Every push to `main` now builds and publishes the site automatically (check progress in the **Actions** tab).

## Step 2 – Connect the web address

1. GitHub: **Settings → Pages → Custom domain** → enter `care.reclamationcntr.com` → Save.
2. Wix dashboard: **Domains → reclamationcntr.com → Manage DNS Records** → add a **CNAME** record:
   - Host name: `care`
   - Value: `YOUR-GITHUB-USERNAME.github.io`
   (If your domain's DNS is managed somewhere else, like GoDaddy, add the record there.)
3. Wait for it to connect (minutes to a few hours), then turn on **Enforce HTTPS** in GitHub Pages.

## Step 3 – Connect the form to Wix

1. Wix editor (Dev Mode on) → **CMS** → create a collection named **AnxietyLeads** with fields:
   `firstName` (Text), `phone` (Text), `email` (Text),
   `preferredDate` (Text), `preferredDateISO` (Text), `preferredTime` (Text),
   `message` (Text), `consent` (Boolean),
   `page` (Text), `utmSource` (Text), `utmCampaign` (Text), `submittedAt` (Date and Time).
   (If the collection already exists, just add the three new fields `preferredDate`,
   `preferredDateISO`, and `preferredTime`, then re-paste the backend code and publish again.)

### How booking availability works

- All dates and times are **Florida (Eastern) time**, no matter where the visitor is.
- Each date + time can only be booked **once**. The form greys out taken times, and the
  backend also rejects a second submission for the same slot, so two visitors can't
  double-book even if they submit at the same moment.
- To **free up a slot** (a cancellation, or a spam lead), delete that row from the
  **AnxietyLeads** collection — the time becomes bookable again right away.
- The page reads availability from `https://www.reclamationcntr.com/_functions/slots`,
  which only shares date/time pairs — never names, phone numbers, or emails.
2. Set the collection permissions so only admins can view the data.
3. Code panel → **Backend** → create `http-functions.js` → paste the code from `wix-backend/http-functions.js`.
4. **Publish** the Wix site.
5. Submit a test on `https://care.reclamationcntr.com/get-started` and check the **AnxietyLeads** collection.

For email alerts, set up a Wix automation that notifies your team when a new item is added (check what your plan supports).

## Before running ads

- [ ] Fill in the `[INFORMATION NEEDED]` spots in `index.html` (insurance plans, response time, Fort Lauderdale suite number)
- [ ] Add your Meta Pixel base code to all three pages. Track the `Lead` event on `thank-you.html` (marked in the file). Never send form details to Meta.
- [ ] Test the form on desktop and on a phone
- [ ] Confirm with your privacy/compliance contact that this setup is appropriate for health-related inquiries
- [ ] Ad link: `https://care.reclamationcntr.com/?utm_source=facebook&utm_medium=paid&utm_campaign=anxiety`
