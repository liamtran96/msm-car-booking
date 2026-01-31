# PostgreSQL - Ecpg (Part 2)

## 34.17. Internals #


**URL:** https://www.postgresql.org/docs/18/ecpg-develop.html

**Contents:**
- 34.17. Internals #

This section explains how ECPG works internally. This information can occasionally be useful to help users understand how to use ECPG.

The first four lines written by ecpg to the output are fixed lines. Two are comments and two are include lines necessary to interface to the library. Then the preprocessor reads through the file and writes output. Normally it just echoes everything to the output.

When it sees an EXEC SQL statement, it intervenes and changes it. The command starts with EXEC SQL and ends with ;. Everything in between is treated as an SQL statement and parsed for variable substitution.

Variable substitution occurs when a symbol starts with a colon (:). The variable with that name is looked up among the variables that were previously declared within a EXEC SQL DECLARE section.

The most important function in the library is ECPGdo, which takes care of executing most commands. It takes a variable number of arguments. This can easily add up to 50 or so arguments, and we hope this will not be a problem on any platform.

This is the line number of the original line; used in error messages only.

This is the SQL command that is to be issued. It is modified by the input variables, i.e., the variables that where not known at compile time but are to be entered in the command. Where the variables should go the string contains ?.

Every input variable causes ten arguments to be created. (See below.)

An enum telling that there are no more input variables.

Every output variable causes ten arguments to be created. (See below.) These variables are filled by the function.

An enum telling that there are no more variables.

For every variable that is part of the SQL command, the function gets ten arguments:

The type as a special symbol.

A pointer to the value or a pointer to the pointer.

The size of the variable if it is a char or varchar.

The number of elements in the array (for array fetches).

The offset to the next element in the array (for array fetches).

The type of the indicator variable as a special symbol.

A pointer to the indicator variable.

The number of elements in the indicator array (for array fetches).

The offset to the next element in the indicator array (for array fetches).

Note that not all SQL commands are treated in this way. For instance, an open cursor statement like:

is not copied to the output. Instead, the cursor's DECLARE command is used at the position of the OPEN command because it indeed opens the cursor.

Here is a complete example describing the output of the preprocessor of a file foo.pgc (details might change with each particular version of the preprocessor):

(The indentation here is added for readability and not something the preprocessor does.)

**Examples:**

Example 1 (unknown):
```unknown
EXEC SQL DECLARE
```

Example 2 (unknown):
```unknown
EXEC SQL OPEN cursor;
```

Example 3 (sql):
```sql
EXEC SQL BEGIN DECLARE SECTION;
int index;
int result;
EXEC SQL END DECLARE SECTION;
...
EXEC SQL SELECT res INTO :result FROM mytable WHERE index = :index;
```

Example 4 (sql):
```sql
/* Processed by ecpg (2.6.0) */
/* These two include files are added by the preprocessor */
#include <ecpgtype.h>;
#include <ecpglib.h>;

/* exec sql begin declare section */

#line 1 "foo.pgc"

 int index;
 int result;
/* exec sql end declare section */
...
ECPGdo(__LINE__, NULL, "SELECT res FROM mytable WHERE index = ?     ",
        ECPGt_int,&(index),1L,1L,sizeof(int),
        ECPGt_NO_INDICATOR, NULL , 0L, 0L, 0L, ECPGt_EOIT,
        ECPGt_int,&(result),1L,1L,sizeof(int),
        ECPGt_NO_INDICATOR, NULL , 0L, 0L, 0L, ECPGt_EORT);
#line 147 "foo.pgc"
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-describe.html

**Contents:**
- DESCRIBE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DESCRIBE — obtain information about a prepared statement or result set

DESCRIBE retrieves metadata information about the result columns contained in a prepared statement, without actually fetching a row.

The name of a prepared statement. This can be an SQL identifier or a host variable.

A descriptor name. It is case sensitive. It can be an SQL identifier or a host variable.

The name of an SQLDA variable.

DESCRIBE is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
prepared_name
```

