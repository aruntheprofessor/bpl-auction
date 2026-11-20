# Badminton Premier League Auction

A live player auction for badminton leagues, like the IPL auction.
The auctioneer runs everything from one screen. The audience watches a projector view that updates by itself.

- **/auction** – auctioneer screen (password). Pick a category, show a player, click the team buttons to raise the bid.
- **/display** – projector view (public, read-only). Dark and light modes, SOLD animation, results after every category.
- **/admin** – add categories, teams, players (password).

Built with Next.js (React), Supabase (database) and Vercel (hosting). All free.

---

## 1. Install the tools (one time)

1. Install **Node.js** (LTS version) from https://nodejs.org
2. Install **VS Code** from https://code.visualstudio.com

## 2. Create the free database (one time)

1. Go to https://supabase.com, sign up, click **New project**.
2. When it is ready, open **SQL Editor -> New query**, paste the whole content of `schema.sql`, click **Run**.
3. Open **Project Settings -> API** and keep this page open. You need three things from it:
   - Project URL
   - `anon` public key
   - `service_role` secret key (never share this one)

## 3. Run the app on your laptop

Open this folder in VS Code, open the terminal (Terminal -> New Terminal) and run:

```
npm install
```

Copy `.env.example` to a new file called `.env.local` and fill in the four values:

```
NEXT_PUBLIC_SUPABASE_URL=...          (Project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     (anon public key)
SUPABASE_SERVICE_ROLE_KEY=...         (service_role secret key)
ADMIN_PASSWORD=...                    (the password YOU choose)
```

Then start it:

```
npm run dev
```

Open http://localhost:3000

## 4. How to use it

1. Open **/admin**, log in, and add in this order: **Settings** (event name and starting purse), **Categories**, **Teams**, **Players**.
   Tip: the Players tab can add many players at once. Paste one per line: `Name, Category, Age, Level`.
2. Open **/display** on the projector laptop and press **Full screen**.
3. Open **/auction** on the auctioneer laptop.
   - Click the category the chief guest drew.
   - Click **Next player** (or pick one from the list).
   - Click team buttons to raise the bid (or press keys 1 to 9). The first click takes the base price, every next click adds the category's bid step.
   - Click **Sold**, or **No sale**. **Undo last bid** and **Undo sale** fix mistakes.
   - When the category is finished, click **Finish category and show results**. The projector shows the results.
   - **Results so far** and **Final squads** can be opened any time. **Show the auction again** returns the projector to the auction.
   - After all categories, click **Start unsold round**. Only teams that still miss a category can bid.
4. **Switch to light / dark** is on the top of the auction screen. The projector follows.

## 5. Rules the software enforces

- One player per category for each team. Squad size = number of categories.
- A team cannot bid more than it can afford. It must keep enough money to buy a player at base price in every category it still has to fill.
- The highest bidder cannot raise their own bid.
- Unsold players come back at the same base price in the unsold round.

All of these rules are in one file: `lib/rules.js`.

## 6. Put it on GitHub

1. Create an empty repository on https://github.com (no README).
2. In the VS Code terminal:

```
git init
git add .
git commit -m "BPL auction"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```

(`.env.local` is already ignored, so your secret keys are NOT uploaded.)

## 7. Get a link that works on any laptop (Vercel)

1. Go to https://vercel.com, sign in with GitHub, click **Add New -> Project** and choose your repository.
2. Before deploying, open **Environment Variables** and add the same four values from `.env.local`.
3. Click **Deploy**. You get a link like `https://your-app.vercel.app`.
   - `https://your-app.vercel.app/display` is the projector link.
   - `https://your-app.vercel.app/auction` is the auctioneer link.

## 8. Before the real event

- Do a full **rehearsal** with dummy data a day or two before. Free Supabase projects pause after about a week without use, so this also wakes it up.
- After the rehearsal, go to **Admin -> Settings -> Start over** (type RESET). This clears bids and sales but keeps players, teams and categories.
- Keep your phone hotspot ready as a second internet connection.
- Test the projector in dark and light mode at the venue.

## 9. Folder guide

```
app/                  the pages (each folder is one web address)
  admin/              admin page
  auction/            auctioneer screen
  display/            projector view
  login/              password page
  api/                the server code (saves to the database, checks every rule)
components/           reusable pieces (Stage, TeamButton, ResultsBoard, ...)
  admin/              the admin tabs
lib/                  helpers
  rules.js            ALL auction rules
  useAuctionData.js   loads live data for every screen
schema.sql            the database design
```

## 10. Common changes

- **Currency symbol:** `lib/format.js` (`CURRENCY`).
- **Colours and animation:** the top of `app/globals.css` (dark and light blocks).
- **Auction rules:** `lib/rules.js`.

## Troubleshooting

- *"Supabase keys are missing"*: check `.env.local`, then stop and restart `npm run dev`.
- *"Database not ready"*: run `schema.sql` again in the Supabase SQL Editor.
- *Wrong password*: `ADMIN_PASSWORD` in `.env.local` (or in Vercel settings) is the password. Restart after changing it.
- *Images do not upload*: make sure `schema.sql` ran fully (it creates the public `images` storage bucket).
