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
4. למלא את שני הערכים בקובץ `config.js` (קיים כבר בריפו — ראו הערה למטה על למה זה בסדר שהוא לא ב-`.gitignore`).

**הערה על `config.js` ו-git:** בניגוד לפרויקט הצמחים (Vite, שם משתני הסביבה מוזרקים בזמן build), כאן אין build step — אז אין דרך נקייה להזריק ערכים דרך Vercel. `config.js` בכוונה **לא** ב-`.gitignore` ומכיל את ה-URL וה-anon key בפועל: זה לא מדליף שום דבר שלא היה חשוף ממילא — כל דפדפן שפותח את האתר רואה את הערכים האלה ב-JS הציבורי בין כה וכה (בדיוק כמו anon key בכל פרויקט Supabase פתוח-גישה, ראו CLAUDE.md של פרויקט הצמחים). כלל הברזל: שום `service_role` key או סוד אמיתי אחר לא נכנס לקובץ הזה.

## פריסה ל-Vercel

הפרויקט סטטי לגמרי — אין build command בכלל. ב-Vercel: Import מה-ריפו ב-GitHub, Framework Preset: **Other**, Build Command: ריק, Output Directory: `.`. אין צורך בשום משתנה סביבה — `config.js` כבר בריפו.

## הוספה למסך הבית באייפון

Safari → כפתור השיתוף (הריבוע עם החץ) → "הוסף למסך הבית".
