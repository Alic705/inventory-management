# 🚀 Project Deployment Guide (Method 1: Render + Vercel)

Yeh guide aapko apka **Backend (Render.com)** aur **Frontend (Vercel)** par 100% free live karne ke steps batati hai.

---

## 1️⃣ STEP 1: Backend Deployment (Render.com)

1. **[Render.com](https://render.com)** par free account banayein ya sign in karein.
2. Dashboard mein **New +** button daba kar **Web Service** select karein.
3. Apni GitHub repository ko connect karein.
4. Settings fill karein:
   - **Name:** `project-fixer-backend` (ya jo aap chahein)
   - **Region:** Singapore ya Nearest region
   - **Branch:** `main` (ya master)
   - **Root Directory:** `project-fixer` (agar subfolder hai, varna empty)
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. **Environment Variables** (Advanced section mein add karein):
   - `DATABASE_URL` = `your_mongodb_connection_string`
   - `SESSION_SECRET` = `your_random_secret_key`
   - `NODE_ENV` = `production`
   - `CLIENT_ORIGIN` = `https://your-frontend.vercel.app` (Deployment ke baad update kar sakte hain)
6. **Create Web Service** button daba dein.
7. Deployment complete hone par aapko Backend URL milega, maslan:
   👉 `https://project-fixer-backend.onrender.com`

---

## 2️⃣ STEP 2: Frontend Deployment (Vercel)

1. **[Vercel.com](https://vercel.com)** par sign in karein.
2. Dashboard par **Add New...** -> **Project** dabaayein.
3. Apni GitHub repository import karein.
4. Project Configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `project-fixer` (agar project main root mein hai to empty chhod dein)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
5. **Environment Variables** add karein:
   - `VITE_API_URL` = `https://project-fixer-backend.onrender.com` (Jo Render se URL mila tha)
6. **Deploy** button daba dein.

---

## ✅ Total Automated Configuration Added to Code

Mainey code mein ye sab automatic handle kar diya hai:
1. `client/src/main.tsx` mein global `fetch` interceptor daal diya hai jo production mein `VITE_API_URL` auto-attach karega.
2. `client/src/lib/queryClient.ts` mein React Query requests ke liye API base URL add kar diya hai.
3. `server/index.ts` aur `server/auth.ts` mein dynamic **CORS** handle kar diya hai taake aapka Vercel domain allow rahe.
4. `server/auth.ts` mein production sessions aur SSL cookies active kar di hain.
