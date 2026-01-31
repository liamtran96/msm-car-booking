# PostgreSQL - Ecpg (Part 8)

## 34.8. Error Handling #


**URL:** https://www.postgresql.org/docs/18/ecpg-errors.html

**Contents:**
- 34.8. Error Handling #
  - 34.8.1. Setting Callbacks #
  - 34.8.2. sqlca #
  - 34.8.3. SQLSTATE vs. SQLCODE #

This section describes how you can handle exceptional conditions and warnings in an embedded SQL program. There are two nonexclusive facilities for this.

One simple method to catch errors and warnings is to set a specific action to be executed whenever a particular condition occurs. In general:

condition can be one of the following:

The specified action is called whenever an error occurs during the execution of an SQL statement.

The specified action is called whenever a warning occurs during the execution of an SQL statement.

The specified action is called whenever an SQL statement retrieves or affects zero rows. (This condition is not an error, but you might be interested in handling it specially.)

action can be one of the following:

This effectively means that the condition is ignored. This is the default.

Jump to the specified label (using a C goto statement).

Print a message to standard error. This is useful for simple programs or during prototyping. The details of the message cannot be configured.

Call exit(1), which will terminate the program.

Execute the C statement break. This should only be used in loops or switch statements.

Execute the C statement continue. This should only be used in loops statements. if executed, will cause the flow of control to return to the top of the loop.

Call the specified C functions with the specified arguments. (This use is different from the meaning of CALL and DO in the normal PostgreSQL grammar.)

The SQL standard only provides for the actions CONTINUE and GOTO (and GO TO).

Here is an example that you might want to use in a simple program. It prints a simple message when a warning occurs and aborts the program when an error happens:

The statement EXEC SQL WHENEVER is a directive of the SQL preprocessor, not a C statement. The error or warning actions that it sets apply to all embedded SQL statements that appear below the point where the handler is set, unless a different action was set for the same condition between the first EXEC SQL WHENEVER and the SQL statement causing the condition, regardless of the flow of control in the C program. So neither of the two following C program excerpts will have the desired effect:

For more powerful error handling, the embedded SQL interface provides a global variable with the name sqlca (SQL communication area) that has the following structure:

(In a multithreaded program, every thread automatically gets its own copy of sqlca. This works similarly to the handling of the standard C global variable errno.)

sqlca covers both warnings and errors. If multiple warnings or errors occur during the execution of a statement, then sqlca will only contain information about the last one.

If no error occurred in the last SQL statement, sqlca.sqlcode will be 0 and sqlca.sqlstate will be "00000". If a warning or error occurred, then sqlca.sqlcode will be negative and sqlca.sqlstate will be different from "00000". A positive sqlca.sqlcode indicates a harmless condition, such as that the last query returned zero rows. sqlcode and sqlstate are two different error code schemes; details appear below.

If the last SQL statement was successful, then sqlca.sqlerrd[1] contains the OID of the processed row, if applicable, and sqlca.sqlerrd[2] contains the number of processed or returned rows, if applicable to the command.

In case of an error or warning, sqlca.sqlerrm.sqlerrmc will contain a string that describes the error. The field sqlca.sqlerrm.sqlerrml contains the length of the error message that is stored in sqlca.sqlerrm.sqlerrmc (the result of strlen(), not really interesting for a C programmer). Note that some messages are too long to fit in the fixed-size sqlerrmc array; they will be truncated.

In case of a warning, sqlca.sqlwarn[2] is set to W. (In all other cases, it is set to something different from W.) If sqlca.sqlwarn[1] is set to W, then a value was truncated when it was stored in a host variable. sqlca.sqlwarn[0] is set to W if any of the other elements are set to indicate a warning.

The fields sqlcaid, sqlabc, sqlerrp, and the remaining elements of sqlerrd and sqlwarn currently contain no useful information.

The structure sqlca is not defined in the SQL standard, but is implemented in several other SQL database systems. The definitions are similar at the core, but if you want to write portable applications, then you should investigate the different implementations carefully.

Here is one example that combines the use of WHENEVER and sqlca, printing out the contents of sqlca when an error occurs. This is perhaps useful for debugging or prototyping applications, before installing a more “user-friendly” error handler.

The result could look as follows (here an error due to a misspelled table name):

