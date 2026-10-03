const express = require("express");
const router = express.Router();
// const db = require("../db");

module.exports = (db) => {
// get all settings
router.get("/", async (req, res) => {
  try {
    db.get("SELECT * FROM settings", [], (err, row) => {
      if (err) {
        console.error(" Database error:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.json([]);
      }
      res.json([row]);
    });
  } catch (err) {
    console.error("Database error details:", err);
    res.status(500).json({ error: "Database error" });
  }
});
// update setting
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { Store_name, phone_nuumber, store_email, store_address } =
    req.body;

  if (
    !Store_name ||
    !phone_nuumber ||
    !store_address ) {
    return res.status(400).json({ error: "يرجى إدخال جميع الحقول المطلوبة" });
  }
      if (!/^[0-9]{8,15}$/.test(phone_nuumber)) {
    return res.status(400).json({ message: "رقم الهاتف غير صالح" });
  }

  try {
    db.run(
      "UPDATE settings SET Store_name=?,phone_nuumber=?,store_email=?,store_address=? WHERE id = ?",
      [Store_name, phone_nuumber, store_email, store_address, id]
    );

    if (this.changes === 0) {
      return res.json([]);
    }

    res.json({ message: " تم تحديث الإعداد بنجاح" });
  } catch (err) {
    console.error(" خطأ في تحديث الإعداد:", err);
    res.status(500).json({ error: "حدث خطأ أثناء التحديث" });
  }
});
// POST api/setting
router.post("/add", (req, res) => {
  const { Store_name, phone_nuumber, store_email, store_address } = req.body;
  if (!Store_name || !phone_nuumber  || !store_address) {
    return res.status(400).json({ message: " جميع الحقول مطلوبة" });
  }
      if (!/^[0-9]{8,15}$/.test(phone_nuumber)) {
    return res.status(400).json({ message: "رقم الهاتف غير صالح" });
  }
  try {
    db.run(
      'INSERT INTO settings (Store_name,phone_nuumber,store_email,store_address,language) VALUES (?,?,?,?,"العربية")',
      [Store_name, phone_nuumber, store_email, store_address],
      function (err) {
        if (err) {
          console.error(" خطأ في حفظ الإعدادات:", err.message);
          return res
            .status(500)
            .json({ message: " خطأ في الخادم أثناء الحفظ" });
        }
        return res
          .status(201)
          .json({ message: " تم حفظ الإعدادات بنجاح", id: this.lastID });
      }
    );
  } catch (err) {
    console.error(" خطأ في حفظ الإعدادات:", err);
    return res.status(500).json({ message: " خطأ في الخادم أثناء الحفظ" });
  }
});
return router;
}

// module.exports=router