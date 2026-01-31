# PostgreSQL - Spi

## 45.4. Transaction Management #


**URL:** https://www.postgresql.org/docs/18/spi-transaction.html

**Contents:**
- 45.4. Transaction Management #

It is not possible to run transaction control commands such as COMMIT and ROLLBACK through SPI functions such as SPI_execute. There are, however, separate interface functions that allow transaction control through SPI.

It is not generally safe and sensible to start and end transactions in arbitrary user-defined SQL-callable functions without taking into account the context in which they are called. For example, a transaction boundary in the middle of a function that is part of a complex SQL expression that is part of some SQL command will probably result in obscure internal errors or crashes. The interface functions presented here are primarily intended to be used by procedural language implementations to support transaction management in SQL-level procedures that are invoked by the CALL command, taking the context of the CALL invocation into account. SPI-using procedures implemented in C can implement the same logic, but the details of that are beyond the scope of this documentation.

**Examples:**

Example 1 (unknown):
```unknown
SPI_execute
```

---


---

## 45.2. Interface Support Functions #


**URL:** https://www.postgresql.org/docs/18/spi-interface-support.html

**Contents:**
- 45.2. Interface Support Functions #

The functions described here provide an interface for extracting information from result sets returned by SPI_execute and other SPI functions.

All functions described in this section can be used by both connected and unconnected C functions.

**Examples:**

Example 1 (unknown):
```unknown
SPI_execute
```

---


---

## 45.5. Visibility of Data Changes #


**URL:** https://www.postgresql.org/docs/18/spi-visibility.html

**Contents:**
- 45.5. Visibility of Data Changes #

The following rules govern the visibility of data changes in functions that use SPI (or any other C function):

During the execution of an SQL command, any data changes made by the command are invisible to the command itself. For example, in:

the inserted rows are invisible to the SELECT part.

Changes made by a command C are visible to all commands that are started after C, no matter whether they are started inside C (during the execution of C) or after C is done.

Commands executed via SPI inside a function called by an SQL command (either an ordinary function or a trigger) follow one or the other of the above rules depending on the read/write flag passed to SPI. Commands executed in read-only mode follow the first rule: they cannot see changes of the calling command. Commands executed in read-write mode follow the second rule: they can see all changes made so far.

All standard procedural languages set the SPI read-write mode depending on the volatility attribute of the function. Commands of STABLE and IMMUTABLE functions are done in read-only mode, while commands of VOLATILE functions are done in read-write mode. While authors of C functions are able to violate this convention, it's unlikely to be a good idea to do so.

The next section contains an example that illustrates the application of these rules.

**Examples:**

Example 1 (sql):
```sql
INSERT INTO a SELECT * FROM a;
```

---


---

## 45.6. Examples #


**URL:** https://www.postgresql.org/docs/18/spi-examples.html

**Contents:**
- 45.6. Examples #

This section contains a very simple example of SPI usage. The C function execq takes an SQL command as its first argument and a row count as its second, executes the command using SPI_exec and returns the number of rows that were processed by the command. You can find more complex examples for SPI in the source tree in src/test/regress/regress.c and in the spi module.

This is how you declare the function after having compiled it into a shared library (details are in Section 36.10.5.):

Here is a sample session:

**Examples:**

Example 1 (unknown):
```unknown
src/test/regress/regress.c
```

Example 2 (json):
```json
#include "postgres.h"

#include "executor/spi.h"
#include "utils/builtins.h"

PG_MODULE_MAGIC;

PG_FUNCTION_INFO_V1(execq);

Datum
execq(PG_FUNCTION_ARGS)
{
    char *command;
    int cnt;
    int ret;
    uint64 proc;

    /* Convert given text object to a C string */
    command = text_to_cstring(PG_GETARG_TEXT_PP(0));
    cnt = PG_GETARG_INT32(1);

    SPI_connect();

    ret = SPI_exec(command, cnt);

    proc = SPI_processed;

    /*
     * If some rows were fetched, print them via elog(INFO).
     */
    if (ret > 0 && SPI_tuptable != NULL)
    {
        SPITupleTable *tuptable = SPI_tuptable;
        TupleDesc tupdesc = tuptable->tupdesc;
        char buf[8192];
        uint64 j;

        for (j = 0; j < tuptable->numvals; j++)
        {
            HeapTuple tuple = tuptable->vals[j];
            int i;

            for (i = 1, buf[0] = 0; i <= tupdesc->natts; i++)
                snprintf(buf + strlen(buf), sizeof(buf) - strlen(buf), " %s%s",
                        SPI_getvalue(tuple, tupdesc, i),
                        (i == tupdesc->natts) ? " " : " |");
            elog(INFO, "EXECQ: %s", buf);
        }
    }

    SPI_finish();
    pfree(command);

    PG_RETURN_INT64(proc);
}
```

Example 3 (javascript):
```javascript
CREATE FUNCTION execq(text, integer) RETURNS int8
    AS 'filename'
    LANGUAGE C STRICT;
```

