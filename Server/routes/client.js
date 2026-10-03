const express = require("express");
const router = express.Router();

module.exports = (db) => {
// GET /api/clients/recent?limit=3 → [{ name, created_at }]
router.get("/recent", (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  db.all(
    "SELECT name, created_at FROM clients ORDER BY created_at DESC LIMIT ?",
    [limit],
    (err, rows) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows || []);
    }
  );
}); 
//GET Get the number of client 
router.get("/count", async (req, res) => {
  try {
    db.get("SELECT COUNT(*) AS count FROM clients", [], (err, rows) => {
      if (err) {
        console.error(" Error counting invoices:", err.message);
        return res.status(500).json({ error: "حدث خطأ أثناء العد" });
      }

      res.json({ count: rows?.count || 0 });
    });
  } catch (err) {
    console.error(" Error counting invoices:", err);
    res.status(500).json({ error: "حدث خطأ أثناء العد" });
  }
});
  // Get get all the clients
router.get("/", async (req, res) => {
          try {
    db.all("SELECT * FROM clients", [], (err, rows) => {
      if (err) {
        console.error(" Database error:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (!rows || rows.length === 0) {
        return res.json([]);
      }

       return res.json(rows || []);
    });
  } catch (err) {
    console.error("Database error details:", err);
    res.status(500).json({ error: "Database error" });
  }
});
// GET get one client by id
router.get("/:id", (req, res) => {
  const clientId = req.params.id;

  db.get("SELECT * FROM clients WHERE id = ?", [clientId], (err, row) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.json({});
    }

    res.json(row);
  });
});

//POST insert one client\
router.post("/add", (req, res) => {
  const { name, phone, address } = req.body;
 console.log(req.body);
  if (!name) {
    return res.status(400).json({ message: "اسم الزبون مطلوب" });
  }

  const query = `
    INSERT INTO clients (name, phone, address)
    VALUES (?, ?, ?)
  `;

  db.run(query, [name, phone, address], function (err) {
    if (err) {
      console.error("Error inserting client:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      message: "تم إضافة الزبون بنجاح",
      id: this.lastID
    });
  });
});

// DELETE delete one client by id
router.delete("/delete/:id", (req, res) => {
  const clientId = req.params.id;

  db.run("DELETE FROM clients WHERE id = ?", [clientId], function (err) {
    if (err) {
      console.error("Error deleting client:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "الزبون غير موجود" });
    }

    res.json({ message: "تم حذف الزبون بنجاح" });
  });
});
// PUT update oone client by id
router.put("/update/:id", (req, res) => {
  const clientId = req.params.id;
  const { name, phone, address } = req.body;

  const query = `
    UPDATE clients
    SET name = ?, phone = ?, address = ?
    WHERE id = ?
  `;

  db.run(query, [name, phone, address, clientId], function (err) {
    if (err) {
      console.error("Error updating client:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "الزبون غير موجود" });
    }

    res.json({ message: "تم تحديث معلومات الزبون بنجاح" });
  });
});

    return router;
}