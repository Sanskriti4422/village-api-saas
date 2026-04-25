# Village API SaaS Platform

A production-style backend SaaS platform that provides REST APIs for India's village-level geographical data.

## 🚀 Features

- Hierarchical APIs  
  (Country → State → District → Sub-district → Village)
- Autocomplete search API
- Admin dashboard for monitoring data
- API key system (basic implementation)
- Structured and normalized dataset

## 🛠 Tech Stack

- Next.js
- Node.js
- Prisma ORM
- SQLite / PostgreSQL
- Tailwind CSS

## ⚙️ Setup Instructions

```bash
## ⚙️ Setup Instructions

```bash
git clone https://github.com/Sanskriti4422/village-api-saas.git
cd village-api-saas
npm install

# Setup database
npx prisma generate
npx prisma db push

# (Optional) Import dataset
node scripts/import-to-db.ts

# Run project
npm run dev
