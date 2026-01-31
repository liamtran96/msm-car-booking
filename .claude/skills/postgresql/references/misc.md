# PostgreSQL - Misc

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-pfree.html

**Contents:**
- SPI_pfree
- Synopsis
- Description
- Arguments

SPI_pfree — free memory in the upper executor context

SPI_pfree frees memory previously allocated using SPI_palloc or SPI_repalloc.

This function is no longer different from plain pfree. It's kept just for backward compatibility of existing code.

pointer to existing storage to free

**Examples:**

Example 1 (unknown):
```unknown
SPI_repalloc
```

Example 2 (unknown):
```unknown
void * pointer
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-execute-plan-with-paramlist.html

**Contents:**
- SPI_execute_plan_with_paramlist
- Synopsis
- Description
- Arguments
- Return Value

SPI_execute_plan_with_paramlist — execute a statement prepared by SPI_prepare

SPI_execute_plan_with_paramlist executes a statement prepared by SPI_prepare. This function is equivalent to SPI_execute_plan except that information about the parameter values to be passed to the query is presented differently. The ParamListInfo representation can be convenient for passing down values that are already available in that format. It also supports use of dynamic parameter sets via hook functions specified in ParamListInfo.

This function is now deprecated in favor of SPI_execute_plan_extended.

prepared statement (returned by SPI_prepare)

data structure containing parameter types and values; NULL if none

true for read-only execution

maximum number of rows to return, or 0 for no limit

The return value is the same as for SPI_execute_plan.

SPI_processed and SPI_tuptable are set as in SPI_execute_plan if successful.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_execute_plan_with_paramlist
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


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-get-connections.html

**Contents:**
- dblink_get_connections
- Synopsis
- Description
- Return Value
- Examples

dblink_get_connections — returns the names of all open named dblink connections

dblink_get_connections returns an array of the names of all open named dblink connections.

Returns a text array of connection names, or NULL if none.

**Examples:**

Example 1 (unknown):
```unknown
dblink_get_connections
```

Example 2 (sql):
```sql
SELECT dblink_get_connections();
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-get-result.html

**Contents:**
- dblink_get_result
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_get_result — gets an async query result

dblink_get_result collects the results of an asynchronous query previously sent with dblink_send_query. If the query is not already completed, dblink_get_result will wait until it is.

Name of the connection to use.

If true (the default when omitted) then an error thrown on the remote side of the connection causes an error to also be thrown locally. If false, the remote error is locally reported as a NOTICE, and the function returns no rows.

For an async query (that is, an SQL statement returning rows), the function returns the row(s) produced by the query. To use this function, you will need to specify the expected set of columns, as previously discussed for dblink.

For an async command (that is, an SQL statement not returning rows), the function returns a single row with a single text column containing the command's status string. It is still necessary to specify that the result will have a single text column in the calling FROM clause.

This function must be called if dblink_send_query returned 1. It must be called once for each query sent, and one additional time to obtain an empty set result, before the connection can be used again.

When using dblink_send_query and dblink_get_result, dblink fetches the entire remote query result before returning any of it to the local query processor. If the query returns a large number of rows, this can result in transient memory bloat in the local session. It may be better to open such a query as a cursor with dblink_open and then fetch a manageable number of rows at a time. Alternatively, use plain dblink(), which avoids memory bloat by spooling large result sets to disk.

**Examples:**

Example 1 (unknown):
```unknown
dblink_get_result
```

Example 2 (unknown):
```unknown
dblink_send_query
```

Example 3 (unknown):
```unknown
dblink_get_result
```

Example 4 (unknown):
```unknown
fail_on_error
```

---


---

## 3. Conventions #


**URL:** https://www.postgresql.org/docs/18/notation.html

**Contents:**
- 3. Conventions #

The following conventions are used in the synopsis of a command: brackets ([ and ]) indicate optional parts. Braces ({ and }) and vertical lines (|) indicate that you must choose one alternative. Dots (...) mean that the preceding element can be repeated. All other symbols, including parentheses, should be taken literally.

Where it enhances the clarity, SQL commands are preceded by the prompt =>, and shell commands are preceded by the prompt $. Normally, prompts are not shown, though.

An administrator is generally a person who is in charge of installing and running the server. A user could be anyone who is using, or wants to use, any part of the PostgreSQL system. These terms should not be interpreted too narrowly; this book does not have fixed presumptions about system administration procedures.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/legalnotice.html

PostgreSQL Database Management System (also known as Postgres, formerly known as Postgres95)

