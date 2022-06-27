// connet to the test database
process.env.NODE_ENV = "test";
// npm packages
const request = require("supertest");
// app imports
const app = require("../app");
const db = require("../db")

let testCompany;

beforeEach(async () => {
    const company_result = await db.query(
        `INSERT INTO companies (code, name, description) 
         VALUES ('test', 'test company', 'description for the test company')
         RETURNING code, name, description`
    );
    testCompany = company_result.rows[0];

    const invoice_results = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
         VALUES ('test', 99)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`
    );
    testCompany.invoices = [invoice_results.rows[0].id];
});

afterEach(async () => {
    // delete any data created by test
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async () => {
    // close db connection
    await db.end();
});


describe("GET /companies", () => {
    test("Gets a list of 1 company", async () => {
        const resp = await request(app).get(`/companies`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ companies: [ { code: testCompany.code, name: testCompany.name }] });
    });
});

describe("GET /companies/[code]", () => {
    test("Gets a single company", async () => {
        const resp = await request(app).get(`/companies/${testCompany.code}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ 
            company: { 
                code: testCompany.code, 
                name: testCompany.name, 
                description: testCompany.description, 
                invoices: testCompany.invoices 
            } 
        });
    });

    test("Respond with 404 for invalid code", async () => {
        const resp = await request(app).get('/companies/xyz');
        expect(resp.statusCode).toBe(404);
    });
});

describe("POST /companies", () => {
    test("Add new company", async () => {
        const resp = await request(app).post('/companies').send({ "code": "apple", "name": "apple company", "description": "apple company description" });
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({ company: { code: "apple", name: "apple company", description: "apple company description" } });
    });
});

describe("PATCH /companies/[code]", () => {
    test("Updating company info", async () => {
        const resp = await request(app).patch(`/companies/${testCompany.code}`).send({ "name": "new name test", "description": "new description updated" });
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ company: { code: testCompany.code, name: "new name test", description: "new description updated" } });
    });

    test("Respond with 404 for invalid code", async () => {
        const resp = await request(app).get('/companies/xyz');
        expect(resp.statusCode).toBe(404);
    });
});

describe("DELETE /companies/[code]", () => {
    test("Deleting a company", async () => {
        const resp = await request(app).delete(`/companies/${testCompany.code}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ status: "deleted" });
    });

    test("Respond with 404 for invalid code", async () => {
        const resp = await request(app).get('/companies/xyz');
        expect(resp.statusCode).toBe(404);
    });
});