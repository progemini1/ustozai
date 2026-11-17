# Bilet 006 — Kichik yuk uchun transport topish

Manba: foydalanuvchi bergan `20261117_113818.jpg`, 2026-11-17. Biletda 120 daqiqa yozilgan. Foydalanuvchi ish davomida 50 daqiqa qolganini aytdi, keyin vaqt va limitni o‘zi nazorat qilishini, sifatni qisqartirmaslikni talab qildi.

## Asl vazifa va ma’lumotlar

Kichik yukni jo‘natmoqchi bo‘lgan foydalanuvchiga mos qatnovni topishda yordam beradigan sayt yarating. Qatnovlar quyidagi tayyor ro‘yxatdan olinadi.

| ID  | Qayerdan        | Qayerga  | Jo‘nash vaqti     |
| --- | --------------- | -------- | ----------------- |
| Y01 | Viloyat markazi | A tumani | 20.11.2026, 09:00 |
| Y02 | Viloyat markazi | B tumani | 20.11.2026, 10:00 |
| Y03 | A tumani        | B tumani | 20.11.2026, 14:00 |
| Y04 | B tumani        | C tumani | 21.11.2026, 09:00 |
| Y05 | C tumani        | A tumani | 21.11.2026, 11:00 |

## Majburiy talablar

1. 5 ta qatnov yo‘nalishi va jo‘nash vaqti bilan ko‘rsatiladi.
2. Yetib borish hududi bo‘yicha Barchasi, A tumani, B tumani, C tumani tanlovlari.
3. Qatnov tanlanganda uning yo‘nalishi va vaqti bilan so‘rov shakli ochiladi.
4. Ism va yukning qisqa tavsifi — ikkalasi majburiy.
5. Yuborilganda tanlangan qatnov, ism va yuk tavsifi bilan tasdiq.

## Biletdagi qabul sinovlari

- B tumani filtrida faqat Y02 va Y03.
- Y02, Sinovchi 01, 2 quti kitob → Viloyat markazi → B tumani, ism va yuk tavsifi tasdiqda.
- Tavsif bo‘sh yoki faqat bo‘shliqlardan iborat bo‘lsa tasdiqlanmaydi.

## Chegara

Xarita, GPS, narx hisoblash, yuk sig‘imini tekshirish va haydovchiga haqiqiy xabar talab qilinmaydi. Sinov loyihasi: haqiqiy xarid, band qilish yoki xabar yuborish amalga oshirilmaydi.

Rasmda tilga olingan 1-betning umumiy talablari foydalanuvchiga og‘zaki o‘qib berilgan. U foydalanuvchi orqali aniqlashtirildi: sayt to‘liq ishlashi, tugmalar soxta bo‘lmasligi, bilet ma’lumotlari to‘g‘ri ishlatilishi kerak; qo‘shimcha imkoniyatlar va sinov yetkazish ma’lumotlaridan foydalanish mumkin. Qo‘lda o‘zgartirish so‘ralishi mumkin. Alohida 1-bet rasmi ushbu repoga kiritilmagan.

## Foydalanuvchi tanlovi

- Landing: SI.gov/Yuksal’dan ilhom, o‘zimizga mos shakl va kuchli animatsiya.
- Ichki interfeys: Bloom / Material Design 3.
- Qo‘lda kichik tahrir sifatni pasaytirmasligi kerak; matn, rang va qatnovlar uchun aniq fayl xaritasi.
- Maksimal sifat. Supabase/Render tayyorgarligi Antigravity’da; biletning asosiy oqimi majburiy auth yoki API’ga bog‘lanmaydi.
- Ishchi nom: Yo‘lchi. Logo: foydalanuvchi tanlagan Ustozailogo.png.
- Landing tahriri Antigravityga berilgan. Uning fayllari `src/Landing.jsx`, `src/Landing.css`, `src/ParticleScene.jsx`; ichki sahifa va asosiy funksiyalar Codex tomonidan davom ettiriladi.

## Talab → joy → dalil

| Talab              | Joy                                              | Sinov                              |
| ------------------ | ------------------------------------------------ | ---------------------------------- |
| Qatnovlar          | /qatnovlar, src/content.js                       | 5 ID, manzil va vaqt aynan mos     |
| Filtr              | /qatnovlar                                       | B → Y02/Y03; A → Y01/Y05; C → Y04  |
| Tanlangan shakl    | /sorov/:id                                       | URL/reload va route xulosasi       |
| Majburiy maydonlar | /sorov/:id, src/domain.js                        | bo‘sh/whitespace/uzunlik           |
| Tasdiq             | /tasdiq/:id                                      | yozilgan ism/tavsif va ayni qatnov |
| Qo‘lda tahrir      | src/content.js, src/brand.css, JONLI-OZGARISH.md | matn/rang/element xaritasi         |
