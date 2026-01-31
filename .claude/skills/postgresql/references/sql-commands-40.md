# PostgreSQL - Sql Commands (Part 40)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createforeigntable.html

**Contents:**
- CREATE FOREIGN TABLE
- Synopsis
- Description
- Parameters
- Notes
  - Caution
- Examples
- Compatibility
- See Also

CREATE FOREIGN TABLE — define a new foreign table

CREATE FOREIGN TABLE creates a new foreign table in the current database. The table will be owned by the user issuing the command.

If a schema name is given (for example, CREATE FOREIGN TABLE myschema.mytable ...) then the table is created in the specified schema. Otherwise it is created in the current schema. The name of the foreign table must be distinct from the name of any other relation (table, sequence, index, view, materialized view, or foreign table) in the same schema.

CREATE FOREIGN TABLE also automatically creates a data type that represents the composite type corresponding to one row of the foreign table. Therefore, foreign tables cannot have the same name as any existing data type in the same schema.

If PARTITION OF clause is specified then the table is created as a partition of parent_table with specified bounds.

To be able to create a foreign table, you must have USAGE privilege on the foreign server, as well as USAGE privilege on all column types used in the table.

Do not throw an error if a relation with the same name already exists. A notice is issued in this case. Note that there is no guarantee that the existing relation is anything like the one that would have been created.

The name (optionally schema-qualified) of the table to be created.

The name of a column to be created in the new table.

The data type of the column. This can include array specifiers. For more information on the data types supported by PostgreSQL, refer to Chapter 8.

The COLLATE clause assigns a collation to the column (which must be of a collatable data type). If not specified, the column data type's default collation is used.

The optional INHERITS clause specifies a list of tables from which the new foreign table automatically inherits all columns. Parent tables can be plain tables or foreign tables. See the similar form of CREATE TABLE for more details.

This form can be used to create the foreign table as partition of the given parent table with specified partition bound values. See the similar form of CREATE TABLE for more details. Note that it is currently not allowed to create the foreign table as a partition of the parent table if there are UNIQUE indexes on the parent table. (See also ALTER TABLE ATTACH PARTITION.)

The LIKE clause specifies a table from which the new table automatically copies all column names, their data types, and their not-null constraints.

Unlike INHERITS, the new table and original table are completely decoupled after creation is complete. Changes to the original table will not be applied to the new table, and it is not possible to include data of the new table in scans of the original table.

Also unlike INHERITS, columns and constraints copied by LIKE are not merged with similarly named columns and constraints. If the same name is specified explicitly or in another LIKE clause, an error is signaled.

The optional like_option clauses specify which additional properties of the original table to copy. Specifying INCLUDING copies the property, specifying EXCLUDING omits the property. EXCLUDING is the default. If multiple specifications are made for the same kind of object, the last one is used. The available options are:

Comments for the copied columns and constraints will be copied. The default behavior is to exclude comments, resulting in the copied columns and constraints in the new table having no comments.

CHECK constraints will be copied. No distinction is made between column constraints and table constraints. Not-null constraints are always copied to the new table.

Default expressions for the copied column definitions will be copied. Otherwise, default expressions are not copied, resulting in the copied columns in the new table having null defaults. Note that copying defaults that call database-modification functions, such as nextval, may create a functional linkage between the original and new tables.

Any generation expressions of copied column definitions will be copied. By default, new columns will be regular base columns.

Extended statistics are copied to the new table.

INCLUDING ALL is an abbreviated form selecting all the available individual options. (It could be useful to write individual EXCLUDING clauses after INCLUDING ALL to select all but some specific options.)

An optional name for a column or table constraint. If the constraint is violated, the constraint name is present in error messages, so constraint names like col must be positive can be used to communicate helpful constraint information to client applications. (Double-quotes are needed to specify constraint names that contain spaces.) If a constraint name is not specified, the system generates a name.

The column is not allowed to contain null values.

A constraint marked with NO INHERIT will not propagate to child tables.

The column is allowed to contain null values. This is the default.

This clause is only provided for compatibility with non-standard SQL databases. Its use is discouraged in new applications.

The CHECK clause specifies an expression producing a Boolean result which each row in the foreign table is expected to satisfy; that is, the expression should produce TRUE or UNKNOWN, never FALSE, for all rows in the foreign table. A check constraint specified as a column constraint should reference that column's value only, while an expression appearing in a table constraint can reference multiple columns.

