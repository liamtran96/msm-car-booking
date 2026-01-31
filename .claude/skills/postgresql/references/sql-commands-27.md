# PostgreSQL - Sql Commands (Part 27)

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterfunction.html

**Contents:**
- ALTER FUNCTION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER FUNCTION — change the definition of a function

ALTER FUNCTION changes the definition of a function.

You must own the function to use ALTER FUNCTION. To change a function's schema, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the function's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the function. However, a superuser can alter ownership of any function anyway.)

The name (optionally schema-qualified) of an existing function. If no argument list is specified, the name must be unique in its schema.

The mode of an argument: IN, OUT, INOUT, or VARIADIC. If omitted, the default is IN. Note that ALTER FUNCTION does not actually pay any attention to OUT arguments, since only the input arguments are needed to determine the function's identity. So it is sufficient to list the IN, INOUT, and VARIADIC arguments.

The name of an argument. Note that ALTER FUNCTION does not actually pay any attention to argument names, since only the argument data types are needed to determine the function's identity.

The data type(s) of the function's arguments (optionally schema-qualified), if any.

The new name of the function.

The new owner of the function. Note that if the function is marked SECURITY DEFINER, it will subsequently execute as the new owner.

The new schema for the function.

This form marks the function as dependent on the extension, or no longer dependent on that extension if NO is specified. A function that's marked as dependent on an extension is dropped when the extension is dropped, even if CASCADE is not specified. A function can depend upon multiple extensions, and will be dropped when any one of those extensions is dropped.

CALLED ON NULL INPUT changes the function so that it will be invoked when some or all of its arguments are null. RETURNS NULL ON NULL INPUT or STRICT changes the function so that it is not invoked if any of its arguments are null; instead, a null result is assumed automatically. See CREATE FUNCTION for more information.

Change the volatility of the function to the specified setting. See CREATE FUNCTION for details.

Change whether the function is a security definer or not. The key word EXTERNAL is ignored for SQL conformance. See CREATE FUNCTION for more information about this capability.

Change whether the function is deemed safe for parallelism. See CREATE FUNCTION for details.

Change whether the function is considered leakproof or not. See CREATE FUNCTION for more information about this capability.

Change the estimated execution cost of the function. See CREATE FUNCTION for more information.

Change the estimated number of rows returned by a set-returning function. See CREATE FUNCTION for more information.

Set or change the planner support function to use for this function. See Section 36.11 for details. You must be superuser to use this option.

This option cannot be used to remove the support function altogether, since it must name a new support function. Use CREATE OR REPLACE FUNCTION if you need to do that.

Add or change the assignment to be made to a configuration parameter when the function is called. If value is DEFAULT or, equivalently, RESET is used, the function-local setting is removed, so that the function executes with the value present in its environment. Use RESET ALL to clear all function-local settings. SET FROM CURRENT saves the value of the parameter that is current when ALTER FUNCTION is executed as the value to be applied when the function is entered.

See SET and Chapter 19 for more information about allowed parameter names and values.

Ignored for conformance with the SQL standard.

To rename the function sqrt for type integer to square_root:

To change the owner of the function sqrt for type integer to joe:

To change the schema of the function sqrt for type integer to maths:

To mark the function sqrt for type integer as being dependent on the extension mathlib:

To adjust the search path that is automatically set for a function:

To disable automatic setting of search_path for a function:

The function will now execute with whatever search path is used by its caller.

This statement is partially compatible with the ALTER FUNCTION statement in the SQL standard. The standard allows more properties of a function to be modified, but does not provide the ability to rename a function, make a function a security definer, attach configuration parameter values to a function, or change the owner, schema, or volatility of a function. The standard also requires the RESTRICT key word, which is optional in PostgreSQL.

**Examples:**

Example 1 (unknown):
```unknown
extension_name
```

Example 2 (unknown):
```unknown
execution_cost
```

Example 3 (unknown):
```unknown
result_rows
```

Example 4 (unknown):
```unknown
support_function
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropsequence.html

**Contents:**
- DROP SEQUENCE
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP SEQUENCE — remove a sequence

DROP SEQUENCE removes sequence number generators. A sequence can only be dropped by its owner or a superuser.

Do not throw an error if the sequence does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of a sequence.

Automatically drop objects that depend on the sequence, and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the sequence if any objects depend on it. This is the default.

To remove the sequence serial:

DROP SEQUENCE conforms to the SQL standard, except that the standard only allows one sequence to be dropped per command, and apart from the IF EXISTS option, which is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP SEQUENCE
```

