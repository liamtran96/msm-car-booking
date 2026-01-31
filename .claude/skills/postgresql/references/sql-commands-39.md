# PostgreSQL - Sql Commands (Part 39)

## 


**URL:** https://www.postgresql.org/docs/18/sql-createforeigndatawrapper.html

**Contents:**
- CREATE FOREIGN DATA WRAPPER
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE FOREIGN DATA WRAPPER — define a new foreign-data wrapper

CREATE FOREIGN DATA WRAPPER creates a new foreign-data wrapper. The user who defines a foreign-data wrapper becomes its owner.

The foreign-data wrapper name must be unique within the database.

Only superusers can create foreign-data wrappers.

The name of the foreign-data wrapper to be created.

handler_function is the name of a previously registered function that will be called to retrieve the execution functions for foreign tables. The handler function must take no arguments, and its return type must be fdw_handler.

It is possible to create a foreign-data wrapper with no handler function, but foreign tables using such a wrapper can only be declared, not accessed.

validator_function is the name of a previously registered function that will be called to check the generic options given to the foreign-data wrapper, as well as options for foreign servers, user mappings and foreign tables using the foreign-data wrapper. If no validator function or NO VALIDATOR is specified, then options will not be checked at creation time. (Foreign-data wrappers will possibly ignore or reject invalid option specifications at run time, depending on the implementation.) The validator function must take two arguments: one of type text[], which will contain the array of options as stored in the system catalogs, and one of type oid, which will be the OID of the system catalog containing the options. The return type is ignored; the function should report invalid options using the ereport(ERROR) function.

This clause specifies options for the new foreign-data wrapper. The allowed option names and values are specific to each foreign data wrapper and are validated using the foreign-data wrapper's validator function. Option names must be unique.

PostgreSQL's foreign-data functionality is still under active development. Optimization of queries is primitive (and mostly left to the wrapper, too). Thus, there is considerable room for future performance improvements.

Create a useless foreign-data wrapper dummy:

Create a foreign-data wrapper file with handler function file_fdw_handler:

Create a foreign-data wrapper mywrapper with some options:

CREATE FOREIGN DATA WRAPPER conforms to ISO/IEC 9075-9 (SQL/MED), with the exception that the HANDLER and VALIDATOR clauses are extensions and the standard clauses LIBRARY and LANGUAGE are not implemented in PostgreSQL.

Note, however, that the SQL/MED functionality as a whole is not yet conforming.

**Examples:**

Example 1 (unknown):
```unknown
handler_function
```

Example 2 (unknown):
```unknown
validator_function
```

Example 3 (unknown):
```unknown
CREATE FOREIGN DATA WRAPPER
```

Example 4 (unknown):
```unknown
HANDLER handler_function
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-set-transaction.html

**Contents:**
- SET TRANSACTION
- Synopsis
- Description
- Notes
- Examples
- Compatibility

SET TRANSACTION — set the characteristics of the current transaction

The SET TRANSACTION command sets the characteristics of the current transaction. It has no effect on any subsequent transactions. SET SESSION CHARACTERISTICS sets the default transaction characteristics for subsequent transactions of a session. These defaults can be overridden by SET TRANSACTION for an individual transaction.

The available transaction characteristics are the transaction isolation level, the transaction access mode (read/write or read-only), and the deferrable mode. In addition, a snapshot can be selected, though only for the current transaction, not as a session default.

The isolation level of a transaction determines what data the transaction can see when other transactions are running concurrently:

A statement can only see rows committed before it began. This is the default.

All statements of the current transaction can only see rows committed before the first query or data-modification statement was executed in this transaction.

All statements of the current transaction can only see rows committed before the first query or data-modification statement was executed in this transaction. If a pattern of reads and writes among concurrent serializable transactions would create a situation which could not have occurred for any serial (one-at-a-time) execution of those transactions, one of them will be rolled back with a serialization_failure error.

The SQL standard defines one additional level, READ UNCOMMITTED. In PostgreSQL READ UNCOMMITTED is treated as READ COMMITTED.

The transaction isolation level cannot be changed after the first query or data-modification statement (SELECT, INSERT, DELETE, UPDATE, MERGE, FETCH, or COPY) of a transaction has been executed. See Chapter 13 for more information about transaction isolation and concurrency control.

The transaction access mode determines whether the transaction is read/write or read-only. Read/write is the default. When a transaction is read-only, the following SQL commands are disallowed: INSERT, UPDATE, DELETE, MERGE, and COPY FROM if the table they would write to is not a temporary table; all CREATE, ALTER, and DROP commands; COMMENT, GRANT, REVOKE, TRUNCATE; and EXPLAIN ANALYZE and EXECUTE if the command they would execute is among those listed. This is a high-level notion of read-only that does not prevent all writes to disk.

The DEFERRABLE transaction property has no effect unless the transaction is also SERIALIZABLE and READ ONLY. When all three of these properties are selected for a transaction, the transaction may block when first acquiring its snapshot, after which it is able to run without the normal overhead of a SERIALIZABLE transaction and without any risk of contributing to or being canceled by a serialization failure. This mode is well suited for long-running reports or backups.

The SET TRANSACTION SNAPSHOT command allows a new transaction to run with the same snapshot as an existing transaction. The pre-existing transaction must have exported its snapshot with the pg_export_snapshot function (see Section 9.28.5). That function returns a snapshot identifier, which must be given to SET TRANSACTION SNAPSHOT to specify which snapshot is to be imported. The identifier must be written as a string literal in this command, for example '00000003-0000001B-1'. SET TRANSACTION SNAPSHOT can only be executed at the start of a transaction, before the first query or data-modification statement (SELECT, INSERT, DELETE, UPDATE, MERGE, FETCH, or COPY) of the transaction. Furthermore, the transaction must already be set to SERIALIZABLE or REPEATABLE READ isolation level (otherwise, the snapshot would be discarded immediately, since READ COMMITTED mode takes a new snapshot for each command). If the importing transaction uses SERIALIZABLE isolation level, then the transaction that exported the snapshot must also use that isolation level. Also, a non-read-only serializable transaction cannot import a snapshot from a read-only transaction.

If SET TRANSACTION is executed without a prior START TRANSACTION or BEGIN, it emits a warning and otherwise has no effect.

It is possible to dispense with SET TRANSACTION by instead specifying the desired transaction_modes in BEGIN or START TRANSACTION. But that option is not available for SET TRANSACTION SNAPSHOT.

The session default transaction modes can also be set or examined via the configuration parameters default_transaction_isolation, default_transaction_read_only, and default_transaction_deferrable. (In fact SET SESSION CHARACTERISTICS is just a verbose equivalent for setting these variables with SET.) This means the defaults can be set in the configuration file, via ALTER DATABASE, etc. Consult Chapter 19 for more information.

The current transaction's modes can similarly be set or examined via the configuration parameters transaction_isolation, transaction_read_only, and transaction_deferrable. Setting one of these parameters acts the same as the corresponding SET TRANSACTION option, with the same restrictions on when it can be done. However, these parameters cannot be set in the configuration file, or from any source other than live SQL.

To begin a new transaction with the same snapshot as an already existing transaction, first export the snapshot from the existing transaction. That will return the snapshot identifier, for example:

Then give the snapshot identifier in a SET TRANSACTION SNAPSHOT command at the beginning of the newly opened transaction:

These commands are defined in the SQL standard, except for the DEFERRABLE transaction mode and the SET TRANSACTION SNAPSHOT form, which are PostgreSQL extensions.

SERIALIZABLE is the default transaction isolation level in the standard. In PostgreSQL the default is ordinarily READ COMMITTED, but you can change it as mentioned above.

In the SQL standard, there is one other transaction characteristic that can be set with these commands: the size of the diagnostics area. This concept is specific to embedded SQL, and therefore is not implemented in the PostgreSQL server.

The SQL standard requires commas between successive transaction_modes, but for historical reasons PostgreSQL allows the commas to be omitted.

**Examples:**

Example 1 (unknown):
```unknown
transaction_mode
```

Example 2 (unknown):
```unknown
snapshot_id
```

Example 3 (unknown):
```unknown
transaction_mode
```

Example 4 (unknown):
```unknown
transaction_mode
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropfunction.html

