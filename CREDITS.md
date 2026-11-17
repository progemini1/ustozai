# Manbalar va litsenziyalar

## Dizayn va mazmun

- Vazifa va qatnov jadvali foydalanuvchi bergan Bilet 006 rasmidan olindi. Shaxsiy rasm repo tarkibiga qo‘shilmagan.
- Tayyorlov manbasi: [Azizbek Safarov tayyorgarlik sahifasi](https://azizbeksafarov.github.io/tayyorgarlik/). Berilgan dizayn to‘plamidagi Bloom va SI starterlari asosida mazkur vazifaga mos, mustaqil qatnov oqimi qurildi.
- Landing yo‘nalishi — foydalanuvchi tanlagan SI.gov; ichki interfeys — Bloom va Material Design 3. Yo‘l, quti va hududlar tasvirlari kodda SVG/canvas bilan chizilgan.
- `public/brand/logo.png` — foydalanuvchi tanlagan `Ustozailogo.png`. Logo huquqi yuzasidan mustaqil tekshiruv bajarilmagan; uni umumiy ochiq litsenziyadagi asset deb ta’riflamaymiz.
- Yo‘lchi matnlari, qadoqlash izohlari va so‘rov oqimi ushbu loyiha uchun moslandi. Biletga kirmagan narx, sig‘im yoki yetib borish muddati to‘qib qo‘shilmagan.

## Kutubxonalar

Aniq o‘rnatilgan versiyalar `package-lock.json` da qayd etilgan.

| Kutubxona                | Ishlatilishi                          | Litsenziya nusxasi                                                                                     |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| React / React DOM        | Interfeys va render                   | [React MIT](public/licenses/React-LICENSE.txt), [React DOM MIT](public/licenses/React-DOM-LICENSE.txt) |
| Motion                   | O‘tishlar va mikroanimatsiyalar       | [MIT](public/licenses/Motion-LICENSE.txt)                                                              |
| Material Web             | Material tugma va filtr komponentlari | [Apache 2.0](public/Material-Web-LICENSE.txt)                                                          |
| Material Color Utilities | Dinamik rang tizimi                   | [Apache 2.0](public/Material-Color-Utilities-LICENSE.txt)                                              |
| Vite                     | Ishlab chiqish va production build    | [MIT va kiritilgan uchinchi tomon qaydlari](public/licenses/Vite-LICENSE.txt)                          |
| Prettier                 | Manba kodini formatlash               | [MIT](public/licenses/Prettier-LICENSE.txt)                                                            |

Ikonkalar `src/icons.jsx` ichidagi SVG yo‘llarida. Runtime tashqi ikonka yoki shrift CDN’iga bog‘lanmaydi.

## Mahalliy shriftlar

| Shrift           | Mualliflar                           | Litsenziya                                           |
| ---------------- | ------------------------------------ | ---------------------------------------------------- |
| Instrument Serif | The Instrument Serif Project Authors | [SIL OFL 1.1](public/fonts/instrumentserif-OFL.txt)  |
| Instrument Sans  | The Instrument Sans Project Authors  | [SIL OFL 1.1](public/fonts/instrumentsans-OFL.txt)   |
| Google Sans Flex | The Google Sans Flex Project Authors | [SIL OFL 1.1](public/fonts/Google-Sans-Flex-OFL.txt) |
| Roboto           | The Roboto Project Authors           | [SIL OFL 1.1](public/fonts/Roboto-OFL.txt)           |

Shriftlar loyiha bilan birga saqlanadi. Litsenziya matnlari va mualliflik qaydlari joylash nusxasiga ham kiradi.

Bu ro‘yxat bog‘liqliklarning litsenziyasini saqlaydi; foydalanuvchi logosi yoki tashqi dizaynning savdo belgilariga egalik da’vosini bildirmaydi.

## Dashboard tasvirlari

`public/images/dashboard-parcels.webp` va `dashboard-delivery.webp` ushbu loyiha uchun built-in imagegen orqali yaratildi, WebP formatida optimallashtirildi. Kitoblar va qadoqlangan yuklar hamda ko‘k transport va manzil belgilari; landingdagi Antigravity tasvirlari o‘zgartirilmadi.
