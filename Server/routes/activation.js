const express = require("express");
const router = express.Router();
const os = require("os");
const { execSync } = require("child_process");
const crypto = require("crypto");
const { console } = require("inspector");

const SECRET = "YOUCEF-LEPRINCE-EENGENIER-BMR";

module.exports = (db) => {

  // =============================================
  // GET /api/activation/status
  // يتحقق من الحالة في كل تشغيل
  // =============================================
  router.get("/status", (req, res) => {
    db.get("SELECT * FROM app_status ORDER BY id DESC LIMIT 1", (err, row) => {
      if (err) return res.status(500).json({ message: "خطأ في قاعدة البيانات" });

      //  أول تشغيل — سجل تاريخ البداية
      if (!row) {
        db.run(
          "INSERT INTO app_status (first_run, is_activated) VALUES (datetime('now'), 0)",
          function (insertErr) {
            if (insertErr) return res.status(500).json({ message: "خطأ في التسجيل" });
            return res.json({ status: "trial", daysLeft: 7 });
          }
        );
        return;
      }

      // ✅ مفعّل بكود كامل
      if (row.is_activated === 1) {
        return res.json({ status: "active" });
      }

      // ⏳ نسخة تجريبية — احسب الأيام
      const firstRun = new Date(row.first_run);
      const now = new Date();
      const diffDays = Math.floor((now - firstRun) / (1000 * 60 * 60 * 24));
      const daysLeft = 7 - diffDays;
      console.log("First Run:", firstRun, "Now:", now, "Days Left:", daysLeft);

      if (daysLeft <= 0) {
        return res.json({ status: "expired", daysLeft: 0 });
      }

      return res.json({ status: "trial", daysLeft });
    });
  });

  // =============================================
  // GET /api/activation/machine-id
  // جلب الـ Hardware ID
  // =============================================
  router.get("/machine-id", (req, res) => {
    try {
      let raw = "";

      if (process.platform === "win32") {
        raw = execSync("wmic csproduct get uuid")
          .toString()
          .split("\n")[1]
          .trim();
      } else if (process.platform === "linux") {
        raw = execSync("cat /etc/machine-id").toString().trim();
      } else if (process.platform === "darwin") {
        raw = execSync(
          "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID"
        )
          .toString()
          .trim();
      }

      const machineId = crypto
        .createHash("sha256")
        .update(raw)
        .digest("hex")
        .slice(0, 16)
        .toUpperCase();

      res.json({ machineId });
      console.log("Machine ID requested:", machineId);
    } catch (err) {
      res.status(500).json({ message: "خطأ في جلب رقم الجهاز" });
    }
  });

  // =============================================
  // POST /api/activation/active
  // تفعيل بكود
  // =============================================
  router.post("/active", (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ message: "الكود مطلوب" });

    try {
      // جلب machine ID
      const raw = execSync("wmic csproduct get uuid")
        .toString()
        .split("\n")[1]
        .trim();

      const machineId = crypto
        .createHash("sha256")
        .update(raw)
        .digest("hex")
        .slice(0, 16)
        .toUpperCase();

      // توليد الكود الصحيح لهذا الجهاز
      const expectedKey = crypto
        .createHmac("sha256", SECRET)
        .update(machineId)
        .digest("hex")
        .slice(0, 20)
        .toUpperCase();
        console.log("Received Key:", key);
        console.log("Expected Key:", expectedKey);
        console.log("Match:", key.trim() === expectedKey.trim());

      if (key.toUpperCase() !== expectedKey) {
        return res.status(401).json({ message: "كود التفعيل غير صحيح" });
      }

      //  حفظ التفعيل
      db.run(
        "UPDATE app_status SET is_activated = 1, lisense_key = ? WHERE id = (SELECT id FROM app_status ORDER BY id DESC LIMIT 1)",
        [key],
        function (err) {
          if (err) return res.status(500).json({ message: "خطأ في التفعيل" });

          // حفظ في جدول activation أيضاً
          db.run(
            "INSERT INTO activation (key) VALUES (?)",
            [key],
            function (err2) {
              if (err2) console.error("خطأ في حفظ activation:", err2.message);
            }
          );

          return res.json({ message: "تم التفعيل بنجاح" });
        }
      );
    } catch (err) {
      res.status(500).json({ message: "خطأ في التحقق", error: err.message });
    }
  });

  // -----------------------------------------------
  // POST /api/activation/start-trial
  // ------------------------------------------
  
router.post("/start-trial", (req, res) => {
  console.log("Start trial requested");
  db.get("SELECT * FROM app_status ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ message: "خطأ في قاعدة البيانات" });

    if (row) {
      console.log("Trial already exists, cannot start a new one.",row);
      return res.json({ message: "التجربة موجودة مسبقاً" });
    }

    // إنشاء سجل جديد للتجربة
    db.run(
      "INSERT INTO app_status (first_run, is_activated) VALUES (datetime('now'), 0)",
      function (err) {
        if (err) return res.status(500).json({ message: "خطأ في بدء التجربة", error: err.message });
        return res.json({ message: "تم بدء التجربة", daysLeft: 7 });
      }
    );
  });
});


return router;
}