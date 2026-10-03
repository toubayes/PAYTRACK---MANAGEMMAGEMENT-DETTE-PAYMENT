const express = require("express");
const router = express.Router();

module.exports = (db) => {
    // GET get all record with name client ddebt andn payment 
         router.get("/debets_summary", async (req, res) => {
        const sql = `
                SELECT 
            clients.id AS Client_ID,
            clients.name,
            clients.phone,

            COALESCE(SUM(debts.amount), 0) AS Total_Debt,

            COALESCE(SUM(payments.Total_Payment), 0) AS Total_Payment,

            (
                COALESCE(SUM(debts.amount), 0) 
                - 
                COALESCE(SUM(payments.Total_Payment), 0)
            ) AS Remaining_Amount,

            CAST(
                (julianday('now') - julianday(MIN(debts.created_at))) AS INTEGER
            ) AS Remaining_Days

        FROM clients

        LEFT JOIN debts 
            ON clients.id = debts.client_id

        LEFT JOIN (
            SELECT 
                debet_id, 
                SUM(amount) AS Total_Payment
            FROM payments
            GROUP BY debet_id
        ) payments 
            ON payments.debet_id = debts.id

        GROUP BY 
            clients.id, 
            clients.name, 
            clients.phone;
        `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).json({ error: "Database error" });
            }

            return res.status(200).json(rows);
        });
    });

        return router;
}