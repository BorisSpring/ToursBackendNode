const mongoose = require('mongoose');
const app = require('./app');

mongoose.connect(process.env.DATABASE).then(() => {
  console.log(`successfully connected`);
});

const port = process.env.PORT || 3000;
process.on('uncaughtException', (err) => {
  console.error(`Err name: ${err.name}`);
  console.error(err.message);
  console.error('UNHANDLED EXCEPTION! APP IS SHUTTING DOWN');
  server.close(() => process.exit(1));
});

const server = app.listen(port, 'localhost', () => {
  console.log(`Server listening on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Err name: ${err.name}`);
  console.error(err.message);
  console.error('UNHANDLED REJECTION! APP IS SHUTTING DOWN');
  server.close(() => process.exit(1));
});
