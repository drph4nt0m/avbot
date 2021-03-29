const express = require('express');
const logger = require('./utils/Logger');

const app = express();
const PORT = 80;

app.get('/', (req, res) => {
  res.status(200).send('AvBot is online!');
});

app.listen(PORT, () => {
  logger.info(`Server is running on PORT ${PORT}`);
});
