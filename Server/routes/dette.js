const express = require("express");
const router = express.Router();
module.exports = (db) => {
// get amount dette monthly
const ARABIC_MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل",
  "ماي", "جوان", "جويلية", "أوت",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
router.get("/monthly", (req, res) => {
  const sql = `
    SELECT
      strftime('%m', created_at) AS month_num,
      strftime('%Y-%m', created_at) AS year_month,
      COALESCE(SUM(amount), 0) AS total
    FROM debts
    WHERE created_at >= date('now', '-6 months')
    GROUP BY year_month
    ORDER BY year_month ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "خطأ في جلب الديون الشهرية" });
    }

    const result = (rows || []).map(r => ({
      month: ARABIC_MONTHS[parseInt(r.month_num) - 1] ?? r.month_num,
      total: Number(r.total),
    }));

    res.json(result);
  });
});

// GET /api/dette/recent?limit=3 → [{ client_name, amount, created_at }]
router.get("/recent", (req, res) => {
  const limit = parseInt(req.query.limit) || 5; // Default to 5 if not provided
  const sql = `SELECT d.amount, d.created_at, c.name AS client_name
             FROM debts d
             JOIN clients c ON d.client_id = c.id
             ORDER BY d.created_at DESC
             LIMIT ?`;
  db.all(sql, [limit], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows || []);}
);  
});
   //grt the sum ofn debt 
 router.get("/sum", async (req, res) => {
  try {
    db.get(`SELECT 
        COALESCE(SUM(d.amount - COALESCE(p.total_payment, 0)), 0) AS sum_debt
      FROM debts d
      LEFT JOIN (
        SELECT 
          debet_id,
          SUM(amount) AS total_payment
        FROM payments
        GROUP BY debet_id
      ) p ON p.debet_id = d.id`, [], (err, rows) => {
      if (err) {
        console.error(" Error on getting the somme of debt :", err.message);
        return res.status(500).json({ error: "حدث خطأ أثناء الجمع" });
      }

    
         res.json({
      sum_debt: rows.sum_debt ?? 0
    });
    });
  } catch (err) {
    console.error(" Error on getting the somme of debt:", err);
    res.status(500).json({ error: "حدث خطأ أثناء الجمع" });
  }
});
    // GET get all the debt 
router.get("/", async (req, res) => {
          try {
    db.all(`  SELECT d.id, d.amount, d.description, d.created_at,
         c.name AS client_name
        FROM debts d
        LEFT JOIN clients c ON d.client_id = c.id
        ORDER BY d.id DESC` ,[], (err, rows) => {
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
    // GET get one debt by id 
router.get("/:id", (req, res) => {
  const debtId = req.params.id;

  db.get(`      SELECT d.id, d.client_id, d.amount, d.description, d.created_at,
             c.name AS client_name
      FROM debts d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?`, [debtId], (err, row) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.json({ });
    }

    res.json(row);
  });
});

    // POST insert new debt of aclient name (use  inne join)
router.post("/add", (req, res) => {
  const { client_id, amount, description } = req.body;

  if (!client_id || !amount  ) {
    return res.status(400).json({ message: "الرجاء إدخال معلومات الدين كاملة" });
  }

  const checkClient = "SELECT id FROM clients WHERE id = ?";

  db.get(checkClient, [client_id], (err, row) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ message: "الزبون غير موجود" });
    }

    const insertQuery = `
      INSERT INTO debts (client_id, amount, description)
      VALUES (?, ?, ?)
    `;

    db.run(insertQuery, [client_id, amount,  description], function (err) {
      if (err) {
        console.error("Error inserting debt:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(201).json({
        message: "تم إضافة الدين بنجاح",
        id: this.lastID
      });
    });
  });
});

    //DELETE delete a debt by id
router.delete("/delete/:id",(req, res) => {
  const debtId = req.params.id;

  db.run("DELETE FROM debts WHERE id = ?", [debtId], function (err) {
    if (err) {
      console.error("Error deleting debt:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.json({});
    }

    res.json({ message: "تم حذف الدين بنجاح" });
  });
});

    // PUT updatee a debt by id
router.put("/update/:id", (req, res) => {
  const debtId = req.params.id;
  const {client_id, amount, description } = req.body;

  const query = `
    UPDATE debts
    SET client_id = ?, amount = ?, description = ?
    WHERE id = ?
  `;

  db.run(query, [client_id,amount,  description, debtId], function (err) {
    if (err) {
      console.error("Error updating debt:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.json({});
    }

    res.json({ message: "تم تحديث الدين بنجاح" });
  });
});


    return router;
}