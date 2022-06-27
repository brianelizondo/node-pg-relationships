const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

/*
GET /invoices
    Return info on invoices: like {invoices: [{id, comp_code}, ...]}
*/
router.get("/", async (req, res, next) => {
    try{
        const results = await db.query("SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices");
        return res.json({ invoices: results.rows });
    } catch(err){
        return next(err);
    }
});

/*
GET /invoices/[id]
    Returns obj on given invoice.
    If invoice cannot be found, returns 404.
    Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
*/
router.get("/:id", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id=$1`, [req.params.id]);
        if(results.rows.length === 0){
            throw new ExpressError("Invoice not found", 404);
        }
        let { id, comp_code, amt, paid, add_date, paid_date } = results.rows[0];

        const result_company = await db.query(`SELECT name, description FROM companies WHERE code = $1`, [comp_code]);
        let company = { 
            code: comp_code, 
            name: result_company.rows[0].name, 
            description: result_company.rows[0].description 
        };

        return res.json({ invoice: { id, amt, paid, add_date, paid_date, company }});
    } catch(err){
        return next(err);
    }
});

/*
POST /invoices
    Adds an invoice.
    Needs to be passed in JSON body of: {comp_code, amt}
    Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async (req, res, next) => {
    try{
        const { comp_code, amt } = req.body;

        const result_company = await db.query(`SELECT name, description FROM companies WHERE code = $1`, [comp_code]);
        if(result_company.rows.length === 0){
            throw new ExpressError("Company code is not valid", 404);
        }      
        
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt) 
             VALUES ($1, $2)
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]);

        return res.status(201).json({ invoice: results.rows[0] });
    } catch(err){
        return next(err);
    }
});

/*
PUT /invoices/[id]
    Updates an invoice.
    If invoice cannot be found, returns a 404.
    Needs to be passed in a JSON body of {amt}
    Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.patch("/:id", async (req, res, next) => {
    try{
        const { amt } = req.body;
        const results = await db.query(
            `UPDATE invoices 
            SET amt=$1
            WHERE id = $2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [amt, req.params.id]);
        
        if(results.rows.length === 0){
            throw new ExpressError("Invoice not found", 404);
        }

        return res.json({ invoice: results.rows[0] });
    } catch(err){
        return next(err);
    }
});

/*
DELETE /invoices/[id]
    Deletes an invoice.
    If invoice cannot be found, returns a 404.
    Returns: {status: "deleted"}
*/
router.delete("/:id", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT id FROM invoices WHERE id = $1`, [req.params.id]);
        if(results.rows.length === 0){
            throw new ExpressError("Invoice not found", 404);
        }

        const delete_result = await db.query("DELETE FROM invoices WHERE id = $1", [req.params.id]);
        return res.json({status: "deleted"});
    } catch(err){
        return next(err);
    }
});


module.exports = router;