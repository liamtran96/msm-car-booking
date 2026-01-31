# PostgreSQL - Pltcl (Part 2)

## 42.5. Database Access from PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-dbaccess.html

**Contents:**
- 42.5. Database Access from PL/Tcl #

In this section, we follow the usual Tcl convention of using question marks, rather than brackets, to indicate an optional element in a syntax synopsis. The following commands are available to access the database from the body of a PL/Tcl function:

Executes an SQL command given as a string. An error in the command causes an error to be raised. Otherwise, the return value of spi_exec is the number of rows processed (selected, inserted, updated, or deleted) by the command, or zero if the command is a utility statement. In addition, if the command is a SELECT statement, the values of the selected columns are placed in Tcl variables as described below.

The optional -count value tells spi_exec to stop once n rows have been retrieved, much as if the query included a LIMIT clause. If n is zero, the query is run to completion, the same as when -count is omitted.

If the command is a SELECT statement, the values of the result columns are placed into Tcl variables named after the columns. If the -array option is given, the column values are instead stored into elements of the named associative array, with the column names used as array indexes. In addition, the current row number within the result (counting from zero) is stored into the array element named “.tupno”, unless that name is in use as a column name in the result.

If the command is a SELECT statement and no loop-body script is given, then only the first row of results are stored into Tcl variables or array elements; remaining rows, if any, are ignored. No storing occurs if the query returns no rows. (This case can be detected by checking the result of spi_exec.) For example:

will set the Tcl variable $cnt to the number of rows in the pg_proc system catalog.

If the optional loop-body argument is given, it is a piece of Tcl script that is executed once for each row in the query result. (loop-body is ignored if the given command is not a SELECT.) The values of the current row's columns are stored into Tcl variables or array elements before each iteration. For example:

will print a log message for every row of pg_class. This feature works similarly to other Tcl looping constructs; in particular continue and break work in the usual way inside the loop body.

If a column of a query result is null, the target variable for it is “unset” rather than being set.

Prepares and saves a query plan for later execution. The saved plan will be retained for the life of the current session.

The query can use parameters, that is, placeholders for values to be supplied whenever the plan is actually executed. In the query string, refer to parameters by the symbols $1 ... $n. If the query uses parameters, the names of the parameter types must be given as a Tcl list. (Write an empty list for typelist if no parameters are used.)

The return value from spi_prepare is a query ID to be used in subsequent calls to spi_execp. See spi_execp for an example.

Executes a query previously prepared with spi_prepare. queryid is the ID returned by spi_prepare. If the query references parameters, a value-list must be supplied. This is a Tcl list of actual values for the parameters. The list must be the same length as the parameter type list previously given to spi_prepare. Omit value-list if the query has no parameters.

The optional value for -nulls is a string of spaces and 'n' characters telling spi_execp which of the parameters are null values. If given, it must have exactly the same length as the value-list. If it is not given, all the parameter values are nonnull.

Except for the way in which the query and its parameters are specified, spi_execp works just like spi_exec. The -count, -array, and loop-body options are the same, and so is the result value.

Here's an example of a PL/Tcl function using a prepared plan:

We need backslashes inside the query string given to spi_prepare to ensure that the $n markers will be passed through to spi_prepare as-is, and not replaced by Tcl variable substitution.

The Tcl script contained in command is executed within an SQL subtransaction. If the script returns an error, that entire subtransaction is rolled back before returning the error out to the surrounding Tcl code. See Section 42.9 for more details and an example.

Doubles all occurrences of single quote and backslash characters in the given string. This can be used to safely quote strings that are to be inserted into SQL commands given to spi_exec or spi_prepare. For example, think about an SQL command string like:

where the Tcl variable val actually contains doesn't. This would result in the final command string:

which would cause a parse error during spi_exec or spi_prepare. To work properly, the submitted command should contain:

which can be formed in PL/Tcl using:

One advantage of spi_execp is that you don't have to quote parameter values like this, since the parameters are never parsed as part of an SQL command string.

