# PostgreSQL - Ecpg (Part 6)

## 34.15. Informix Compatibility Mode # (continued)

Functions return this value if a parsing routine needs a short date representation but did not get the date string in the right length. Internally it is defined as -1209 (the Informix definition).

Functions return this value if an error occurred during date formatting. Internally it is defined as -1210 (the Informix definition).

Functions return this value if memory was exhausted during their operation. Internally it is defined as -1211 (the Informix definition).

Functions return this value if a parsing routine was supposed to get a format mask (like mmddyy) but not all fields were listed correctly. Internally it is defined as -1212 (the Informix definition).

Functions return this value either if a parsing routine cannot parse the textual representation for a numeric value because it contains errors or if a routine cannot complete a calculation involving numeric variables because at least one of the numeric variables is invalid. Internally it is defined as -1213 (the Informix definition).

Functions return this value if a parsing routine cannot parse an exponent. Internally it is defined as -1216 (the Informix definition).

Functions return this value if a parsing routine cannot parse a date. Internally it is defined as -1218 (the Informix definition).

Functions return this value if a parsing routine is passed extra characters it cannot parse. Internally it is defined as -1264 (the Informix definition).

**Examples:**

Example 1 (sql):
```sql
$int j = 3;
$CONNECT TO :dbname;
$CREATE TABLE test(i INT PRIMARY KEY, j INT);
$INSERT INTO test(i, j) VALUES (7, :j);
$COMMIT;
```

Example 2 (unknown):
```unknown
INFORMIX_SE
```

Example 3 (unknown):
```unknown
YEAR TO MINUTE
```

Example 4 (unknown):
```unknown
typedef sometype string;
```

---


---

## 34.16. Oracle Compatibility Mode #


**URL:** https://www.postgresql.org/docs/18/ecpg-oracle-compat.html

**Contents:**
- 34.16. Oracle Compatibility Mode #

ecpg can be run in a so-called Oracle compatibility mode. If this mode is active, it tries to behave as if it were Oracle Pro*C.

Specifically, this mode changes ecpg in three ways:

Pad character arrays receiving character string types with trailing spaces to the specified length

Zero byte terminate these character arrays, and set the indicator variable if truncation occurs

Set the null indicator to -1 when character arrays receive empty character string types

---


---

## 34.1. The Concept #


**URL:** https://www.postgresql.org/docs/18/ecpg-concept.html

**Contents:**
- 34.1. The Concept #

An embedded SQL program consists of code written in an ordinary programming language, in this case C, mixed with SQL commands in specially marked sections. To build the program, the source code (*.pgc) is first passed through the embedded SQL preprocessor, which converts it to an ordinary C program (*.c), and afterwards it can be processed by a C compiler. (For details about the compiling and linking see Section 34.10.) Converted ECPG applications call functions in the libpq library through the embedded SQL library (ecpglib), and communicate with the PostgreSQL server using the normal frontend-backend protocol.

Embedded SQL has advantages over other methods for handling SQL commands from C code. First, it takes care of the tedious passing of information to and from variables in your C program. Second, the SQL code in the program is checked at build time for syntactical correctness. Third, embedded SQL in C is specified in the SQL standard and supported by many other SQL database systems. The PostgreSQL implementation is designed to match this standard as much as possible, and it is usually possible to port embedded SQL programs written for other SQL databases to PostgreSQL with relative ease.

As already stated, programs written for the embedded SQL interface are normal C programs with special code inserted to perform database-related actions. This special code always has the form:

These statements syntactically take the place of a C statement. Depending on the particular statement, they can appear at the global level or within a function.

Embedded SQL statements follow the case-sensitivity rules of normal SQL code, and not those of C. Also they allow nested C-style comments as per the SQL standard. The C part of the program, however, follows the C standard of not accepting nested comments. Embedded SQL statements likewise use SQL rules, not C rules, for parsing quoted strings and identifiers. (See Section 4.1.2.1 and Section 4.1.1 respectively. Note that ECPG assumes that standard_conforming_strings is on.) Of course, the C part of the program follows C quoting rules.

The following sections explain all the embedded SQL statements.

**Examples:**

Example 1 (unknown):
```unknown
EXEC SQL ...;
```

Example 2 (unknown):
```unknown
standard_conforming_strings
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-type.html

**Contents:**
- TYPE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility

TYPE — define a new data type

The TYPE command defines a new C type. It is equivalent to putting a typedef into a declare section.

This command is only recognized when ecpg is run with the -c option.

The name for the new type. It must be a valid C type name.

A C type specification.

Here is an example program that uses EXEC SQL TYPE:

The output from this program looks like this:

The TYPE command is a PostgreSQL extension.

**Examples:**

Example 1 (swift):
```swift
EXEC SQL TYPE customer IS
    struct
    {
        varchar name[50];
        int     phone;
    };