The fields sqlca.sqlstate and sqlca.sqlcode are two different schemes that provide error codes. Both are derived from the SQL standard, but SQLCODE has been marked deprecated in the SQL-92 edition of the standard and has been dropped in later editions. Therefore, new applications are strongly encouraged to use SQLSTATE.

SQLSTATE is a five-character array. The five characters contain digits or upper-case letters that represent codes of various error and warning conditions. SQLSTATE has a hierarchical scheme: the first two characters indicate the general class of the condition, the last three characters indicate a subclass of the general condition. A successful state is indicated by the code 00000. The SQLSTATE codes are for the most part defined in the SQL standard. The PostgreSQL server natively supports SQLSTATE error codes; therefore a high degree of consistency can be achieved by using this error code scheme throughout all applications. For further information see Appendix A.

SQLCODE, the deprecated error code scheme, is a simple integer. A value of 0 indicates success, a positive value indicates success with additional information, a negative value indicates an error. The SQL standard only defines the positive value +100, which indicates that the last command returned or affected zero rows, and no specific negative values. Therefore, this scheme can only achieve poor portability and does not have a hierarchical code assignment. Historically, the embedded SQL processor for PostgreSQL has assigned some specific SQLCODE values for its use, which are listed below with their numeric value and their symbolic name. Remember that these are not portable to other SQL implementations. To simplify the porting of applications to the SQLSTATE scheme, the corresponding SQLSTATE is also listed. There is, however, no one-to-one or one-to-many mapping between the two schemes (indeed it is many-to-many), so you should consult the global SQLSTATE listing in Appendix A in each case.

These are the assigned SQLCODE values:

Indicates no error. (SQLSTATE 00000)

This is a harmless condition indicating that the last command retrieved or processed zero rows, or that you are at the end of the cursor. (SQLSTATE 02000)

When processing a cursor in a loop, you could use this code as a way to detect when to abort the loop, like this:

But WHENEVER NOT FOUND DO BREAK effectively does this internally, so there is usually no advantage in writing this out explicitly.

Indicates that your virtual memory is exhausted. The numeric value is defined as -ENOMEM. (SQLSTATE YE001)

Indicates the preprocessor has generated something that the library does not know about. Perhaps you are running incompatible versions of the preprocessor and the library. (SQLSTATE YE002)

This means that the command specified more host variables than the command expected. (SQLSTATE 07001 or 07002)

This means that the command specified fewer host variables than the command expected. (SQLSTATE 07001 or 07002)

This means a query has returned multiple rows but the statement was only prepared to store one result row (for example, because the specified variables are not arrays). (SQLSTATE 21000)

The host variable is of type int and the datum in the database is of a different type and contains a value that cannot be interpreted as an int. The library uses strtol() for this conversion. (SQLSTATE 42804)

The host variable is of type unsigned int and the datum in the database is of a different type and contains a value that cannot be interpreted as an unsigned int. The library uses strtoul() for this conversion. (SQLSTATE 42804)

The host variable is of type float and the datum in the database is of another type and contains a value that cannot be interpreted as a float. The library uses strtod() for this conversion. (SQLSTATE 42804)

The host variable is of type numeric and the datum in the database is of another type and contains a value that cannot be interpreted as a numeric value. (SQLSTATE 42804)

The host variable is of type interval and the datum in the database is of another type and contains a value that cannot be interpreted as an interval value. (SQLSTATE 42804)

The host variable is of type date and the datum in the database is of another type and contains a value that cannot be interpreted as a date value. (SQLSTATE 42804)

The host variable is of type timestamp and the datum in the database is of another type and contains a value that cannot be interpreted as a timestamp value. (SQLSTATE 42804)

This means the host variable is of type bool and the datum in the database is neither 't' nor 'f'. (SQLSTATE 42804)

The statement sent to the PostgreSQL server was empty. (This cannot normally happen in an embedded SQL program, so it might point to an internal error.) (SQLSTATE YE002)

A null value was returned and no null indicator variable was supplied. (SQLSTATE 22002)

An ordinary variable was used in a place that requires an array. (SQLSTATE 42804)

The database returned an ordinary variable in a place that requires array value. (SQLSTATE 42804)

The value could not be inserted into the array. (SQLSTATE 42804)

The program tried to access a connection that does not exist. (SQLSTATE 08003)

