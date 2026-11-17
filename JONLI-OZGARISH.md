# Himoyada qo‘lda o‘zgartirish

Jonli tahrir uchun `npm run dev` ni ishlating va `http://127.0.0.1:5173` ni oching. Fayl saqlanganda natija avtomatik yangilanadi. Production serverdagi `3000` portida o‘zgarish ko‘rinishi uchun `npm run build` ni qayta bajaring.

## Matn va tugma

`src/content.js` ichidagi `BRAND` obyekti:

```js
hero: ["Har yukning", "o‘z yo‘li bor."],
cta: "Qatnov topish",
```

`hero` dagi ikkita matn — landing sarlavhasining ikki qatori. `introduction` — izoh, `cta` — asosiy tugma, `name` — umumiy logo yonidagi nom. Qo‘llanma kartalari `GUIDE`, savol-javob `FAQ` ro‘yxatlarida. Sahifaga xos qolgan matnni VS Code qidiruvi orqali toping; HTML ichidagi mazmunni o‘zgartirib, teglarni saqlang.

## Qatnovni tahrirlash

Barcha asosiy qatnov ma’lumoti `src/content.js` → `TRIPS` da:

```js
{
  id: "Y02",
  from: "Viloyat markazi",
  to: "B tumani",
  date: "20.11.2026",
  time: "10:00",
  color: "peach",
  caption: "Markazdan yo‘lga",
  type: "Ertalabki qatnov"
}
```

`from`, `to`, `date` yoki `time` o‘zgarsa katalog, tanlangan shakl va tasdiq shu manbadan yangilanadi. Sana `KK.OO.YYYY`, vaqt `SS:DD` formatida. Rang variantlari: `blue`, `peach`, `mint`, `lavender`, `yellow`.

Biletdagi asl beshta yozuvni hakam so‘ramaguncha o‘zgartirmang. `id` qiymati URL va saqlangan tarix bilan bog‘langan; mavjud ID ni almashtirish eski tasdiqlarni buzishi mumkin. Yangi hudud qo‘shilsa `DESTINATIONS`, sxema tugunlari va sahifadagi umumiy jadval matnlarini ham moslang. Asl bilet ma’lumotlari ataylab o‘zgartirilsa, ularning aniq qiymatini tekshiruvchi testning kutilgan natijasi ham yangi talabga mos yangilanadi.

## Rang

Landing va umumiy fokus rangi `src/brand.css` ichidagi `--brand-primary` orqali boshqariladi:

```css
--brand-primary: #2357cf;
```

Ichki sahifalarning yuqori o‘ngidagi palitra tugmasi to‘rtta rangdan birini tanlaydi. Material rang tizimi matn, fon, tugma va konteynerlarni birga hisoblaydi. Tanlov shu brauzerda eslab qolinadi. Quyosh/oy tugmasi yorug‘ va qorong‘i rejimni almashtiradi.

Dastlabki Material rangi `src/content.js` dagi `BRAND.themeSeed` orqali boshqariladi. Bu yangi brauzerdagi boshlang‘ich tanlovga ta’sir qiladi. Brauzerda oldingi palitra tanlangan bo‘lsa, saqlangan tanlov standart qiymatdan ustun turadi; yangi tanlovni palitra orqali bering. So‘rovlar tarixini tozalash kerak emas.

## Logo va ko‘rinish

Logo fayli `public/brand/logo.png`. Shu nom bilan almashtirish umumiy logolarni yangilaydi. Tasvirning tomonlar nisbatini buzmasdan, tiniq va imkon qadar shaffof fonli fayl ishlating.

Landing tahriri `src/Landing.jsx`, `src/Landing.css`, `src/ParticleScene.jsx` da. Ichki sahifalar uslubi `src/workspace.css` va `src/style.css` da. Bir sahifani o‘zgartirganda uslubni o‘sha sahifa klassi bilan chegaralang; umumiy `button`, `h1`, `section` qoidalari hamma ekranga ta’sir qilishi mumkin.

## Tahrirdan keyin

1. O‘zgargan sahifani katta ekranda va telefon kengligida ko‘ring.
2. B tumani filtrida Y02 va Y03 qolishini tekshiring.
3. Y02 so‘rovini ism va yuk tavsifi bilan yuboring, tasdiqdagi ma’lumotni solishtiring.
4. `npm test`, so‘ng `npm run build` ni bajaring. Joylashdan oldin `node --test server.test.js` ni ham ishlating.

Sahifalarga `.env` yoki server kalitlarini qo‘shmang. Ushbu versiyaning asosiy oqimi kalitsiz ishlaydi.