Example 4 (sql):
```sql
=> SELECT execq('CREATE TABLE a (x integer)', 0);
 execq
-------
     0
(1 row)

=> INSERT INTO a VALUES (execq('INSERT INTO a VALUES (0)', 0));
INSERT 0 1
=> SELECT execq('SELECT * FROM a', 0);
INFO:  EXECQ:  0    -- inserted by execq
INFO:  EXECQ:  1    -- returned by execq and inserted by upper INSERT

 execq
-------
     2
(1 row)

=> SELECT execq('INSERT INTO a SELECT x + 2 FROM a RETURNING *', 1);
INFO:  EXECQ:  2    -- 0 + 2, then execution was stopped by count
 execq
-------
     1
(1 row)

=> SELECT execq('SELECT * FROM a', 10);
INFO:  EXECQ:  0
INFO:  EXECQ:  1
INFO:  EXECQ:  2

 execq
-------
     3              -- 10 is the max value only, 3 is the real number of rows
(1 row)

=> SELECT execq('INSERT INTO a SELECT x + 10 FROM a', 1);
 execq
-------
     3              -- all rows processed; count does not stop it, because nothing is returned
(1 row)

=> SELECT * FROM a;
 x
----
  0
  1
  2
 10
 11
 12
(6 rows)

=> DELETE FROM a;
DELETE 6
=> INSERT INTO a VALUES (execq('SELECT * FROM a', 0) + 1);
INSERT 0 1
=> SELECT * FROM a;
 x
---
 1                  -- 0 (no rows in a) + 1
(1 row)

=> INSERT INTO a VALUES (execq('SELECT * FROM a', 0) + 1);
INFO:  EXECQ:  1
INSERT 0 1
=> SELECT * FROM a;
 x
---
 1
 2                  -- 1 (there was one row in a) + 1
(2 rows)

-- This demonstrates the data changes visibility rule.
-- execq is called twice and sees different numbers of rows each time:

=> INSERT INTO a SELECT execq('SELECT * FROM a', 0) * x FROM a;
INFO:  EXECQ:  1    -- results from first execq
INFO:  EXECQ:  2
INFO:  EXECQ:  1    -- results from second execq
INFO:  EXECQ:  2
INFO:  EXECQ:  2
INSERT 0 2
=> SELECT * FROM a;
 x
---
 1
 2
 2                  -- 2 rows * 1 (x in first row)
 6                  -- 3 rows (2 + 1 just inserted) * 2 (x in second row)
(4 rows)
```

---


---

## Chapter 45. Server Programming Interface


**URL:** https://www.postgresql.org/docs/18/spi.html

**Contents:**
- Chapter 45. Server Programming Interface
  - Note

The Server Programming Interface (SPI) gives writers of user-defined C functions the ability to run SQL commands inside their functions or procedures. SPI is a set of interface functions to simplify access to the parser, planner, and executor. SPI also does some memory management.

The available procedural languages provide various means to execute SQL commands from functions. Most of these facilities are based on SPI, so this documentation might be of use for users of those languages as well.

Note that if a command invoked via SPI fails, then control will not be returned to your C function. Rather, the transaction or subtransaction in which your C function executes will be rolled back. (This might seem surprising given that the SPI functions mostly have documented error-return conventions. Those conventions only apply for errors detected within the SPI functions themselves, however.) It is possible to recover control after an error by establishing your own subtransaction surrounding SPI calls that might fail.

SPI functions return a nonnegative result on success (either via a returned integer value or in the global variable SPI_result, as described below). On error, a negative result or NULL will be returned.

Source code files that use SPI must include the header file executor/spi.h.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_prepare
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
SPI_cursor_open
```

---


---

## 45.3. Memory Management #


**URL:** https://www.postgresql.org/docs/18/spi-memory.html

**Contents:**
- 45.3. Memory Management #

PostgreSQL allocates memory within memory contexts, which provide a convenient method of managing allocations made in many different places that need to live for differing amounts of time. Destroying a context releases all the memory that was allocated in it. Thus, it is not necessary to keep track of individual objects to avoid memory leaks; instead only a relatively small number of contexts have to be managed. palloc and related functions allocate memory from the “current” context.

SPI_connect creates a new memory context and makes it current. SPI_finish restores the previous current memory context and destroys the context created by SPI_connect. These actions ensure that transient memory allocations made inside your C function are reclaimed at C function exit, avoiding memory leakage.

However, if your C function needs to return an object in allocated memory (such as a value of a pass-by-reference data type), you cannot allocate that memory using palloc, at least not while you are connected to SPI. If you try, the object will be deallocated by SPI_finish, and your C function will not work reliably. To solve this problem, use SPI_palloc to allocate memory for your return object. SPI_palloc allocates memory in the “upper executor context”, that is, the memory context that was current when SPI_connect was called, which is precisely the right context for a value returned from your C function. Several of the other utility functions described in this section also return objects created in the upper executor context.

When SPI_connect is called, the private context of the C function, which is created by SPI_connect, is made the current context. All allocations made by palloc, repalloc, or SPI utility functions (except as described in this section) are made in this context. When a C function disconnects from the SPI manager (via SPI_finish) the current context is restored to the upper executor context, and all allocations made in the C function memory context are freed and cannot be used any more.

**Examples:**

Example 1 (unknown):
```unknown
SPI_execute
```

Example 2 (unknown):
```unknown
SPI_connect
```

Example 3 (unknown):
```unknown
SPI_connect
```

Example 4 (unknown):
```unknown
SPI_connect
```

---


---

