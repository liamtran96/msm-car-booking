# PostgreSQL - Plperl (Part 2)

## 43.8. PL/Perl Under the Hood #


**URL:** https://www.postgresql.org/docs/18/plperl-under-the-hood.html

**Contents:**
- 43.8. PL/Perl Under the Hood #
  - 43.8.1. Configuration #
  - 43.8.2. Limitations and Missing Features #

This section lists configuration parameters that affect PL/Perl.

Specifies Perl code to be executed when a Perl interpreter is first initialized, before it is specialized for use by plperl or plperlu. The SPI functions are not available when this code is executed. If the code fails with an error it will abort the initialization of the interpreter and propagate out to the calling query, causing the current transaction or subtransaction to be aborted.

The Perl code is limited to a single string. Longer code can be placed into a module and loaded by the on_init string. Examples:

Any modules loaded by plperl.on_init, either directly or indirectly, will be available for use by plperl. This may create a security risk. To see what modules have been loaded you can use:

Initialization will happen in the postmaster if the plperl library is included in shared_preload_libraries, in which case extra consideration should be given to the risk of destabilizing the postmaster. The principal reason for making use of this feature is that Perl modules loaded by plperl.on_init need be loaded only at postmaster start, and will be instantly available without loading overhead in individual database sessions. However, keep in mind that the overhead is avoided only for the first Perl interpreter used by a database session — either PL/PerlU, or PL/Perl for the first SQL role that calls a PL/Perl function. Any additional Perl interpreters created in a database session will have to execute plperl.on_init afresh. Also, on Windows there will be no savings whatsoever from preloading, since the Perl interpreter created in the postmaster process does not propagate to child processes.

This parameter can only be set in the postgresql.conf file or on the server command line.

These parameters specify Perl code to be executed when a Perl interpreter is specialized for plperl or plperlu respectively. This will happen when a PL/Perl or PL/PerlU function is first executed in a database session, or when an additional interpreter has to be created because the other language is called or a PL/Perl function is called by a new SQL role. This follows any initialization done by plperl.on_init. The SPI functions are not available when this code is executed. The Perl code in plperl.on_plperl_init is executed after “locking down” the interpreter, and thus it can only perform trusted operations.

If the code fails with an error it will abort the initialization and propagate out to the calling query, causing the current transaction or subtransaction to be aborted. Any actions already done within Perl won't be undone; however, that interpreter won't be used again. If the language is used again the initialization will be attempted again within a fresh Perl interpreter.

Only superusers can change these settings. Although these settings can be changed within a session, such changes will not affect Perl interpreters that have already been used to execute functions.

When set true subsequent compilations of PL/Perl functions will have the strict pragma enabled. This parameter does not affect functions already compiled in the current session.

The following features are currently missing from PL/Perl, but they would make welcome contributions.

PL/Perl functions cannot call each other directly.

SPI is not yet fully implemented.

If you are fetching very large data sets using spi_exec_query, you should be aware that these will all go into memory. You can avoid this by using spi_query/spi_fetchrow as illustrated earlier.

A similar problem occurs if a set-returning function passes a large set of rows back to PostgreSQL via return. You can avoid this problem too by instead using return_next for each row returned, as shown previously.

When a session ends normally, not due to a fatal error, any END blocks that have been defined are executed. Currently no other actions are performed. Specifically, file handles are not automatically flushed and objects are not automatically destroyed.

**Examples:**

Example 1 (unknown):
```unknown
plperl.on_init
```

Example 2 (rust):
```rust
plperl.on_init = 'require "plperlinit.pl"'
plperl.on_init = 'use lib "/my/app"; use MyApp::PgInit;'
```

Example 3 (unknown):
```unknown
plperl.on_init
```

Example 4 (sql):
```sql
DO 'elog(WARNING, join ", ", sort keys %INC)' LANGUAGE plperl;
```

---


---

## 43.2. Data Values in PL/Perl #


**URL:** https://www.postgresql.org/docs/18/plperl-data.html

**Contents:**
- 43.2. Data Values in PL/Perl #

The argument values supplied to a PL/Perl function's code are simply the input arguments converted to text form (just as if they had been displayed by a SELECT statement). Conversely, the return and return_next commands will accept any string that is acceptable input format for the function's declared return type.

If this behavior is inconvenient for a particular case, it can be improved by using a transform, as already illustrated for bool values. Several examples of transform modules are included in the PostgreSQL distribution.

**Examples:**

Example 1 (unknown):
```unknown
return_next
```

---


---

## 43.3. Built-in Functions #


**URL:** https://www.postgresql.org/docs/18/plperl-builtins.html

**Contents:**
- 43.3. Built-in Functions #
  - 43.3.1. Database Access from PL/Perl #
  - 43.3.2. Utility Functions in PL/Perl #

Access to the database itself from your Perl function can be done via the following functions:

