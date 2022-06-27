\c biztime

DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS companies_industries;
DROP TABLE IF EXISTS invoices;

CREATE TABLE industries (
    code text PRIMARY KEY,
    industry text NOT NULL UNIQUE
);

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    ind_code text NOT NULL REFERENCES industries ON DELETE CASCADE
);

CREATE TABLE companies_industries (
    comp_code text NOT NULL REFERENCES companies,
    ind_code text NOT NULL REFERENCES industries,
    PRIMARY KEY(comp_code, ind_code)
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

INSERT INTO industries
  VALUES ('acct', 'Accounting'),
         ('it', 'Information Technology'),
         ('ai', 'Artificial Intelligence'),
         ('hr', 'Human Resources'),
         ('ols', 'Online Sales');

INSERT INTO companies
  VALUES ('apple', 'Apple Computer', 'Maker of OSX.', 'it'),
         ('ibm', 'IBM', 'Big blue.', 'it'),
         ('modo', 'MODO Store', 'A online retail store', 'ols');

INSERT INTO companies_industries
  VALUES ('apple', 'it'),
         ('apple', 'ols'),
         ('ibm', 'it'),
         ('modo', 'it'),
         ('modo', 'ols'),
         ('modo', 'ai');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES ('apple', 100, false, null),
         ('apple', 200, false, null),
         ('apple', 300, true, '2018-01-01'),
         ('ibm', 400, false, null),
         ('modo', 299, true, '2022-06-27'),
         ('modo', 150, false, null),
         ('modo', 500, true, '2018-01-01');
