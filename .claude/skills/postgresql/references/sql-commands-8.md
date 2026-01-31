# PostgreSQL - Sql Commands (Part 8)

## 


**URL:** https://www.postgresql.org/docs/18/sql-set.html

**Contents:**
- SET
- Synopsis
- Description
  - Note
- Parameters
- Notes
- Examples
- Compatibility
- See Also

SET — change a run-time parameter

The SET command changes run-time configuration parameters. Many of the run-time parameters listed in Chapter 19 can be changed on-the-fly with SET. (Some parameters can only be changed by superusers and users who have been granted SET privilege on that parameter. There are also parameters that cannot be changed after server or session start.) SET only affects the value used by the current session.

If SET (or equivalently SET SESSION) is issued within a transaction that is later aborted, the effects of the SET command disappear when the transaction is rolled back. Once the surrounding transaction is committed, the effects will persist until the end of the session, unless overridden by another SET.

The effects of SET LOCAL last only till the end of the current transaction, whether committed or not. A special case is SET followed by SET LOCAL within a single transaction: the SET LOCAL value will be seen until the end of the transaction, but afterwards (if the transaction is committed) the SET value will take effect.

The effects of SET or SET LOCAL are also canceled by rolling back to a savepoint that is earlier than the command.

If SET LOCAL is used within a function that has a SET option for the same variable (see CREATE FUNCTION), the effects of the SET LOCAL command disappear at function exit; that is, the value in effect when the function was called is restored anyway. This allows SET LOCAL to be used for dynamic or repeated changes of a parameter within a function, while still having the convenience of using the SET option to save and restore the caller's value. However, a regular SET command overrides any surrounding function's SET option; its effects will persist unless rolled back.

In PostgreSQL versions 8.0 through 8.2, the effects of a SET LOCAL would be canceled by releasing an earlier savepoint, or by successful exit from a PL/pgSQL exception block. This behavior has been changed because it was deemed unintuitive.

Specifies that the command takes effect for the current session. (This is the default if neither SESSION nor LOCAL appears.)

Specifies that the command takes effect for only the current transaction. After COMMIT or ROLLBACK, the session-level setting takes effect again. Issuing this outside of a transaction block emits a warning and otherwise has no effect.

Name of a settable run-time parameter. Available parameters are documented in Chapter 19 and below.

New value of parameter. Values can be specified as string constants, identifiers, numbers, or comma-separated lists of these, as appropriate for the particular parameter. DEFAULT can be written to specify resetting the parameter to its default value (that is, whatever value it would have had if no SET had been executed in the current session).

Besides the configuration parameters documented in Chapter 19, there are a few that can only be adjusted using the SET command or that have a special syntax:

SET SCHEMA 'value' is an alias for SET search_path TO value. Only one schema can be specified using this syntax.

SET NAMES 'value' is an alias for SET client_encoding TO value.

Sets the internal seed for the random number generator (the function random). Allowed values are floating-point numbers between -1 and 1 inclusive.

The seed can also be set by invoking the function setseed:

SET TIME ZONE 'value' is an alias for SET timezone TO 'value'. The syntax SET TIME ZONE allows special syntax for the time zone specification. Here are examples of valid values:

The time zone for Berkeley, California.

The time zone for Italy.

The time zone 7 hours west from UTC (equivalent to PDT). Positive values are east from UTC.

The time zone 8 hours west from UTC (equivalent to PST).

