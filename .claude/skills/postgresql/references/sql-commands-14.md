# PostgreSQL - Sql Commands (Part 14)

##  (continued)
Create partition of a range partitioned table:

Create a few partitions of a range partitioned table with multiple columns in the partition key:

Create partition of a list partitioned table:

Create partition of a list partitioned table that is itself further partitioned and then add a partition to it:

Create partitions of a hash partitioned table:

Create a default partition:

The CREATE TABLE command conforms to the SQL standard, with exceptions listed below.

Although the syntax of CREATE TEMPORARY TABLE resembles that of the SQL standard, the effect is not the same. In the standard, temporary tables are defined just once and automatically exist (starting with empty contents) in every session that needs them. PostgreSQL instead requires each session to issue its own CREATE TEMPORARY TABLE command for each temporary table to be used. This allows different sessions to use the same temporary table name for different purposes, whereas the standard's approach constrains all instances of a given temporary table name to have the same table structure.

The standard's definition of the behavior of temporary tables is widely ignored. PostgreSQL's behavior on this point is similar to that of several other SQL databases.

The SQL standard also distinguishes between global and local temporary tables, where a local temporary table has a separate set of contents for each SQL module within each session, though its definition is still shared across sessions. Since PostgreSQL does not support SQL modules, this distinction is not relevant in PostgreSQL.

For compatibility's sake, PostgreSQL will accept the GLOBAL and LOCAL keywords in a temporary table declaration, but they currently have no effect. Use of these keywords is discouraged, since future versions of PostgreSQL might adopt a more standard-compliant interpretation of their meaning.

The ON COMMIT clause for temporary tables also resembles the SQL standard, but has some differences. If the ON COMMIT clause is omitted, SQL specifies that the default behavior is ON COMMIT DELETE ROWS. However, the default behavior in PostgreSQL is ON COMMIT PRESERVE ROWS. The ON COMMIT DROP option does not exist in SQL.

When a UNIQUE or PRIMARY KEY constraint is not deferrable, PostgreSQL checks for uniqueness immediately whenever a row is inserted or modified. The SQL standard says that uniqueness should be enforced only at the end of the statement; this makes a difference when, for example, a single command updates multiple key values. To obtain standard-compliant behavior, declare the constraint as DEFERRABLE but not deferred (i.e., INITIALLY IMMEDIATE). Be aware that this can be significantly slower than immediate uniqueness checking.

The SQL standard says that CHECK column constraints can only refer to the column they apply to; only CHECK table constraints can refer to multiple columns. PostgreSQL does not enforce this restriction; it treats column and table check constraints alike.

The EXCLUDE constraint type is a PostgreSQL extension.

The ability to specify column lists in the foreign key actions SET DEFAULT and SET NULL is a PostgreSQL extension.

It is a PostgreSQL extension that a foreign key constraint may reference columns of a unique index instead of columns of a primary key or unique constraint.

The NULL “constraint” (actually a non-constraint) is a PostgreSQL extension to the SQL standard that is included for compatibility with some other database systems (and for symmetry with the NOT NULL constraint). Since it is the default for any column, its presence is simply noise.

The SQL standard says that table and domain constraints must have names that are unique across the schema containing the table or domain. PostgreSQL is laxer: it only requires constraint names to be unique across the constraints attached to a particular table or domain. However, this extra freedom does not exist for index-based constraints (UNIQUE, PRIMARY KEY, and EXCLUDE constraints), because the associated index is named the same as the constraint, and index names must be unique across all relations within the same schema.

Multiple inheritance via the INHERITS clause is a PostgreSQL language extension. SQL:1999 and later define single inheritance using a different syntax and different semantics. SQL:1999-style inheritance is not yet supported by PostgreSQL.

PostgreSQL allows a table of no columns to be created (for example, CREATE TABLE foo();). This is an extension from the SQL standard, which does not allow zero-column tables. Zero-column tables are not in themselves very useful, but disallowing them creates odd special cases for ALTER TABLE DROP COLUMN, so it seems cleaner to ignore this spec restriction.

PostgreSQL allows a table to have more than one identity column. The standard specifies that a table can have at most one identity column. This is relaxed mainly to give more flexibility for doing schema changes or migrations. Note that the INSERT command supports only one override clause that applies to the entire statement, so having multiple identity columns with different behaviors is not well supported.

The options STORED and VIRTUAL are not standard but are also used by other SQL implementations. The SQL standard does not specify the storage of generated columns.

