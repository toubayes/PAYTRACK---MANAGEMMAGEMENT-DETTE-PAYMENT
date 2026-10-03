const express = require("express");

module.exports = (db) => {
const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
    [username.trim()],
    (err, user) => {
      if (err) {
        console.error(" خطأ في الاستعلام:", err.message);
        return res.status(500).json({ message: " خطأ في الخادم" });
      }

      if (!user) {
        return res
          .status(401)
          .json({ message: " اسم المستخدم غير موجود أو ليس مسؤولاً" });
      }

      if (password !== user.password) {
        return res.status(401).json({ message: " كلمة المرور غير صحيحة" });
      }

      return res.json({
        message: " تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    }
  );
});
// POST api/user to create admin user
router.post("/add", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: " جميع الحقول مطلوبة" });
  }
  try {
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?,?,"admin")',
      [username, password],
      function (err) {
        if (err) {
          console.error(" خطأ في حفظ المستخدم:", err.message);
          return res
            .status(500)
            .json({ message: " خطأ في الخادم أثناء الحفظ" });
        }
        return res
          .status(201)
          .json({ message: " تم حفظ المستخدم بنجاح", id: this.lastID });
      }
    );
  } catch (err) {
    console.error(" خطأ في حفظ المستخدم:", err);
    return res.status(500).json({ message: " خطأ في الخادم أثناء الحفظ" });
  }
});
// GET api/user to get all employees
router.get("/employees", (req, res) => {
  db.all("SELECT id, username,password, role,phone FROM users WHERE role = 'employee'", [], (err, rows) => {
    if (err) return res.status(500).json({ message: " خطأ في قاعدة البيانات" });
    res.json(rows);
  });
});

// POST api/user to add employee
router.post("/employees/add", (req, res) => {
  const { username, password, phone, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: " جميع الحقول مطلوبة" });

  db.run(
    "INSERT INTO users (username, password, role,phone) VALUES (?, ?,?, ?)",
    [username, password,  role,phone],
    function (err) {
      if (err) return res.status(500).json({ message: " خطأ في قاعدة البيانات" });
      res.status(201).json({ message: " تم إضافة الموظف", id: this.lastID });
    }
  );
});

// DELETE api/user/:id to delete employee
router.delete("/employees/delete/:id" ,(req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM users WHERE id = ? AND role = 'employee'", [id], function (err) {
    if (err) return res.status(500).json({ message: " خطأ في قاعدة البيانات" });
    if (this.changes === 0) return res.status(404).json({ message: " موظف غير موجود" });
    res.json({ message: " تم حذف الموظف" });
  });
});
// PUT api/user/:id to update employee
router.put("/employees/update/:id", (req, res) => {
  const { username, password ,phone } = req.body;
  const { id } = req.params;
      if (!/^[0-9]{8,15}$/.test(phone)) {
    return res.status(400).json({ message: "رقم الهاتف غير صالح" });
  }

  db.run(
    "UPDATE users SET username = ?, password = ? ,phone=? WHERE id = ? AND role = 'employee'",
    [username, password,phone, id],
    function (err) {
      if (err) return res.status(500).json({ message: " خطأ في قاعدة البيانات" });
      if (this.changes === 0) return res.status(404).json({ message: " موظف غير موجود" });
      res.json({ message: " تم تحديث الموظف" });
    }
  );
});
return router;
}
