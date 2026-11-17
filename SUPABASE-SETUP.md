# Supabase va Google — ulash tartibi

Kod va migratsiya tayyor. Ushbu hujjat SQL serverda bajarilganini yoki Google login muvaffaqiyatli sinovdan o‘tganini tasdiqlamaydi. Tashqi sozlamalarni foydalanuvchi topshirig‘i bilan Antigravity bajaradi; amaldagi holat natija orqali qayd etiladi.

## 1. Loyiha va public konfiguratsiya

Avval tayyorlangan loyiha:

- Project ref: `nyfulxqqclkkiccnpyeo`.
- URL: `https://nyfulxqqclkkiccnpyeo.supabase.co`.
- [Supabase dashboard](https://supabase.com/dashboard/project/nyfulxqqclkkiccnpyeo).

Dashboarddagi API Keys bo‘limidan **publishable** yoki eski **anon** kalitini oling. Serverning mahalliy `.env` yoki Render Environment sozlamalariga:

```dotenv
SUPABASE_URL=https://nyfulxqqclkkiccnpyeo.supabase.co
SUPABASE_ANON_KEY=
# Yoki shu nomdan foydalanish mumkin:
SUPABASE_PUBLISHABLE_KEY=
```

`service_role` yoki `sb_secret_` kaliti kerak emas va public konfiguratsiyada qabul qilinmaydi. `getSupabaseConfig` `{url, anonKey, configured}` qaytaradi; shu public kalit brauzerdagi SDK uchun ishlatiladi. Public kalit ma’lumotga o‘zi ruxsat bermaydi: jadval grantlari va RLS foydalanuvchining JWT sessiyasini tekshiradi. OAuth Google Client Secret va AI/Telegram kalitlari bu konfiguratsiyaga qo‘shilmaydi.

## 2. Jadval va RLS

Antigravity ayni loyiha ichidagi SQL Editor’da [202611170001_requests.sql](supabase/migrations/202611170001_requests.sql) faylining to‘liq matnini bajarsin. Foydalanuvchi ma’lumotlar bazasini ulashni topshirgan; bu yangi jadval, indeks va egasiga tegishli siyosatlarni yaratadi. Migratsiya jadval yoki yozuvlarni o‘chirmaydi. Tayyor loyiha uchun qayta ishlatish idempotent.

Agar `public.requests` jadvali avval boshqa sxemada yaratilgan bo‘lsa, avval ustunlar va mavjud siyosatlarni tekshiring. `create table if not exists` boshqa tuzilmani avtomatik tuzatmaydi; jadvalni o‘chirib qayta yaratmang. Mavjud qo‘shimcha RLS siyosatlari avtomatik olib tashlanmaydi; begona yoki keng ruxsatli policy bo‘lsa uning maqsadini aniqlab, foydalanuvchi bilan kelishilgan holda moslang.

| DB ustuni    | Turi va qoida                           | Mijozdagi maydon                |
| ------------ | --------------------------------------- | ------------------------------- |
| `id`         | UUID, primary key                       | `id`                            |
| `user_id`    | Auth foydalanuvchi UUID, majburiy       | `userId` yoki sessiya `user.id` |
| `number`     | 1–40 belgi                              | `number`                        |
| `trip_id`    | Y01–Y05 dan biri                        | `tripId`                        |
| `name`       | Bo‘shliqlardan tozalanganda 1–80 belgi  | `name`                          |
| `cargo`      | Bo‘shliqlardan tozalanganda 1–500 belgi | `cargo`                         |
| `created_at` | `timestamptz`, standart `now()`         | `createdAt`                     |

`user_id` kiritishda amaldagi Supabase sessiyasining `user.id` qiymati beriladi. Tasodifiy foydalanuvchi ID si yoki JSON nusxadagi egani ishonchli deb qabul qilmang. Mijoz `camelCase` qiymatlarini jadval uchun `snake_case` ga moslaydi.

RLS: `SELECT`, `INSERT` va `UPDATE` faqat `(select auth.uid()) = user_id`. Anonymous ruxsat yo‘q, foydalanuvchi uchun `DELETE` granti yoki siyosati yo‘q. ID, egasi va yaratilgan sana update paytida o‘zgarmaydi; bir xil qiymatli upsert ishlaydi. Auth akkaunti keyinchalik o‘chirilsa uning yozuvlari foreign key orqali cascade bilan o‘chadi; bu migratsiya hech qanday akkauntni o‘chirmaydi.

## 3. Google OAuth va qaytish manzillari

Avvalgi Antigravity hisobotida Google provider yoqilgani va client sozlangani aytilgan. Dashboardda amaldagi holatini tekshiring.

Google Cloud OAuth Client’dagi **Authorized redirect URI** aynan:

```text
https://nyfulxqqclkkiccnpyeo.supabase.co/auth/v1/callback
```

Bu Google → Supabase callback. Saytning `/auth/callback` yo‘li boshqa bosqich: Supabase → Yo‘lchi qaytishi. Ularni bir-biriga almashtirmang.

Supabase → Authentication → URL Configuration:

- **Site URL**: Render bergan haqiqiy sayt origin’i, masalan `https://REAL-SERVICE.onrender.com`.
- **Redirect URLs**: `https://REAL-SERVICE.onrender.com/auth/callback` va zarur bo‘lsa shu origin uchun `https://REAL-SERVICE.onrender.com/**`.
- Mahalliy tekshiruv: `http://127.0.0.1:5173/auth/callback`, `http://localhost:5173/auth/callback`, `http://127.0.0.1:3000/auth/callback` va ishlatiladigan mahalliy variantlar.

`ustozai.onrender.com` oldingi hisobotdagi taxminiy nom. Haqiqiy Render domeni tasdiqlanmaguncha uni ishlaydigan xizmat manzili deb hisoblamang. Google ilovasi Testing rejimida bo‘lsa sinov akkauntlarini audience ro‘yxatida tekshiring.

Frontend `@supabase/supabase-js` bilan PKCE oqimidan foydalanadi. OAuth boshlanishida `redirectTo` — joriy origin + `/auth/callback`; callbackdagi `code` bir marta sessiyaga almashtiriladi. Brauzer qaytganda kod verifier saqlangan ayni brauzer/oyna konteksti kerak. Production server `/auth/callback` deep linkiga SPA HTML berishi kerak.

## 4. Serverdagi tekshiruvlar

`server/supabase.mjs` faqat native fetch ishlatadi:

```js
getSupabaseConfig(env);
await verifyUser(accessToken, { env, fetchImpl, signal });
// { id, email, displayName, avatarUrl }
await getOwnedReceipt(receiptId, accessToken, { env, fetchImpl, signal });
// { id, userId, number, tripId, name, cargo, createdAt }
```

`verifyUser` `/auth/v1/user` orqali haqiqiy sessiyani tekshiradi. Server JWT’ni shunchaki decode qilib egani tasdiqlamaydi. `getOwnedReceipt` avval shu tekshiruvni, so‘ng foydalanuvchi JWT va public apikey bilan `/rest/v1/requests` so‘rovini bajaradi. RLSga qo‘shimcha ravishda javobdagi egani ham solishtiradi. Boshqa foydalanuvchi yozuvi chiqsa xato qaytaradi. Telegramga bulutdagi tasdiqni yuborishdan oldin shu yordamchi orqali egalikni tekshirish mumkin.

Standart timeout har tashqi GET uchun 5 soniya. Ixtiyoriy `SUPABASE_TIMEOUT_MS` 20–8000 oralig‘ida test yoki muhitga mos berilishi mumkin. Xato javobida token, public key, providerning ichki xabari yoki shaxsiy log bo‘lmaydi.

## 5. Tashqi ulanish qabul sinovi

1. Server public konfiguratsiyasi sozlanganligini tekshiring; secret kalit chiqmasin.
2. Google orqali kiring → saytga qayting → ism va avatar/sessiya ko‘rinsin.
3. Sahifani yangilang; sessiya saqlansin. Chiqish tugmasi ishlasin.
4. Y02, Sinovchi 01, 2 quti kitob so‘rovini yarating. Bazada ayni `user_id` bilan yozuv paydo bo‘lsin.
5. Akkauntdan chiqib, shu ma’lumotni anonymous sessiyada o‘qish/yangi yozish rad etilsin.
6. Ikkinchi Google foydalanuvchi bilan kiring. Birinchi foydalanuvchining so‘rovi ko‘rinmasin; uning UUID’si ma’lum bo‘lsa ham SELECT/UPDATE natijasi bermasin.
7. Boshqa `user_id` bilan INSERT va egasini o‘zgartiruvchi UPDATE rad etilsin. Oddiy ism/yuk tahriri o‘z yozuvida ishlasin.
8. Tarmoq yoki Supabase xatosida mahalliy tasdiq “bulutga saqlandi” deb ko‘rsatilmasin.

Yakuniy hisobotga SQL bajarilgan vaqt, haqiqiy sayt URL’i, login/callback/reload/logout, DB insert/select va ikkinchi foydalanuvchi RLS sinovi natijasini yozing. Kalitlar, token va foydalanuvchi emailini hisobotga nusxalamang.

## Mahalliy avtomatik sinov

```sh
node --test server/supabase.test.mjs
```

Mock testlar konfiguratsiya, malformed JWT, auth endpoint, maydonlarni tozalash, egalik/RLS xatolarini qayta ishlash, timeout va bekor qilishni tekshiradi. Ular SQL’ni tashqi loyihada bajarmaydi va haqiqiy ikki foydalanuvchi RLS sinovini almashtirmaydi.

Rasmiy manbalar: [Google provider](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [server orqali getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
