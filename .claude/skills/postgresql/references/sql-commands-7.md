# PostgreSQL - Sql Commands (Part 7)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createdomain.html

**Contents:**
- CREATE DOMAIN
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE DOMAIN — define a new domain

CREATE DOMAIN creates a new domain. A domain is essentially a data type with optional constraints (restrictions on the allowed set of values). The user who defines a domain becomes its owner.

If a schema name is given (for example, CREATE DOMAIN myschema.mydomain ...) then the domain is created in the specified schema. Otherwise it is created in the current schema. The domain name must be unique among the types and domains existing in its schema.

Domains are useful for abstracting common constraints on fields into a single location for maintenance. For example, several tables might contain email address columns, all requiring the same CHECK constraint to verify the address syntax. Define a domain rather than setting up each table's constraint individually.

To be able to create a domain, you must have USAGE privilege on the underlying type.

The name (optionally schema-qualified) of a domain to be created.

The underlying data type of the domain. This can include array specifiers.

An optional collation for the domain. If no collation is specified, the domain has the same collation behavior as its underlying data type. The underlying type must be collatable if COLLATE is specified.

The DEFAULT clause specifies a default value for columns of the domain data type. The value is any variable-free expression (but subqueries are not allowed). The data type of the default expression must match the data type of the domain. If no default value is specified, then the default value is the null value.

The default expression will be used in any insert operation that does not specify a value for the column. If a default value is defined for a particular column, it overrides any default associated with the domain. In turn, the domain default overrides any default value associated with the underlying data type.

An optional name for a constraint. If not specified, the system generates a name.

Values of this domain are prevented from being null (but see notes below).

Values of this domain are allowed to be null. This is the default.

This clause is only intended for compatibility with nonstandard SQL databases. Its use is discouraged in new applications.

CHECK clauses specify integrity constraints or tests which values of the domain must satisfy. Each constraint must be an expression producing a Boolean result. It should use the key word VALUE to refer to the value being tested. Expressions evaluating to TRUE or UNKNOWN succeed. If the expression produces a FALSE result, an error is reported and the value is not allowed to be converted to the domain type.

Currently, CHECK expressions cannot contain subqueries nor refer to variables other than VALUE.

When a domain has multiple CHECK constraints, they will be tested in alphabetical order by name. (PostgreSQL versions before 9.5 did not honor any particular firing order for CHECK constraints.)

Domain constraints, particularly NOT NULL, are checked when converting a value to the domain type. It is possible for a column that is nominally of the domain type to read as null despite there being such a constraint. For example, this can happen in an outer-join query, if the domain column is on the nullable side of the outer join. A more subtle example is

The empty scalar sub-SELECT will produce a null value that is considered to be of the domain type, so no further constraint checking is applied to it, and the insertion will succeed.

It is very difficult to avoid such problems, because of SQL's general assumption that a null value is a valid value of every data type. Best practice therefore is to design a domain's constraints so that a null value is allowed, and then to apply column NOT NULL constraints to columns of the domain type as needed, rather than directly to the domain type.

PostgreSQL assumes that CHECK constraints' conditions are immutable, that is, they will always give the same result for the same input value. This assumption is what justifies examining CHECK constraints only when a value is first converted to be of a domain type, and not at other times. (This is essentially the same as the treatment of table CHECK constraints, as described in Section 5.5.1.)

An example of a common way to break this assumption is to reference a user-defined function in a CHECK expression, and then change the behavior of that function. PostgreSQL does not disallow that, but it will not notice if there are stored values of the domain type that now violate the CHECK constraint. That would cause a subsequent database dump and restore to fail. The recommended way to handle such a change is to drop the constraint (using ALTER DOMAIN), adjust the function definition, and re-add the constraint, thereby rechecking it against stored data.

It's also good practice to ensure that domain CHECK expressions will not throw errors.

This example creates the us_postal_code data type and then uses the type in a table definition. A regular expression test is used to verify that the value looks like a valid US postal code:

The command CREATE DOMAIN conforms to the SQL standard.

The syntax NOT NULL in this command is a PostgreSQL extension. (A standard-conforming way to write the same for non-composite data types would be CHECK (VALUE IS NOT NULL). However, per the section called “Notes”, such constraints are best avoided in practice anyway.) The NULL “constraint” is a PostgreSQL extension (see also Compatibility).

**Examples:**

Example 1 (unknown):
```unknown
domain_constraint
```

Example 2 (unknown):
```unknown
domain_constraint
```

Example 3 (unknown):
```unknown
constraint_name
```

