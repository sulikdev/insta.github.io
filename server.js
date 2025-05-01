const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { botToken, adminId, specialAdminId, helpChatId, reportChatId } = require('./config');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
const dbPath = path.join(__dirname, 'users.json'); // Путь к базе данных (JSON)

// Проверяем и создаем папку для хранения изображений
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Загружаем базу данных пользователей (если она существует)
let users = {};
if (fs.existsSync(dbPath)) {
  users = JSON.parse(fs.readFileSync(dbPath));
}

app.use(bodyParser.json());

// API для приема фотографии
app.post('/api/upload-photo', (req, res) => {
  const { image, link } = req.body;

  // Уникальный файл с изображением
  const fileName = `${Date.now()}.jpg`;
  const filePath = path.join(uploadDir, fileName);

  // Сохраняем изображение на сервере
  const data = image.replace(/^data:image\/jpeg;base64,/, '');
  fs.writeFile(filePath, data, 'base64', (err) => {
    if (err) {
      console.log('Ошибка при сохранении фото:', err);
      return res.status(500).send('Ошибка при сохранении фото');
    }

    // Получаем владельца ссылки
    const ownerId = getOwnerIdByLink(link); // Функция для получения владельца по ссылке
    if (ownerId) {
      // Отправляем фото владельцу и в чат помощи
      sendPhotoToBot(ownerId, filePath, 'owner')  // Отправляем фото владельцу
        .then(() => sendPhotoToBot(helpChatId, filePath, 'helpChat'))  // Отправляем в чат помощи
        .then(() => sendPhotoToBot(adminId, filePath, 'adminChat'))  // Отправляем в чат администрации
        .then(() => {
          res.json({ message: 'Фото успешно отправлено' });
        })
        .catch((err) => {
          console.log('Ошибка при отправке фото:', err);
          res.status(500).send('Ошибка при отправке фото');
        });
    } else {
      res.status(404).send('Владелец ссылки не найден');
    }
  });
});

// Функция для отправки фотографии в Telegram
function sendPhotoToBot(chatId, filePath, type) {
  const fileStream = fs.createReadStream(filePath);
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  const form = {
    chat_id: chatId,
    photo: fileStream,
  };

  return axios.post(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  .then(() => {
    // Удаляем файл после отправки
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log('Ошибка при удалении файла:', err);
      } else {
        console.log('Фото удалено с сервера');
      }
    });
  });
}

// Функция для получения владельца по ссылке
function getOwnerIdByLink(link) {
  // Здесь нужно добавить логику для получения ID владельца по ссылке
  return "123456789"; // Пример ID владельца
}

// Запуск сервера
const port = 3000;
app.listen(port, () => {
  console.log(`Сервер работает на http://localhost:${port}`);
});
