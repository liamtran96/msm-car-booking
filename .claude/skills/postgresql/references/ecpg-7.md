# PostgreSQL - Ecpg (Part 7)

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-allocate-descriptor.html

**Contents:**
- ALLOCATE DESCRIPTOR
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALLOCATE DESCRIPTOR — allocate an SQL descriptor area

ALLOCATE DESCRIPTOR allocates a new named SQL descriptor area, which can be used to exchange data between the PostgreSQL server and the host program.

Descriptor areas should be freed after use using the DEALLOCATE DESCRIPTOR command.

A name of SQL descriptor, case sensitive. This can be an SQL identifier or a host variable.

ALLOCATE DESCRIPTOR is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALLOCATE DESCRIPTOR
```

Example 2 (unknown):
```unknown
DEALLOCATE DESCRIPTOR
```

Example 3 (unknown):
```unknown
EXEC SQL ALLOCATE DESCRIPTOR mydesc;
```

Example 4 (unknown):
```unknown
ALLOCATE DESCRIPTOR
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-deallocate-descriptor.html

**Contents:**
- DEALLOCATE DESCRIPTOR
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DEALLOCATE DESCRIPTOR — deallocate an SQL descriptor area

DEALLOCATE DESCRIPTOR deallocates a named SQL descriptor area.

The name of the descriptor which is going to be deallocated. It is case sensitive. This can be an SQL identifier or a host variable.

DEALLOCATE DESCRIPTOR is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DEALLOCATE DESCRIPTOR
```

Example 2 (unknown):
```unknown
EXEC SQL DEALLOCATE DESCRIPTOR mydesc;
```

Example 3 (unknown):
```unknown
DEALLOCATE DESCRIPTOR
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-var.html

**Contents:**
- VAR
- Synopsis
- Description
- Parameters
- Examples
- Compatibility

VAR — define a variable

The VAR command assigns a new C data type to a host variable. The host variable must be previously declared in a declare section.

A C type specification.

The VAR command is a PostgreSQL extension.

**Examples:**

Example 1 (julia):
```julia
Exec sql begin declare section;
short a;
exec sql end declare section;
EXEC SQL VAR a IS int;
```

---


---

## 34.3. Running SQL Commands #


**URL:** https://www.postgresql.org/docs/18/ecpg-commands.html

**Contents:**
- 34.3. Running SQL Commands #
  - 34.3.1. Executing SQL Statements #
  - 34.3.2. Using Cursors #
  - Note
  - 34.3.3. Managing Transactions #
  - 34.3.4. Prepared Statements #

Any SQL command can be run from within an embedded SQL application. Below are some examples of how to do that.

SELECT statements that return a single result row can also be executed using EXEC SQL directly. To handle result sets with multiple rows, an application has to use a cursor; see Section 34.3.2 below. (As a special case, an application can fetch multiple rows at once into an array host variable; see Section 34.4.4.3.1.)

Also, a configuration parameter can be retrieved with the SHOW command:

The tokens of the form :something are host variables, that is, they refer to variables in the C program. They are explained in Section 34.4.

To retrieve a result set holding multiple rows, an application has to declare a cursor and fetch each row from the cursor. The steps to use a cursor are the following: declare a cursor, open it, fetch a row from the cursor, repeat, and finally close it.

Select using cursors:

For more details about declaring a cursor, see DECLARE; for more details about fetching rows from a cursor, see FETCH.

