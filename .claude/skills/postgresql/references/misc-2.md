# PostgreSQL - Misc (Part 2)

## Bibliography


**URL:** https://www.postgresql.org/docs/18/biblio.html

**Contents:**
- Bibliography
  - SQL Reference Books
  - PostgreSQL-specific Documentation
  - Proceedings and Articles

Selected references and readings for SQL and PostgreSQL.

Some white papers and technical reports from the original POSTGRES development team are available at the University of California, Berkeley, Computer Science Department web site.

[bowman01] The Practical SQL Handbook. Using SQL Variants. Fourth Edition. Judith Bowman, Sandra Emerson, and Marcy Darnovsky. ISBN 0-201-70309-2. Addison-Wesley Professional. 2001.

[date97] A Guide to the SQL Standard. A user's guide to the standard database language SQL. Fourth Edition. C. J. Date and Hugh Darwen. ISBN 0-201-96426-0. Addison-Wesley. 1997.

[date04] An Introduction to Database Systems. Eighth Edition. C. J. Date. ISBN 0-321-19784-4. Addison-Wesley. 2003.

[elma04] Fundamentals of Database Systems. Fourth Edition. Ramez Elmasri and Shamkant Navathe. ISBN 0-321-12226-7. Addison-Wesley. 2003.

[melt93] Understanding the New SQL. A complete guide. Jim Melton and Alan R. Simon. ISBN 1-55860-245-3. Morgan Kaufmann. 1993.

[ull88] Principles of Database and Knowledge-Base Systems. Classical Database Systems. Jeffrey D. Ullman. Volume 1. Computer Science Press. 1988.

[sqltr-19075-6] SQL Technical Report. Part 6: SQL support for JavaScript Object Notation (JSON). First Edition. 2017.

[sim98] Enhancement of the ANSI SQL Implementation of PostgreSQL. Stefan Simkovics. Department of Information Systems, Vienna University of Technology. Vienna, Austria. November 29, 1998.

[yu95] The Postgres95. User Manual. A. Yu and J. Chen. University of California. Berkeley, California. Sept. 5, 1995.

[fong] The design and implementation of the POSTGRES query optimizer. Zelaine Fong. University of California, Berkeley, Computer Science Department.

[berenson95] “A Critique of ANSI SQL Isolation Levels”. H. Berenson, P. Bernstein, J. Gray, J. Melton, E. O'Neil, and P. O'Neil. ACM-SIGMOD Conference on Management of Data, June 1995.

[hell18] “Looking Back at Postgres”. J. Hellerstein. Making Databases Work. ISBN 978-1-947487-19-2. Association for Computing Machinery and Morgan & Claypool. 2018.

[olson93] Partial indexing in POSTGRES: research project. Nels Olson. UCB Engin T7.49.1993 O676. University of California. Berkeley, California. 1993.

[ong90] “A Unified Framework for Version Modeling Using Production Rules in a Database System”. L. Ong and J. Goh. ERL Technical Memorandum M90/33. University of California. Berkeley, California. April, 1990.

[ports12] “Serializable Snapshot Isolation in PostgreSQL”. D. Ports and K. Grittner. VLDB Conference, August 2012.

[rowe87] “The POSTGRES data model”. L. Rowe and M. Stonebraker. VLDB Conference, Sept. 1987.

[seshadri95] “Generalized Partial Indexes”. P. Seshadri and A. Swami. Eleventh International Conference on Data Engineering, 6–10 March 1995. Cat. No.95CH35724. IEEE Computer Society Press. Los Alamitos, California. 1995. 420–7.

[ston86] “The design of POSTGRES”. M. Stonebraker and L. Rowe. ACM-SIGMOD Conference on Management of Data, May 1986.

[ston87a] “The design of the POSTGRES rules system”. M. Stonebraker, E. Hanson, and C. H. Hong. IEEE Conference on Data Engineering, Feb. 1987.

