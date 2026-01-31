# PostgreSQL - Sql Commands (Part 16)

##  (continued)
PostgreSQL recognizes functional dependency (allowing columns to be omitted from GROUP BY) only when a table's primary key is included in the GROUP BY list. The SQL standard specifies additional conditions that should be recognized.

The clauses LIMIT and OFFSET are PostgreSQL-specific syntax, also used by MySQL. The SQL:2008 standard has introduced the clauses OFFSET ... FETCH {FIRST|NEXT} ... for the same functionality, as shown above in LIMIT Clause. This syntax is also used by IBM DB2. (Applications written for Oracle frequently use a workaround involving the automatically generated rownum column, which is not available in PostgreSQL, to implement the effects of these clauses.)

Although FOR UPDATE appears in the SQL standard, the standard allows it only as an option of DECLARE CURSOR. PostgreSQL allows it in any SELECT query as well as in sub-SELECTs, but this is an extension. The FOR NO KEY UPDATE, FOR SHARE and FOR KEY SHARE variants, as well as the NOWAIT and SKIP LOCKED options, do not appear in the standard.

PostgreSQL allows INSERT, UPDATE, DELETE, and MERGE to be used as WITH queries. This is not found in the SQL standard.

DISTINCT ON ( ... ) is an extension of the SQL standard.

ROWS FROM( ... ) is an extension of the SQL standard.

The MATERIALIZED and NOT MATERIALIZED options of WITH are extensions of the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
output_name
```

Example 2 (unknown):
```unknown
grouping_element
```

Example 3 (unknown):
```unknown
window_name
```

Example 4 (unknown):
```unknown
window_definition
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropuser.html

**Contents:**
- DROP USER
- Synopsis
- Description
- Compatibility
- See Also

DROP USER — remove a database role

DROP USER is simply an alternate spelling of DROP ROLE.

The DROP USER statement is a PostgreSQL extension. The SQL standard leaves the definition of users to the implementation.

---


---