Example 2 (unknown):
```unknown
DROP SEQUENCE serial;
```

Example 3 (unknown):
```unknown
DROP SEQUENCE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-close.html

**Contents:**
- CLOSE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CLOSE — close a cursor

CLOSE frees the resources associated with an open cursor. After the cursor is closed, no subsequent operations are allowed on it. A cursor should be closed when it is no longer needed.

Every non-holdable open cursor is implicitly closed when a transaction is terminated by COMMIT or ROLLBACK. A holdable cursor is implicitly closed if the transaction that created it aborts via ROLLBACK. If the creating transaction successfully commits, the holdable cursor remains open until an explicit CLOSE is executed, or the client disconnects.

The name of an open cursor to close.

Close all open cursors.

PostgreSQL does not have an explicit OPEN cursor statement; a cursor is considered open when it is declared. Use the DECLARE statement to declare a cursor.

You can see all available cursors by querying the pg_cursors system view.

If a cursor is closed after a savepoint which is later rolled back, the CLOSE is not rolled back; that is, the cursor remains closed.

Close the cursor liahona:

CLOSE is fully conforming with the SQL standard. CLOSE ALL is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
CLOSE liahona;
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alterroutine.html

**Contents:**
- ALTER ROUTINE
- Synopsis
- Description
- Examples
- Compatibility
- See Also

ALTER ROUTINE — change the definition of a routine

ALTER ROUTINE changes the definition of a routine, which can be an aggregate function, a normal function, or a procedure. See under ALTER AGGREGATE, ALTER FUNCTION, and ALTER PROCEDURE for the description of the parameters, more examples, and further details.

To rename the routine foo for type integer to foobar:

This command will work independent of whether foo is an aggregate, function, or procedure.

This statement is partially compatible with the ALTER ROUTINE statement in the SQL standard. See under ALTER FUNCTION and ALTER PROCEDURE for more details. Allowing routine names to refer to aggregate functions is a PostgreSQL extension.

Note that there is no CREATE ROUTINE command.

**Examples:**

Example 1 (unknown):
```unknown
extension_name
```

Example 2 (unknown):
```unknown
execution_cost
```

Example 3 (unknown):
```unknown
result_rows
```

Example 4 (unknown):
```unknown
configuration_parameter
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-release-savepoint.html

**Contents:**
- RELEASE SAVEPOINT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

RELEASE SAVEPOINT — release a previously defined savepoint

RELEASE SAVEPOINT releases the named savepoint and all active savepoints that were created after the named savepoint, and frees their resources. All changes made since the creation of the savepoint that didn't already get rolled back are merged into the transaction or savepoint that was active when the named savepoint was created. Changes made after RELEASE SAVEPOINT will also be part of this active transaction or savepoint.

The name of the savepoint to release.

Specifying a savepoint name that was not previously defined is an error.

It is not possible to release a savepoint when the transaction is in an aborted state; to do that, use ROLLBACK TO SAVEPOINT.

If multiple savepoints have the same name, only the most recently defined unreleased one is released. Repeated commands will release progressively older savepoints.

To establish and later release a savepoint:

The above transaction will insert both 3 and 4.

A more complex example with multiple nested subtransactions:

In this example, the application requests the release of the savepoint sp2, which inserted 3. This changes the insert's transaction context to sp1. When the statement attempting to insert value 4 generates an error, the insertion of 2 and 4 are lost because they are in the same, now-rolled back savepoint, and value 3 is in the same transaction context. The application can now only choose one of these two commands, since all other commands will be ignored:

Choosing ROLLBACK will abort everything, including value 1, whereas ROLLBACK TO SAVEPOINT sp1 will retain value 1 and allow the transaction to continue.

This command conforms to the SQL standard. The standard specifies that the key word SAVEPOINT is mandatory, but PostgreSQL allows it to be omitted.

**Examples:**

Example 1 (unknown):
```unknown
savepoint_name
```

Example 2 (unknown):
```unknown
RELEASE SAVEPOINT
```

Example 3 (unknown):
```unknown
RELEASE SAVEPOINT
```

Example 4 (unknown):
```unknown
savepoint_name
```

---


---

