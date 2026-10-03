const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");


module.exports = (db, dbPath, backupsPath) => {


router.get("/backup", (req, res) => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);

      if (!backupsPath) {
  throw new Error("Backups path is undefined!");
}
        if (!fs.existsSync(backupsPath)) {
          fs.mkdirSync(backupsPath, { recursive: true });
        }

 
        const backupFile = path.join(backupsPath, `backup_${timestamp}.sqlite`);
              fs.copyFileSync(dbPath, backupFile);

    res.json({
      message: " تم إنشاء النسخة الاحتياطية بنجاح",
      file: backupFile,
    });
  } catch (error) {
    console.error("خطأ أثناء النسخ الاحتياطي:", error);
    res.status(500).json({ message: " فشل في إنشاء النسخة الاحتياطية" });
  }
});

// GET /api/alerts → [{ msg, level }]
router.get("/alerts", (req, res) => {
  // Example: Check if the database file exists
  if (!fs.existsSync(dbPath)) {
    return res.json([
      {
        msg: "ملف قاعدة البيانات غير موجود! تأكد من أن الملف موجود في المسار الصحيح.",  
        level: "danger",
      },
    ]);
  } 
  res.json([]);
});

// GET /api/search?q=xxx → [{ type: "client"|"debt", label, sub }]
router.get("/search", (req, res) => {
  const q = req.query.q;
  if (!q || q.trim() === "") {
    return res.json([]);
  }
  const searchTerm = `%${q.trim()}%`;

  db.all(
    `SELECT 'client' AS type, name AS label, id AS sub FROM clients WHERE name LIKE ?
      UNION ALL
      SELECT 'debt' AS type, description AS label, id AS sub FROM debts WHERE description LIKE ?`,
    [searchTerm, searchTerm],
    (err, rows) => {
      if (err) {
        console.error("Database error during search:", err.message);
        return res.status(500).json({ error: "Database error" });
      } 
      res.json(rows || []);
    } );  
});
return router;
}
