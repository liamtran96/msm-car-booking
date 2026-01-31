# PostgreSQL - Misc (Part 9)

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-function.html

**Contents:**
- dblink
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink — executes a query in a remote database

dblink executes a query (usually a SELECT, but it can be any SQL statement that returns rows) in a remote database.

When two text arguments are given, the first one is first looked up as a persistent connection's name; if found, the command is executed on that connection. If not found, the first argument is treated as a connection info string as for dblink_connect, and the indicated connection is made just for the duration of this command.

Name of the connection to use; omit this parameter to use the unnamed connection.

A connection info string, as previously described for dblink_connect.

The SQL query that you wish to execute in the remote database, for example select * from foo.

If true (the default when omitted) then an error thrown on the remote side of the connection causes an error to also be thrown locally. If false, the remote error is locally reported as a NOTICE, and the function returns no rows.

The function returns the row(s) produced by the query. Since dblink can be used with any query, it is declared to return record, rather than specifying any particular set of columns. This means that you must specify the expected set of columns in the calling query — otherwise PostgreSQL would not know what to expect. Here is an example:

The “alias” part of the FROM clause must specify the column names and types that the function will return. (Specifying column names in an alias is actually standard SQL syntax, but specifying column types is a PostgreSQL extension.) This allows the system to understand what * should expand to, and what proname in the WHERE clause refers to, in advance of trying to execute the function. At run time, an error will be thrown if the actual query result from the remote database does not have the same number of columns shown in the FROM clause. The column names need not match, however, and dblink does not insist on exact type matches either. It will succeed so long as the returned data strings are valid input for the column type declared in the FROM clause.

A convenient way to use dblink with predetermined queries is to create a view. This allows the column type information to be buried in the view, instead of having to spell it out in every query. For example,

**Examples:**

Example 1 (unknown):
```unknown
dblink_connect
```

Example 2 (unknown):
```unknown
dblink_connect
```

Example 3 (sql):
```sql
select * from foo
```

Example 4 (unknown):
```unknown
fail_on_error
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-freeplan.html

**Contents:**
- SPI_freeplan
- Synopsis
- Description
- Arguments
- Return Value

SPI_freeplan — free a previously saved prepared statement

SPI_freeplan releases a prepared statement previously returned by SPI_prepare or saved by SPI_keepplan or SPI_saveplan.

pointer to statement to free

0 on success; SPI_ERROR_ARGUMENT if plan is NULL or invalid

**Examples:**

Example 1 (unknown):
```unknown
SPI_freeplan
```

Example 2 (unknown):
```unknown
SPI_prepare
```

Example 3 (unknown):
```unknown
SPI_keepplan
```

Example 4 (unknown):
```unknown
SPI_saveplan
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-unregister-relation.html

**Contents:**
- SPI_unregister_relation
- Synopsis
- Description
- Arguments
- Return Value

SPI_unregister_relation — remove an ephemeral named relation from the registry

SPI_unregister_relation removes an ephemeral named relation from the registry for the current connection.

the relation registry entry name

If the execution of the command was successful then the following (nonnegative) value will be returned:

if the tuplestore has been successfully removed from the registry

On error, one of the following negative values is returned:

if called from an unconnected C function

if name is not found in the registry for the current connection

**Examples:**

Example 1 (unknown):
```unknown
SPI_unregister_relation
```

Example 2 (unknown):
```unknown
const char * name
```

Example 3 (unknown):
```unknown
SPI_OK_REL_UNREGISTER
```

