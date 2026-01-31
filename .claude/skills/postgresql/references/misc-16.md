# PostgreSQL - Misc (Part 16)

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-prepare-cursor.html

**Contents:**
- SPI_prepare_cursor
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_prepare_cursor — prepare a statement, without executing it yet

SPI_prepare_cursor is identical to SPI_prepare, except that it also allows specification of the planner's “cursor options” parameter. This is a bit mask having the values shown in nodes/parsenodes.h for the options field of DeclareCursorStmt. SPI_prepare always takes the cursor options as zero.

This function is now deprecated in favor of SPI_prepare_extended.

number of input parameters ($1, $2, etc.)

pointer to an array containing the OIDs of the data types of the parameters

integer bit mask of cursor options; zero produces default behavior

SPI_prepare_cursor has the same return conventions as SPI_prepare.

Useful bits to set in cursorOptions include CURSOR_OPT_SCROLL, CURSOR_OPT_NO_SCROLL, CURSOR_OPT_FAST_PLAN, CURSOR_OPT_GENERIC_PLAN, and CURSOR_OPT_CUSTOM_PLAN. Note in particular that CURSOR_OPT_HOLD is ignored.

**Examples:**

Example 1 (unknown):
```unknown
cursorOptions
```

Example 2 (unknown):
```unknown
SPI_prepare_cursor
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
nodes/parsenodes.h
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-build-sql-insert.html

**Contents:**
- dblink_build_sql_insert
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_build_sql_insert — builds an INSERT statement using a local tuple, replacing the primary key field values with alternative supplied values

dblink_build_sql_insert can be useful in doing selective replication of a local table to a remote database. It selects a row from the local table based on primary key, and then builds an SQL INSERT command that will duplicate that row, but with the primary key values replaced by the values in the last argument. (To make an exact copy of the row, just specify the same values for the last two arguments.)

Name of a local relation, for example foo or myschema.mytab. Include double quotes if the name is mixed-case or contains special characters, for example "FooBar"; without quotes, the string will be folded to lower case.

Attribute numbers (1-based) of the primary key fields, for example 1 2.

The number of primary key fields.

Values of the primary key fields to be used to look up the local tuple. Each field is represented in text form. An error is thrown if there is no local row with these primary key values.

Values of the primary key fields to be placed in the resulting INSERT command. Each field is represented in text form.

Returns the requested SQL statement as text.

As of PostgreSQL 9.0, the attribute numbers in primary_key_attnums are interpreted as logical column numbers, corresponding to the column's position in SELECT * FROM relname. Previous versions interpreted the numbers as physical column positions. There is a difference if any column(s) to the left of the indicated column have been dropped during the lifetime of the table.

**Examples:**

Example 1 (unknown):
```unknown
dblink_build_sql_insert
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


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-fetch.html

**Contents:**
- dblink_fetch
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_fetch — returns rows from an open cursor in a remote database

dblink_fetch fetches rows from a cursor previously established by dblink_open.

Name of the connection to use; omit this parameter to use the unnamed connection.

The name of the cursor to fetch from.

The maximum number of rows to retrieve. The next howmany rows are fetched, starting at the current cursor position, moving forward. Once the cursor has reached its end, no more rows are produced.

If true (the default when omitted) then an error thrown on the remote side of the connection causes an error to also be thrown locally. If false, the remote error is locally reported as a NOTICE, and the function returns no rows.

The function returns the row(s) fetched from the cursor. To use this function, you will need to specify the expected set of columns, as previously discussed for dblink.

On a mismatch between the number of return columns specified in the FROM clause, and the actual number of columns returned by the remote cursor, an error will be thrown. In this event, the remote cursor is still advanced by as many rows as it would have been if the error had not occurred. The same is true for any other error occurring in the local query after the remote FETCH has been done.

**Examples:**

Example 1 (unknown):
```unknown
dblink_fetch
```

Example 2 (unknown):
```unknown
dblink_open
```

Example 3 (unknown):
```unknown
fail_on_error
```