Example 2 (unknown):
```unknown
descriptor_name
```

Example 3 (unknown):
```unknown
prepared_name
```

Example 4 (unknown):
```unknown
descriptor_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-open.html

**Contents:**
- OPEN
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

OPEN — open a dynamic cursor

OPEN opens a cursor and optionally binds actual values to the placeholders in the cursor's declaration. The cursor must previously have been declared with the DECLARE command. The execution of OPEN causes the query to start executing on the server.

The name of the cursor to be opened. This can be an SQL identifier or a host variable.

A value to be bound to a placeholder in the cursor. This can be an SQL constant, a host variable, or a host variable with indicator.

The name of a descriptor containing values to be bound to the placeholders in the cursor. This can be an SQL identifier or a host variable.

OPEN is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
cursor_name
```

Example 2 (unknown):
```unknown
cursor_name
```

Example 3 (unknown):
```unknown
cursor_name
```

Example 4 (unknown):
```unknown
descriptor_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-disconnect.html

**Contents:**
- DISCONNECT
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DISCONNECT — terminate a database connection

DISCONNECT closes a connection (or all connections) to the database.

A database connection name established by the CONNECT command.

Close the “current” connection, which is either the most recently opened connection, or the connection set by the SET CONNECTION command. This is also the default if no argument is given to the DISCONNECT command.

Close all open connections.

DISCONNECT is specified in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
connection_name
```

Example 2 (unknown):
```unknown
connection_name
```

Example 3 (unknown):
```unknown
SET CONNECTION
```

Example 4 (cpp):
```cpp
int
main(void)
{
    EXEC SQL CONNECT TO testdb AS con1 USER testuser;
    EXEC SQL CONNECT TO testdb AS con2 USER testuser;
    EXEC SQL CONNECT TO testdb AS con3 USER testuser;

    EXEC SQL DISCONNECT CURRENT;  /* close con3          */
    EXEC SQL DISCONNECT ALL;      /* close con2 and con1 */

    return 0;
}
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-set-descriptor.html

**Contents:**
- SET DESCRIPTOR
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

SET DESCRIPTOR — set information in an SQL descriptor area

SET DESCRIPTOR populates an SQL descriptor area with values. The descriptor area is then typically used to bind parameters in a prepared query execution.

This command has two forms: The first form applies to the descriptor “header”, which is independent of a particular datum. The second form assigns values to particular datums, identified by number.

A token identifying which header information item to set. Only COUNT, to set the number of descriptor items, is currently supported.

The number of the descriptor item to set. The count starts at 1.

A token identifying which item of information to set in the descriptor. See Section 34.7.1 for a list of supported items.

A value to store into the descriptor item. This can be an SQL constant or a host variable.

SET DESCRIPTOR is specified in the SQL standard.

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
descriptor_item
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-declare-statement.html

**Contents:**
- DECLARE STATEMENT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

DECLARE STATEMENT — declare SQL statement identifier

DECLARE STATEMENT declares an SQL statement identifier. SQL statement identifier can be associated with the connection. When the identifier is used by dynamic SQL statements, the statements are executed using the associated connection. The namespace of the declaration is the precompile unit, and multiple declarations to the same SQL statement identifier are not allowed. Note that if the precompiler runs in Informix compatibility mode and some SQL statement is declared, "database" can not be used as a cursor name.

A database connection name established by the CONNECT command.

AT clause can be omitted, but such statement has no meaning.

The name of an SQL statement identifier, either as an SQL identifier or a host variable.

This association is valid only if the declaration is physically placed on top of a dynamic statement.

DECLARE STATEMENT is an extension of the SQL standard, but can be used in famous DBMSs.

**Examples:**

Example 1 (unknown):
```unknown
connection_name
```

Example 2 (unknown):
```unknown
statement_name
```

Example 3 (unknown):
```unknown
DECLARE STATEMENT
```

Example 4 (unknown):
```unknown
connection_name
```

---


---