While a LIKE clause exists in the SQL standard, many of the options that PostgreSQL accepts for it are not in the standard, and some of the standard's options are not implemented by PostgreSQL.

The WITH clause is a PostgreSQL extension; storage parameters are not in the standard.

The PostgreSQL concept of tablespaces is not part of the standard. Hence, the clauses TABLESPACE and USING INDEX TABLESPACE are extensions.

Typed tables implement a subset of the SQL standard. According to the standard, a typed table has columns corresponding to the underlying composite type as well as one other column that is the “self-referencing column”. PostgreSQL does not support self-referencing columns explicitly.

The PARTITION BY clause is a PostgreSQL extension.

The PARTITION OF clause is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
column_name
```

Example 2 (unknown):
```unknown
compression_method
```

Example 3 (unknown):
```unknown
column_constraint
```

Example 4 (unknown):
```unknown
table_constraint
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterindex.html

**Contents:**
- ALTER INDEX
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER INDEX — change the definition of an index

ALTER INDEX changes the definition of an existing index. There are several subforms described below. Note that the lock level required may differ for each subform. An ACCESS EXCLUSIVE lock is held unless explicitly noted. When multiple subcommands are listed, the lock held will be the strictest one required from any subcommand.

The RENAME form changes the name of the index. If the index is associated with a table constraint (either UNIQUE, PRIMARY KEY, or EXCLUDE), the constraint is renamed as well. There is no effect on the stored data.

Renaming an index acquires a SHARE UPDATE EXCLUSIVE lock.

This form changes the index's tablespace to the specified tablespace and moves the data file(s) associated with the index to the new tablespace. To change the tablespace of an index, you must own the index and have CREATE privilege on the new tablespace. All indexes in the current database in a tablespace can be moved by using the ALL IN TABLESPACE form, which will lock all indexes to be moved and then move each one. This form also supports OWNED BY, which will only move indexes owned by the roles specified. If the NOWAIT option is specified then the command will fail if it is unable to acquire all of the locks required immediately. Note that system catalogs will not be moved by this command, use ALTER DATABASE or explicit ALTER INDEX invocations instead if desired. See also CREATE TABLESPACE.

Causes the named index (possibly schema-qualified) to become attached to the altered index. The named index must be on a partition of the table containing the index being altered, and have an equivalent definition. An attached index cannot be dropped by itself, and will automatically be dropped if its parent index is dropped.

This form marks the index as dependent on the extension, or no longer dependent on that extension if NO is specified. An index that's marked as dependent on an extension is automatically dropped when the extension is dropped.

This form changes one or more index-method-specific storage parameters for the index. See CREATE INDEX for details on the available parameters. Note that the index contents will not be modified immediately by this command; depending on the parameter you might need to rebuild the index with REINDEX to get the desired effects.

This form resets one or more index-method-specific storage parameters to their defaults. As with SET, a REINDEX might be needed to update the index entirely.

This form sets the per-column statistics-gathering target for subsequent ANALYZE operations, though can be used only on index columns that are defined as an expression. Since expressions lack a unique name, we refer to them using the ordinal number of the index column. The target can be set in the range 0 to 10000; alternatively, set it to -1 to revert to using the system default statistics target (default_statistics_target). For more information on the use of statistics by the PostgreSQL query planner, refer to Section 14.2.

Do not throw an error if the index does not exist. A notice is issued in this case.

The ordinal number refers to the ordinal (left-to-right) position of the index column.

The name (possibly schema-qualified) of an existing index to alter.

The new name for the index.

The tablespace to which the index will be moved.

The name of the extension that the index is to depend on.

The name of an index-method-specific storage parameter.

The new value for an index-method-specific storage parameter. This might be a number or a word depending on the parameter.

These operations are also possible using ALTER TABLE. ALTER INDEX is in fact just an alias for the forms of ALTER TABLE that apply to indexes.

There was formerly an ALTER INDEX OWNER variant, but this is now ignored (with a warning). An index cannot have an owner different from its table's owner. Changing the table's owner automatically changes the index as well.

Changing any part of a system catalog index is not permitted.

To rename an existing index:

To move an index to a different tablespace:

To change an index's fill factor (assuming that the index method supports it):

Set the statistics-gathering target for an expression index:

ALTER INDEX is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
tablespace_name
```

Example 2 (unknown):
```unknown
extension_name
```

Example 3 (unknown):
```unknown
storage_parameter
```

Example 4 (unknown):
```unknown
storage_parameter
```

---


---

