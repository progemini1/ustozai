# Yo‘lchi AI — server moduli

`ai.mjs` va `agent.mjs` faqat serverda ishlaydi. Kalitlar server `.env` faylida yoki Render Environment sozlamalarida turadi. Ularni `VITE_` nomi bilan bermang, frontendga uzatmang va Gitga qo‘shmang. Tayyor namunada kalit qiymatlari yo‘q: [ai.env.example](ai.env.example).

## Ulanish kontrakti

```js
import { askAi, createAiHandler, getAiStatus } from "./server/ai.mjs";

const result = await askAi(
  {
    messages: [{ role: "user", content: "B tumaniga qaysi qatnovlar bor?" }],
    tripId: "Y02", // ixtiyoriy, mavjud qatnov ID
    cargo: "2 quti kitob", // ixtiyoriy, 500 belgigacha
  },
  { env: process.env, signal: abortController.signal },
);
// { reply: '...', provider: 'groq' | 'gemini', model: '...' }

const handleAi = createAiHandler({ env: process.env });
await handleAi(payload, { signal });

getAiStatus(process.env);
// { configured: boolean, groq: boolean, gemini: boolean, backup: boolean }
```

HTTP server JSON o‘qish, metod, body hajmi, kelib chiqish va so‘rovlar tezligi cheklovlarini alohida bajaradi. Modul tayyor payload oladi; HTTP `req/res` bilan ishlamaydi. Xatolar o‘zbekcha xavfsiz `message`, HTTP uchun `status` va barqaror `code` ga ega:

| Kod                 | Status | Ma’no                                    |
| ------------------- | ------ | ---------------------------------------- |
| `AI_INPUT`          | 400    | Savol yoki kontekst formati noto‘g‘ri    |
| `AI_NOT_CONFIGURED` | 503    | Serverda AI kaliti yo‘q                  |
| `AI_UNAVAILABLE`    | 503    | Mavjud xizmatlar vaqtincha javob bermadi |
| `AI_CANCELLED`      | 499    | Kutish tashqaridan bekor qilindi         |

Xatoda upstream javobi, URL ichidagi kalit, credential yoki foydalanuvchi suhbatining logi berilmaydi. `getAiStatus` faqat ulanish sozlanganligini bildiradi; kalitning ishlashini yoki kvotani tasdiqlamaydi. Haqiqiy smoke sinovi alohida bajariladi.

## Bir yordamchi, bir xil suhbat

Pool tartibi: **Groq asosiy → Gemini asosiy → Groq zaxira → Gemini zaxira**. Har yangi murojaat boshlanish nuqtasini keyingi kalitga suradi; xatoda qolgan mavjud kalitlar ketma-ket sinab ko‘riladi. Bir xil providerga bir xil asosiy/zaxira kalit qo‘yilsa u takroran yuborilmaydi. Barcha xizmatlar bir xil jadval, ko‘rsatma va suhbat tarixini oladi.

- Har urinish: odatda 8 soniyagacha; barcha urinishlar: jami 25 soniyagacha.
- `429`: `Retry-After` ni hisobga olib o‘sha kalit kutish holatiga o‘tadi; joriy so‘rov kutib turmay keyingi xizmatga o‘tadi.
- `401/403`: o‘sha kalit 5 daqiqaga chetlatiladi.
- `5xx`, tarmoq yoki yaroqsiz/bo‘sh javob: keyingi xizmatga o‘tiladi.
- Murojaat bekor qilinsa yangi fallback boshlanmaydi.

Cheklovlar provider yoki tashkilot darajasida umumiy bo‘lishi mumkin. Zaxira kalit mavjudligi qo‘shimcha kvota yoki uzluksiz javobni kafolatlamaydi.

## Kiritma va faktlar

Faqat `user` va `assistant` rollari qabul qilinadi. Oxirgi xabar yangi foydalanuvchi savoli bo‘lishi kerak. Jami suhbat va yuk tavsifi 12 000 belgidan oshmaydi; providerga eng so‘nggi 10 tagacha xabar yuboriladi. Kalitlar prompt ichiga qo‘shilmaydi.

Tizim jadvalni bevosita `src/content.js` dagi `TRIPS` dan oladi. Mavjud beshta qatnov, sana va vaqt asos qilib beriladi. Foydalanuvchi yozgan cargo konteksti buyruq sifatida emas, foydalanuvchi ma’lumoti sifatida uzatiladi. Yordamchi narx, sig‘im, yangi yo‘nalish, yetib kelish vaqti yoki bajarilgan bronni to‘qib aytmasligi ko‘rsatilgan. Chat tashqi amal bajarmaydi. Tashqi xizmatga yuborilgan haqiqiy xabarning natijasi alohida server oqimiga tegishli.

