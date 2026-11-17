# Antigravity — Renderga joylash

Bu hujjat bajarilishi kerak bo‘lgan joylash topshirig‘i. Jonli deploy mavjud yoki muvaffaqiyatli deb tasdiqlamaydi. Kod GitHubga yuborilgach, ayni commitni deploy qiling.

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

`PORT` ni kodda qotirmang; Render bergan qiymat o‘qiladi va server `0.0.0.0` ga ulanadi. Ushbu versiyaga Supabase, Google OAuth yoki boshqa API kaliti kerak emas. Hech qanday secretni frontend, Git yoki hisobotga qo‘shmang.

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

`https://ustozai.onrender.com` oldingi infratuzilma hisobotidagi taxminiy allowlist nomi edi; uni xizmatning haqiqiy URL’i deb qabul qilmang. Supabase tayyorgarligi bu sinov saytining ishlashiga bog‘liq emas. Faqat keyin haqiqiy auth integratsiyasi so‘ralsa, Site URL va redirect ro‘yxatini amaldagi domen bilan alohida moslash kerak bo‘ladi.
