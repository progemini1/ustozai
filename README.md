# Yo‘lchi

Kichik yuk uchun qatnov topish va so‘rov tayyorlash sayti. Bilet 006 dagi beshta yo‘nalish, jo‘nash sanalari va vaqtlar aynan saqlangan. Landing SI.gov yo‘nalishidan, ichki interfeys Bloom va Material Design 3 dan ilhomlangan.

## Ishga tushirish

Node.js 22.16 yoki undan yangi mos versiya kerak. Buyruqlarni `package.json` turgan loyiha papkasida bajaring.

```sh
npm ci
npm run dev
```

AI, Telegram va Google konfiguratsiyasi uchun ikkinchi terminalda `npm run dev:backend` ni ishga tushiring. Vite `/api` so‘rovlarini `127.0.0.1:3001` ga uzatadi. `.env.example` dagi nomlarni `.env` ga nusxalab haqiqiy qiymatlarni kiriting. `.env` Git’ga yuborilmaydi.

Ishlab chiqish manzili: [127.0.0.1:5173](http://127.0.0.1:5173). Saqlangan tahrirlar avtomatik ko‘rinadi.

Tayyor production nusxa:

```sh
npm run build
npm start
```

Manzil: [127.0.0.1:3000](http://127.0.0.1:3000). `PORT` berilsa server shu portni va hosting uchun `0.0.0.0` ni ishlatadi. `npm start` oldin yaratilgan `dist/` ni beradi; kod o‘zgarsa qayta build qiling.

## Sayt imkoniyatlari

- Qatnovlar katalogi, yetib borish hududi bo‘yicha filtr va matnli qidiruv.
- Tanlangan qatnov uchun ism va yuk tavsifi bilan tekshiriladigan so‘rov shakli.
- Qatnov, vaqt va kiritilgan ma’lumotlar bilan tasdiq; matn nusxasini yuklash, nusxalash va chop etish.
- Shu brauzerdagi so‘rovlar tarixi va JSON zaxira nusxasi.
- Yuk tayyorlash qo‘llanmasi, savol-javob, ichki sahifalarda rang palitrasi va qorong‘i rejim.

Bu sinov xizmati. Haqiqiy transport band qilinmaydi, to‘lov olinmaydi va haydovchiga xabar yuborilmaydi. Mehmon so‘rovlari `localStorage` da saqlanadi; ular boshqa qurilmaga avtomatik ko‘chmaydi. Hisobga kirilganida Supabase ulanishi quyida tushuntirilgan. Brauzer xotirasi tozalansa tarix o‘chadi. Saqlash bloklansa foydalanuvchi ogohlantiriladi va tasdiqni faylga olish mumkin.

### Google, Supabase va AI agent

Google orqali kirgan foydalanuvchining so‘rovlari Supabase `requests` jadvaliga yoziladi va hisobga qayta kirganda o‘qiladi. RLS har bir foydalanuvchiga faqat o‘z yozuvini ko‘rsatadi. Mehmon uchun mahalliy rejim ishlaydi; akkauntlarning mahalliy nusxa va qoralamalari alohida. Bulutga yozish xato bersa “saqlandi” deyilmaydi, mahalliy nusxa va qayta saqlash taklifi ko‘rsatiladi. [Supabase ulash tartibi](SUPABASE-SETUP.md) va SQL migratsiyani Antigravity tashqi dashboardda bajaradi. Kod tayyorligi haqiqiy OAuth/RLS sinovi o‘tganini anglatmaydi.

AI agent Groq/Gemini native function calling orqali jadvalni qidiradi, qatnovni ochadi, yuk tavsifi va so‘rov qoralamasini tayyorlaydi. To‘rtta kalit navbatlashadi, xato/limit bo‘lsa zaxiraga o‘tiladi. So‘rov yaratish va Telegramga yuborish alohida foydalanuvchi tugmasi bilan bajariladi. Telegram endpoint foydalanuvchi JWT’sini Supabase’da tekshiradi, tasdiqni bazadan egasi bo‘yicha oladi va ulangan chatga yuboradi. So‘rovga narx, sig‘im yoki haqiqiy transport broni qo‘shilmagan. [AI konfiguratsiya](server/AI-CONFIG.md).

Dashboardga maxsus yaratilgan, WebP’da optimallashgan ikkita tasvir qo‘shilgan: `public/images/dashboard-delivery.webp` va `dashboard-parcels.webp`.

Mahalliy tarixga ko‘pi bilan 100 ta so‘rov saqlanadi. Limitga yetganda eski yozuvlar avtomatik o‘chirilmaydi: yangi tasdiq joriy oynada qoladi va saqlanmaganligi ochiq ko‘rsatiladi. Uning matn nusxasini yuklab oling. JSON tiklash ham mavjud tarixni saqlagan holda birlashtiradi; jami 100 tadan oshsa yoki fayl noto‘g‘ri bo‘lsa hech qanday yozuvni almashtirmaydi.

## Tekshirish

```sh
npm test
npm run test:integrations
npm run build
node --test server.test.js
```

Birinchi sinovlar qatnov ma’lumotlari, filtrlar, majburiy maydonlar, tasdiq va saqlashni tekshiradi. HTTP sinovlari production nusxani alohida bo‘sh portda ishga tushirib, deep link, `/health`, haqiqiy assetlar, HEAD, 404 va 405 javoblarini tekshiradi. Ular asosiy ishlab chiqish serverini to‘xtatmaydi.

## Fayllar xaritasi

| Vazifa                                | Fayl                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| Brend, qatnovlar, matn va savollar    | `src/content.js`                                              |
| Landing                               | `src/Landing.jsx`, `src/Landing.css`, `src/ParticleScene.jsx` |
| Ichki sahifalar va navigatsiya        | `src/main.jsx`                                                |
| Umumiy tugmalar, logo va havolalar    | `src/ui.jsx`                                                  |
| Ichki vizual qismlar                  | `src/WorkspaceVisual.jsx`, `src/workspace.css`                |
| Yuk tayyorlash qo‘llanmasi            | `src/GuidePage.jsx`, `src/GuidePage.css`                      |
| So‘rovlar tarixi                      | `src/RequestsPage.jsx`, `src/RequestsPage.css`                |
| Filtr, tekshirish, tasdiq va saqlash  | `src/domain.js`                                               |
| Bazaviy brend ranglari                | `src/brand.css`                                               |
| Umumiy moslashuvchan uslublar         | `src/style.css`                                               |
| Production server va Render sozlamasi | `server.mjs`, `render.yaml`                                   |

[Qo‘lda tahrir qilish](JONLI-OZGARISH.md), [himoya tartibi](HIMOYA.md), [Renderga joylash](ANTIGRAVITY-DEPLOY.md) va [manbalar/litsenziyalar](CREDITS.md).
