# Antigravity — Renderga joylash

Bu hujjat bajarilishi kerak bo‘lgan joylash topshirig‘i. Jonli deploy mavjud yoki muvaffaqiyatli deb tasdiqlamaydi. Kod GitHubga yuborilgach, ayni commitni deploy qiling.

## Yangilangan integratsiya — birinchi o‘qing

Google Auth va Supabase bazasi qo‘shilgan. `SUPABASE-SETUP.md` bo‘yicha `supabase/migrations/202611170001_requests.sql` ni loyiha SQL Editor’ida bajaring. Render muhitiga `SUPABASE_URL=https://nyfulxqqclkkiccnpyeo.supabase.co` va shu loyihaning **publishable/anon** kalitini `SUPABASE_ANON_KEY` sifatida kiriting. `service_role` kerak emas va public config’ga berilmaydi.

Mahalliy `loyiha/.env` da foydalanuvchi bergan AI va Telegram kalitlari bor, Git’dan chiqarilgan. Renderga aynan server environment sifatida qo‘ying. Maxfiy qiymatlarni hisobot yoki repo fayliga yozmang. `SUPABASE_ANON_KEY` ni mahalliy `.env` ga ham qo‘shing, shunda localhost’da haqiqiy login ishlaydi. Config kiritilgach backendni qayta ishga tushiring.

Codex Render yaratish formasini `yolchi-uz`, Singapore, **Free**, `main`, `npm ci && npm run build`, `npm start`, `/health` bilan tayyorladi va 6 ta AI/Telegram qiymati + `NODE_VERSION=22.16.0` ni kiritdi. **Deploy tugmasi bosilgani tasdiqlanmagan.** Yangi xizmatni takror yaratishdan avval shu formani tekshiring.

Public Git Repository URL bilan oddiy service auto-deploy qilmaydi. Foydalanuvchi keyingi pushlar avtomatik chiqishini so‘radi: Git Provider orqali faqat `progemini1/ustozai` reposini ulash va **On Commit** rejimini tanlash kerak. Yangi GitHub app ruxsati chiqsa foydalanuvchi shu ruxsatni tasdiqlaydi; aks holda GitHub Actions → maxfiy Render deploy hook orqali avtomatlashtirish mumkin. Deploy hook maxfiy, repo yoki hisobotga yozilmaydi.

Google Cloud OAuth callback avvalgidek `https://nyfulxqqclkkiccnpyeo.supabase.co/auth/v1/callback`. Supabase Site URL — Render bergan haqiqiy origin. Redirect allowlist — shu origin `/auth/callback` va localhost 3000/5173 callbacklari. Bu ikki callbackni aralashtirmang.

AI `/api/ai`: haqiqiy native function calling, 6 ta vosita, bitta agent, Groq/Gemini va 4 kalit almashinuvi. Standartlar `openai/gpt-oss-120b`, `gemini-3.5-flash-lite`; ikkala provider haqiqiy javob bilan tekshirildi. Telegram `/api/telegram/receipt`: Google sessiyasi tekshiriladi va tasdiq Supabase’dan egasi bo‘yicha olinadi; keyin haqiqiy chatga yuboriladi. JWT bo‘lmasa 401; guest brauzer tasdig‘i o‘zicha Telegramga yuborilmaydi.

## Manba va loyiha

- GitHub: [progemini1/ustozai](https://github.com/progemini1/ustozai).
- Mahalliy repo: `C:\Users\User\Downloads\ustozai\loyiha`.
- GitHub repo ildizida `package.json`, `server.mjs`, `render.yaml`, `src/` va `public/` bo‘lishi kerak. Mahalliy yuqori papka ichidagi `loyiha` nomini Render Root Directory ga yozmang.
- Oldindan tayyorlangan Render project: [ustozai project](https://dashboard.render.com/project/prj-dbtu8367bikc73fom3u0), workspace `Pro's workspace`, environment `Production`.

## Xizmat sozlamasi

Ushbu loyiha uchun **Node Web Service** yarating. `render.yaml` shu sozlamalarni saqlaydi. Xizmat nomi mavjud bo‘lmasa `yolchi` yoki bo‘sh nom tanlanadi; nomni tanlash domen oldindan band qilinganini anglatmaydi.

| Maydon            | Qiymat                                  |
| ----------------- | --------------------------------------- |
| Repository        | `https://github.com/progemini1/ustozai` |
| Branch            | Kod yuborilgan amaldagi branch          |
| Root Directory    | Bo‘sh — repo ildizi                     |
| Runtime           | Node                                    |
| Build Command     | `npm ci && npm run build`               |
| Start Command     | `npm start`                             |
| Health Check Path | `/health`                               |
| Environment       | `NODE_VERSION=22.16.0`                  |
| Instance          | Free, agar dashboardda mavjud bo‘lsa    |

`PORT` ni kodda qotirmang; Render bergan qiymat o‘qiladi va server `0.0.0.0` ga ulanadi. Supabase/Google, AI va Telegram uchun yuqoridagi environment sozlamalari kerak. Hech qanday secretni frontend, Git yoki hisobotga qo‘shmang.

Deploy tugaguncha build log va xizmat holatini kuzating. Xato chiqsa oxirgi mazmunli logni oling, manbasini aniqlang. `Live` holati hamda sahifaning ochilishini tekshirmaguncha tayyor deb xabar bermang.

## Jonli tekshiruv

Render bergan haqiqiy URL bilan:

1. `/health` → HTTP 200, `{"status":"ok"}`.
2. `/` → landing; **Qatnov topish** → katalog.
3. `/qatnovlar` ni yangi tabda bevosita ochish va yangilash ishlasin.
4. `/sorov/Y02` ni bevosita oching; tanlangan manzil va vaqt chiqsin.
5. B tumani filtrida faqat Y02 va Y03 qolsin.
6. `Sinovchi 01` va `2 quti kitob` bilan Y02 tasdig‘ini yarating; yangilash va **So‘rovlarim** orqali qayta ochish ishlasin.
7. Bo‘sh yoki faqat bo‘shliqli yuk tavsifi rad etilsin.
8. Telefon kengligida gorizontal siljish, yopilib qolgan tugmalar yoki ochilmaydigan navigatsiya bo‘lmasin.
9. `/assets/not-present.js` → 404. Bu HTML fallback bo‘lmasligi kerak.

Sinov so‘rovini yuborish haqiqiy bron yoki xabar yaratmaydi. Tasdiqning URL’i boshqa brauzerga ma’lumotni ko‘chirmaydi; so‘rovlar shu brauzerda saqlanadi.

## Qaytariladigan hisobot

```text
Render xizmat nomi va dashboard havolasi:
Haqiqiy jonli URL:
Branch va deploy qilingan commit SHA:
Deploy holati va tekshirilgan vaqt:
/health HTTP holati:
Deep link/reload natijasi:
B filtri, Y02 tasdig‘i, bo‘sh tavsif natijasi:
Telefon ko‘rinishi:
Qolgan xato yoki cheklov:
```

`https://ustozai.onrender.com` oldingi infratuzilma hisobotidagi taxminiy allowlist nomi edi; uni xizmatning haqiqiy URL’i deb qabul qilmang. Google va Supabase ulanishi uchun Site URL va redirect ro‘yxatini haqiqiy domen bilan moslang. SQL va kalit bo‘lmasa mehmon rejimi ishlaydi, bulut hamda Telegram tayyor deb hisoblanmaydi.
