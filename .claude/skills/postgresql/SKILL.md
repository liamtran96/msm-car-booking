---
name: postgresql
description: PostgreSQL 18 database documentation - SQL, administration, and development
---

# PostgreSQL Skill

Comprehensive PostgreSQL 18 documentation covering SQL syntax, database administration, PL/pgSQL programming, and development best practices. Generated from official PostgreSQL documentation.

## When to Use This Skill

This skill should be activated when:

### Database Design & Schema
- Creating tables, views, indexes, and constraints
- Designing foreign key relationships
- Implementing table inheritance
- Planning database architecture

### SQL Queries
- Writing SELECT, INSERT, UPDATE, DELETE statements
- Performing JOIN operations (INNER, LEFT OUTER, RIGHT OUTER, FULL)
- Using aggregate functions and GROUP BY
- Building complex queries with subqueries and CTEs

### Transactions & Data Integrity
- Managing transactions with BEGIN, COMMIT, ROLLBACK
- Implementing savepoints for partial rollbacks
- Understanding ACID properties
- Handling concurrent access

### PL/pgSQL Programming
- Creating stored functions and procedures
- Writing triggers
- Implementing complex business logic in the database
- Performance optimization through server-side computation

### Administration
- Installing and configuring PostgreSQL
- Running regression tests
- Managing users, roles, and permissions
- Backup and recovery operations
- Understanding Write-Ahead Logging (WAL)

## Key Concepts

### ACID Properties
PostgreSQL is fully ACID-compliant:
- **Atomicity**: Transactions are all-or-nothing operations
- **Consistency**: Database moves from one valid state to another
- **Isolation**: Concurrent transactions don't see each other's incomplete changes
- **Durability**: Committed transactions survive system failures via WAL

### Write-Ahead Logging (WAL)
Changes are logged before being applied to data files. This enables:
- Crash recovery without data loss
- Point-in-time recovery
- Online backup and replication
- Reduced disk I/O (sequential log writes vs. random data page writes)

### PL/pgSQL Advantages
Server-side procedural language that:
- Eliminates client/server round trips
- Avoids transferring intermediate results
- Reduces query parsing overhead
- Can use all SQL data types and functions

## Quick Reference

### Creating Tables

**Basic table creation** (from official docs):
```sql
CREATE TABLE my_first_table (
    first_column text,
    second_column integer
);
```

**Table with foreign key constraint** (from official docs):
```sql
CREATE TABLE cities (
    name     varchar(80) PRIMARY KEY,
    location point
);

CREATE TABLE weather (
    city      varchar(80) REFERENCES cities(name),
    temp_lo   int,
    temp_hi   int,
    prcp      real,
    date      date
);
```

**Table inheritance** (from official docs):
```sql
CREATE TABLE cities (
    name       text,
    population real,
    elevation  int     -- (in ft)
);

CREATE TABLE capitals (
    state      char(2) UNIQUE NOT NULL
) INHERITS (cities);
```

### Querying Data

**Basic SELECT** (from official docs):
```sql
SELECT * FROM weather;

SELECT city, temp_lo, temp_hi, prcp, date FROM weather;
```

**Computed columns with aliases** (from official docs):
```sql
SELECT city, (temp_hi+temp_lo)/2 AS temp_avg, date FROM weather;
```

**JOIN operations** (from official docs):
```sql
-- Inner join
SELECT * FROM weather JOIN cities ON city = name;

-- Explicit column selection with qualified names
SELECT weather.city, weather.temp_lo, weather.temp_hi,
       weather.prcp, weather.date, cities.location
    FROM weather JOIN cities ON weather.city = cities.name;
```

### Creating Views

**Encapsulate complex queries** (from official docs):
```sql
CREATE VIEW myview AS
    SELECT name, temp_lo, temp_hi, prcp, date, location
        FROM weather, cities
        WHERE city = name;

SELECT * FROM myview;
```

### Creating Indexes

**Basic index creation** (from official docs):
```sql
CREATE TABLE test1 (
    id integer,
    content varchar
);

CREATE INDEX test1_id_index ON test1 (id);
```

### Modifying Data

**UPDATE statement** (from official docs):
```sql
UPDATE weather
    SET temp_hi = temp_hi - 2,  temp_lo = temp_lo - 2
    WHERE date > '1994-11-28';
```

**INSERT statement** (from official docs):
```sql
INSERT INTO weather VALUES ('Berkeley', 45, 53, 0.0, '1994-11-28');
```

### Transactions

**Basic transaction block** (from official docs):
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100.00
    WHERE name = 'Alice';
-- ... more operations ...
COMMIT;
```

**Using savepoints** (from official docs):
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100.00
    WHERE name = 'Alice';
SAVEPOINT my_savepoint;
UPDATE accounts SET balance = balance + 100.00
    WHERE name = 'Bob';
-- oops ... forget that and use Wally's account
ROLLBACK TO my_savepoint;
UPDATE accounts SET balance = balance + 100.00
    WHERE name = 'Wally';
COMMIT;
```

### Embedded SQL (ECPG)

