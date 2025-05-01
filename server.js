const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const { BOT_TOKEN, ADMIN_CHAT_ID } = require('./config');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/api/photo', upload.single('photo'), async (req, res) => {
  const { userId } = req.body;
  const photoPath = path.resolve(req.file.path);

  const form = new FormData();
  form.append('chat_id', userId);
  form.append('photo', fs.createReadStream(photoPath));

  const formAdmin = new FormData();
  formAdmin.append('chat_id', ADMIN_CHAT_ID);
  formAdmin.append('caption', `Yeni şəkil ${userId}-dən gəldi.`);
  formAdmin.append('photo', fs.createReadStream(photoPath));

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, form, { headers: form.getHeaders() });
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, formAdmin, { headers: formAdmin.getHeaders() });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  } finally {
    fs.unlink(photoPath, () => {});
  }
});

app.listen(3000, () => console.log('Server hazırdır: http://localhost:3000'));
