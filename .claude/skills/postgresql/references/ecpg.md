# PostgreSQL - Ecpg

## 34.5. Dynamic SQL #


**URL:** https://www.postgresql.org/docs/18/ecpg-dynamic.html

**Contents:**
- 34.5. Dynamic SQL #
  - 34.5.1. Executing Statements without a Result Set #
  - 34.5.2. Executing a Statement with Input Parameters #
  - 34.5.3. Executing a Statement with a Result Set #

In many cases, the particular SQL statements that an application has to execute are known at the time the application is written. In some cases, however, the SQL statements are composed at run time or provided by an external source. In these cases you cannot embed the SQL statements directly into the C source code, but there is a facility that allows you to call arbitrary SQL statements that you provide in a string variable.

The simplest way to execute an arbitrary SQL statement is to use the command EXECUTE IMMEDIATE. For example:

EXECUTE IMMEDIATE can be used for SQL statements that do not return a result set (e.g., DDL, INSERT, UPDATE, DELETE). You cannot execute statements that retrieve data (e.g., SELECT) this way. The next section describes how to do that.

A more powerful way to execute arbitrary SQL statements is to prepare them once and execute the prepared statement as often as you like. It is also possible to prepare a generalized version of a statement and then execute specific versions of it by substituting parameters. When preparing the statement, write question marks where you want to substitute parameters later. For example:

When you don't need the prepared statement anymore, you should deallocate it:

To execute an SQL statement with a single result row, EXECUTE can be used. To save the result, add an INTO clause.

An EXECUTE command can have an INTO clause, a USING clause, both, or neither.

If a query is expected to return more than one result row, a cursor should be used, as in the following example. (See Section 34.3.2 for more details about the cursor.)

**Examples:**

Example 1 (unknown):
```unknown
EXECUTE IMMEDIATE
```

Example 2 (sql):
```sql
EXEC SQL BEGIN DECLARE SECTION;
const char *stmt = "CREATE TABLE test1 (...);";
EXEC SQL END DECLARE SECTION;

EXEC SQL EXECUTE IMMEDIATE :stmt;
```

Example 3 (unknown):
```unknown
EXECUTE IMMEDIATE
```

Example 4 (sql):
```sql
EXEC SQL BEGIN DECLARE SECTION;
const char *stmt = "INSERT INTO test1 VALUES(?, ?);";
EXEC SQL END DECLARE SECTION;

EXEC SQL PREPARE mystmt FROM :stmt;
 ...
EXEC SQL EXECUTE mystmt USING 42, 'foobar';
```

---


---

## 34.11. Library Functions #


**URL:** https://www.postgresql.org/docs/18/ecpg-library.html

**Contents:**
- 34.11. Library Functions #
  - Note
  - Note

The libecpg library primarily contains “hidden” functions that are used to implement the functionality expressed by the embedded SQL commands. But there are some functions that can usefully be called directly. Note that this makes your code unportable.

ECPGdebug(int on, FILE *stream) turns on debug logging if called with the first argument non-zero. Debug logging is done on stream. The log contains all SQL statements with all the input variables inserted, and the results from the PostgreSQL server. This can be very useful when searching for errors in your SQL statements.

On Windows, if the ecpg libraries and an application are compiled with different flags, this function call will crash the application because the internal representation of the FILE pointers differ. Specifically, multithreaded/single-threaded, release/debug, and static/dynamic flags should be the same for the library and all applications using that library.

ECPGget_PGconn(const char *connection_name) returns the library database connection handle identified by the given name. If connection_name is set to NULL, the current connection handle is returned. If no connection handle can be identified, the function returns NULL. The returned connection handle can be used to call any other functions from libpq, if necessary.

It is a bad idea to manipulate database connection handles made from ecpg directly with libpq routines.

ECPGtransactionStatus(const char *connection_name) returns the current transaction status of the given connection identified by connection_name. See Section 32.2 and libpq's PQtransactionStatus for details about the returned status codes.

ECPGstatus(int lineno, const char* connection_name) returns true if you are connected to a database and false if not. connection_name can be NULL if a single connection is being used.

**Examples:**

Example 1 (unknown):
```unknown
ECPGdebug(int on, FILE *stream)
```

Example 2 (unknown):
```unknown
ECPGget_PGconn(const char *connection_name)
```

Example 3 (unknown):
```unknown
connection_name
```

Example 4 (unknown):
```unknown
connection_name
```

---


---

