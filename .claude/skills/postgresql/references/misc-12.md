# PostgreSQL - Misc (Part 12)

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-keepplan.html

**Contents:**
- SPI_keepplan
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_keepplan — save a prepared statement

SPI_keepplan saves a passed statement (prepared by SPI_prepare) so that it will not be freed by SPI_finish nor by the transaction manager. This gives you the ability to reuse prepared statements in the subsequent invocations of your C function in the current session.

the prepared statement to be saved

0 on success; SPI_ERROR_ARGUMENT if plan is NULL or invalid

The passed-in statement is relocated to permanent storage by means of pointer adjustment (no data copying is required). If you later wish to delete it, use SPI_freeplan on it.

**Examples:**

Example 1 (unknown):
```unknown
SPI_keepplan
```

Example 2 (unknown):
```unknown
SPI_prepare
```

Example 3 (unknown):
```unknown
SPIPlanPtr plan
```

Example 4 (unknown):
```unknown
SPI_ERROR_ARGUMENT
```

---


---

## Chapter 30. Just-in-Time Compilation (JIT)


**URL:** https://www.postgresql.org/docs/18/jit.html

**Contents:**
- Chapter 30. Just-in-Time Compilation (JIT)

This chapter explains what just-in-time compilation is, and how it can be configured in PostgreSQL.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-prepare-extended.html

**Contents:**
- SPI_prepare_extended
- Synopsis
- Description
- Arguments
- Return Value

SPI_prepare_extended — prepare a statement, without executing it yet

SPI_prepare_extended creates and returns a prepared statement for the specified command, but doesn't execute the command. This function is equivalent to SPI_prepare, with the addition that the caller can specify options to control the parsing of external parameter references, as well as other facets of query parsing and planning.

struct containing optional arguments

Callers should always zero out the entire options struct, then fill whichever fields they want to set. This ensures forward compatibility of code, since any fields that are added to the struct in future will be defined to behave backwards-compatibly if they are zero. The currently available options fields are:

Parser hook setup function

pass-through argument for parserSetup

mode for raw parsing; RAW_PARSE_DEFAULT (zero) produces default behavior

integer bit mask of cursor options; zero produces default behavior

SPI_prepare_extended has the same return conventions as SPI_prepare.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare_extended
```

Example 2 (unknown):
```unknown
SPI_prepare
```

Example 3 (unknown):
```unknown
const char * command
```

Example 4 (unknown):
```unknown
const SPIPrepareOptions * options
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-gettypeid.html

**Contents:**
- SPI_gettypeid
- Synopsis
- Description
- Arguments
- Return Value

SPI_gettypeid — return the data type OID of the specified column

SPI_gettypeid returns the OID of the data type of the specified column.

input row description

column number (count starts at 1)

The OID of the data type of the specified column or InvalidOid on error. On error, SPI_result is set to SPI_ERROR_NOATTRIBUTE.

**Examples:**

Example 1 (unknown):
```unknown
SPI_gettypeid
```

Example 2 (unknown):
```unknown
TupleDesc rowdesc
```

Example 3 (unknown):
```unknown
int colnumber
```

Example 4 (unknown):
```unknown
SPI_ERROR_NOATTRIBUTE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-fname.html

**Contents:**
- SPI_fname
- Synopsis
- Description
- Arguments
- Return Value

SPI_fname — determine the column name for the specified column number

SPI_fname returns a copy of the column name of the specified column. (You can use pfree to release the copy of the name when you don't need it anymore.)

input row description

column number (count starts at 1)

The column name; NULL if colnumber is out of range. SPI_result set to SPI_ERROR_NOATTRIBUTE on error.

**Examples:**

Example 1 (unknown):
```unknown
TupleDesc rowdesc
```

Example 2 (unknown):
```unknown
int colnumber
```

Example 3 (unknown):
```unknown
SPI_ERROR_NOATTRIBUTE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-getargcount.html

**Contents:**
- SPI_getargcount
- Synopsis
- Description
- Arguments
- Return Value

SPI_getargcount — return the number of arguments needed by a statement prepared by SPI_prepare

SPI_getargcount returns the number of arguments needed to execute a statement prepared by SPI_prepare.

prepared statement (returned by SPI_prepare)

The count of expected arguments for the plan. If the plan is NULL or invalid, SPI_result is set to SPI_ERROR_ARGUMENT and -1 is returned.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_getargcount
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
SPIPlanPtr plan
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-prepare.html

