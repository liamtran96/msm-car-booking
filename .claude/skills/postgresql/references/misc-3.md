# PostgreSQL - Misc (Part 3)

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-scroll-cursor-fetch.html

**Contents:**
- SPI_scroll_cursor_fetch
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_scroll_cursor_fetch — fetch some rows from a cursor

SPI_scroll_cursor_fetch fetches some rows from a cursor. This is equivalent to the SQL command FETCH.

portal containing the cursor

one of FETCH_FORWARD, FETCH_BACKWARD, FETCH_ABSOLUTE or FETCH_RELATIVE

number of rows to fetch for FETCH_FORWARD or FETCH_BACKWARD; absolute row number to fetch for FETCH_ABSOLUTE; or relative row number to fetch for FETCH_RELATIVE

SPI_processed and SPI_tuptable are set as in SPI_execute if successful.

See the SQL FETCH command for details of the interpretation of the direction and count parameters.

Direction values other than FETCH_FORWARD may fail if the cursor's plan was not created with the CURSOR_OPT_SCROLL option.

**Examples:**

Example 1 (unknown):
```unknown
SPI_scroll_cursor_fetch
```

Example 2 (unknown):
```unknown
Portal portal
```

Example 3 (unknown):
```unknown
FetchDirection direction
```

Example 4 (unknown):
```unknown
FETCH_FORWARD
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-register-relation.html

**Contents:**
- SPI_register_relation
- Synopsis
- Description
- Arguments
- Return Value

SPI_register_relation — make an ephemeral named relation available by name in SPI queries

SPI_register_relation makes an ephemeral named relation, with associated information, available to queries planned and executed through the current SPI connection.

the ephemeral named relation registry entry

If the execution of the command was successful then the following (nonnegative) value will be returned:

if the relation has been successfully registered by name

On error, one of the following negative values is returned:

if enr is NULL or its name field is NULL

if called from an unconnected C function

if the name specified in the name field of enr is already registered for this connection

**Examples:**

Example 1 (unknown):
```unknown
SPI_register_relation
```

Example 2 (unknown):
```unknown
EphemeralNamedRelation enr
```

Example 3 (unknown):
```unknown
SPI_OK_REL_REGISTER
```

Example 4 (unknown):
```unknown
SPI_ERROR_ARGUMENT
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-connect.html

**Contents:**
- SPI_connect
- Synopsis
- Description
- Return Value

SPI_connect, SPI_connect_ext — connect a C function to the SPI manager

SPI_connect opens a connection from a C function invocation to the SPI manager. You must call this function if you want to execute commands through SPI. Some utility SPI functions can be called from unconnected C functions.

SPI_connect_ext does the same but has an argument that allows passing option flags. Currently, the following option values are available:

Sets the SPI connection to be nonatomic, which means that transaction control calls (SPI_commit, SPI_rollback) are allowed. Otherwise, calling those functions will result in an immediate error.

SPI_connect() is equivalent to SPI_connect_ext(0).

The fact that these functions return int not void is historical. All failure cases are reported via ereport or elog. (In versions before PostgreSQL v10, some but not all failures would be reported with a result value of SPI_ERROR_CONNECT.)

**Examples:**

Example 1 (unknown):
```unknown
SPI_connect
```

Example 2 (unknown):
```unknown
SPI_connect_ext
```

Example 3 (unknown):
```unknown
SPI_OPT_NONATOMIC
```

Example 4 (unknown):
```unknown
SPI_rollback
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-cursor-move.html

**Contents:**
- SPI_cursor_move
- Synopsis
- Description
- Arguments
- Notes

SPI_cursor_move — move a cursor

SPI_cursor_move skips over some number of rows in a cursor. This is equivalent to a subset of the SQL command MOVE (see SPI_scroll_cursor_move for more functionality).

portal containing the cursor

true for move forward, false for move backward

maximum number of rows to move

Moving backward may fail if the cursor's plan was not created with the CURSOR_OPT_SCROLL option.

**Examples:**

Example 1 (unknown):
```unknown
SPI_cursor_move
```

Example 2 (unknown):
```unknown
SPI_scroll_cursor_move
```

Example 3 (unknown):
```unknown
Portal portal
```

Example 4 (unknown):
```unknown
bool forward
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-scroll-cursor-move.html

**Contents:**
- SPI_scroll_cursor_move
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_scroll_cursor_move — move a cursor

SPI_scroll_cursor_move skips over some number of rows in a cursor. This is equivalent to the SQL command MOVE.

portal containing the cursor

one of FETCH_FORWARD, FETCH_BACKWARD, FETCH_ABSOLUTE or FETCH_RELATIVE

number of rows to move for FETCH_FORWARD or FETCH_BACKWARD; absolute row number to move to for FETCH_ABSOLUTE; or relative row number to move to for FETCH_RELATIVE

SPI_processed is set as in SPI_execute if successful. SPI_tuptable is set to NULL, since no rows are returned by this function.

See the SQL FETCH command for details of the interpretation of the direction and count parameters.

Direction values other than FETCH_FORWARD may fail if the cursor's plan was not created with the CURSOR_OPT_SCROLL option.

**Examples:**

Example 1 (unknown):
```unknown
SPI_scroll_cursor_move
```

Example 2 (unknown):
```unknown
Portal portal
```

Example 3 (unknown):
```unknown
FetchDirection direction
```

Example 4 (unknown):
```unknown
FETCH_FORWARD
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-error-message.html

**Contents:**
- dblink_error_message
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_error_message — gets last error message on the named connection

dblink_error_message fetches the most recent remote error message for a given connection.

Name of the connection to use.

Returns last error message, or OK if there has been no error in this connection.

When asynchronous queries are initiated by dblink_send_query, the error message associated with the connection might not get updated until the server's response message is consumed. This typically means that dblink_is_busy or dblink_get_result should be called prior to dblink_error_message, so that any error generated by the asynchronous query will be visible.

**Examples:**

Example 1 (unknown):
```unknown
dblink_error_message
```

Example 2 (unknown):
```unknown
dblink_send_query
```

Example 3 (unknown):
```unknown
dblink_is_busy
```

Example 4 (unknown):
```unknown
dblink_get_result
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-is-cursor-plan.html

**Contents:**
- SPI_is_cursor_plan
- Synopsis
- Description
- Arguments
- Return Value

SPI_is_cursor_plan — return true if a statement prepared by SPI_prepare can be used with SPI_cursor_open

SPI_is_cursor_plan returns true if a statement prepared by SPI_prepare can be passed as an argument to SPI_cursor_open, or false if that is not the case. The criteria are that the plan represents one single command and that this command returns tuples to the caller; for example, SELECT is allowed unless it contains an INTO clause, and UPDATE is allowed only if it contains a RETURNING clause.

prepared statement (returned by SPI_prepare)

true or false to indicate if the plan can produce a cursor or not, with SPI_result set to zero. If it is not possible to determine the answer (for example, if the plan is NULL or invalid, or if called when not connected to SPI), then SPI_result is set to a suitable error code and false is returned.

**Examples:**

Example 1 (unknown):
```unknown
SPI_prepare
```

Example 2 (unknown):
```unknown
SPI_cursor_open
```

Example 3 (unknown):
```unknown
SPI_is_cursor_plan
```

Example 4 (unknown):
```unknown
SPI_prepare
```

---


---

