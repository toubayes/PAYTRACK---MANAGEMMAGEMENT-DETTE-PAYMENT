const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const sqlite3 = require("sqlite3");
const db = require("./db");


function startServer(dbPath,backupsPath) {

  console.log("=== startServer called ===");
  console.log("dbPath:", dbPath);
  console.log("DB file exists:", require("fs").existsSync(dbPath));
// Create DB connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Database connected successfully.");
  }
});


// App
const app = express();


// Routes
const usersRoutes = require("./routes/auth");
const usersRoutessetting = require("./routes/setting");
const activationRoutes = require("./routes/activation");
const bakupRoutes = require("./routes/backups");
const clientRoutes = require("./routes/client");
const detteRoutes = require("./routes/dette");
const paymentRoutes = require("./routes/payment");
const RecordRoutes = require("./routes/record");


app.locals.db = db;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Routes
app.use("/api/users", usersRoutes(db));
app.use("/api/setting", usersRoutessetting(db));
app.use("/api/activation", activationRoutes(db));
app.use("/api", bakupRoutes(db, dbPath, backupsPath));
app.use("/api/clients", clientRoutes(db));
app.use("/api/dette", detteRoutes(db));
app.use("/api/payments", paymentRoutes(db));
app.use("/api/record", RecordRoutes(db));

// Test route
app.get("/", (req, res) => {
  res.send("Electronics Shop API is running");
});

// Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
});

}

module.exports = { startServer }
// // Paths
// const dbPath = path.join(__dirname, "managecash.sqlite");
// const backupsPath = path.join(__dirname, "backups");
  
// startServer(dbPath, backupsPath);