Emits a log or error message. Possible levels are DEBUG, LOG, INFO, NOTICE, WARNING, ERROR, and FATAL. ERROR raises an error condition; if this is not trapped by the surrounding Tcl code, the error propagates out to the calling query, causing the current transaction or subtransaction to be aborted. This is effectively the same as the Tcl error command. FATAL aborts the transaction and causes the current session to shut down. (There is probably no good reason to use this error level in PL/Tcl functions, but it's provided for completeness.) The other levels only generate messages of different priority levels. Whether messages of a particular priority are reported to the client, written to the server log, or both is controlled by the log_min_messages and client_min_messages configuration variables. See Chapter 19 and Section 42.8 for more information.

**Examples:**

Example 1 (unknown):
```unknown
spi_exec ?-count n? ?-array name? command ?loop-body?
```

Example 2 (sql):
```sql
spi_exec "SELECT count(*) AS cnt FROM pg_proc"
```

Example 3 (sql):
```sql
spi_exec -array C "SELECT * FROM pg_class" {
    elog DEBUG "have table $C(relname)"
}
```

Example 4 (unknown):
```unknown
spi_prepare
```

---


---

## 42.6. Trigger Functions in PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-trigger.html

**Contents:**
- 42.6. Trigger Functions in PL/Tcl #
  - Tip

Trigger functions can be written in PL/Tcl. PostgreSQL requires that a function that is to be called as a trigger must be declared as a function with no arguments and a return type of trigger.

The information from the trigger manager is passed to the function body in the following variables:

The name of the trigger from the CREATE TRIGGER statement.

The object ID of the table that caused the trigger function to be invoked.

The name of the table that caused the trigger function to be invoked.

The schema of the table that caused the trigger function to be invoked.

A Tcl list of the table column names, prefixed with an empty list element. So looking up a column name in the list with Tcl's lsearch command returns the element's number starting with 1 for the first column, the same way the columns are customarily numbered in PostgreSQL. (Empty list elements also appear in the positions of columns that have been dropped, so that the attribute numbering is correct for columns to their right.)

The string BEFORE, AFTER, or INSTEAD OF, depending on the type of trigger event.

The string ROW or STATEMENT depending on the type of trigger event.

The string INSERT, UPDATE, DELETE, or TRUNCATE depending on the type of trigger event.

An associative array containing the values of the new table row for INSERT or UPDATE actions, or empty for DELETE. The array is indexed by column name. Columns that are null will not appear in the array. This is not set for statement-level triggers.

An associative array containing the values of the old table row for UPDATE or DELETE actions, or empty for INSERT. The array is indexed by column name. Columns that are null will not appear in the array. This is not set for statement-level triggers.

A Tcl list of the arguments to the function as given in the CREATE TRIGGER statement. These arguments are also accessible as $1 ... $n in the function body.

The return value from a trigger function can be one of the strings OK or SKIP, or a list of column name/value pairs. If the return value is OK, the operation (INSERT/UPDATE/DELETE) that fired the trigger will proceed normally. SKIP tells the trigger manager to silently suppress the operation for this row. If a list is returned, it tells PL/Tcl to return a modified row to the trigger manager; the contents of the modified row are specified by the column names and values in the list. Any columns not mentioned in the list are set to null. Returning a modified row is only meaningful for row-level BEFORE INSERT or UPDATE triggers, for which the modified row will be inserted instead of the one given in $NEW; or for row-level INSTEAD OF INSERT or UPDATE triggers where the returned row is used as the source data for INSERT RETURNING or UPDATE RETURNING clauses. In row-level BEFORE DELETE or INSTEAD OF DELETE triggers, returning a modified row has the same effect as returning OK, that is the operation proceeds. The trigger return value is ignored for all other types of triggers.

The result list can be made from an array representation of the modified tuple with the array get Tcl command.

Here's a little example trigger function that forces an integer value in a table to keep track of the number of updates that are performed on the row. For new rows inserted, the value is initialized to 0 and then incremented on every update operation.

Notice that the trigger function itself does not know the column name; that's supplied from the trigger arguments. This lets the trigger function be reused with different tables.

**Examples:**

Example 1 (unknown):
```unknown
CREATE TRIGGER
```

Example 2 (bash):
```bash
$TG_table_name
```

Example 3 (bash):
```bash
$TG_table_schema
```

Example 4 (bash):
```bash
$TG_relatts
```

---


---

## 42.9. Explicit Subtransactions in PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-subtransactions.html

**Contents:**
- 42.9. Explicit Subtransactions in PL/Tcl #

Recovering from errors caused by database access as described in Section 42.8 can lead to an undesirable situation where some operations succeed before one of them fails, and after recovering from that error the data is left in an inconsistent state. PL/Tcl offers a solution to this problem in the form of explicit subtransactions.

Consider a function that implements a transfer between two accounts:

If the second UPDATE statement results in an exception being raised, this function will log the failure, but the result of the first UPDATE will nevertheless be committed. In other words, the funds will be withdrawn from Joe's account, but will not be transferred to Mary's account. This happens because each spi_exec is a separate subtransaction, and only one of those subtransactions got rolled back.

To handle such cases, you can wrap multiple database operations in an explicit subtransaction, which will succeed or roll back as a whole. PL/Tcl provides a subtransaction command to manage this. We can rewrite our function as:

Note that use of catch is still required for this purpose. Otherwise the error would propagate to the top level of the function, preventing the desired insertion into the operations table. The subtransaction command does not trap errors, it only assures that all database operations executed inside its scope will be rolled back together when an error is reported.

A rollback of an explicit subtransaction occurs on any error reported by the contained Tcl code, not only errors originating from database access. Thus a regular Tcl exception raised inside a subtransaction command will also cause the subtransaction to be rolled back. However, non-error exits out of the contained Tcl code (for instance, due to return) do not cause a rollback.

**Examples:**

Example 1 (sql):
```sql
CREATE FUNCTION transfer_funds() RETURNS void AS $$
    if [catch {
        spi_exec "UPDATE accounts SET balance = balance - 100 WHERE account_name = 'joe'"
        spi_exec "UPDATE accounts SET balance = balance + 100 WHERE account_name = 'mary'"
    } errormsg] {
        set result [format "error transferring funds: %s" $errormsg]
    } else {
        set result "funds transferred successfully"
    }
    spi_exec "INSERT INTO operations (result) VALUES ('[quote $result]')"
$$ LANGUAGE pltcl;
```

Example 2 (unknown):
```unknown
subtransaction
```

Example 3 (sql):
```sql
CREATE FUNCTION transfer_funds2() RETURNS void AS $$
    if [catch {
        subtransaction {
            spi_exec "UPDATE accounts SET balance = balance - 100 WHERE account_name = 'joe'"
            spi_exec "UPDATE accounts SET balance = balance + 100 WHERE account_name = 'mary'"
        }
    } errormsg] {
        set result [format "error transferring funds: %s" $errormsg]
    } else {
        set result "funds transferred successfully"
    }
    spi_exec "INSERT INTO operations (result) VALUES ('[quote $result]')"
$$ LANGUAGE pltcl;
```

Example 4 (unknown):
```unknown
subtransaction
```

---


---

## 42.11. PL/Tcl Configuration #


**URL:** https://www.postgresql.org/docs/18/pltcl-config.html

**Contents:**
- 42.11. PL/Tcl Configuration #

This section lists configuration parameters that affect PL/Tcl.

This parameter, if set to a nonempty string, specifies the name (possibly schema-qualified) of a parameterless PL/Tcl function that is to be executed whenever a new Tcl interpreter is created for PL/Tcl. Such a function can perform per-session initialization, such as loading additional Tcl code. A new Tcl interpreter is created when a PL/Tcl function is first executed in a database session, or when an additional interpreter has to be created because a PL/Tcl function is called by a new SQL role.

The referenced function must be written in the pltcl language, and must not be marked SECURITY DEFINER. (These restrictions ensure that it runs in the interpreter it's supposed to initialize.) The current user must have permission to call it, too.

If the function fails with an error it will abort the function call that caused the new interpreter to be created and propagate out to the calling query, causing the current transaction or subtransaction to be aborted. Any actions already done within Tcl won't be undone; however, that interpreter won't be used again. If the language is used again the initialization will be attempted again within a fresh Tcl interpreter.

Only superusers can change this setting. Although this setting can be changed within a session, such changes will not affect Tcl interpreters that have already been created.

This parameter is exactly like pltcl.start_proc, except that it applies to PL/TclU. The referenced function must be written in the pltclu language.

**Examples:**

Example 1 (unknown):
```unknown
pltcl.start_proc
```

Example 2 (unknown):
```unknown
SECURITY DEFINER
```

Example 3 (unknown):
```unknown
pltclu.start_proc
```

Example 4 (unknown):
```unknown
pltcl.start_proc
```

---


---

