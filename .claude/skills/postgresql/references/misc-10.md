# PostgreSQL - Misc (Part 10)

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-getargtypeid.html

**Contents:**
- SPI_getargtypeid
- Synopsis
- Description
- Arguments
- Return Value

SPI_getargtypeid — return the data type OID for an argument of a statement prepared by SPI_prepare

SPI_getargtypeid returns the OID representing the type for the argIndex'th argument of a statement prepared by SPI_prepare. First argument is at index zero.

prepared statement (returned by SPI_prepare)

zero based index of the argument

The type OID of the argument at the given index. If the plan is NULL or invalid, or argIndex is less than 0 or not less than the number of arguments declared for the plan, SPI_result is set to SPI_ERROR_ARGUMENT and InvalidOid is returned.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_getargtypeid
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
SPIPlanPtr plan
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-is-busy.html

**Contents:**
- dblink_is_busy
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_is_busy — checks if connection is busy with an async query

dblink_is_busy tests whether an async query is in progress.

Name of the connection to check.

Returns 1 if connection is busy, 0 if it is not busy. If this function returns 0, it is guaranteed that dblink_get_result will not block.

**Examples:**

Example 1 (unknown):
```unknown
dblink_is_busy
```

Example 2 (unknown):
```unknown
dblink_get_result
```

Example 3 (sql):
```sql
SELECT dblink_is_busy('dtest1');
```

---


---

## 30.2. When to JIT? #


**URL:** https://www.postgresql.org/docs/18/jit-decision.html

**Contents:**
- 30.2. When to JIT? #
  - Note

JIT compilation is beneficial primarily for long-running CPU-bound queries. Frequently these will be analytical queries. For short queries the added overhead of performing JIT compilation will often be higher than the time it can save.

To determine whether JIT compilation should be used, the total estimated cost of a query (see Chapter 69 and Section 19.7.2) is used. The estimated cost of the query will be compared with the setting of jit_above_cost. If the cost is higher, JIT compilation will be performed. Two further decisions are then needed. Firstly, if the estimated cost is more than the setting of jit_inline_above_cost, short functions and operators used in the query will be inlined. Secondly, if the estimated cost is more than the setting of jit_optimize_above_cost, expensive optimizations are applied to improve the generated code. Each of these options increases the JIT compilation overhead, but can reduce query execution time considerably.

These cost-based decisions will be made at plan time, not execution time. This means that when prepared statements are in use, and a generic plan is used (see PREPARE), the values of the configuration parameters in effect at prepare time control the decisions, not the settings at execution time.

If jit is set to off, or if no JIT implementation is available (for example because the server was compiled without --with-llvm), JIT will not be performed, even if it would be beneficial based on the above criteria. Setting jit to off has effects at both plan and execution time.

EXPLAIN can be used to see whether JIT is used or not. As an example, here is a query that is not using JIT:

Given the cost of the plan, it is entirely reasonable that no JIT was used; the cost of JIT would have been bigger than the potential savings. Adjusting the cost limits will lead to JIT use:

As visible here, JIT was used, but inlining and expensive optimization were not. If jit_inline_above_cost or jit_optimize_above_cost were also lowered, that would change.

**Examples:**

Example 1 (unknown):
```unknown
--with-llvm
```

Example 2 (sql):
```sql
=# EXPLAIN ANALYZE SELECT SUM(relpages) FROM pg_class;
                                                 QUERY PLAN
-------------------------------------------------------------------​------------------------------------------
 Aggregate  (cost=16.27..16.29 rows=1 width=8) (actual time=0.303..0.303 rows=1.00 loops=1)
   Buffers: shared hit=14
   ->  Seq Scan on pg_class  (cost=0.00..15.42 rows=342 width=4) (actual time=0.017..0.111 rows=356.00 loops=1)
         Buffers: shared hit=14
 Planning Time: 0.116 ms
 Execution Time: 0.365 ms
```