Example 4 (sql):
```sql
SELECT dblink_connect('dbname=postgres options=-csearch_path=');
 dblink_connect
----------------
 OK
(1 row)

SELECT dblink_open('foo', 'select proname, prosrc from pg_proc where proname like ''bytea%''');
 dblink_open
-------------
 OK
(1 row)

SELECT * FROM dblink_fetch('foo', 5) AS (funcname name, source text);
 funcname |  source
----------+----------
 byteacat | byteacat
 byteacmp | byteacmp
 byteaeq  | byteaeq
 byteage  | byteage
 byteagt  | byteagt
(5 rows)

SELECT * FROM dblink_fetch('foo', 5) AS (funcname name, source text);
 funcname  |  source
-----------+-----------
 byteain   | byteain
 byteale   | byteale
 bytealike | bytealike
 bytealt   | bytealt
 byteane   | byteane
(5 rows)

SELECT * FROM dblink_fetch('foo', 5) AS (funcname name, source text);
  funcname  |   source
------------+------------
 byteanlike | byteanlike
 byteaout   | byteaout
(2 rows)

SELECT * FROM dblink_fetch('foo', 5) AS (funcname name, source text);
 funcname | source
----------+--------
(0 rows)
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-cursor-open.html

**Contents:**
- SPI_cursor_open
- Synopsis
- Description
- Arguments
- Return Value

SPI_cursor_open — set up a cursor using a statement created with SPI_prepare

SPI_cursor_open sets up a cursor (internally, a portal) that will execute a statement prepared by SPI_prepare. The parameters have the same meanings as the corresponding parameters to SPI_execute_plan.

Using a cursor instead of executing the statement directly has two benefits. First, the result rows can be retrieved a few at a time, avoiding memory overrun for queries that return many rows. Second, a portal can outlive the current C function (it can, in fact, live to the end of the current transaction). Returning the portal name to the C function's caller provides a way of returning a row set as result.

The passed-in parameter data will be copied into the cursor's portal, so it can be freed while the cursor still exists.

name for portal, or NULL to let the system select a name

prepared statement (returned by SPI_prepare)

An array of actual parameter values. Must have same length as the statement's number of arguments.

An array describing which parameters are null. Must have same length as the statement's number of arguments.

If nulls is NULL then SPI_cursor_open assumes that no parameters are null. Otherwise, each entry of the nulls array should be ' ' if the corresponding parameter value is non-null, or 'n' if the corresponding parameter value is null. (In the latter case, the actual value in the corresponding values entry doesn't matter.) Note that nulls is not a text string, just an array: it does not need a '\0' terminator.

true for read-only execution

Pointer to portal containing the cursor. Note there is no error return convention; any error will be reported via elog.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_cursor_open
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
SPI_execute_plan
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-open.html

**Contents:**
- dblink_open
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_open — opens a cursor in a remote database

dblink_open() opens a cursor in a remote database. The cursor can subsequently be manipulated with dblink_fetch() and dblink_close().

Name of the connection to use; omit this parameter to use the unnamed connection.

The name to assign to this cursor.

The SELECT statement that you wish to execute in the remote database, for example select * from pg_class.

If true (the default when omitted) then an error thrown on the remote side of the connection causes an error to also be thrown locally. If false, the remote error is locally reported as a NOTICE, and the function's return value is set to ERROR.

Returns status, either OK or ERROR.

Since a cursor can only persist within a transaction, dblink_open starts an explicit transaction block (BEGIN) on the remote side, if the remote side was not already within a transaction. This transaction will be closed again when the matching dblink_close is executed. Note that if you use dblink_exec to change data between dblink_open and dblink_close, and then an error occurs or you use dblink_disconnect before dblink_close, your change will be lost because the transaction will be aborted.

**Examples:**

Example 1 (unknown):
```unknown
dblink_open()
```

Example 2 (unknown):
```unknown
dblink_fetch()
```

Example 3 (unknown):
```unknown
dblink_close()
```

Example 4 (sql):
```sql
select * from pg_class
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-cursor-fetch.html

**Contents:**
- SPI_cursor_fetch
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_cursor_fetch — fetch some rows from a cursor

SPI_cursor_fetch fetches some rows from a cursor. This is equivalent to a subset of the SQL command FETCH (see SPI_scroll_cursor_fetch for more functionality).

portal containing the cursor

true for fetch forward, false for fetch backward

maximum number of rows to fetch

SPI_processed and SPI_tuptable are set as in SPI_execute if successful.

Fetching backward may fail if the cursor's plan was not created with the CURSOR_OPT_SCROLL option.

**Examples:**

Example 1 (unknown):
```unknown
SPI_cursor_fetch
```

Example 2 (unknown):
```unknown
SPI_scroll_cursor_fetch
```

Example 3 (unknown):
```unknown
Portal portal
```

Example 4 (unknown):
```unknown
bool forward
```

---


---

