# מעקב תרופות לחיות מחמד

PWA פשוט (HTML/CSS/JS רגיל, בלי build step) למעקב משותף בין בני בית אחר מתן תרופות לחיות מחמד, עם סנכרון בזמן אמת דרך Supabase.

## הרצה מקומית

צריך שרת סטטי כלשהו (לא לפתוח כ-`file://`, כי מודולי ה-service worker וה-CDN לא תמיד עובדים נכון ככה). למשל:

```bash
npx serve .
```

ואז לפתוח את הכתובת שמודפסת בטרמינל.

## הגדרת Supabase

1. ליצור פרויקט חדש ונפרד ב-[supabase.com](https://supabase.com) (לא להשתמש בפרויקט של אפליקציית הצמחים).
2. ב-SQL Editor להריץ את התוכן של [`supabase/migration.sql`](supabase/migration.sql).
3. ב-Settings → API להעתיק את ה-Project URL וה-anon public key.
4. להעתיק את `config.example.js` לקובץ בשם `config.js` (הוא ב-`.gitignore`, לא עולה ל-git) ולמלא שם את שני הערכים.

## פריסה ל-Vercel

הפרויקט סטטי לגמרי — אין build command. ב-Vercel לבחור Framework Preset: **Other** (או Static), Build Command: ריק, Output Directory: `.`. **חשוב:** להוסיף את `config.js` כקובץ בפריסה בנפרד (למשל דרך משתני סביבה + שלב build קטן, או פשוט להעלות אותו ידנית) כי הוא לא ב-git.

## הוספה למסך הבית באייפון

Safari → כפתור השיתוף (הריבוע עם החץ) → "הוסף למסך הבית".