[ston87b] “The design of the POSTGRES storage system”. M. Stonebraker. VLDB Conference, Sept. 1987.

[ston89] “A commentary on the POSTGRES rules system”. M. Stonebraker, M. Hearst, and S. Potamianos. SIGMOD Record 18(3). Sept. 1989.

[ston89b] “The case for partial indexes”. M. Stonebraker. SIGMOD Record 18(4). Dec. 1989. 4–11.

[ston90a] “The implementation of POSTGRES”. M. Stonebraker, L. A. Rowe, and M. Hirohama. Transactions on Knowledge and Data Engineering 2(1). IEEE. March 1990.

[ston90b] “On Rules, Procedures, Caching and Views in Database Systems”. M. Stonebraker, A. Jhingran, J. Goh, and S. Potamianos. ACM-SIGMOD Conference on Management of Data, June 1990.

[ston92] “ An overview of the Sequoia 2000 project ”. M. Stonebraker. Digest of Papers COMPCON Spring 1992. 1992. 383–388.

**Examples:**

Example 1 (unknown):
```unknown
pg_receivexlog
```

Example 2 (unknown):
```unknown
pg_receivewal
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-getrelname.html

**Contents:**
- SPI_getrelname
- Synopsis
- Description
- Arguments
- Return Value

SPI_getrelname — return the name of the specified relation

SPI_getrelname returns a copy of the name of the specified relation. (You can use pfree to release the copy of the name when you don't need it anymore.)

The name of the specified relation.

**Examples:**

Example 1 (unknown):
```unknown
SPI_getrelname
```

Example 2 (unknown):
```unknown
Relation rel
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-modifytuple.html

**Contents:**
- SPI_modifytuple
- Synopsis
- Description
- Arguments
- Return Value

SPI_modifytuple — create a row by replacing selected fields of a given row

SPI_modifytuple creates a new row by substituting new values for selected columns, copying the original row's columns at other positions. The input row is not modified. The new row is returned in the upper executor context.

This function can only be used while connected to SPI. Otherwise, it returns NULL and sets SPI_result to SPI_ERROR_UNCONNECTED.

Used only as the source of the row descriptor for the row. (Passing a relation rather than a row descriptor is a misfeature.)

number of columns to be changed

an array of length ncols, containing the numbers of the columns that are to be changed (column numbers start at 1)

an array of length ncols, containing the new values for the specified columns

an array of length ncols, describing which new values are null