The ECPG DECLARE command does not actually cause a statement to be sent to the PostgreSQL backend. The cursor is opened in the backend (using the backend's DECLARE command) at the point when the OPEN command is executed.

In the default mode, statements are committed only when EXEC SQL COMMIT is issued. The embedded SQL interface also supports autocommit of transactions (similar to psql's default behavior) via the -t command-line option to ecpg (see ecpg) or via the EXEC SQL SET AUTOCOMMIT TO ON statement. In autocommit mode, each command is automatically committed unless it is inside an explicit transaction block. This mode can be explicitly turned off using EXEC SQL SET AUTOCOMMIT TO OFF.

The following transaction management commands are available:

Commit an in-progress transaction.

Roll back an in-progress transaction.

Prepare the current transaction for two-phase commit.

Commit a transaction that is in prepared state.

Roll back a transaction that is in prepared state.

Enable autocommit mode.

Disable autocommit mode. This is the default.

When the values to be passed to an SQL statement are not known at compile time, or the same statement is going to be used many times, then prepared statements can be useful.

The statement is prepared using the command PREPARE. For the values that are not known yet, use the placeholder “?”:

If a statement returns a single row, the application can call EXECUTE after PREPARE to execute the statement, supplying the actual values for the placeholders with a USING clause:

If a statement returns multiple rows, the application can use a cursor declared based on the prepared statement. To bind input parameters, the cursor must be opened with a USING clause:

When you don't need the prepared statement anymore, you should deallocate it:

For more details about PREPARE, see PREPARE. Also see Section 34.5 for more details about using placeholders and input parameters.

**Examples:**

Example 1 (sql):
```sql
EXEC SQL CREATE TABLE foo (number integer, ascii char(16));
EXEC SQL CREATE UNIQUE INDEX num1 ON foo(number);
EXEC SQL COMMIT;
```

Example 2 (sql):
```sql
EXEC SQL INSERT INTO foo (number, ascii) VALUES (9999, 'doodad');
EXEC SQL COMMIT;
```

Example 3 (sql):
```sql
EXEC SQL DELETE FROM foo WHERE number = 9999;
EXEC SQL COMMIT;
```

Example 4 (sql):
```sql
EXEC SQL UPDATE foo
    SET ascii = 'foobar'
    WHERE number = 9999;
EXEC SQL COMMIT;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-execute-immediate.html

**Contents:**
- EXECUTE IMMEDIATE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility

EXECUTE IMMEDIATE — dynamically prepare and execute a statement

EXECUTE IMMEDIATE immediately prepares and executes a dynamically specified SQL statement, without retrieving result rows.

A literal string or a host variable containing the SQL statement to be executed.

In typical usage, the string is a host variable reference to a string containing a dynamically-constructed SQL statement. The case of a literal string is not very useful; you might as well just write the SQL statement directly, without the extra typing of EXECUTE IMMEDIATE.

If you do use a literal string, keep in mind that any double quotes you might wish to include in the SQL statement must be written as octal escapes (\042) not the usual C idiom \". This is because the string is inside an EXEC SQL section, so the ECPG lexer parses it according to SQL rules not C rules. Any embedded backslashes will later be handled according to C rules; but \" causes an immediate syntax error because it is seen as ending the literal.

Here is an example that executes an INSERT statement using EXECUTE IMMEDIATE and a host variable named command:

EXECUTE IMMEDIATE is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
EXECUTE IMMEDIATE
```

Example 2 (unknown):
```unknown
EXECUTE IMMEDIATE
```

Example 3 (unknown):
```unknown
EXECUTE IMMEDIATE
```

Example 4 (sql):
```sql
sprintf(command, "INSERT INTO test (name, amount, letter) VALUES ('db: ''r1''', 1, 'f')");
EXEC SQL EXECUTE IMMEDIATE :command;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-set-connection.html

**Contents:**
- SET CONNECTION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

SET CONNECTION — select a database connection

SET CONNECTION sets the “current” database connection, which is the one that all commands use unless overridden.

A database connection name established by the CONNECT command.

Set the connection to the current connection (thus, nothing happens).

SET CONNECTION is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
connection_name
```

Example 2 (unknown):
```unknown
SET CONNECTION
```

Example 3 (unknown):
```unknown
connection_name
```

Example 4 (unknown):
```unknown
EXEC SQL SET CONNECTION TO con2;
EXEC SQL SET CONNECTION = con1;
```

---


---