Currently, CHECK expressions cannot contain subqueries nor refer to variables other than columns of the current row. The system column tableoid may be referenced, but not any other system column.

A constraint marked with NO INHERIT will not propagate to child tables.

The DEFAULT clause assigns a default data value for the column whose column definition it appears within. The value is any variable-free expression (subqueries and cross-references to other columns in the current table are not allowed). The data type of the default expression must match the data type of the column.

The default expression will be used in any insert operation that does not specify a value for the column. If there is no default for a column, then the default is null.

This clause creates the column as a generated column. The column cannot be written to, and when read the result of the specified expression will be returned.

When VIRTUAL is specified, the column will be computed when it is read. (The foreign-data wrapper will see it as a null value in new rows and may choose to store it as a null value or ignore it altogether.) When STORED is specified, the column will be computed on write. (The computed value will be presented to the foreign-data wrapper for storage and must be returned on reading.) VIRTUAL is the default.

The generation expression can refer to other columns in the table, but not other generated columns. Any functions and operators used must be immutable. References to other tables are not allowed.

The name of an existing foreign server to use for the foreign table. For details on defining a server, see CREATE SERVER.

Options to be associated with the new foreign table or one of its columns. The allowed option names and values are specific to each foreign data wrapper and are validated using the foreign-data wrapper's validator function. Duplicate option names are not allowed (although it's OK for a table option and a column option to have the same name).

Constraints on foreign tables (such as CHECK or NOT NULL clauses) are not enforced by the core PostgreSQL system, and most foreign data wrappers do not attempt to enforce them either; that is, the constraint is simply assumed to hold true. There would be little point in such enforcement since it would only apply to rows inserted or updated via the foreign table, and not to rows modified by other means, such as directly on the remote server. Instead, a constraint attached to a foreign table should represent a constraint that is being enforced by the remote server.

Some special-purpose foreign data wrappers might be the only access mechanism for the data they access, and in that case it might be appropriate for the foreign data wrapper itself to perform constraint enforcement. But you should not assume that a wrapper does that unless its documentation says so.

Although PostgreSQL does not attempt to enforce constraints on foreign tables, it does assume that they are correct for purposes of query optimization. If there are rows visible in the foreign table that do not satisfy a declared constraint, queries on the table might produce errors or incorrect answers. It is the user's responsibility to ensure that the constraint definition matches reality.

When a foreign table is used as a partition of a partitioned table, there is an implicit constraint that its contents must satisfy the partitioning rule. Again, it is the user's responsibility to ensure that that is true, which is best done by installing a matching constraint on the remote server.

Within a partitioned table containing foreign-table partitions, an UPDATE that changes the partition key value can cause a row to be moved from a local partition to a foreign-table partition, provided the foreign data wrapper supports tuple routing. However, it is not currently possible to move a row from a foreign-table partition to another partition. An UPDATE that would require doing that will fail due to the partitioning constraint, assuming that that is properly enforced by the remote server.

Similar considerations apply to generated columns. Stored generated columns are computed on insert or update on the local PostgreSQL server and handed to the foreign-data wrapper for writing out to the foreign data store, but it is not enforced that a query of the foreign table returns values for stored generated columns that are consistent with the generation expression. Again, this might result in incorrect query results.

Create foreign table films, which will be accessed through the server film_server:

Create foreign table measurement_y2016m07, which will be accessed through the server server_07, as a partition of the range partitioned table measurement:

The CREATE FOREIGN TABLE command largely conforms to the SQL standard; however, much as with CREATE TABLE, NULL constraints and zero-column foreign tables are permitted. The ability to specify column default values is also a PostgreSQL extension. Table inheritance, in the form defined by PostgreSQL, is nonstandard. The LIKE clause, as supported in this command, is nonstandard.

**Examples:**

Example 1 (unknown):
```unknown
column_name
```

Example 2 (unknown):
```unknown
column_constraint
```

Example 3 (unknown):
```unknown
table_constraint
```

