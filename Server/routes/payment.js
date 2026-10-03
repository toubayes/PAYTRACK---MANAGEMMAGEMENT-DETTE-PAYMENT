const express = require("express");
const router = express.Router();
module.exports = (db) => {
  // arbic months and days
  const ARABIC_MONTHS = {
  "01": "يناير",  "02": "فبراير", "03": "مارس",
  "04": "أبريل", "05": "مايو",   "06": "يونيو",
  "07": "يوليو", "08": "أغسطس", "09": "سبتمبر",
  "10": "أكتوبر","11": "نوفمبر", "12": "ديسمبر",
};
 
const ARABIC_DAYS = {
  0: "الأحد", 1: "الإثنين", 2: "الثلاثاء",
  3: "الأربعاء", 4: "الخميس", 5: "الجمعة", 6: "السبت",
};
//   get daily payment
router.get("/daily", (req, res) => {
  const sql = `
    SELECT
      strftime('%w', payment_date) AS day_index,
      COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE date(payment_date) >= date('now', 'weekday 0', '-6 days')
    GROUP BY day_index
    ORDER BY day_index ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "خطأ في جلب الدفعات اليومية" });
    }

    // نحول النتائج إلى map
    const map = {};
    (rows || []).forEach(r => {
      map[parseInt(r.day_index)] = Number(r.total);
    });

    // نملأ كل أيام الأسبوع
    const result = Array.from({ length: 7 }, (_, i) => ({
      day: ARABIC_DAYS[i],
      total: map[i] ?? 0,
    }));

    res.json(result);
  });
});
// get monthly payment
router.get("/monthly", (req, res) => {
  const sql = `
    SELECT
      strftime('%m', payment_date) AS month_num,
      strftime('%Y-%m', payment_date) AS year_month,
      COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE payment_date >= date('now', '-6 months')
    GROUP BY year_month
    ORDER BY year_month ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "خطأ في جلب الدفعات الشهرية" });
    }

    const result = (rows || []).map(r => ({
      month: ARABIC_MONTHS[parseInt(r.month_num) - 1] ?? r.month_num,
      total: Number(r.total),
    }));

    res.json(result);
  });
});
// GET /api/payments/recent?limit=3 → [{ client_name, amount, created_at }]
router.get("/recent", (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const sql = `SELECT 
    p.amount,
    p.payment_date,
    c.name AS client_name   
  FROM payments p
  LEFT JOIN clients c ON p.client_id = c.id
  ORDER BY p.payment_date DESC
  LIMIT ?`;
  db.all(sql, [limit], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows || []);
  });
});

  //  GET get the somme of payment
  router.get("/sum", async (req, res) => {
  try {
    db.get("SELECT SUM(amount) AS  sum_payment FROM payments", [], (err, rows) => {
      if (err) {
        console.error(" Error on getting the somme of debt :", err.message);
        return res.status(500).json({ error: "حدث خطأ أثناء الجمع" });
      }

      res.json({ sum_payment: rows?.sum_payment || 0 });
    });
  } catch (err) {
    console.error(" Error on getting the somme of debt:", err);
    res.status(500).json({ error: "حدث خطأ أثناء الجمع" });
  }
});
    // GET get all  payments 
router.get("/", async (req, res) => {
          try {
    db.all(` 				SELECT p.id,
        p.client_id,
        p.debet_id,
        p.amount,
        p.description,
        p.payment_date,
        c.name AS client_name,
        d.amount AS debt_amount
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN debts d ON p.debet_id = d.id
      ORDER BY d.id DESC`, [], (err, rows) => {
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

    // GET one payment 
router.get("/:id", (req, res) => {
  const paymentId = req.params.id;

  db.get(`SELECT p.id,
        p.client_id,
        p.debet_id,
        p.amount,
        p.description,
        c.name AS client_name,
        d.amount AS debt_amount
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN debts d ON p.debet_id = d.id
        WHERE d.id =?`, [paymentId], (err, row) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ message: "الدفعة غير موجودة" });
    }

    res.json(row);
  });
});

    // POST insert new payment 
  router.post("/add", (req, res) => {
    const { client_id, debet_id, amount , description} = req.body;

    if (!client_id ||!debet_id || !amount) {
      return res.status(400).json({ message: "الرجاء إدخال معلومات الدفعة كاملة" });
    }

    const checkDebt = "SELECT id, amount,description FROM debts WHERE id = ?";

    db.get(checkDebt, [debet_id], (err, debtRow) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      if (!debtRow) {
        return res.status(404).json({ message: "الدين غير موجود" });
      }

      const insertQuery = `
        INSERT INTO payments (client_id,debet_id, amount ,description)
        VALUES (?, ?, ?, ?)
      `;

      db.run(insertQuery, [client_id,debet_id, amount,description], function (err) {
        if (err) {
          console.error("Error inserting payment:", err.message);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          message: "تمت إضافة الدفعة بنجاح",
          payment_id: this.lastID
        });
      });
    });
  });

//GET get total debt for one client
router.get("/client/:id", (req, res) => {
  const clientId = req.params.id;

  const sql = `
SELECT 
    d.id AS debet_id,
    SUM(IFNULL(d.amount, 0)) AS total_debt
FROM debts d
WHERE d.client_id = ?
  `;

  db.get(sql, [clientId], (err, row) => {
    if (err) {
      console.error("Error fetching debt:", err.message);
      return res.status(500).json({ message: "Database error" });
    }
      const totalDebt = row ? row.total_debt : 0;
      const debet_id=row;
    res.json({
      client_id: clientId,
      debet_id:debet_id,
      totalDebt: totalDebt,
    });
  });
});

    // DELETE delete a new payment by id
router.delete("/delete/:id", (req, res) => {
  const paymentId = req.params.id;

  db.run("DELETE FROM payments WHERE id = ?", [paymentId], function (err) {
    if (err) {
      console.error("Error deleting payment:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "الدفعة غير موجودة" });
    }

    res.json({ message: "تم حذف الدفعة بنجاح" });
  });
});
    // PUT update payment
  router.put("/update/:id", (req, res) => {
    const paymentId = req.params.id;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "الرجاء إدخال مبلغ الدفعة" });
    }

    const getOldPayment = `
      SELECT amount, client_id FROM payments WHERE id = ?
    `;

    db.get(getOldPayment, [paymentId], (err, paymentRow) => {
      if (err) {
        console.error("Error fetching old payment:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!paymentRow) {
        return res.status(404).json({ message: "الدفعة غير موجودة" });
      }

      const updatePayment = `
        UPDATE payments SET amount = ? WHERE id = ?
      `;

      db.run(updatePayment, [amount, paymentId], function (err) {
        if (err) {
          console.error("Error updating payment:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.json({
          message: "تم تحديث الدفعة بنجاح",
          updated_id: paymentId
        });
      });
    });
  });



    return router;
}