**Prepared statements in C** (from official docs):
```c
EXEC SQL BEGIN DECLARE SECTION;
const char *stmt = "INSERT INTO test1 VALUES(?, ?);";
EXEC SQL END DECLARE SECTION;

EXEC SQL PREPARE mystmt FROM :stmt;
EXEC SQL EXECUTE mystmt USING 42, 'foobar';
```

### Database Administration

**Creating a database** (from official docs):
```bash
$ createdb mydb
```

**Removing a database** (from official docs):
```bash
$ dropdb mydb
```

**Setting up shared libraries** (from official docs):
```bash
LD_LIBRARY_PATH=/usr/local/pgsql/lib
export LD_LIBRARY_PATH
```

### Running Tests

**Parallel regression tests** (from official docs):
```bash
make check        # Against temporary installation
make installcheck # Against running server
make check-world  # All test suites
```

## Reference Files

This skill includes comprehensive documentation in `references/`:

### getting_started.md
**Source:** Official PostgreSQL 18 Documentation
**Confidence:** Medium
**Pages:** 46
**Content:**
- Installation requirements and procedures
- Creating databases and connecting
- SQL tutorial (tables, queries, joins)
- Transactions and savepoints
- Views, foreign keys, inheritance
- Running regression tests

### sql.md
**Source:** Official PostgreSQL 18 Documentation
**Confidence:** Medium
**Pages:** 1088
**Content:**
- Complete SQL command reference
- PL/pgSQL procedural language
- User-defined functions and procedures
- Security labels and permissions
- Dynamic SQL with ECPG
- Information schema details

### index.md
**Source:** Official PostgreSQL 18 Documentation
**Confidence:** Medium
**Content:**
- Documentation category index
- Navigation guide to reference files

## Working with This Skill

### For Beginners
1. Start with `references/getting_started.md` for installation and basic SQL
2. Follow the tutorial sections (Chapter 2: SQL Language, Chapter 3: Advanced Features)
3. Practice with the weather/cities example tables from the docs
4. Learn transaction basics with BEGIN/COMMIT/ROLLBACK

### For Intermediate Users
1. Explore `references/sql.md` for complete SQL command syntax
2. Study PL/pgSQL for server-side programming (Section 41)
3. Learn about indexes and query optimization (Chapter 11)
4. Understand views and foreign keys for better schema design

### For Advanced Users
1. Deep dive into PL/pgSQL for complex stored procedures
2. Study Write-Ahead Logging for understanding durability
3. Explore embedded SQL (ECPG) for C applications
4. Reference the information schema for metadata queries

### Navigation Tips
- Use section numbers (e.g., "31.1", "41.1") to locate specific topics
- The URL patterns follow PostgreSQL docs structure (e.g., `/docs/18/tutorial-select.html`)
- Code examples are language-tagged for proper syntax highlighting
- Look for "Examples:" sections for practical code samples

## Common Patterns

### Pattern: Referential Integrity with Foreign Keys
Ensure data consistency by declaring foreign key constraints:
```sql
CREATE TABLE orders (
    order_id    serial PRIMARY KEY,
    customer_id integer REFERENCES customers(id),
    order_date  date
);
```

### Pattern: Safe Updates with Transactions
Wrap related changes in a transaction block:
```sql
BEGIN;
-- Multiple related operations
UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 123;
INSERT INTO order_items (order_id, product_id) VALUES (456, 123);
COMMIT;
```

### Pattern: Query Encapsulation with Views
Hide complexity behind a view interface:
```sql
CREATE VIEW active_customers AS
    SELECT c.*, COUNT(o.order_id) as order_count
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.status = 'active'
    GROUP BY c.id;
```

### Pattern: Performance with Indexes
Create indexes on frequently queried columns:
```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
```

## Error Handling

### Foreign Key Violation
```
ERROR:  insert or update on table "weather" violates foreign key constraint
DETAIL:  Key (city)=(Berkeley) is not present in table "cities".
```
**Solution:** Insert the referenced row first, or use ON DELETE/UPDATE actions.

### Transaction Aborted
After an error in a transaction, you must either:
- `ROLLBACK` to abort and start fresh
- `ROLLBACK TO savepoint` to return to a known good state

## Resources

### references/
Organized documentation extracted from official PostgreSQL sources:
- Detailed explanations with context
- Code examples with language annotations
- Links to original documentation URLs
- Hierarchical table of contents

### scripts/
Add helper scripts for common automation tasks:
- Database migration scripts
- Backup and restore procedures
- Performance testing utilities

### assets/
Add templates and examples:
- Schema templates
- Sample data files
- Configuration examples

## Notes

- This skill was generated from PostgreSQL 18 official documentation
- Reference files preserve original structure and examples
- Code examples include language tags for syntax highlighting
- Examples prioritize practical, real-world patterns from official docs
- PL/pgSQL is installed by default since PostgreSQL 9.0

## Updating

To refresh this skill with updated documentation:
1. Re-run the scraper with the PostgreSQL configuration
2. The skill will be rebuilt with the latest information
3. Check for new features in major version releases

## Source Information

**Primary Source:** PostgreSQL 18 Official Documentation
**Documentation URL:** https://www.postgresql.org/docs/18/
**Source Confidence:** Medium (official documentation)
**Last Updated:** Generated from current documentation