Portions Copyright © 1996-2025, PostgreSQL Global Development Group

Portions Copyright © 1994, The Regents of the University of California

Permission to use, copy, modify, and distribute this software and its documentation for any purpose, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and this paragraph and the following two paragraphs appear in all copies.

IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE SOFTWARE PROVIDED HEREUNDER IS ON AN “AS-IS” BASIS, AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO PROVIDE MAINTENANCE, SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-cancel-query.html

**Contents:**
- dblink_cancel_query
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_cancel_query — cancels any active query on the named connection

dblink_cancel_query attempts to cancel any query that is in progress on the named connection. Note that this is not certain to succeed (since, for example, the remote query might already have finished). A cancel request simply improves the odds that the query will fail soon. You must still complete the normal query protocol, for example by calling dblink_get_result.

Name of the connection to use.

Returns OK if the cancel request has been sent, or the text of an error message on failure.

**Examples:**

Example 1 (unknown):
```unknown
dblink_cancel_query
```

Example 2 (unknown):
```unknown
dblink_get_result
```

Example 3 (sql):
```sql
SELECT dblink_cancel_query('dtest1');
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-freetupletable.html

**Contents:**
- SPI_freetuptable
- Synopsis
- Description
- Arguments

SPI_freetuptable — free a row set created by SPI_execute or a similar function

SPI_freetuptable frees a row set created by a prior SPI command execution function, such as SPI_execute. Therefore, this function is often called with the global variable SPI_tuptable as argument.

This function is useful if an SPI-using C function needs to execute multiple commands and does not want to keep the results of earlier commands around until it ends. Note that any unfreed row sets will be freed anyway at SPI_finish. Also, if a subtransaction is started and then aborted within execution of an SPI-using C function, SPI automatically frees any row sets created while the subtransaction was running.

Beginning in PostgreSQL 9.3, SPI_freetuptable contains guard logic to protect against duplicate deletion requests for the same row set. In previous releases, duplicate deletions would lead to crashes.

pointer to row set to free, or NULL to do nothing

**Examples:**

Example 1 (unknown):
```unknown
SPI_execute
```

Example 2 (unknown):
```unknown
SPI_freetuptable
```

Example 3 (unknown):
```unknown
SPI_execute
```

Example 4 (unknown):
```unknown
SPI_tuptable
```

---


---

## 30.1. What Is JIT compilation? #


**URL:** https://www.postgresql.org/docs/18/jit-reason.html

**Contents:**
- 30.1. What Is JIT compilation? #
  - 30.1.1. JIT Accelerated Operations #
  - 30.1.2. Inlining #
  - 30.1.3. Optimization #

Just-in-Time (JIT) compilation is the process of turning some form of interpreted program evaluation into a native program, and doing so at run time. For example, instead of using general-purpose code that can evaluate arbitrary SQL expressions to evaluate a particular SQL predicate like WHERE a.col = 3, it is possible to generate a function that is specific to that expression and can be natively executed by the CPU, yielding a speedup.

PostgreSQL has builtin support to perform JIT compilation using LLVM when PostgreSQL is built with --with-llvm.

See src/backend/jit/README for further details.

Currently PostgreSQL's JIT implementation has support for accelerating expression evaluation and tuple deforming. Several other operations could be accelerated in the future.

Expression evaluation is used to evaluate WHERE clauses, target lists, aggregates and projections. It can be accelerated by generating code specific to each case.

Tuple deforming is the process of transforming an on-disk tuple (see Section 66.6.1) into its in-memory representation. It can be accelerated by creating a function specific to the table layout and the number of columns to be extracted.

PostgreSQL is very extensible and allows new data types, functions, operators and other database objects to be defined; see Chapter 36. In fact the built-in objects are implemented using nearly the same mechanisms. This extensibility implies some overhead, for example due to function calls (see Section 36.3). To reduce that overhead, JIT compilation can inline the bodies of small functions into the expressions using them. That allows a significant percentage of the overhead to be optimized away.

LLVM has support for optimizing generated code. Some of the optimizations are cheap enough to be performed whenever JIT is used, while others are only beneficial for longer-running queries. See https://llvm.org/docs/Passes.html#transform-passes for more details about optimizations.

**Examples:**

Example 1 (sql):
```sql
WHERE a.col = 3
```

Example 2 (unknown):
```unknown
--with-llvm
```

Example 3 (unknown):
```unknown
src/backend/jit/README
```

---


---