spi_exec_query executes an SQL command and returns the entire row set as a reference to an array of hash references. If limit is specified and is greater than zero, then spi_exec_query retrieves at most limit rows, much as if the query included a LIMIT clause. Omitting limit or specifying it as zero results in no row limit.

You should only use this command when you know that the result set will be relatively small. Here is an example of a query (SELECT command) with the optional maximum number of rows:

This returns up to 5 rows from the table my_table. If my_table has a column my_column, you can get that value from row $i of the result like this:

The total number of rows returned from a SELECT query can be accessed like this:

Here is an example using a different command type:

You can then access the command status (e.g., SPI_OK_INSERT) like this:

To get the number of rows affected, do:

Here is a complete example:

spi_query and spi_fetchrow work together as a pair for row sets which might be large, or for cases where you wish to return rows as they arrive. spi_fetchrow works only with spi_query. The following example illustrates how you use them together:

Normally, spi_fetchrow should be repeated until it returns undef, indicating that there are no more rows to read. The cursor returned by spi_query is automatically freed when spi_fetchrow returns undef. If you do not wish to read all the rows, instead call spi_cursor_close to free the cursor. Failure to do so will result in memory leaks.

spi_prepare, spi_query_prepared, spi_exec_prepared, and spi_freeplan implement the same functionality but for prepared queries. spi_prepare accepts a query string with numbered argument placeholders ($1, $2, etc.) and a string list of argument types:

Once a query plan is prepared by a call to spi_prepare, the plan can be used instead of the string query, either in spi_exec_prepared, where the result is the same as returned by spi_exec_query, or in spi_query_prepared which returns a cursor exactly as spi_query does, which can be later passed to spi_fetchrow. The optional second parameter to spi_exec_prepared is a hash reference of attributes; the only attribute currently supported is limit, which sets the maximum number of rows returned from the query. Omitting limit or specifying it as zero results in no row limit.

The advantage of prepared queries is that is it possible to use one prepared plan for more than one query execution. After the plan is not needed anymore, it can be freed with spi_freeplan:

Note that the parameter subscript in spi_prepare is defined via $1, $2, $3, etc., so avoid declaring query strings in double quotes that might easily lead to hard-to-catch bugs.

Another example illustrates usage of an optional parameter in spi_exec_prepared:

Commit or roll back the current transaction. This can only be called in a procedure or anonymous code block (DO command) called from the top level. (Note that it is not possible to run the SQL commands COMMIT or ROLLBACK via spi_exec_query or similar. It has to be done using these functions.) After a transaction is ended, a new transaction is automatically started, so there is no separate function for that.

Emit a log or error message. Possible levels are DEBUG, LOG, INFO, NOTICE, WARNING, and ERROR. ERROR raises an error condition; if this is not trapped by the surrounding Perl code, the error propagates out to the calling query, causing the current transaction or subtransaction to be aborted. This is effectively the same as the Perl die command. The other levels only generate messages of different priority levels. Whether messages of a particular priority are reported to the client, written to the server log, or both is controlled by the log_min_messages and client_min_messages configuration variables. See Chapter 19 for more information.

Return the given string suitably quoted to be used as a string literal in an SQL statement string. Embedded single-quotes and backslashes are properly doubled. Note that quote_literal returns undef on undef input; if the argument might be undef, quote_nullable is often more suitable.

Return the given string suitably quoted to be used as a string literal in an SQL statement string; or, if the argument is undef, return the unquoted string "NULL". Embedded single-quotes and backslashes are properly doubled.

Return the given string suitably quoted to be used as an identifier in an SQL statement string. Quotes are added only if necessary (i.e., if the string contains non-identifier characters or would be case-folded). Embedded quotes are properly doubled.

Return the unescaped binary data represented by the contents of the given string, which should be bytea encoded.

Return the bytea encoded form of the binary data contents of the given string.

Returns the contents of the referenced array as a string in array literal format (see Section 8.15.2). Returns the argument value unaltered if it's not a reference to an array. The delimiter used between elements of the array literal defaults to ", " if a delimiter is not specified or is undef.

Converts a Perl variable to the value of the data type passed as a second argument and returns a string representation of this value. Correctly handles nested arrays and values of composite types.

Returns the contents of the referenced array as a string in array constructor format (see Section 4.2.12). Individual values are quoted using quote_nullable. Returns the argument value, quoted using quote_nullable, if it's not a reference to an array.

Returns a true value if the content of the given string looks like a number, according to Perl, returns false otherwise. Returns undef if the argument is undef. Leading and trailing space is ignored. Inf and Infinity are regarded as numbers.

Returns a true value if the given argument may be treated as an array reference, that is, if ref of the argument is ARRAY or PostgreSQL::InServer::ARRAY. Returns false otherwise.

**Examples:**

Example 1 (unknown):
```unknown
spi_exec_query(query [, limit])
```

Example 2 (unknown):
```unknown
spi_exec_query
```

Example 3 (unknown):
```unknown
spi_exec_query
```

Example 4 (unknown):
```unknown
spi_exec_query
```

---


---

