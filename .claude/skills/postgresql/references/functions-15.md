# PostgreSQL - Functions (Part 15)

## 9.30. Event Trigger Functions #


**URL:** https://www.postgresql.org/docs/18/functions-event-triggers.html

**Contents:**
- 9.30. Event Trigger Functions #
  - 9.30.1. Capturing Changes at Command End #
  - 9.30.2. Processing Objects Dropped by a DDL Command #
  - 9.30.3. Handling a Table Rewrite Event #

PostgreSQL provides these helper functions to retrieve information from event triggers.

For more information about event triggers, see Chapter 38.

pg_event_trigger_ddl_commands returns a list of DDL commands executed by each user action, when invoked in a function attached to a ddl_command_end event trigger. If called in any other context, an error is raised. pg_event_trigger_ddl_commands returns one row for each base command executed; some commands that are a single SQL sentence may return more than one row. This function returns the following columns:

pg_event_trigger_dropped_objects returns a list of all objects dropped by the command in whose sql_drop event it is called. If called in any other context, an error is raised. This function returns the following columns:

The pg_event_trigger_dropped_objects function can be used in an event trigger like this:

The functions shown in Table 9.111 provide information about a table for which a table_rewrite event has just been called. If called in any other context, an error is raised.

Table 9.111. Table Rewrite Information Functions

pg_event_trigger_table_rewrite_oid () → oid

Returns the OID of the table about to be rewritten.

pg_event_trigger_table_rewrite_reason () → integer

Returns a code explaining the reason(s) for rewriting. The value is a bitmap built from the following values: 1 (the table has changed its persistence), 2 (default value of a column has changed), 4 (a column has a new data type) and 8 (the table access method has changed).

These functions can be used in an event trigger like this:

**Examples:**

Example 1 (unknown):
```unknown
pg_event_trigger_ddl_commands
```

Example 2 (unknown):
```unknown
setof record
```

Example 3 (unknown):
```unknown
pg_event_trigger_ddl_commands
```

Example 4 (unknown):
```unknown
ddl_command_end
```

---


---

## 9.23. Merge Support Functions #


**URL:** https://www.postgresql.org/docs/18/functions-merge-support.html

**Contents:**
- 9.23. Merge Support Functions #

PostgreSQL includes one merge support function that may be used in the RETURNING list of a MERGE command to identify the action taken for each row; see Table 9.68.

Table 9.68. Merge Support Functions

merge_action ( ) → text

Returns the merge action command executed for the current row. This will be 'INSERT', 'UPDATE', or 'DELETE'.

Note that this function can only be used in the RETURNING list of a MERGE command. It is an error to use it in any other part of a query.

**Examples:**

Example 1 (unknown):
```unknown
merge_action
```

Example 2 (julia):
```julia
MERGE INTO products p
  USING stock s ON p.product_id = s.product_id
  WHEN MATCHED AND s.quantity > 0 THEN
    UPDATE SET in_stock = true, quantity = s.quantity
  WHEN MATCHED THEN
    UPDATE SET in_stock = false, quantity = 0
  WHEN NOT MATCHED THEN
    INSERT (product_id, in_stock, quantity)
      VALUES (s.product_id, true, s.quantity)
  RETURNING merge_action(), p.*;

 merge_action | product_id | in_stock | quantity
--------------+------------+----------+----------
 UPDATE       |       1001 | t        |       50
 UPDATE       |       1002 | f        |        0
 INSERT       |       1003 | t        |       10
```

---


---

