<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2301adda-e944-4bc9-b0fa-20d2930d362a

## Run Locally

**Prerequisites:** Node.js, a Neon PostgreSQL database, and a Cloudinary account.


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Set `GEMINI_API_KEY` too if using Gemini features.
3. Run the app:
   `npm run dev`

On first startup, the server creates the required tables in Neon. If `data/database.json` exists, its data is imported to Neon; otherwise the bundled sample data is used. Report photos are uploaded to Cloudinary and only their secure URLs and Cloudinary public IDs are stored in Neon. Keep all connection strings and Cloudinary secrets on the server; do not use `VITE_` prefixed variables for them.

For deployment, set the same environment variables in the hosting provider's server-side secret settings. The local `.env.local` file is not deployed.
