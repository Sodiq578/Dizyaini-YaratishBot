const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const botToken = '7555810817:AAGfB4Yvs9Wswo-GwRGrktTpo4-YCnOMtD8'; // Bot token
const adminChatId = '-4707143908'; // Admin chat ID
const bot = new TelegramBot(botToken, { polling: true });

const userState = {}; // Foydalanuvchilarning holatini saqlash uchun

const catalogProducts = [
  {
    name_uz: "Xudy",
    name_ru: "Худи",
    price: "Tabiiy paxta: 80%. Yumshoq va qulay material. Narxi: 30 000 UZS",
    price_ru: "Натуральный хлопок: 80%. Мягкий и удобный материал. Цена: 30 000 UZS",
    videoPath: path.join(__dirname, "assets/videos/video1.mp4"),
    imagePath: path.join(__dirname, "assets/images/Jigar-Tshirt.jpg")
  },
  {
    name_uz: "Futbolka",
    name_ru: "Футболка",
    price: "Tabiiy paxta: 100%. Nafas oluvchi mato. Narxi: 60 000 UZS",
    price_ru: "Натуральный хлопок: 100%. Дышащая ткань. Цена: 60 000 UZS",
    videoPath: path.join(__dirname, "assets/videos/video2.mp4"),
    imagePath: path.join(__dirname, "assets/images/Jigar-Tshirt.jpg")
  },
  {
    name_uz: "Svitshot",
    name_ru: "Свитшот",
    price: "Tabiiy paxta: 85%, Polyester: 15%. Issiqlikni ushlab turuvchi mato. Narxi: 80 000 UZS",
    price_ru: "Натуральный хлопок: 85%, Полиэстер: 15%. Ткань сохраняет тепло. Цена: 80 000 UZS",
    videoPath: path.join(__dirname, "assets/videos/video4.mp4"),
    imagePath: path.join(__dirname, "assets/images/Jigar-Tshirt.jpg")
  }
];

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'selectLanguage' };
  bot.sendMessage(chatId, "Tilni tanlang / Выберите язык", {
    reply_markup: {
      keyboard: [["O'zbek tili"], ["Русский язык"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

// Xabarlarni qayta ishlash
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!userState[chatId]) return;
  const user = userState[chatId];

  if (user.step === 'selectLanguage') {
    user.language = text;
    user.step = 'mainMenu';
    showMainMenu(chatId, user.language);
  } else if (user.step === 'mainMenu') {
    if (text === (user.language === "O'zbek tili" ? "🛍 Mahsulotlar" : "🛍 Продукты")) {
      user.step = 'products';
      showProducts(chatId, user.language);
    } else if (text === (user.language === "O'zbek tili" ? "📞 Aloqa" : "📞 Контакты")) {
      user.step = 'contact';
      bot.sendMessage(chatId, user.language === "O'zbek tili" ? "Telefon raqamingizni yuboring:" : "Отправьте ваш номер телефона:", {
        reply_markup: {
          keyboard: [[{ text: user.language === "O'zbek tili" ? "📱 Telefon raqamni yuborish" : "📱 Отправить номер телефона", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    }
  } else if (user.step === 'contact') {
    if (msg.contact) {
      user.phoneNumber = msg.contact.phone_number;
      user.username = msg.from.username || msg.from.first_name;
      sendContactToAdmin(chatId, user);
      bot.sendMessage(chatId, user.language === "O'zbek tili" ? "Rahmat! Tez orada siz bilan bog'lanamiz." : "Спасибо! Мы свяжемся с вами в ближайшее время.");
      user.step = 'mainMenu';
      showMainMenu(chatId, user.language);
    } else if (text === (user.language === 'O\'zbek tili' ? "🔙 Orqaga" : "🔙 Назад")) {
      user.step = 'mainMenu';
      showMainMenu(chatId, user.language);
    }
  } else if (user.step === 'products') {
    const product = catalogProducts.find(p => p.name_uz === text || p.name_ru === text);
    if (product) {
      user.selectedProduct = product;
      user.step = 'productDetails';
      showProductDetails(chatId, user.language, product);
    } else if (text === (user.language === 'O\'zbek tili' ? "🔙 Orqaga" : "🔙 Назад")) {
      user.step = 'mainMenu';
      showMainMenu(chatId, user.language);
    }
  } else if (user.step === 'productDetails') {
    if (text === (user.language === 'O\'zbek tili' ? "📥 Savatga qo'shish" : "📥 Добавить в корзину")) {
      user.step = 'enterCustomText';
      bot.sendMessage(chatId, user.language === "O'zbek tili" ? "Kiyimga yozdirmoqchi bo'lgan so'zingizni yozing:" : "Напишите текст, который хотите нанести на одежду:");
    } else if (text === (user.language === 'O\'zbek tili' ? "🔙 Orqaga" : "🔙 Назад")) {
      user.step = 'products';
      showProducts(chatId, user.language);
    }
  } else if (user.step === 'enterCustomText') {
    user.customText = text;
    user.step = 'selectColor';
    showColorOptions(chatId, user.language);
  } else if (user.step === 'selectColor') {
    user.selectedColor = text;
    user.step = 'selectSize';
    showSizeOptions(chatId, user.language);
  } else if (user.step === 'selectSize') {
    user.selectedSize = text;
    user.step = 'selectQuantity';
    bot.sendMessage(chatId, user.language === 'O\'zbek tili' ? "Miqdorni kiriting:" : "Введите количество:");
  } else if (user.step === 'selectQuantity') {
    user.selectedQuantity = parseInt(text);
    user.step = 'confirmOrder';
    confirmOrder(chatId, user.language);
  } else if (user.step === 'confirmOrder') {
    if (text === (user.language === 'O\'zbek tili' ? "✅ Tasdiqlash" : "✅ Подтвердить")) {
      user.step = 'selectPaymentMethod';
      showPaymentMethods(chatId, user.language);
    } else if (text === (user.language === 'O\'zbek tili' ? "🔙 Orqaga" : "🔙 Назад")) {
      user.step = 'productDetails';
      showProductDetails(chatId, user.language, user.selectedProduct);
    }
  } else if (user.step === 'selectPaymentMethod') {
    if (text === (user.language === 'O\'zbek tili' ? "Click" : "Click") || text === (user.language === 'O\'zbek tili' ? "Payme" : "Payme") || text === (user.language === 'O\'zbek tili' ? "Naqd" : "Naqd")) {
      user.selectedPaymentMethod = text;
      user.step = 'enterPhoneNumber';
      bot.sendMessage(chatId, user.language === 'O\'zbek tili' ? "Telefon raqamingizni kiriting:" : "Введите ваш номер телефона:", {
        reply_markup: {
          keyboard: [[{ text: user.language === "O'zbek tili" ? "📱 Telefon raqamni yuborish" : "📱 Отправить номер телефона", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } else if (text === (user.language === 'O\'zbek tili' ? "🔙 Orqaga" : "🔙 Назад")) {
      user.step = 'confirmOrder';
      confirmOrder(chatId, user.language);
    }
  } else if (user.step === 'enterPhoneNumber') {
    if (msg.contact) {
      user.phoneNumber = msg.contact.phone_number;
    } else {
      user.phoneNumber = text;
    }
    sendOrderToAdmin(chatId, user);
    bot.sendMessage(chatId, user.language === 'O\'zbek tili' ? "Buyurtma qabul qilindi!" : "Заказ принят!");
    delete userState[chatId];
    showMainMenu(chatId, user.language);
  }
});

// Asosiy menyu
function showMainMenu(chatId, language) {
  bot.sendMessage(chatId, language === "O'zbek tili" ? "Asosiy menyu" : "Главное меню", {
    reply_markup: {
      keyboard: [
        [language === "O'zbek tili" ? "🛍 Mahsulotlar" : "🛍 Продукты"],
        [language === "O'zbek tili" ? "📞 Aloqa" : "📞 Контакты"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// Mahsulotlarni ko'rsatish
function showProducts(chatId, language) {
  const options = catalogProducts.map(p => [language === "O'zbek tili" ? p.name_uz : p.name_ru]);
  options.push([language === "O'zbek tili" ? "🔙 Orqaga" : "🔙 Назад"]);
  bot.sendMessage(chatId, language === "O'zbek tili" ? "Mahsulotni tanlang:" : "Выберите продукт:", {
    reply_markup: { 
      keyboard: options, 
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// Mahsulot tafsilotlari
function showProductDetails(chatId, language, product) {
  const details = language === "O'zbek tili" ? 
    `Mahsulot: ${product.name_uz}\nNarx: ${product.price}\nRasm: ${product.imagePath}` : 
    `Продукт: ${product.name_ru}\nЦена: ${product.price_ru}\nИзображение: ${product.imagePath}`;
  bot.sendMessage(chatId, details, {
    reply_markup: {
      keyboard: [
        [language === "O'zbek tili" ? "📥 Savatga qo'shish" : "📥 Добавить в корзину"],
        [language === "O'zbek tili" ? "🔙 Orqaga" : "🔙 Назад"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// Rang tanlash
function showColorOptions(chatId, language) {
  const colors = ["Qora", "Oq", "Sariq", "Yashil"];
  const colorOptions = colors.map(color => [language === "O'zbek tili" ? color : color === "Qora" ? "Черный" : color === "Oq" ? "Белый" : color === "Sariq" ? "Желтый" : "Зеленый"]);
  colorOptions.push([language === "O'zbek tili" ? "🔙 Orqaga" : "🔙 Назад"]);
  bot.sendMessage(chatId, language === "O'zbek tili" ? "Rangni tanlang:" : "Выберите цвет:", {
    reply_markup: { 
      keyboard: colorOptions, 
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// O'lcham tanlash
function showSizeOptions(chatId, language) {
  const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const keyboard = [];
  for (let i = 0; i < sizes.length; i += 2) {
    keyboard.push(sizes.slice(i, i + 2)); // Har bir qatorda 2 ta tugma
  }
  keyboard.push([language === "O'zbek tili" ? "🔙 Orqaga" : "🔙 Назад"]);
  bot.sendMessage(chatId, language === "O'zbek tili" ? "O'lchamni tanlang:" : "Выберите размер:", {
    reply_markup: { 
      keyboard: keyboard, 
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// Buyurtmani tasdiqlash
function confirmOrder(chatId, language) {
  bot.sendMessage(chatId, language === "O'zbek tili" ? "Buyurtmani tasdiqlaysizmi?" : "Вы подтверждаете заказ?", {
    reply_markup: { 
      keyboard: [
        [language === "O'zbek tili" ? "✅ Tasdiqlash" : "✅ Подтвердить"],
        [language === "O'zbek tili" ? "🔙 Orqaga" : "🔙 Назад"]
      ], 
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// To'lov usullari
function showPaymentMethods(chatId, language) {
  const paymentMethods = ["Click", "Payme", "Naqd"];
  const paymentOptions = paymentMethods.map(method => [language === "O'zbek tili" ? method : method === "Click" ? "Click" : method === "Payme" ? "Payme" : "Наличные"]);
  paymentOptions.push([language === "O'zbek tili" ? "🔙 Orqaga" : "🔙 Назад"]);
  bot.sendMessage(chatId, language === "O'zbek tili" ? "To'lov usulini tanlang:" : "Выберите способ оплаты:", {
    reply_markup: { 
      keyboard: paymentOptions, 
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

// Buyurtma ma'lumotlarini admin ga yuborish
function sendOrderToAdmin(chatId, user) {
  const orderDetails = `🛍 Buyurtma!
🆔 ID: ${chatId}
👤 Foydalanuvchi: @${user.username || "Noma'lum"}
👕 Mahsulot: ${user.selectedProduct.name_uz}
🎨 Rang: ${user.selectedColor}
📏 O'lcham: ${user.selectedSize}
🔢 Miqdor: ${user.selectedQuantity}
✏️ Yozuv: ${user.customText || "Yo'q"}
💰 Narx: ${user.selectedProduct.price}
💳 To'lov usuli: ${user.selectedPaymentMethod}
📞 Telefon raqam: ${user.phoneNumber}
🌍 Til: ${user.language}`;
  bot.sendMessage(adminChatId, orderDetails);
}

// Aloqa ma'lumotlarini admin ga yuborish
function sendContactToAdmin(chatId, user) {
  const contactDetails = `📞 Aloqa!
🆔 ID: ${chatId}
👤 Foydalanuvchi: @${user.username || "Noma'lum"}
📞 Telefon raqam: ${user.phoneNumber}
🌍 Til: ${user.language}`;
  bot.sendMessage(adminChatId, contactDetails);
}

console.log("sdf");