AI javobi model yaratgan maslahatdir. Promptdagi cheklovlar modelning har bir javobiga mutlaq kafolat bermaydi; jo‘nash vaqti hamda tasdiqning asosiy manbasi saytdagi qatnov jadvali va shakldir.

## Modellar va rasmiy manbalar

2026-11-17 kuni rasmiy hujjatlar tekshirildi:

- Groq native chat completion: [API reference](https://console.groq.com/docs/api-reference). Standart `openai/gpt-oss-120b`; amaldagi model va akkaunt ruxsatini [model ro‘yxati](https://console.groq.com/docs/models) bo‘yicha tekshiring. Llama 3.3 70B ro‘yxatda Enterprise sifatida ko‘rsatilgan; kerak bo‘lsa serverdagi `GROQ_MODEL` ni akkauntga ochiq modelga almashtiring.
- Gemini native REST: [generateContent reference](https://aistudio.google.com/api-reference/generate-content/generate-content). Standart [barqaror Gemini 3.5 Flash-Lite](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite); kalit `x-goog-api-key` sarlavhasida uzatiladi.
- Eski [Gemini 2.5 Flash](https://aistudio.google.com/docs/models/gemini-2.5-flash) hujjatida deprecated va mavjud foydalanuvchilar uchun cheklanganligi ko‘rsatilgan. Shu sababli yangi modulning standarti sifatida tanlanmadi. Zaruratda `GEMINI_MODEL` orqali ruxsat etilgan model belgilanadi.
- Groq `429` va `Retry-After`: [rate limit hujjati](https://console.groq.com/docs/rate-limits).

## Sinov

```sh
node --test server/ai.test.mjs server/agent.test.mjs
```

Testlar faqat soxta fetch javoblarini ishlatadi: to‘g‘ri endpoint va kontekst, provider almashishi, ketma-ket kalitlar, `429/401/5xx`, bo‘sh/yaroqsiz JSON, vaqt cheklovi, bekor qilish, kiritma tekshiruvi va kalit chiqib ketmasligi. Ular haqiqiy API kvotasini sarflamaydi va tashqi provider tayyorligini tasdiqlamaydi.

## Vositali agent

`askAi` matnli yordamchi uchun saqlangan. Ilovadagi faol agent `agent.mjs` → `runAgent(payload, options)` dan foydalanadi. Uning natijasi:

```js
{
  reply, provider, model,
  tools: [{ name, summary }],
  trips: [/* faqat serverdagi haqiqiy TRIPS yozuvlari */],
  actions: [/* tekshirilgan interfeys takliflari */]
}
```

Model Groq’da native `tool_calls`, Gemini’da native `functionCall` qaytaradi. Server vositani tekshiradi va bajarib, natijani yana modelga uzatadi. Gemini’dagi `thoughtSignature` va function ID keyingi native turda o‘zgartirilmay saqlanadi. Provider almashganda oldingi tekshirilgan natija yangi providerga matnli kontekst sifatida ko‘chadi; qalbaki imzo yaratilmaydi.

| Vosita             | Haqiqiy ish                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `search_trips`     | Jadvalni manzil, matn va sana bo‘yicha filtrlaydi                             |
| `get_trip`         | Mavjud ID bo‘yicha qatnovni o‘qiydi                                           |
| `open_request`     | `{type:'open_request', tripId}` taklifini beradi                              |
| `prepare_request`  | Ism/yuk bilan `prepare_request` qoralama taklifi; `requiresConfirmation:true` |
| `set_cargo`        | Tekshirilgan `set_cargo` yuk tavsifi taklifi                                  |
| `request_telegram` | `send_telegram` taklifi; `requiresConfirmation:true`, xabar yubormaydi        |

Mijoz faqat `actions` dagi oq ro‘yxatdan o‘tgan tuzilmalarni ishlatadi; yordamchi javobidan buyruq ajratib bajarmaydi. Haqiqiy so‘rovni yaratish yoki Telegramga yuborish alohida tasdiqlash interfeysida bajariladi. Agentning o‘zi chat ichidan tashqi yozuvchi amal bajarmaydi.

Bir murojaatda ko‘pi bilan 4 model turi va 8 vosita chaqiruvi, barchasi birgalikda 25 soniyagacha. Qidiruvdan keyin final matnda natijaga kirmaydigan qatnov ID chiqsa, server uni aniq jadvaldan yaratilgan javob bilan almashtiradi. Masalan B tumani natijasiga Y04 qo‘shib yuborilsa, finalda faqat Y02 va Y03 qoladi. Noma’lum vosita, ID yoki yaroqsiz argument interfeys amali yaratmaydi.

Rasmiy format manbalari: [Groq local tool calling](https://console.groq.com/docs/tool-use/local-tool-calling), [Gemini generateContent function calling](https://ai.google.dev/gemini-api/docs/generate-content/function-calling?hl=en).
