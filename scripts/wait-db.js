const net = require('net');
const fs = require('fs');
const path = require('path');

// Default database URL fallback
let databaseUrl = 'postgresql://postgres:postgres@localhost:5432/gohite_bizsphere?schema=public';

// Attempt to read the DATABASE_URL from .env in the root directory
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      databaseUrl = match[1];
    }
  }
} catch (err) {
  console.warn('Could not read .env file, using default DB URL:', err.message);
}

// Parse host and port from the database connection string
let host = 'localhost';
let port = 5432;

try {
  const urlPattern = /@([^/]+)/;
  const match = databaseUrl.match(urlPattern);
  if (match && match[1]) {
    const parts = match[1].split(':');
    host = parts[0];
    if (parts[1]) {
      port = parseInt(parts[1], 10);
    }
  }
} catch (err) {
  console.warn('Could not parse host/port from DATABASE_URL, using localhost:5432');
}

console.log(`Waiting for database to be ready at ${host}:${port}...`);

const startTime = Date.now();
const TIMEOUT_MS = 30000; // 30 seconds

function checkConnection() {
  const client = net.createConnection({ host, port }, () => {
    console.log('Database is ready!');
    client.end();
    process.exit(0);
  });

  client.on('error', (err) => {
    if (Date.now() - startTime > TIMEOUT_MS) {
      console.error(`Database was not ready after ${TIMEOUT_MS / 1000} seconds. Exiting...`);
      process.exit(1);
    }
    setTimeout(checkConnection, 1000);
  });
}

checkConnection();