Example 3 (sql):
```sql
=# SET jit_above_cost = 10;
SET
=# EXPLAIN ANALYZE SELECT SUM(relpages) FROM pg_class;
                                                 QUERY PLAN
-------------------------------------------------------------------​------------------------------------------
 Aggregate  (cost=16.27..16.29 rows=1 width=8) (actual time=6.049..6.049 rows=1.00 loops=1)
   Buffers: shared hit=14
   ->  Seq Scan on pg_class  (cost=0.00..15.42 rows=342 width=4) (actual time=0.019..0.052 rows=356.00 loops=1)
         Buffers: shared hit=14
 Planning Time: 0.133 ms
 JIT:
   Functions: 3
   Options: Inlining false, Optimization false, Expressions true, Deforming true
   Timing: Generation 1.259 ms (Deform 0.000 ms), Inlining 0.000 ms, Optimization 0.797 ms, Emission 5.048 ms, Total 7.104 ms
 Execution Time: 7.416 ms
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-build-sql-delete.html

**Contents:**
- dblink_build_sql_delete
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_build_sql_delete — builds a DELETE statement using supplied values for primary key field values

dblink_build_sql_delete can be useful in doing selective replication of a local table to a remote database. It builds an SQL DELETE command that will delete the row with the given primary key values.

Name of a local relation, for example foo or myschema.mytab. Include double quotes if the name is mixed-case or contains special characters, for example "FooBar"; without quotes, the string will be folded to lower case.

Attribute numbers (1-based) of the primary key fields, for example 1 2.

The number of primary key fields.

Values of the primary key fields to be used in the resulting DELETE command. Each field is represented in text form.

Returns the requested SQL statement as text.

As of PostgreSQL 9.0, the attribute numbers in primary_key_attnums are interpreted as logical column numbers, corresponding to the column's position in SELECT * FROM relname. Previous versions interpreted the numbers as physical column positions. There is a difference if any column(s) to the left of the indicated column have been dropped during the lifetime of the table.

**Examples:**

Example 1 (unknown):
```unknown
dblink_build_sql_delete
```

Example 2 (unknown):
```unknown
myschema.mytab
```

Example 3 (unknown):
```unknown
primary_key_attnums
```

Example 4 (unknown):
```unknown
num_primary_key_atts
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-disconnect.html

**Contents:**
- dblink_disconnect
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_disconnect — closes a persistent connection to a remote database

dblink_disconnect() closes a connection previously opened by dblink_connect(). The form with no arguments closes an unnamed connection.

The name of a named connection to be closed.

Returns status, which is always OK (since any error causes the function to throw an error instead of returning).

**Examples:**

Example 1 (unknown):
```unknown
dblink_disconnect()
```

Example 2 (unknown):
```unknown
dblink_connect()
```

Example 3 (sql):
```sql
SELECT dblink_disconnect();
 dblink_disconnect
-------------------
 OK
(1 row)

SELECT dblink_disconnect('myconn');
 dblink_disconnect
-------------------
 OK
(1 row)
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-get-pkey.html

**Contents:**
- dblink_get_pkey
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_get_pkey — returns the positions and field names of a relation's primary key fields

dblink_get_pkey provides information about the primary key of a relation in the local database. This is sometimes useful in generating queries to be sent to remote databases.

Name of a local relation, for example foo or myschema.mytab. Include double quotes if the name is mixed-case or contains special characters, for example "FooBar"; without quotes, the string will be folded to lower case.

Returns one row for each primary key field, or no rows if the relation has no primary key. The result row type is defined as

The position column simply runs from 1 to N; it is the number of the field within the primary key, not the number within the table's columns.

**Examples:**

Example 1 (unknown):
```unknown
dblink_get_pkey
```

Example 2 (unknown):
```unknown
myschema.mytab
```

Example 3 (unknown):
```unknown
CREATE TYPE dblink_pkey_results AS (position int, colname text);
```

Example 4 (sql):
```sql
CREATE TABLE foobar (
    f1 int,
    f2 int,
    f3 int,
    PRIMARY KEY (f1, f2, f3)
);
CREATE TABLE

SELECT * FROM dblink_get_pkey('foobar');
 position | colname
----------+---------
        1 | f1
        2 | f2
        3 | f3
(3 rows)
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-freetuple.html

**Contents:**
- SPI_freetuple
- Synopsis
- Description
- Arguments

SPI_freetuple — free a row allocated in the upper executor context

SPI_freetuple frees a row previously allocated in the upper executor context.

This function is no longer different from plain heap_freetuple. It's kept just for backward compatibility of existing code.

**Examples:**

Example 1 (unknown):
```unknown
SPI_freetuple
```

Example 2 (unknown):
```unknown
heap_freetuple
```

Example 3 (unknown):
```unknown
HeapTuple row
```

---


---