**Contents:**
- DROP FUNCTION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP FUNCTION — remove a function

DROP FUNCTION removes the definition of an existing function. To execute this command the user must be the owner of the function. The argument types to the function must be specified, since several different functions can exist with the same name and different argument lists.

Do not throw an error if the function does not exist. A notice is issued in this case.

The name (optionally schema-qualified) of an existing function. If no argument list is specified, the name must be unique in its schema.

The mode of an argument: IN, OUT, INOUT, or VARIADIC. If omitted, the default is IN. Note that DROP FUNCTION does not actually pay any attention to OUT arguments, since only the input arguments are needed to determine the function's identity. So it is sufficient to list the IN, INOUT, and VARIADIC arguments.

The name of an argument. Note that DROP FUNCTION does not actually pay any attention to argument names, since only the argument data types are needed to determine the function's identity.

The data type(s) of the function's arguments (optionally schema-qualified), if any.

Automatically drop objects that depend on the function (such as operators or triggers), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the function if any objects depend on it. This is the default.

This command removes the square root function:

Drop multiple functions in one command:

If the function name is unique in its schema, it can be referred to without an argument list:

Note that this is different from

which refers to a function with zero arguments, whereas the first variant can refer to a function with any number of arguments, including zero, as long as the name is unique.

This command conforms to the SQL standard, with these PostgreSQL extensions:

The standard only allows one function to be dropped per command.

The ability to specify argument modes and names

**Examples:**

Example 1 (unknown):
```unknown
DROP FUNCTION
```

Example 2 (unknown):
```unknown
DROP FUNCTION
```

Example 3 (unknown):
```unknown
DROP FUNCTION
```

Example 4 (javascript):
```javascript
DROP FUNCTION sqrt(integer);
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropconversion.html

**Contents:**
- DROP CONVERSION
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

DROP CONVERSION — remove a conversion

DROP CONVERSION removes a previously defined conversion. To be able to drop a conversion, you must own the conversion.

Do not throw an error if the conversion does not exist. A notice is issued in this case.

The name of the conversion. The conversion name can be schema-qualified.

These key words do not have any effect, since there are no dependencies on conversions.

To drop the conversion named myname:

There is no DROP CONVERSION statement in the SQL standard, but a DROP TRANSLATION statement that goes along with the CREATE TRANSLATION statement that is similar to the CREATE CONVERSION statement in PostgreSQL.

**Examples:**

Example 1 (unknown):
```unknown
DROP CONVERSION
```

Example 2 (unknown):
```unknown
DROP CONVERSION myname;
```

Example 3 (unknown):
```unknown
DROP CONVERSION
```

Example 4 (unknown):
```unknown
DROP TRANSLATION
```

---


---