Example 4 (unknown):
```unknown
SPI_ERROR_ARGUMENT
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-palloc.html

**Contents:**
- SPI_palloc
- Synopsis
- Description
- Arguments
- Return Value

SPI_palloc — allocate memory in the upper executor context

SPI_palloc allocates memory in the upper executor context.

This function can only be used while connected to SPI. Otherwise, it throws an error.

size in bytes of storage to allocate

pointer to new storage space of the specified size

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-commit.html

**Contents:**
- SPI_commit
- Synopsis
- Description

SPI_commit, SPI_commit_and_chain — commit the current transaction

SPI_commit commits the current transaction. It is approximately equivalent to running the SQL command COMMIT. After the transaction is committed, a new transaction is automatically started using default transaction characteristics, so that the caller can continue using SPI facilities. If there is a failure during commit, the current transaction is instead rolled back and a new transaction is started, after which the error is thrown in the usual way.

SPI_commit_and_chain is the same, but the new transaction is started with the same transaction characteristics as the just finished one, like with the SQL command COMMIT AND CHAIN.

These functions can only be executed if the SPI connection has been set as nonatomic in the call to SPI_connect_ext.

**Examples:**

Example 1 (unknown):
```unknown
SPI_commit_and_chain
```

Example 2 (unknown):
```unknown
COMMIT AND CHAIN
```

Example 3 (unknown):
```unknown
SPI_connect_ext
```

---


---

## 2. A Brief History of PostgreSQL #


**URL:** https://www.postgresql.org/docs/18/history.html

**Contents:**
- 2. A Brief History of PostgreSQL #
  - 2.1. The Berkeley POSTGRES Project #
  - 2.2. Postgres95 #
  - 2.3. PostgreSQL #

The object-relational database management system now known as PostgreSQL is derived from the POSTGRES package written at the University of California at Berkeley. With decades of development behind it, PostgreSQL is now the most advanced open-source database available anywhere.

Another take on the history presented here can be found in Dr. Joe Hellerstein's paper “Looking Back at Postgres” [hell18].

The POSTGRES project, led by Professor Michael Stonebraker, was sponsored by the Defense Advanced Research Projects Agency (DARPA), the Army Research Office (ARO), the National Science Foundation (NSF), and ESL, Inc. The implementation of POSTGRES began in 1986. The initial concepts for the system were presented in [ston86], and the definition of the initial data model appeared in [rowe87]. The design of the rule system at that time was described in [ston87a]. The rationale and architecture of the storage manager were detailed in [ston87b].

POSTGRES has undergone several major releases since then. The first “demoware” system became operational in 1987 and was shown at the 1988 ACM-SIGMOD Conference. Version 1, described in [ston90a], was released to a few external users in June 1989. In response to a critique of the first rule system ([ston89]), the rule system was redesigned ([ston90b]), and Version 2 was released in June 1990 with the new rule system. Version 3 appeared in 1991 and added support for multiple storage managers, an improved query executor, and a rewritten rule system. For the most part, subsequent releases until Postgres95 (see below) focused on portability and reliability.

POSTGRES has been used to implement many different research and production applications. These include: a financial data analysis system, a jet engine performance monitoring package, an asteroid tracking database, a medical information database, and several geographic information systems. POSTGRES has also been used as an educational tool at several universities. Finally, Illustra Information Technologies (later merged into Informix, which is now owned by IBM) picked up the code and commercialized it. In late 1992, POSTGRES became the primary data manager for the Sequoia 2000 scientific computing project described in [ston92].

The size of the external user community nearly doubled during 1993. It became increasingly obvious that maintenance of the prototype code and support was taking up large amounts of time that should have been devoted to database research. In an effort to reduce this support burden, the Berkeley POSTGRES project officially ended with Version 4.2.

In 1994, Andrew Yu and Jolly Chen added an SQL language interpreter to POSTGRES. Under a new name, Postgres95 was subsequently released to the web to find its own way in the world as an open-source descendant of the original POSTGRES Berkeley code.

Postgres95 code was completely ANSI C and trimmed in size by 25%. Many internal changes improved performance and maintainability. Postgres95 release 1.0.x ran about 30–50% faster on the Wisconsin Benchmark compared to POSTGRES, Version 4.2. Apart from bug fixes, the following were the major enhancements:

The query language PostQUEL was replaced with SQL (implemented in the server). (Interface library libpq was named after PostQUEL.) Subqueries were not supported until PostgreSQL (see below), but they could be imitated in Postgres95 with user-defined SQL functions. Aggregate functions were re-implemented. Support for the GROUP BY query clause was also added.

A new program (psql) was provided for interactive SQL queries, which used GNU Readline. This largely superseded the old monitor program.

A new front-end library, libpgtcl, supported Tcl-based clients. A sample shell, pgtclsh, provided new Tcl commands to interface Tcl programs with the Postgres95 server.

The large-object interface was overhauled. The inversion large objects were the only mechanism for storing large objects. (The inversion file system was removed.)

The instance-level rule system was removed. Rules were still available as rewrite rules.

A short tutorial introducing regular SQL features as well as those of Postgres95 was distributed with the source code

GNU make (instead of BSD make) was used for the build. Also, Postgres95 could be compiled with an unpatched GCC (data alignment of doubles was fixed).

By 1996, it became clear that the name “Postgres95” would not stand the test of time. We chose a new name, PostgreSQL, to reflect the relationship between the original POSTGRES and the more recent versions with SQL capability. At the same time, we set the version numbering to start at 6.0, putting the numbers back into the sequence originally begun by the Berkeley POSTGRES project.

Postgres is still considered an official project name, both because of tradition and because people find it easier to pronounce Postgres than PostgreSQL.

The emphasis during development of Postgres95 was on identifying and understanding existing problems in the server code. With PostgreSQL, the emphasis has shifted to augmenting features and capabilities, although work continues in all areas.

Details about what has happened in each PostgreSQL release since then can be found at https://www.postgresql.org/docs/release/.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-copytuple.html

**Contents:**
- SPI_copytuple
- Synopsis
- Description
- Arguments
- Return Value

SPI_copytuple — make a copy of a row in the upper executor context

SPI_copytuple makes a copy of a row in the upper executor context. This is normally used to return a modified row from a trigger. In a function declared to return a composite type, use SPI_returntuple instead.

This function can only be used while connected to SPI. Otherwise, it returns NULL and sets SPI_result to SPI_ERROR_UNCONNECTED.

the copied row, or NULL on error (see SPI_result for an error indication)

**Examples:**

Example 1 (unknown):
```unknown
SPI_copytuple
```

Example 2 (unknown):
```unknown
SPI_returntuple
```

Example 3 (unknown):
```unknown
SPI_ERROR_UNCONNECTED
```

Example 4 (unknown):
```unknown
HeapTuple row
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-execp.html

**Contents:**
- SPI_execp
- Synopsis
- Description
- Arguments
- Return Value

SPI_execp — execute a statement in read/write mode

SPI_execp is the same as SPI_execute_plan, with the latter's read_only parameter always taken as false.

prepared statement (returned by SPI_prepare)

An array of actual parameter values. Must have same length as the statement's number of arguments.

An array describing which parameters are null. Must have same length as the statement's number of arguments.

If nulls is NULL then SPI_execp assumes that no parameters are null. Otherwise, each entry of the nulls array should be ' ' if the corresponding parameter value is non-null, or 'n' if the corresponding parameter value is null. (In the latter case, the actual value in the corresponding values entry doesn't matter.) Note that nulls is not a text string, just an array: it does not need a '\0' terminator.

maximum number of rows to return, or 0 for no limit

See SPI_execute_plan.

SPI_processed and SPI_tuptable are set as in SPI_execute if successful.

**Examples:**

Example 1 (unknown):
```unknown
SPI_execute_plan
```

Example 2 (unknown):
```unknown
SPIPlanPtr plan
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
Datum * values
```

---


---