Set the time zone to your local time zone (that is, the server's default value of timezone).

Timezone settings given as numbers or intervals are internally translated to POSIX timezone syntax. For example, after SET TIME ZONE -7, SHOW TIME ZONE would report <-07>+07.

Time zone abbreviations are not supported by SET; see Section 8.5.3 for more information about time zones.

The function set_config provides equivalent functionality; see Section 9.28.1. Also, it is possible to UPDATE the pg_settings system view to perform the equivalent of SET.

Set the schema search path:

Set the style of date to traditional POSTGRES with “day before month” input convention:

Set the time zone for Berkeley, California:

Set the time zone for Italy:

SET TIME ZONE extends syntax defined in the SQL standard. The standard allows only numeric time zone offsets while PostgreSQL allows more flexible time-zone specifications. All other SET features are PostgreSQL extensions.

**Examples:**

Example 1 (unknown):
```unknown
configuration_parameter
```

Example 2 (unknown):
```unknown
SET SESSION
```

Example 3 (unknown):
```unknown
configuration_parameter
```

Example 4 (unknown):
```unknown
SET SCHEMA 'value'
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-delete.html

**Contents:**
- DELETE
- Synopsis
- Description
  - Tip
- Parameters
- Outputs
- Notes
- Examples
- Compatibility
- See Also

DELETE — delete rows of a table

DELETE deletes rows that satisfy the WHERE clause from the specified table. If the WHERE clause is absent, the effect is to delete all rows in the table. The result is a valid, but empty table.

TRUNCATE provides a faster mechanism to remove all rows from a table.

There are two ways to delete rows in a table using information contained in other tables in the database: using sub-selects, or specifying additional tables in the USING clause. Which technique is more appropriate depends on the specific circumstances.

The optional RETURNING clause causes DELETE to compute and return value(s) based on each row actually deleted. Any expression using the table's columns, and/or columns of other tables mentioned in USING, can be computed. The syntax of the RETURNING list is identical to that of the output list of SELECT.

You must have the DELETE privilege on the table to delete from it, as well as the SELECT privilege for any table in the USING clause or whose values are read in the condition.

The WITH clause allows you to specify one or more subqueries that can be referenced by name in the DELETE query. See Section 7.8 and SELECT for details.

The name (optionally schema-qualified) of the table to delete rows from. If ONLY is specified before the table name, matching rows are deleted from the named table only. If ONLY is not specified, matching rows are also deleted from any tables inheriting from the named table. Optionally, * can be specified after the table name to explicitly indicate that descendant tables are included.

A substitute name for the target table. When an alias is provided, it completely hides the actual name of the table. For example, given DELETE FROM foo AS f, the remainder of the DELETE statement must refer to this table as f not foo.

A table expression allowing columns from other tables to appear in the WHERE condition. This uses the same syntax as the FROM clause of a SELECT statement; for example, an alias for the table name can be specified. Do not repeat the target table as a from_item unless you wish to set up a self-join (in which case it must appear with an alias in the from_item).

An expression that returns a value of type boolean. Only rows for which this expression returns true will be deleted.

The name of the cursor to use in a WHERE CURRENT OF condition. The row to be deleted is the one most recently fetched from this cursor. The cursor must be a non-grouping query on the DELETE's target table. Note that WHERE CURRENT OF cannot be specified together with a Boolean condition. See DECLARE for more information about using cursors with WHERE CURRENT OF.

An optional substitute name for OLD or NEW rows in the RETURNING list.

By default, old values from the target table can be returned by writing OLD.column_name or OLD.*, and new values can be returned by writing NEW.column_name or NEW.*. When an alias is provided, these names are hidden and the old or new rows must be referred to using the alias. For example RETURNING WITH (OLD AS o, NEW AS n) o.*, n.*.

An expression to be computed and returned by the DELETE command after each row is deleted. The expression can use any column names of the table named by table_name or table(s) listed in USING. Write * to return all columns.

A column name or * may be qualified using OLD or NEW, or the corresponding output_alias for OLD or NEW, to cause old or new values to be returned. An unqualified column name, or *, or a column name or * qualified using the target table name or alias will return old values.

For a simple DELETE, all new values will be NULL. However, if an ON DELETE rule causes an INSERT or UPDATE to be executed instead, the new values may be non-NULL.

A name to use for a returned column.

On successful completion, a DELETE command returns a command tag of the form

The count is the number of rows deleted. Note that the number may be less than the number of rows that matched the condition when deletes were suppressed by a BEFORE DELETE trigger. If count is 0, no rows were deleted by the query (this is not considered an error).

If the DELETE command contains a RETURNING clause, the result will be similar to that of a SELECT statement containing the columns and values defined in the RETURNING list, computed over the row(s) deleted by the command.

PostgreSQL lets you reference columns of other tables in the WHERE condition by specifying the other tables in the USING clause. For example, to delete all films produced by a given producer, one can do:

What is essentially happening here is a join between films and producers, with all successfully joined films rows being marked for deletion. This syntax is not standard. A more standard way to do it is:

In some cases the join style is easier to write or faster to execute than the sub-select style.

Delete all films but musicals:

Clear the table films:

Delete completed tasks, returning full details of the deleted rows:

Delete the row of tasks on which the cursor c_tasks is currently positioned:

While there is no LIMIT clause for DELETE, it is possible to get a similar effect using the same method described in the documentation of UPDATE:

This command conforms to the SQL standard, except that the USING and RETURNING clauses are PostgreSQL extensions, as is the ability to use WITH with DELETE.

**Examples:**

Example 1 (unknown):
```unknown
cursor_name
```

Example 2 (unknown):
```unknown
output_alias
```

Example 3 (unknown):
```unknown
output_expression
```

Example 4 (unknown):
```unknown
output_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-droplanguage.html

**Contents:**
- DROP LANGUAGE
- Synopsis
- Description
  - Note
- Parameters
- Examples
- Compatibility
- See Also

DROP LANGUAGE — remove a procedural language

DROP LANGUAGE removes the definition of a previously registered procedural language. You must be a superuser or the owner of the language to use DROP LANGUAGE.

As of PostgreSQL 9.1, most procedural languages have been made into “extensions”, and should therefore be removed with DROP EXTENSION not DROP LANGUAGE.

Do not throw an error if the language does not exist. A notice is issued in this case.

The name of an existing procedural language.

Automatically drop objects that depend on the language (such as functions in the language), and in turn all objects that depend on those objects (see Section 5.15).

Refuse to drop the language if any objects depend on it. This is the default.

This command removes the procedural language plsample:

There is no DROP LANGUAGE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
DROP LANGUAGE
```

Example 2 (unknown):
```unknown
DROP LANGUAGE
```

Example 3 (unknown):
```unknown
DROP EXTENSION
```

Example 4 (unknown):
```unknown
DROP LANGUAGE
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-values.html

**Contents:**
- VALUES
- Synopsis
- Description
- Parameters
- Notes
- Examples
  - Tip
- Compatibility
- See Also

VALUES — compute a set of rows

VALUES computes a row value or set of row values specified by value expressions. It is most commonly used to generate a “constant table” within a larger command, but it can be used on its own.

When more than one row is specified, all the rows must have the same number of elements. The data types of the resulting table's columns are determined by combining the explicit or inferred types of the expressions appearing in that column, using the same rules as for UNION (see Section 10.5).

Within larger commands, VALUES is syntactically allowed anywhere that SELECT is. Because it is treated like a SELECT by the grammar, it is possible to use the ORDER BY, LIMIT (or equivalently FETCH FIRST), and OFFSET clauses with a VALUES command.

A constant or expression to compute and insert at the indicated place in the resulting table (set of rows). In a VALUES list appearing at the top level of an INSERT, an expression can be replaced by DEFAULT to indicate that the destination column's default value should be inserted. DEFAULT cannot be used when VALUES appears in other contexts.

An expression or integer constant indicating how to sort the result rows. This expression can refer to the columns of the VALUES result as column1, column2, etc. For more details see ORDER BY Clause in the SELECT documentation.

A sorting operator. For details see ORDER BY Clause in the SELECT documentation.

The maximum number of rows to return. For details see LIMIT Clause in the SELECT documentation.

The number of rows to skip before starting to return rows. For details see LIMIT Clause in the SELECT documentation.

VALUES lists with very large numbers of rows should be avoided, as you might encounter out-of-memory failures or poor performance. VALUES appearing within INSERT is a special case (because the desired column types are known from the INSERT's target table, and need not be inferred by scanning the VALUES list), so it can handle larger lists than are practical in other contexts.

A bare VALUES command:

This will return a table of two columns and three rows. It's effectively equivalent to:

More usually, VALUES is used within a larger SQL command. The most common use is in INSERT:

In the context of INSERT, entries of a VALUES list can be DEFAULT to indicate that the column default should be used here instead of specifying a value:

VALUES can also be used where a sub-SELECT might be written, for example in a FROM clause:

Note that an AS clause is required when VALUES is used in a FROM clause, just as is true for SELECT. It is not required that the AS clause specify names for all the columns, but it's good practice to do so. (The default column names for VALUES are column1, column2, etc. in PostgreSQL, but these names might be different in other database systems.)

When VALUES is used in INSERT, the values are all automatically coerced to the data type of the corresponding destination column. When it's used in other contexts, it might be necessary to specify the correct data type. If the entries are all quoted literal constants, coercing the first is sufficient to determine the assumed type for all:

For simple IN tests, it's better to rely on the list-of-scalars form of IN than to write a VALUES query as shown above. The list of scalars method requires less writing and is often more efficient.

VALUES conforms to the SQL standard. LIMIT and OFFSET are PostgreSQL extensions; see also under SELECT.

**Examples:**

Example 1 (unknown):
```unknown
sort_expression
```

Example 2 (unknown):
```unknown
FETCH FIRST
```

Example 3 (unknown):
```unknown
sort_expression
```

Example 4 (unknown):
```unknown
VALUES (1, 'one'), (2, 'two'), (3, 'three');
```

---


---

