// JONLI TAHRIR: sarlavha, tugma va qatnov ma’lumotlarini shu faylda o‘zgartiring.
export const BRAND = {
  themeSeed: "#2357cf",
  name: "Yo‘lchi",
  tagline: "Kichik yuk. Yaqin manzillar.",
  hero: ["Har yukning", "o‘z yo‘li bor."],
  introduction:
    "Kitoblar, sovg‘a yoki kichik buyumlar. Yaqin hududga yuk jo‘natish mos qatnovni topishdan boshlanadi.",
  cta: "Qatnov topish",
  note: "Sinov xizmati: so‘rov tayyorlanadi, haqiqiy bron yoki haydovchiga xabar yuborilmaydi.",
};
// Bilet 006 ma’lumotlari: manzillar va sana-vaqtlar aynan saqlangan.
export const TRIPS = [
  {
    id: "Y01",
    from: "Viloyat markazi",
    to: "A tumani",
    date: "20.11.2026",
    time: "09:00",
    color: "blue",
    caption: "Kunni erta boshlang",
    type: "Ertalabki qatnov",
  },
  {
    id: "Y02",
    from: "Viloyat markazi",
    to: "B tumani",
    date: "20.11.2026",
    time: "10:00",
    color: "peach",
    caption: "Markazdan yo‘lga",
    type: "Ertalabki qatnov",
  },
  {
    id: "Y03",
    from: "A tumani",
    to: "B tumani",
    date: "20.11.2026",
    time: "14:00",
    color: "mint",
    caption: "Tumanlar orasida",
    type: "Kunduzgi qatnov",
  },
  {
    id: "Y04",
    from: "B tumani",
    to: "C tumani",
    date: "21.11.2026",
    time: "09:00",
    color: "lavender",
    caption: "Yangi kun, yangi manzil",
    type: "Ertalabki qatnov",
  },
  {
    id: "Y05",
    from: "C tumani",
    to: "A tumani",
    date: "21.11.2026",
    time: "11:00",
    color: "yellow",
    caption: "Manzillarni bog‘laymiz",
    type: "Kunduzgi qatnov",
  },
];
export const DESTINATIONS = ["Barchasi", "A tumani", "B tumani", "C tumani"];
export const GUIDE = [
  {
    id: "qadoq",
    title: "Mustahkam qadoqlang",
    text: "Buyumga mos quti tanlang. Qutining ichidagi bo‘sh joylarni to‘ldiring, buyum siljimasin. Qopqoq va pastki qismini lenta bilan mahkamlang.",
    icon: "box",
  },
  {
    id: "tavsif",
    title: "Aniq tavsif yozing",
    text: "Nima jo‘natilayotganini va miqdorini yozing. Masalan, “2 quti kitob”. Mo‘rt buyum bo‘lsa, tavsifda alohida ayting.",
    icon: "edit",
  },
  {
    id: "belgi",
    title: "Mo‘rt buyumni belgilang",
    text: "Shisha va sinuvchan buyumlarni alohida yumshoq material bilan o‘rang. Quti ustiga “Mo‘rt” va kerak bo‘lsa “Yuqori tomon” belgilarini qo‘ying.",
    icon: "shield",
  },
  {
    id: "vaqt",
    title: "Qatnov vaqtini tekshiring",
    text: "So‘rov yuborishdan oldin jo‘nash sanasi, vaqti, boshlang‘ich va yakuniy manzilni yana bir marta solishtiring.",
    icon: "clock",
  },
];
export const FAQ = [
  [
    "So‘rov yuborilgach nima bo‘ladi?",
    "Tanlangan qatnov, ismingiz va yuk tavsifi bilan tasdiq yaratiladi. Uni shu brauzerda qayta ochish, nusxalash yoki chop etish mumkin. Ushbu sinov saytida haqiqiy bron va haydovchiga xabar jo‘natish amalga oshirilmaydi.",
  ],
  [
    "Qatnovni qanday tanlayman?",
    "“Qatnovlar” bo‘limida yetib borish hududini tanlang. Sizga mos yo‘nalish va jo‘nash vaqtini tekshirib, “So‘rov qoldirish” tugmasini bosing.",
  ],
  [
    "So‘rovlarim qayerda saqlanadi?",
    "So‘rovlaringiz ushbu qurilma va brauzerning mahalliy xotirasida saqlanadi. Boshqa qurilmada avtomatik ko‘rinmaydi. Xotira bloklangan bo‘lsa, sayt buni ochiq aytadi va tasdiq nusxasini olish mumkin bo‘ladi.",
  ],
  [
    "Narx va yetkazish muddati bormi?",
    "Hozircha yo‘nalish va jo‘nash vaqtini tanlash mumkin. Narx, yetib borish vaqti va maxsus yuk shartlari tashuvchi bilan alohida kelishiladi.",
  ],
];