Example 4 (unknown):
```unknown
CREATE DOMAIN
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtableas.html

**Contents:**
- CREATE TABLE AS
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE TABLE AS — define a new table from the results of a query

CREATE TABLE AS creates a table and fills it with data computed by a SELECT command. The table columns have the names and data types associated with the output columns of the SELECT (except that you can override the column names by giving an explicit list of new column names).

CREATE TABLE AS bears some resemblance to creating a view, but it is really quite different: it creates a new table and evaluates the query just once to fill the new table initially. The new table will not track subsequent changes to the source tables of the query. In contrast, a view re-evaluates its defining SELECT statement whenever it is queried.

CREATE TABLE AS requires CREATE privilege on the schema used for the table.

Ignored for compatibility. Use of these keywords is deprecated; refer to CREATE TABLE for details.

If specified, the table is created as a temporary table. Refer to CREATE TABLE for details.

If specified, the table is created as an unlogged table. Refer to CREATE TABLE for details.

Do not throw an error if a relation with the same name already exists; simply issue a notice and leave the table unmodified.

The name (optionally schema-qualified) of the table to be created.

The name of a column in the new table. If column names are not provided, they are taken from the output column names of the query.

This optional clause specifies the table access method to use to store the contents for the new table; the method needs be an access method of type TABLE. See Chapter 62 for more information. If this option is not specified, the default table access method is chosen for the new table. See default_table_access_method for more information.

This clause specifies optional storage parameters for the new table; see Storage Parameters in the CREATE TABLE documentation for more information. For backward-compatibility the WITH clause for a table can also include OIDS=FALSE to specify that rows of the new table should contain no OIDs (object identifiers), OIDS=TRUE is not supported anymore.

This is backward-compatible syntax for declaring a table WITHOUT OIDS, creating a table WITH OIDS is not supported anymore.

The behavior of temporary tables at the end of a transaction block can be controlled using ON COMMIT. The three options are:

No special action is taken at the ends of transactions. This is the default behavior.

All rows in the temporary table will be deleted at the end of each transaction block. Essentially, an automatic TRUNCATE is done at each commit.

The temporary table will be dropped at the end of the current transaction block.

The tablespace_name is the name of the tablespace in which the new table is to be created. If not specified, default_tablespace is consulted, or temp_tablespaces if the table is temporary.

A SELECT, TABLE, or VALUES command, or an EXECUTE command that runs a prepared SELECT, TABLE, or VALUES query.

This clause specifies whether or not the data produced by the query should be copied into the new table. If not, only the table structure is copied. The default is to copy the data.

This command is functionally similar to SELECT INTO, but it is preferred since it is less likely to be confused with other uses of the SELECT INTO syntax. Furthermore, CREATE TABLE AS offers a superset of the functionality offered by SELECT INTO.

Create a new table films_recent consisting of only recent entries from the table films:

To copy a table completely, the short form using the TABLE command can also be used:

Create a new temporary table films_recent, consisting of only recent entries from the table films, using a prepared statement. The new table will be dropped at commit:

CREATE TABLE AS conforms to the SQL standard. The following are nonstandard extensions:

The standard requires parentheses around the subquery clause; in PostgreSQL, these parentheses are optional.

In the standard, the WITH [ NO ] DATA clause is required; in PostgreSQL it is optional.

PostgreSQL handles temporary tables in a way rather different from the standard; see CREATE TABLE for details.

The WITH clause is a PostgreSQL extension; storage parameters are not in the standard.

The PostgreSQL concept of tablespaces is not part of the standard. Hence, the clause TABLESPACE is an extension.

**Examples:**

Example 1 (unknown):
```unknown
column_name
```

Example 2 (unknown):
```unknown
storage_parameter
```

Example 3 (unknown):
```unknown
tablespace_name
```

Example 4 (sql):
```sql
CREATE TABLE AS
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptransform.html

**Contents:**
- DROP TRANSFORM
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP TRANSFORM — remove a transform

DROP TRANSFORM removes a previously defined transform.

To be able to drop a transform, you must own the type and the language. These are the same privileges that are required to create a transform.

Do not throw an error if the transform does not exist. A notice is issued in this case.

The name of the data type of the transform.

The name of the language of the transform.

Automatically drop objects that depend on the transform, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the transform if any objects depend on it. This is the default.

To drop the transform for type hstore and language plpython3u:

This form of DROP TRANSFORM is a PostgreSQL extension. See CREATE TRANSFORM for details.

**Examples:**

Example 1 (csharp):
```csharp
DROP TRANSFORM
```

Example 2 (csharp):
```csharp
DROP TRANSFORM FOR hstore LANGUAGE plpython3u;
```

Example 3 (csharp):
```csharp
DROP TRANSFORM
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droptablespace.html

**Contents:**
- DROP TABLESPACE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

DROP TABLESPACE — remove a tablespace

DROP TABLESPACE removes a tablespace from the system.

A tablespace can only be dropped by its owner or a superuser. The tablespace must be empty of all database objects before it can be dropped. It is possible that objects in other databases might still reside in the tablespace even if no objects in the current database are using the tablespace. Also, if the tablespace is listed in the temp_tablespaces setting of any active session, the DROP might fail due to temporary files residing in the tablespace.

Do not throw an error if the tablespace does not exist. A notice is issued in this case.

The name of a tablespace.

DROP TABLESPACE cannot be executed inside a transaction block.

To remove tablespace mystuff from the system:

DROP TABLESPACE is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP TABLESPACE
```

Example 2 (unknown):
```unknown
DROP TABLESPACE
```

Example 3 (unknown):
```unknown
DROP TABLESPACE mystuff;
```

Example 4 (unknown):
```unknown
DROP TABLESPACE
```

---


---