If nulls is NULL then SPI_modifytuple assumes that no new values are null. Otherwise, each entry of the nulls array should be ' ' if the corresponding new value is non-null, or 'n' if the corresponding new value is null. (In the latter case, the actual value in the corresponding values entry doesn't matter.) Note that nulls is not a text string, just an array: it does not need a '\0' terminator.

new row with modifications, allocated in the upper executor context, or NULL on error (see SPI_result for an error indication)

On error, SPI_result is set as follows:

if rel is NULL, or if row is NULL, or if ncols is less than or equal to 0, or if colnum is NULL, or if values is NULL.

if colnum contains an invalid column number (less than or equal to 0 or greater than the number of columns in row)

**Examples:**

Example 1 (unknown):
```unknown
SPI_modifytuple
```

Example 2 (unknown):
```unknown
SPI_ERROR_UNCONNECTED
```

Example 3 (unknown):
```unknown
Relation rel
```

Example 4 (unknown):
```unknown
HeapTuple row
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-rollback.html

**Contents:**
- SPI_rollback
- Synopsis
- Description

SPI_rollback, SPI_rollback_and_chain — abort the current transaction

SPI_rollback rolls back the current transaction. It is approximately equivalent to running the SQL command ROLLBACK. After the transaction is rolled back, a new transaction is automatically started using default transaction characteristics, so that the caller can continue using SPI facilities.

SPI_rollback_and_chain is the same, but the new transaction is started with the same transaction characteristics as the just finished one, like with the SQL command ROLLBACK AND CHAIN.

These functions can only be executed if the SPI connection has been set as nonatomic in the call to SPI_connect_ext.

**Examples:**

Example 1 (unknown):
```unknown
SPI_rollback
```

Example 2 (unknown):
```unknown
SPI_rollback_and_chain
```

Example 3 (unknown):
```unknown
ROLLBACK AND CHAIN
```

Example 4 (unknown):
```unknown
SPI_connect_ext
```

---


---

## 30.3. Configuration #


**URL:** https://www.postgresql.org/docs/18/jit-configuration.html

**Contents:**
- 30.3. Configuration #

The configuration variable jit determines whether JIT compilation is enabled or disabled. If it is enabled, the configuration variables jit_above_cost, jit_inline_above_cost, and jit_optimize_above_cost determine whether JIT compilation is performed for a query, and how much effort is spent doing so.

jit_provider determines which JIT implementation is used. It is rarely required to be changed. See Section 30.4.2.

For development and debugging purposes a few additional configuration parameters exist, as described in Section 19.17.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-execute-with-args.html

**Contents:**
- SPI_execute_with_args
- Synopsis
- Description
- Arguments
- Return Value

SPI_execute_with_args — execute a command with out-of-line parameters

SPI_execute_with_args executes a command that might include references to externally supplied parameters. The command text refers to a parameter as $n, and the call specifies data types and values for each such symbol. read_only and count have the same interpretation as in SPI_execute.

The main advantage of this routine compared to SPI_execute is that data values can be inserted into the command without tedious quoting/escaping, and thus with much less risk of SQL-injection attacks.

Similar results can be achieved with SPI_prepare followed by SPI_execute_plan; however, when using this function the query plan is always customized to the specific parameter values provided. For one-time query execution, this function should be preferred. If the same command is to be executed with many different parameters, either method might be faster, depending on the cost of re-planning versus the benefit of custom plans.

number of input parameters ($1, $2, etc.)

an array of length nargs, containing the OIDs of the data types of the parameters

an array of length nargs, containing the actual parameter values

an array of length nargs, describing which parameters are null

If nulls is NULL then SPI_execute_with_args assumes that no parameters are null. Otherwise, each entry of the nulls array should be ' ' if the corresponding parameter value is non-null, or 'n' if the corresponding parameter value is null. (In the latter case, the actual value in the corresponding values entry doesn't matter.) Note that nulls is not a text string, just an array: it does not need a '\0' terminator.

true for read-only execution

maximum number of rows to return, or 0 for no limit

The return value is the same as for SPI_execute.

SPI_processed and SPI_tuptable are set as in SPI_execute if successful.

**Examples:**

Example 1 (unknown):
```unknown
SPI_execute_with_args
```

Example 2 (unknown):
```unknown
SPI_execute
```

Example 3 (unknown):
```unknown
SPI_execute
```

Example 4 (unknown):
```unknown
SPI_prepare
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-prepare-params.html

**Contents:**
- SPI_prepare_params
- Synopsis
- Description
- Arguments
- Return Value

SPI_prepare_params — prepare a statement, without executing it yet

SPI_prepare_params creates and returns a prepared statement for the specified command, but doesn't execute the command. This function is equivalent to SPI_prepare_cursor, with the addition that the caller can specify parser hook functions to control the parsing of external parameter references.

This function is now deprecated in favor of SPI_prepare_extended.

Parser hook setup function

pass-through argument for parserSetup

integer bit mask of cursor options; zero produces default behavior

SPI_prepare_params has the same return conventions as SPI_prepare.

**Examples:**

Example 1 (unknown):
```unknown
parserSetup
```

Example 2 (unknown):
```unknown
parserSetupArg
```

Example 3 (unknown):
```unknown
cursorOptions
```

Example 4 (unknown):
```unknown
SPI_prepare_params
```

---


---