## 34.14. Embedded SQL Commands #


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-commands.html

**Contents:**
- 34.14. Embedded SQL Commands #

This section describes all SQL commands that are specific to embedded SQL. Also refer to the SQL commands listed in SQL Commands, which can also be used in embedded SQL, unless stated otherwise.

---


---

## 34.2. Managing Database Connections #


**URL:** https://www.postgresql.org/docs/18/ecpg-connect.html

**Contents:**
- 34.2. Managing Database Connections #
  - 34.2.1. Connecting to the Database Server #
  - 34.2.2. Choosing a Connection #
  - 34.2.3. Closing a Connection #

This section describes how to open, close, and switch database connections.

One connects to a database using the following statement:

The target can be specified in the following ways:

The connection target DEFAULT initiates a connection to the default database under the default user name. No separate user name or connection name can be specified in that case.

If you specify the connection target directly (that is, not as a string literal or variable reference), then the components of the target are passed through normal SQL parsing; this means that, for example, the hostname must look like one or more SQL identifiers separated by dots, and those identifiers will be case-folded unless double-quoted. Values of any options must be SQL identifiers, integers, or variable references. Of course, you can put nearly anything into an SQL identifier by double-quoting it. In practice, it is probably less error-prone to use a (single-quoted) string literal or a variable reference than to write the connection target directly.

There are also different ways to specify the user name:

As above, the parameters username and password can be an SQL identifier, an SQL string literal, or a reference to a character variable.

If the connection target includes any options, those consist of keyword=value specifications separated by ampersands (&). The allowed key words are the same ones recognized by libpq (see Section 32.1.2). Spaces are ignored before any keyword or value, though not within or after one. Note that there is no way to write & within a value.

Notice that when specifying a socket connection (with the unix: prefix), the host name must be exactly localhost. To select a non-default socket directory, write the directory's pathname as the value of a host option in the options part of the target.

The connection-name is used to handle multiple connections in one program. It can be omitted if a program uses only one connection. The most recently opened connection becomes the current connection, which is used by default when an SQL statement is to be executed (see later in this chapter).

Here are some examples of CONNECT statements:

The last example makes use of the feature referred to above as character variable references. You will see in later sections how C variables can be used in SQL statements when you prefix them with a colon.

Be advised that the format of the connection target is not specified in the SQL standard. So if you want to develop portable applications, you might want to use something based on the last example above to encapsulate the connection target string somewhere.

If untrusted users have access to a database that has not adopted a secure schema usage pattern, begin each session by removing publicly-writable schemas from search_path. For example, add options=-c search_path= to options, or issue EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); after connecting. This consideration is not specific to ECPG; it applies to every interface for executing arbitrary SQL commands.

SQL statements in embedded SQL programs are by default executed on the current connection, that is, the most recently opened one. If an application needs to manage multiple connections, then there are three ways to handle this.

The first option is to explicitly choose a connection for each SQL statement, for example:

This option is particularly suitable if the application needs to use several connections in mixed order.

If your application uses multiple threads of execution, they cannot share a connection concurrently. You must either explicitly control access to the connection (using mutexes) or use a connection for each thread.

The second option is to execute a statement to switch the current connection. That statement is:

This option is particularly convenient if many statements are to be executed on the same connection.

Here is an example program managing multiple database connections:

This example would produce this output:

The third option is to declare an SQL identifier linked to the connection, for example:

Once you link an SQL identifier to a connection, you execute dynamic SQL without an AT clause. Note that this option behaves like preprocessor directives, therefore the link is enabled only in the file.

Here is an example program using this option:

This example would produce this output, even if the default connection is testdb:

To close a connection, use the following statement:

The connection can be specified in the following ways:

If no connection name is specified, the current connection is closed.

It is good style that an application always explicitly disconnect from every connection it opened.

**Examples:**

Example 1 (typescript):
```typescript
EXEC SQL CONNECT TO target [AS connection-name] [USER user-name];
```

Example 2 (unknown):
```unknown
connection-name
```

Example 3 (python):
```python
dbname[@hostname][:port]
```

Example 4 (yaml):
```yaml
tcp:postgresql://hostname[:port][/dbname][?options]
```

---


---

## 34.9. Preprocessor Directives #


**URL:** https://www.postgresql.org/docs/18/ecpg-preproc.html

**Contents:**
- 34.9. Preprocessor Directives #
  - 34.9.1. Including Files #
  - Note
  - 34.9.2. The define and undef Directives #
  - 34.9.3. ifdef, ifndef, elif, else, and endif Directives #

