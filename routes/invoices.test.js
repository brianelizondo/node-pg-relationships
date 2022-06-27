// connet to the test database
process.env.NODE_ENV = "test";
// npm packages
const request = require("supertest");
// app imports
const app = require("../app");
const db = require("../db")

let testInvoice;

beforeEach(async () => {
    const company_result = await db.query(
        `INSERT INTO companies (code, name, description) 
         VALUES ('test', 'test company', 'description for the test company')
         RETURNING code, name, description`
    );
    
    const invoice_results = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
         VALUES ('test', 99)
         RETURNING id, comp_code, amt, paid, add_date, paid_date`
    );
    testInvoice = invoice_results.rows[0];
    let { code, name, description } = company_result.rows[0];
    testInvoice.company = { code, name, description };
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

describe("GET /invoices", () => {
    test("Gets a list of 1 invoice", async () => {
        const resp = await request(app).get(`/invoices`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ 
            invoices: [{   
                id: testInvoice.id, 
                comp_code: testInvoice.comp_code, 
                amt: testInvoice.amt, 
                paid: testInvoice.paid, 
                add_date: expect.any(String), 
                paid_date: testInvoice.paid_date
            }] 
        });
    });
});

describe("GET /invoices/[id]", () => {
    test("Gets a single invoice", async () => {
        const resp = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ 
            invoice: { 
                id: testInvoice.id, 
                amt: testInvoice.amt, 
                paid: testInvoice.paid, 
                add_date: expect.any(String), 
                paid_date: testInvoice.paid_date,
                company: testInvoice.company
            } 
        });
    });

    test("Respond with 404 for invalid invoice id", async () => {
        const resp = await request(app).get('/invoices/0');
        expect(resp.statusCode).toBe(404);
    });
});

describe("POST /invoices", () => {
    test("Add new invoices", async () => {
        const resp = await request(app).post('/invoices').send({ "comp_code": "test", "amt": 49.99 });
        expect(resp.statusCode).toBe(201);
        expect(resp.body).toEqual({ 
            invoice: { 
                id: expect.any(Number),
                comp_code: "test",
                amt: 49.99, 
                paid: false, 
                add_date: expect.any(String), 
                paid_date: null
            } 
        });
    });

    test("Respond with 404 for invalid company code", async () => {
        const resp = await request(app).post('/invoices').send({ "comp_code": "xyz", "amt": 49.99 });
        expect(resp.statusCode).toBe(404);
    });
});

describe("PATCH /invoices/[id]", () => {
    test("Updating invoice info", async () => {
        const resp = await request(app).patch(`/invoices/${testInvoice.id}`).send({ "amt": 99.99 });
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ 
            invoice: { 
                id: testInvoice.id,
                comp_code: testInvoice.comp_code,
                amt: 99.99, 
                paid: false, 
                add_date: expect.any(String), 
                paid_date: null
            } 
        });
    });

    test("Respond with 404 for invalid invoice id", async () => {
        const resp = await request(app).get('/invoices/0');
        expect(resp.statusCode).toBe(404);
    });
});

describe("DELETE /invoices/[id]", () => {
    test("Deleting a invoice", async () => {
        const resp = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({ status: "deleted" });
    });

    test("Respond with 404 for invalid invoice id", async () => {
        const resp = await request(app).get('/invoices/0');
        expect(resp.statusCode).toBe(404);
    });
});