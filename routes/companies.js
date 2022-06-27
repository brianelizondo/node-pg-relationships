const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

/*
GET /companies
    Returns list of companies, like {companies: [{code, name}, ...]}
*/
router.get("/", async (req, res, next) => {
    try{
        const results = await db.query("SELECT code, name FROM companies");
        return res.json({ companies: results.rows });
    } catch(err){
        return next(err);
    }
});

/*
GET /companies/[code]
    Return obj of company: {company: {code, name, description}}
    If the company given cannot be found, this should return a 404 status response.
    Route updated:
    Return obj of company: {company: {code, name, description, invoices: [id, ...]}}
*/
router.get("/:code", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [req.params.code]);
        if(results.rows.length === 0){
            throw new ExpressError("Company not found", 404);
        }
        let { code, name, description } = results.rows[0];
        
        const invoices_results = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [req.params.code]);
        let invoices = [];
        if(invoices_results.rows.length > 0){
            invoices_results.rows.forEach((value, idx) => {
                invoices.push(value.id);
            });
        }else{
            invoices.push("The company don't have invoices");
        }

        return res.json({ company: { code, name, description, invoices } });
    } catch(err){
        return next(err);
    }
});

/*
POST /companies
    Adds a company.
    Needs to be given JSON like: {code, name, description}
    Returns obj of new company: {company: {code, name, description}}
*/
router.post("/", async (req, res, next) => {
    try{
        const { code, name, description } = req.body;
        const results = await db.query(
            `INSERT INTO companies (code, name, description) 
             VALUES ($1, $2, $3)
             RETURNING code, name, description`,
        [code, name, description]);

        return res.status(201).json({ company: results.rows[0] });
    } catch(err){
        return next(err);
    }
});

/*
PUT /companies/[code]
    Edit existing company.
    Should return 404 if company cannot be found.
    Needs to be given JSON like: {name, description}
    Returns update company object: {company: {code, name, description}}
*/
router.patch("/:code", async (req, res, next) => {
    try{
        const { name, description } = req.body;
        const results = await db.query(
            `UPDATE companies 
            SET name=$1, description=$2
            WHERE code = $3
            RETURNING code, name, description`,
        [name, description, req.params.code]);
        
        if(results.rows.length === 0){
            throw new ExpressError("Company not found", 404);
        }

        return res.json({ company:  results.rows[0] });
    } catch(err){
        return next(err);
    }
});

/*
DELETE /companies/[code]
    Deletes company.
    Should return 404 if company cannot be found.
    Returns {status: "deleted"}
*/
router.delete("/:code", async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code FROM companies WHERE code=$1`, [req.params.code]);
        if(results.rows.length === 0){
            throw new ExpressError("Company not found", 404);
        }

        const delete_result = await db.query("DELETE FROM companies WHERE code = $1", [req.params.code]);
        return res.json({status: "deleted"});
    } catch(err){
        return next(err);
    }
});


module.exports = router;