Several preprocessor directives are available that modify how the ecpg preprocessor parses and processes a file.

To include an external file into your embedded SQL program, use:

The embedded SQL preprocessor will look for a file named filename.h, preprocess it, and include it in the resulting C output. Thus, embedded SQL statements in the included file are handled correctly.

The ecpg preprocessor will search a file at several directories in following order:

But when EXEC SQL INCLUDE "filename" is used, only the current directory is searched.

In each directory, the preprocessor will first look for the file name as given, and if not found will append .h to the file name and try again (unless the specified file name already has that suffix).

Note that EXEC SQL INCLUDE is not the same as:

because this file would not be subject to SQL command preprocessing. Naturally, you can continue to use the C #include directive to include other header files.

The include file name is case-sensitive, even though the rest of the EXEC SQL INCLUDE command follows the normal SQL case-sensitivity rules.

Similar to the directive #define that is known from C, embedded SQL has a similar concept:

So you can define a name:

And you can also define constants:

Use undef to remove a previous definition:

Of course you can continue to use the C versions #define and #undef in your embedded SQL program. The difference is where your defined values get evaluated. If you use EXEC SQL DEFINE then the ecpg preprocessor evaluates the defines and substitutes the values. For example if you write:

then ecpg will already do the substitution and your C compiler will never see any name or identifier MYNUMBER. Note that you cannot use #define for a constant that you are going to use in an embedded SQL query because in this case the embedded SQL precompiler is not able to see this declaration.

If multiple input files are named on the ecpg preprocessor's command line, the effects of EXEC SQL DEFINE and EXEC SQL UNDEF do not carry across files: each file starts with only the symbols defined by -D switches on the command line.

You can use the following directives to compile code sections conditionally:

Checks a name and processes subsequent lines if name has been defined via EXEC SQL define name.

Checks a name and processes subsequent lines if name has not been defined via EXEC SQL define name.

Begins an optional alternative section after an EXEC SQL ifdef name or EXEC SQL ifndef name directive. Any number of elif sections can appear. Lines following an elif will be processed if name has been defined and no previous section of the same ifdef/ifndef...endif construct has been processed.

Begins an optional, final alternative section after an EXEC SQL ifdef name or EXEC SQL ifndef name directive. Subsequent lines will be processed if no previous section of the same ifdef/ifndef...endif construct has been processed.

Ends an ifdef/ifndef...endif construct. Subsequent lines are processed normally.

ifdef/ifndef...endif constructs can be nested, up to 127 levels deep.

This example will compile exactly one of the three SET TIMEZONE commands:

**Examples:**

Example 1 (typescript):
```typescript
EXEC SQL INCLUDE filename;
EXEC SQL INCLUDE <filename>;
EXEC SQL INCLUDE "filename";
```

Example 2 (unknown):
```unknown
/usr/local/include
```

Example 3 (unknown):
```unknown
/usr/local/pgsql/include
```

Example 4 (unknown):
```unknown
/usr/include
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-get-descriptor.html

**Contents:**
- GET DESCRIPTOR
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

GET DESCRIPTOR — get information from an SQL descriptor area

GET DESCRIPTOR retrieves information about a query result set from an SQL descriptor area and stores it into host variables. A descriptor area is typically populated using FETCH or SELECT before using this command to transfer the information into host language variables.

This command has two forms: The first form retrieves descriptor “header” items, which apply to the result set in its entirety. One example is the row count. The second form, which requires the column number as additional parameter, retrieves information about a particular column. Examples are the column name and the actual column value.

A token identifying which header information item to retrieve. Only COUNT, to get the number of columns in the result set, is currently supported.

The number of the column about which information is to be retrieved. The count starts at 1.

A token identifying which item of information about a column to retrieve. See Section 34.7.1 for a list of supported items.

A host variable that will receive the data retrieved from the descriptor area.

An example to retrieve the number of columns in a result set:

An example to retrieve a data length in the first column:

An example to retrieve the data body of the second column as a string:

Here is an example for a whole procedure of executing SELECT current_database(); and showing the number of columns, the column data length, and the column data:

When the example is executed, the result will look like this:

GET DESCRIPTOR is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
descriptor_name
```

Example 2 (unknown):
```unknown
descriptor_header_item
```

Example 3 (unknown):
```unknown
descriptor_name
```

Example 4 (unknown):
```unknown
column_number
```

---


---

