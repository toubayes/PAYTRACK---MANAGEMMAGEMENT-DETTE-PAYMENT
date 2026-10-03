const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.resolve(__dirname,"../Server/managecash.sqlite");
console.log(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);}
  else {
    console.log(" Connected to", path.resolve(__dirname, "../Server/managecash.sqlite"));

}

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          Store_name TEXT,
          phone_nuumber TEXT,
          store_email TEXT,
          store_address TEXT,
          language TEXT
        );
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
            role	TEXT DEFAULT 'admin',
    phone	NUMERIC
        );
      `);
      db.run(`
        CREATE TABLE IF NOT EXISTS activation (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key VARCHAR(255) NOT NULL
        );
      `);

      db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

db.run(`CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients (id)
);
`);
db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    debet_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (debet_id) REFERENCES debts (id)
);
`);

   db.run(`
  CREATE TABLE IF NOT EXISTS app_Status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_run TEXT,
    is_activated INTEGER ,
    lisense_key TEXT
  );
  `);

    console.log("Tables created.");
    });
  
});
db.serialize();

module.exports = db;
