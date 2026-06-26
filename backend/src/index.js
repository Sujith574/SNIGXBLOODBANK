const app = require('./app');

const connectDB = require('./config/db');

// Ensure DB connects (app.js also calls connectDB, but keep startup explicit)
try {
  connectDB();
} catch {
  // ignore
}

const { PORT } = require('dotenv').config() || {};

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});