The program tried to access a connection that does exist but is not open. (This is an internal error.) (SQLSTATE YE002)

The statement you are trying to use has not been prepared. (SQLSTATE 26000)

Duplicate key error, violation of unique constraint (Informix compatibility mode). (SQLSTATE 23505)

The descriptor specified was not found. The statement you are trying to use has not been prepared. (SQLSTATE 33000)

The descriptor index specified was out of range. (SQLSTATE 07009)

An invalid descriptor item was requested. (This is an internal error.) (SQLSTATE YE002)

During the execution of a dynamic statement, the database returned a numeric value and the host variable was not numeric. (SQLSTATE 07006)

During the execution of a dynamic statement, the database returned a non-numeric value and the host variable was numeric. (SQLSTATE 07006)

A result of the subquery is not single row (Informix compatibility mode). (SQLSTATE 21000)

Some error caused by the PostgreSQL server. The message contains the error message from the PostgreSQL server.

The PostgreSQL server signaled that we cannot start, commit, or rollback the transaction. (SQLSTATE 08007)

The connection attempt to the database did not succeed. (SQLSTATE 08001)

Duplicate key error, violation of unique constraint. (SQLSTATE 23505)

A result for the subquery is not single row. (SQLSTATE 21000)

An invalid cursor name was specified. (SQLSTATE 34000)

Transaction is in progress. (SQLSTATE 25001)

There is no active (in-progress) transaction. (SQLSTATE 25P01)

An existing cursor name was specified. (SQLSTATE 42P03)

**Examples:**

Example 1 (unknown):
```unknown
EXEC SQL WHENEVER condition action;
```

Example 2 (unknown):
```unknown
GO TO label
```

Example 3 (unknown):
```unknown
DO CONTINUE
```

Example 4 (unknown):
```unknown
CALL name (args)
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/ecpg-sql-whenever.html

**Contents:**
- WHENEVER
- Synopsis
- Description
- Parameters
- Examples
- Compatibility

WHENEVER — specify the action to be taken when an SQL statement causes a specific class condition to be raised

Define a behavior which is called on the special cases (Rows not found, SQL warnings or errors) in the result of SQL execution.

See Section 34.8.1 for a description of the parameters.

A typical application is the use of WHENEVER NOT FOUND BREAK to handle looping through result sets:

WHENEVER is specified in the SQL standard, but most of the actions are PostgreSQL extensions.

**Examples:**

Example 1 (unknown):
```unknown
EXEC SQL WHENEVER NOT FOUND CONTINUE;
EXEC SQL WHENEVER NOT FOUND DO BREAK;
EXEC SQL WHENEVER NOT FOUND DO CONTINUE;
EXEC SQL WHENEVER SQLWARNING SQLPRINT;
EXEC SQL WHENEVER SQLWARNING DO warn();
EXEC SQL WHENEVER SQLERROR sqlprint;
EXEC SQL WHENEVER SQLERROR CALL print2();
EXEC SQL WHENEVER SQLERROR DO handle_error("select");
EXEC SQL WHENEVER SQLERROR DO sqlnotice(NULL, NONO);
EXEC SQL WHENEVER SQLERROR DO sqlprint();
EXEC SQL WHENEVER SQLERROR GOTO error_label;
EXEC SQL WHENEVER SQLERROR STOP;
```

Example 2 (unknown):
```unknown
WHENEVER NOT FOUND BREAK
```

Example 3 (sql):
```sql
int
main(void)
{
    EXEC SQL CONNECT TO testdb AS con1;
    EXEC SQL SELECT pg_catalog.set_config('search_path', '', false); EXEC SQL COMMIT;
    EXEC SQL ALLOCATE DESCRIPTOR d;
    EXEC SQL DECLARE cur CURSOR FOR SELECT current_database(), 'hoge', 256;
    EXEC SQL OPEN cur;

    /* when end of result set reached, break out of while loop */
    EXEC SQL WHENEVER NOT FOUND DO BREAK;

    while (1)
    {
        EXEC SQL FETCH NEXT FROM cur INTO SQL DESCRIPTOR d;
        ...
    }

    EXEC SQL CLOSE cur;
    EXEC SQL COMMIT;

    EXEC SQL DEALLOCATE DESCRIPTOR d;
    EXEC SQL DISCONNECT ALL;

    return 0;
}
```

---


---