Example 4 (unknown):
```unknown
source_table
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropforeigndatawrapper.html

**Contents:**
- DROP FOREIGN DATA WRAPPER
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP FOREIGN DATA WRAPPER — remove a foreign-data wrapper

DROP FOREIGN DATA WRAPPER removes an existing foreign-data wrapper. To execute this command, the current user must be the owner of the foreign-data wrapper.

Do not throw an error if the foreign-data wrapper does not exist. A notice is issued in this case.

The name of an existing foreign-data wrapper.

Automatically drop objects that depend on the foreign-data wrapper (such as foreign tables and servers), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the foreign-data wrapper if any objects depend on it. This is the default.

Drop the foreign-data wrapper dbi:

DROP FOREIGN DATA WRAPPER conforms to ISO/IEC 9075-9 (SQL/MED). The IF EXISTS clause is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP FOREIGN DATA WRAPPER
```

Example 2 (unknown):
```unknown
DROP FOREIGN DATA WRAPPER dbi;
```

Example 3 (unknown):
```unknown
DROP FOREIGN DATA WRAPPER
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-commit.html

**Contents:**
- COMMIT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

COMMIT — commit the current transaction

COMMIT commits the current transaction. All changes made by the transaction become visible to others and are guaranteed to be durable if a crash occurs.

Optional key words. They have no effect.

If AND CHAIN is specified, a new transaction is immediately started with the same transaction characteristics (see SET TRANSACTION) as the just finished one. Otherwise, no new transaction is started.

Use ROLLBACK to abort a transaction.

Issuing COMMIT when not inside a transaction does no harm, but it will provoke a warning message. COMMIT AND CHAIN when not inside a transaction is an error.

To commit the current transaction and make all changes permanent:

The command COMMIT conforms to the SQL standard. The form COMMIT TRANSACTION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
TRANSACTION
```

Example 2 (unknown):
```unknown
COMMIT AND CHAIN
```

Example 3 (unknown):
```unknown
COMMIT TRANSACTION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterview.html

**Contents:**
- ALTER VIEW
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER VIEW — change the definition of a view

ALTER VIEW changes various auxiliary properties of a view. (If you want to modify the view's defining query, use CREATE OR REPLACE VIEW.)

You must own the view to use ALTER VIEW. To change a view's schema, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the view's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the view. However, a superuser can alter ownership of any view anyway.)

The name (optionally schema-qualified) of an existing view.

Name of an existing column.

New name for an existing column.

Do not throw an error if the view does not exist. A notice is issued in this case.

These forms set or remove the default value for a column. A view column's default value is substituted into any INSERT or UPDATE command whose target is the view, before applying any rules or triggers for the view. The view's default will therefore take precedence over any default values from underlying relations.

The user name of the new owner of the view.

The new name for the view.

The new schema for the view.

Sets or resets a view option. Currently supported options are:

Changes the check option of the view. The value must be local or cascaded.

Changes the security-barrier property of the view. The value must be a Boolean value, such as true or false.

Changes the security-invoker property of the view. The value must be a Boolean value, such as true or false.

For historical reasons, ALTER TABLE can be used with views too; but the only variants of ALTER TABLE that are allowed with views are equivalent to the ones shown above.

To rename the view foo to bar:

To attach a default column value to an updatable view:

ALTER VIEW is a PostgreSQL extension of the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
column_name
```

Example 2 (unknown):
```unknown
column_name
```

Example 3 (unknown):
```unknown
column_name
```

Example 4 (unknown):
```unknown
new_column_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-unlisten.html

**Contents:**
- UNLISTEN
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

UNLISTEN — stop listening for a notification

UNLISTEN is used to remove an existing registration for NOTIFY events. UNLISTEN cancels any existing registration of the current PostgreSQL session as a listener on the notification channel named channel. The special wildcard * cancels all listener registrations for the current session.

NOTIFY contains a more extensive discussion of the use of LISTEN and NOTIFY.

Name of a notification channel (any identifier).

All current listen registrations for this session are cleared.

You can unlisten something you were not listening for; no warning or error will appear.

At the end of each session, UNLISTEN * is automatically executed.

A transaction that has executed UNLISTEN cannot be prepared for two-phase commit.

To make a registration:

Once UNLISTEN has been executed, further NOTIFY messages will be ignored:

There is no UNLISTEN command in the SQL standard.

**Examples:**

Example 1 (sql):
```sql
LISTEN virtual;
NOTIFY virtual;
Asynchronous notification "virtual" received from server process with PID 8448.
```

Example 2 (unknown):
```unknown
UNLISTEN virtual;
NOTIFY virtual;
-- no NOTIFY event is received
```

---


---