**Contents:**
- SPI_prepare
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_prepare — prepare a statement, without executing it yet

SPI_prepare creates and returns a prepared statement for the specified command, but doesn't execute the command. The prepared statement can later be executed repeatedly using SPI_execute_plan.

When the same or a similar command is to be executed repeatedly, it is generally advantageous to perform parse analysis only once, and might furthermore be advantageous to re-use an execution plan for the command. SPI_prepare converts a command string into a prepared statement that encapsulates the results of parse analysis. The prepared statement also provides a place for caching an execution plan if it is found that generating a custom plan for each execution is not helpful.

A prepared command can be generalized by writing parameters ($1, $2, etc.) in place of what would be constants in a normal command. The actual values of the parameters are then specified when SPI_execute_plan is called. This allows the prepared command to be used over a wider range of situations than would be possible without parameters.

The statement returned by SPI_prepare can be used only in the current invocation of the C function, since SPI_finish frees memory allocated for such a statement. But the statement can be saved for longer using the functions SPI_keepplan or SPI_saveplan.

number of input parameters ($1, $2, etc.)

pointer to an array containing the OIDs of the data types of the parameters

SPI_prepare returns a non-null pointer to an SPIPlan, which is an opaque struct representing a prepared statement. On error, NULL will be returned, and SPI_result will be set to one of the same error codes used by SPI_execute, except that it is set to SPI_ERROR_ARGUMENT if command is NULL, or if nargs is less than 0, or if nargs is greater than 0 and argtypes is NULL.

If no parameters are defined, a generic plan will be created at the first use of SPI_execute_plan, and used for all subsequent executions as well. If there are parameters, the first few uses of SPI_execute_plan will generate custom plans that are specific to the supplied parameter values. After enough uses of the same prepared statement, SPI_execute_plan will build a generic plan, and if that is not too much more expensive than the custom plans, it will start using the generic plan instead of re-planning each time. If this default behavior is unsuitable, you can alter it by passing the CURSOR_OPT_GENERIC_PLAN or CURSOR_OPT_CUSTOM_PLAN flag to SPI_prepare_cursor, to force use of generic or custom plans respectively.

Although the main point of a prepared statement is to avoid repeated parse analysis and planning of the statement, PostgreSQL will force re-analysis and re-planning of the statement before using it whenever database objects used in the statement have undergone definitional (DDL) changes since the previous use of the prepared statement. Also, if the value of search_path changes from one use to the next, the statement will be re-parsed using the new search_path. (This latter behavior is new as of PostgreSQL 9.3.) See PREPARE for more information about the behavior of prepared statements.

This function should only be called from a connected C function.

SPIPlanPtr is declared as a pointer to an opaque struct type in spi.h. It is unwise to try to access its contents directly, as that makes your code much more likely to break in future revisions of PostgreSQL.

The name SPIPlanPtr is somewhat historical, since the data structure no longer necessarily contains an execution plan.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_execute_plan
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


**URL:** https://www.postgresql.org/docs/18/spi-spi-execute-plan.html

**Contents:**
- SPI_execute_plan
- Synopsis
- Description
- Arguments
- Return Value

SPI_execute_plan — execute a statement prepared by SPI_prepare

SPI_execute_plan executes a statement prepared by SPI_prepare or one of its siblings. read_only and count have the same interpretation as in SPI_execute.

prepared statement (returned by SPI_prepare)

An array of actual parameter values. Must have same length as the statement's number of arguments.

An array describing which parameters are null. Must have same length as the statement's number of arguments.

If nulls is NULL then SPI_execute_plan assumes that no parameters are null. Otherwise, each entry of the nulls array should be ' ' if the corresponding parameter value is non-null, or 'n' if the corresponding parameter value is null. (In the latter case, the actual value in the corresponding values entry doesn't matter.) Note that nulls is not a text string, just an array: it does not need a '\0' terminator.

true for read-only execution

maximum number of rows to return, or 0 for no limit

The return value is the same as for SPI_execute, with the following additional possible error (negative) results:

if plan is NULL or invalid, or count is less than 0

if values is NULL and plan was prepared with some parameters

SPI_processed and SPI_tuptable are set as in SPI_execute if successful.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_execute_plan
```

Example 3 (unknown):
```unknown
SPI_prepare
```

Example 4 (unknown):
```unknown
SPI_execute
```

---


---

