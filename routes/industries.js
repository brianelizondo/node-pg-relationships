const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

/*
GET /industries
    Returns list of industries, like {industries: [{code, industry, companies: [code, ...]}, ...]}
*/
router.get("/", async (req, res, next) => {
    try{
        const results = await db.query(
            `SELECT i.code, i.industry, ci.comp_code 
            FROM industries AS i
            LEFT JOIN companies_industries AS ci 
                ON i.code = ci.ind_code
            LEFT JOIN companies AS c 
                ON c.code = ci.comp_code`
        );

        let industries = [];
        let industries_codes = [];
        results.rows.forEach(value => industries_codes.push(value.code));
        industries_codes = new Set(industries_codes);

        for(let indCode of industries_codes){
            let industry_obj = { code: indCode }
            let companies = [];
            for(let values of results.rows){
                if(values.code == indCode){
                    industry_obj.industry = values.industry;

                    if(values.comp_code != null){
                        companies.push(values.comp_code);
                    }
                }
            }
            industry_obj.companies = companies;
            industries.push(industry_obj);
        }
        
        return res.json({ industries: industries });
    } catch(err){
        return next(err);
    }
});

/*
POST /industries
    Adds an industry.
    Needs to be passed in JSON body of: {code, industry}
    Returns: {industry: {code, industry}}
*/
router.post("/", async (req, res, next) => {
    try{
        const { code, industry } = req.body;

        const result_industry = await db.query(`SELECT code, industry FROM industries WHERE code = $1`, [code]);
        if(result_industry.rows.length > 0){
            throw new ExpressError("Industry code is not valid", 404);
        }      
        
        const results = await db.query(
            `INSERT INTO industries (code, industry) 
             VALUES ($1, $2)
             RETURNING code, industry`,
        [code, industry]);

        return res.status(201).json({ industry: results.rows[0] });
    } catch(err){
        return next(err);
    }
});

/*
POST /industries/[code]
    Associating an industry to a company.
    If industry cannot be found, returns a 404.
    Needs to be passed in a JSON body of { comp_code }
    Returns: {industry_company: {code, industry, comp_code}}
*/
router.post("/:code", async (req, res, next) => {
    try{
        const { comp_code } = req.body;
        const result_industry = await db.query(`SELECT industry FROM industries WHERE code = $1`, [req.params.code]);
        if(result_industry.rows.length === 0){
            throw new ExpressError("Industry code is not valid", 404);
        } 
        const result_company = await db.query(`SELECT name FROM companies WHERE code = $1`, [comp_code]);
        if(result_company.rows.length === 0){
            throw new ExpressError("Company code is not valid", 404);
        } 
        
        const results = await db.query(
            `INSERT INTO companies_industries (comp_code, ind_code) 
             VALUES ($1, $2)
             RETURNING comp_code, ind_code`,
        [comp_code, req.params.code]);

        return res.status(201).json({ "industry_company": { code: req.params.code, industry: result_industry.rows[0].industry, comp_code } });
    } catch(err){
        return next(err);
    }
});

module.exports = router;