EXEC SQL TYPE cust_ind IS
    struct ind
    {
        short   name_ind;
        short   phone_ind;
    };

EXEC SQL TYPE c IS char reference;
EXEC SQL TYPE ind IS union { int integer; short smallint; };
EXEC SQL TYPE intarray IS int[AMOUNT];
EXEC SQL TYPE str IS varchar[BUFFERSIZ];
EXEC SQL TYPE string IS char[11];
```

Example 2 (unknown):
```unknown
EXEC SQL TYPE
```

Example 3 (c):
```c
EXEC SQL WHENEVER SQLERROR SQLPRINT;

EXEC SQL TYPE tt IS
    struct
    {
        varchar v[256];
        int     i;
    };

EXEC SQL TYPE tt_ind IS
    struct ind {
        short   v_ind;
        short   i_ind;
    };

int
main(void)
{
EXEC SQL BEGIN DECLARE SECTION;
    tt t;
    tt_ind t_ind;
EXEC SQL END DECLARE SECTION;

    EXEC SQL CONNECT TO testdb AS con1;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;

    EXEC SQL SELECT current_database(), 256 INTO :t:t_ind LIMIT 1;

    printf("t.v = %s\n", t.v.arr);
    printf("t.i = %d\n", t.i);

    printf("t_ind.v_ind = %d\n", t_ind.v_ind);
    printf("t_ind.i_ind = %d\n", t_ind.i_ind);

    EXEC SQL DISCONNECT con1;

    return 0;
}
```

Example 4 (unknown):
```unknown
t.v = testdb
t.i = 256
t_ind.v_ind = 0
t_ind.i_ind = 0
```

---


---

## 34.12. Large Objects #


**URL:** https://www.postgresql.org/docs/18/ecpg-lo.html

**Contents:**
- 34.12. Large Objects #

Large objects are not directly supported by ECPG, but ECPG application can manipulate large objects through the libpq large object functions, obtaining the necessary PGconn object by calling the ECPGget_PGconn() function. (However, use of the ECPGget_PGconn() function and touching PGconn objects directly should be done very carefully and ideally not mixed with other ECPG database access calls.)

For more details about the ECPGget_PGconn(), see Section 34.11. For information about the large object function interface, see Chapter 33.

Large object functions have to be called in a transaction block, so when autocommit is off, BEGIN commands have to be issued explicitly.

Example 34.2 shows an example program that illustrates how to create, write, and read a large object in an ECPG application.

Example 34.2. ECPG Program Accessing Large Objects

**Examples:**

Example 1 (unknown):
```unknown
ECPGget_PGconn()
```

Example 2 (unknown):
```unknown
ECPGget_PGconn()
```

Example 3 (unknown):
```unknown
ECPGget_PGconn()
```

Example 4 (c):
```c
#include <stdio.h>
#include <stdlib.h>
#include <libpq-fe.h>
#include <libpq/libpq-fs.h>

EXEC SQL WHENEVER SQLERROR STOP;

int
main(void)
{
    PGconn     *conn;
    Oid         loid;
    int         fd;
    char        buf[256];
    int         buflen = 256;
    char        buf2[256];
    int         rc;

    memset(buf, 1, buflen);

    EXEC SQL CONNECT TO testdb AS con1;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;

    conn = ECPGget_PGconn("con1");
    printf("conn = %p\n", conn);

    /* create */
    loid = lo_create(conn, 0);
    if (loid &lt; 0)
        printf("lo_create() failed: %s", PQerrorMessage(conn));

    printf("loid = %d\n", loid);

    /* write test */
    fd = lo_open(conn, loid, INV_READ|INV_WRITE);
    if (fd &lt; 0)
        printf("lo_open() failed: %s", PQerrorMessage(conn));

    printf("fd = %d\n", fd);

    rc = lo_write(conn, fd, buf, buflen);
    if (rc &lt; 0)
        printf("lo_write() failed\n");

    rc = lo_close(conn, fd);
    if (rc &lt; 0)
        printf("lo_close() failed: %s", PQerrorMessage(conn));

    /* read test */
    fd = lo_open(conn, loid, INV_READ);
    if (fd &lt; 0)
        printf("lo_open() failed: %s", PQerrorMessage(conn));

    printf("fd = %d\n", fd);

    rc = lo_read(conn, fd, buf2, buflen);
    if (rc &lt; 0)
        printf("lo_read() failed\n");

    rc = lo_close(conn, fd);
    if (rc &lt; 0)
        printf("lo_close() failed: %s", PQerrorMessage(conn));

    /* check */
    rc = memcmp(buf, buf2, buflen);
    printf("memcmp() = %d\n", rc);

    /* cleanup */
    rc = lo_unlink(conn, loid);
    if (rc &lt; 0)
        printf("lo_unlink() failed: %s", PQerrorMessage(conn));

    EXEC SQL COMMIT;
    EXEC SQL DISCONNECT ALL;
    return 0;
}
```

---


---

