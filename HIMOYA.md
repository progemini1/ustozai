# Bilet 006 — himoya tartibi

## Qisqa tanishtirish

“Yo‘lchi kichik yukni yaqin hududga jo‘natish uchun berilgan beshta qatnovdan mosini topishga yordam beradi. Yetib borish hududini tanlaymiz, yo‘nalish va vaqtni tekshiramiz, ism hamda yuk tavsifi bilan so‘rov tayyorlaymiz. Tasdiqni qayta ochish yoki faylga olish mumkin.”

Landingdan **Qatnov topish** orqali ichki ilovaga o‘ting. Birinchi ko‘rinishda beshta qatnov, aniq sana va vaqtlar borligini ko‘rsating.

## 1. Yetib borish hududi filtri

1. `/qatnovlar` sahifasida **B tumani** ni tanlang.
2. Faqat **Y02** va **Y03** qolishini ko‘rsating.
3. Y02 — Viloyat markazi → B tumani; Y03 — A tumani → B tumani. Filtr jo‘nash manziliga emas, yetib borish hududiga ishlaydi.
4. **Barchasi** barcha beshta qatnovni qaytaradi.

Qo‘shimcha tekshiruv: A tumani → Y01/Y05; C tumani → Y04. Qidiruvda `Y02` yozilsa tanlangan filtr bilan birga ishlaydi.

## 2. Tanlangan qatnov va muvaffaqiyatli tasdiq

1. Y02 kartasida **So‘rov qoldirish** ni bosing.
2. Shaklda **Y02**, **Viloyat markazi → B tumani**, **20.11.2026, 10:00** ko‘rsatilishini tekshiring.
3. Ism: **Sinovchi 01**.
4. Yukning qisqa tavsifi: **2 quti kitob**.
5. **So‘rovni yuborish** ni bosing.
6. Tasdiqda ayni qatnov, vaqt, ism va yuk tavsifi borligini ko‘rsating.
7. Sahifani yangilang: xotira ruxsat etilgan brauzerda tasdiq saqlanadi. **So‘rovlarim** dan qayta oching; **Tasdiqni yuklash** matn faylini beradi.

## 3. Bo‘sh tavsifni rad etish

1. Y02 so‘rov shaklini qayta oching.
2. Ismga **Sinovchi 01** yozing.
3. Tavsifni bo‘sh qoldiring va yuboring.
4. **Yukning qisqa tavsifini yozing.** xabari chiqadi; tasdiqqa o‘tmaydi.
5. Tavsifga faqat bir nechta bo‘shliq kiriting va yuboring. Shu xato yana chiqishi kerak.
6. Ism ham majburiy: bo‘sh yoki faqat bo‘shliqlardan iborat ism qabul qilinmaydi.

## Qo‘shimcha sifatni ko‘rsatish

- Hududlar, qidiruv va qatnov tafsilotlari bir xil ma’lumotga bog‘langan.
- Telefon va katta ekran uchun moslashuvchan interfeys.
- Rang palitrasi, qorong‘i rejim va animatsiyani kamaytirish sozlamasiga hurmat.
- So‘rovlar tarixi, nusxa olish va bosma tasdiq.
- Qadoqlash bo‘yicha mazmunli qo‘llanma va tayyorgarlik ro‘yxati.
- Qo‘lda o‘zgartirish uchun markazlashgan `src/content.js` va [tahrir xaritasi](JONLI-OZGARISH.md).

## Xizmat chegarasi haqida aniq javob

Bu bilet uchun sinov saytidir. Tugmalar o‘z vazifasini bajaradi, so‘rov tekshiriladi va tasdiq yaratiladi. Haqiqiy bron, haydovchiga xabar, to‘lov, GPS, narx yoki yuk sig‘imini tekshirish amalga oshirilmaydi va bunday natija va’da qilinmaydi. Biletda bu integratsiyalar talab qilinmagan.

Mehmon so‘rovlari brauzerda saqlanadi. Google orqali kirgan foydalanuvchining so‘rovlari Supabase’da egasiga tegishli RLS bilan saqlanadi; haqiqiy yozish muvaffaqiyatsiz bo‘lsa ogohlantirish chiqadi. Google callback, bulutdan reload va boshqa hisobning yozuviga kirish rad etilishini jonli ko‘rsating. Telegramga yuborish faqat tugma bosilganda, JWT va bazadagi ega tekshirilgach bajariladi; bu haydovchiga bron xabari emas.

Tarix limiti 100 ta. Limitga yetilganda eski so‘rovlar jim o‘chirilmaydi; yangi tasdiq faqat joriy oynada qoladi va faylga yuklash kerakligi tushuntiriladi. JSON tiklash mavjud yozuvlarni asraydi, bir xil ID ni takrorlamaydi va limitdan oshsa o‘zgartirish kiritmaydi.

## Texnik savolga javob

React va Vite; Bloom asosidagi Material Web komponentlari; Material Color Utilities bilan dinamik ranglar; Motion animatsiyalari. Server Node.js standart HTTP modulida, `/health` tekshiruvi va SPA deep link qo‘llovi bilan. Testlar bilet ma’lumotlarini, filtr va tekshirishni, saqlashdagi xatolarni hamda production HTTP javoblarini tekshiradi.

## Qo‘shimcha funksiyalarni ko‘rsatish

1. Yuqori o‘ngdagi Google orqali kirish → haqiqiy Google → `/hisob`; chiqish va qayta kirish.
2. So‘rovni tayyorlab hisobga saqlash, sahifani yangilash va tarixdan qayta ochish.
3. AI: “B tumaniga qatnovlarni top”. `search_trips` vositasi haqiqiy jadvaldan Y02/Y03 ni qaytaradi. “Y02 uchun Sinovchi 01, 2 quti kitob qoralamasini tayyorla” → tekshirilgan qoralama, shaklga joylash yoki tasdiq yaratish.
4. Telegramga yuborish → haqiqiy natijadan keyingina “Yetkazildi”. Xatoda qayta urinish mumkin.

`npm run check` domen, AI/agent, Telegram, Supabase va production HTTP testlarini birga bajaradi. Mock testlar jonli OAuth va RLS sinovini almashtirmaydi.
