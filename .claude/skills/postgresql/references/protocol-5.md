# PostgreSQL - Protocol (Part 5)

## 54.7. Message Formats # (continued)

Identifies the message as a simple query.

Length of message contents in bytes, including self.

The query string itself.

Identifies the message type. ReadyForQuery is sent whenever the backend is ready for a new query cycle.

Length of message contents in bytes, including self.

Current backend transaction status indicator. Possible values are 'I' if idle (not in a transaction block); 'T' if in a transaction block; or 'E' if in a failed transaction block (queries will be rejected until block is ended).

Identifies the message as a row description.

Length of message contents in bytes, including self.

Specifies the number of fields in a row (can be zero).

Then, for each field, there is the following:

If the field can be identified as a column of a specific table, the object ID of the table; otherwise zero.

If the field can be identified as a column of a specific table, the attribute number of the column; otherwise zero.

The object ID of the field's data type.

The data type size (see pg_type.typlen). Note that negative values denote variable-width types.

The type modifier (see pg_attribute.atttypmod). The meaning of the modifier is type-specific.

The format code being used for the field. Currently will be zero (text) or one (binary). In a RowDescription returned from the statement variant of Describe, the format code is not yet known and will always be zero.

Identifies the message as an initial SASL response. Note that this is also used for GSSAPI, SSPI and password response messages. The exact message type is deduced from the context.

Length of message contents in bytes, including self.

Name of the SASL authentication mechanism that the client selected.

Length of SASL mechanism specific "Initial Client Response" that follows, or -1 if there is no Initial Response.

SASL mechanism specific "Initial Response".

Identifies the message as a SASL response. Note that this is also used for GSSAPI, SSPI and password response messages. The exact message type can be deduced from the context.

Length of message contents in bytes, including self.

SASL mechanism specific message data.

Length of message contents in bytes, including self.

The SSL request code. The value is chosen to contain 1234 in the most significant 16 bits, and 5679 in the least significant 16 bits. (To avoid confusion, this code must not be the same as any protocol version number.)

Length of message contents in bytes, including self.

The protocol version number. The most significant 16 bits are the major version number (3 for the protocol described here). The least significant 16 bits are the minor version number (2 for the protocol described here).

The protocol version number is followed by one or more pairs of parameter name and value strings. A zero byte is required as a terminator after the last name/value pair. Parameters can appear in any order. user is required, others are optional. Each parameter is specified as:

The parameter name. Currently recognized names are:

The database user name to connect as. Required; there is no default.

The database to connect to. Defaults to the user name.

Command-line arguments for the backend. (This is deprecated in favor of setting individual run-time parameters.) Spaces within this string are considered to separate arguments, unless escaped with a backslash (\); write \\ to represent a literal backslash.

Used to connect in streaming replication mode, where a small set of replication commands can be issued instead of SQL statements. Value can be true, false, or database, and the default is false. See Section 54.4 for details.

In addition to the above, other parameters may be listed. Parameter names beginning with _pq_. are reserved for use as protocol extensions, while others are treated as run-time parameters to be set at backend start time. Such settings will be applied during backend start (after parsing the command-line arguments if any) and will act as session defaults.

Identifies the message as a Sync command.

Length of message contents in bytes, including self.

Identifies the message as a termination.

Length of message contents in bytes, including self.

**Examples:**

Example 1 (unknown):
```unknown
INSERT oid rows
```

Example 2 (unknown):
```unknown
DELETE rows
```

Example 3 (sql):
```sql
UPDATE rows
```

Example 4 (sql):
```sql
CREATE TABLE AS
```

---


---

## 55.4. Miscellaneous Coding Conventions #


**URL:** https://www.postgresql.org/docs/18/source-conventions.html

**Contents:**
- 55.4. Miscellaneous Coding Conventions #
  - C Standard #
  - Function-Like Macros and Inline Functions #
  - Writing Signal Handlers #
  - Calling Function Pointers #

Code in PostgreSQL should only rely on language features available in the C99 standard. That means a conforming C99 compiler has to be able to compile postgres, at least aside from a few platform dependent pieces.

A few features included in the C99 standard are, at this time, not permitted to be used in core PostgreSQL code. This currently includes variable length arrays, intermingled declarations and code, // comments, universal character names. Reasons for that include portability and historical practices.

Features from later revisions of the C standard or compiler specific features can be used, if a fallback is provided.

For example _Static_assert() and __builtin_constant_p are currently used, even though they are from newer revisions of the C standard and a GCC extension respectively. If not available we respectively fall back to using a C99 compatible replacement that performs the same checks, but emits rather cryptic messages and do not use __builtin_constant_p.

Both macros with arguments and static inline functions may be used. The latter are preferable if there are multiple-evaluation hazards when written as a macro, as e.g., the case with

or when the macro would be very long. In other cases it's only possible to use macros, or at least easier. For example because expressions of various types need to be passed to the macro.

When the definition of an inline function references symbols (i.e., variables, functions) that are only available as part of the backend, the function may not be visible when included from frontend code.

In this example CurrentMemoryContext, which is only available in the backend, is referenced and the function thus hidden with a #ifndef FRONTEND. This rule exists because some compilers emit references to symbols contained in inline functions even if the function is not used.

To be suitable to run inside a signal handler code has to be written very carefully. The fundamental problem is that, unless blocked, a signal handler can interrupt code at any time. If code inside the signal handler uses the same state as code outside chaos may ensue. As an example consider what happens if a signal handler tries to acquire a lock that's already held in the interrupted code.

Barring special arrangements code in signal handlers may only call async-signal safe functions (as defined in POSIX) and access variables of type volatile sig_atomic_t. A few functions in postgres are also deemed signal safe, importantly SetLatch().

In most cases signal handlers should do nothing more than note that a signal has arrived, and wake up code running outside of the handler using a latch. An example of such a handler is the following:

For clarity, it is preferred to explicitly dereference a function pointer when calling the pointed-to function if the pointer is a simple variable, for example:

(even though emit_log_hook(edata) would also work). When the function pointer is part of a structure, then the extra punctuation can and usually should be omitted, for example:

**Examples:**

Example 1 (unknown):
```unknown
_Static_assert()
```

Example 2 (unknown):
```unknown
__builtin_constant_p
```

Example 3 (unknown):
```unknown
__builtin_constant_p
```

Example 4 (unknown):
```unknown
static inline
```

---


---

## 54.8. Error and Notice Message Fields #


**URL:** https://www.postgresql.org/docs/18/protocol-error-fields.html

**Contents:**
- 54.8. Error and Notice Message Fields #
  - Note

This section describes the fields that can appear in ErrorResponse and NoticeResponse messages. Each field type has a single-byte identification token. Note that any given field type should appear at most once per message.

Severity: the field contents are ERROR, FATAL, or PANIC (in an error message), or WARNING, NOTICE, DEBUG, INFO, or LOG (in a notice message), or a localized translation of one of these. Always present.

Severity: the field contents are ERROR, FATAL, or PANIC (in an error message), or WARNING, NOTICE, DEBUG, INFO, or LOG (in a notice message). This is identical to the S field except that the contents are never localized. This is present only in messages generated by PostgreSQL versions 9.6 and later.

Code: the SQLSTATE code for the error (see Appendix A). Not localizable. Always present.

Message: the primary human-readable error message. This should be accurate but terse (typically one line). Always present.

Detail: an optional secondary error message carrying more detail about the problem. Might run to multiple lines.

Hint: an optional suggestion what to do about the problem. This is intended to differ from Detail in that it offers advice (potentially inappropriate) rather than hard facts. Might run to multiple lines.

Position: the field value is a decimal ASCII integer, indicating an error cursor position as an index into the original query string. The first character has index 1, and positions are measured in characters not bytes.

Internal position: this is defined the same as the P field, but it is used when the cursor position refers to an internally generated command rather than the one submitted by the client. The q field will always appear when this field appears.

Internal query: the text of a failed internally-generated command. This could be, for example, an SQL query issued by a PL/pgSQL function.

Where: an indication of the context in which the error occurred. Presently this includes a call stack traceback of active procedural language functions and internally-generated queries. The trace is one entry per line, most recent first.

Schema name: if the error was associated with a specific database object, the name of the schema containing that object, if any.

Table name: if the error was associated with a specific table, the name of the table. (Refer to the schema name field for the name of the table's schema.)

Column name: if the error was associated with a specific table column, the name of the column. (Refer to the schema and table name fields to identify the table.)

Data type name: if the error was associated with a specific data type, the name of the data type. (Refer to the schema name field for the name of the data type's schema.)

Constraint name: if the error was associated with a specific constraint, the name of the constraint. Refer to fields listed above for the associated table or domain. (For this purpose, indexes are treated as constraints, even if they weren't created with constraint syntax.)

File: the file name of the source-code location where the error was reported.

Line: the line number of the source-code location where the error was reported.

Routine: the name of the source-code routine reporting the error.

The fields for schema name, table name, column name, data type name, and constraint name are supplied only for a limited number of error types; see Appendix A. Frontends should not assume that the presence of any of these fields guarantees the presence of another field. Core error sources observe the interrelationships noted above, but user-defined functions may use these fields in other ways. In the same vein, clients should not assume that these fields denote contemporary objects in the current database.

The client is responsible for formatting displayed information to meet its needs; in particular it should break long lines as needed. Newline characters appearing in the error message fields should be treated as paragraph breaks, not line breaks.

---


---

## 54.10. Summary of Changes since Protocol 2.0 #


**URL:** https://www.postgresql.org/docs/18/protocol-changes.html

**Contents:**
- 54.10. Summary of Changes since Protocol 2.0 #

This section provides a quick checklist of changes, for the benefit of developers trying to update existing client libraries to protocol 3.0.

The initial startup packet uses a flexible list-of-strings format instead of a fixed format. Notice that session default values for run-time parameters can now be specified directly in the startup packet. (Actually, you could do that before using the options field, but given the limited width of options and the lack of any way to quote whitespace in the values, it wasn't a very safe technique.)

All messages now have a length count immediately following the message type byte (except for startup packets, which have no type byte). Also note that PasswordMessage now has a type byte.

ErrorResponse and NoticeResponse ('E' and 'N') messages now contain multiple fields, from which the client code can assemble an error message of the desired level of verbosity. Note that individual fields will typically not end with a newline, whereas the single string sent in the older protocol always did.

The ReadyForQuery ('Z') message includes a transaction status indicator.

The distinction between BinaryRow and DataRow message types is gone; the single DataRow message type serves for returning data in all formats. Note that the layout of DataRow has changed to make it easier to parse. Also, the representation of binary values has changed: it is no longer directly tied to the server's internal representation.

There is a new “extended query” sub-protocol, which adds the frontend message types Parse, Bind, Execute, Describe, Close, Flush, and Sync, and the backend message types ParseComplete, BindComplete, PortalSuspended, ParameterDescription, NoData, and CloseComplete. Existing clients do not have to concern themselves with this sub-protocol, but making use of it might allow improvements in performance or functionality.

COPY data is now encapsulated into CopyData and CopyDone messages. There is a well-defined way to recover from errors during COPY. The special “\.” last line is not needed anymore, and is not sent during COPY OUT. (It is still recognized as a terminator during text-mode COPY IN, but not in CSV mode. The text-mode behavior is deprecated and may eventually be removed.) Binary COPY is supported. The CopyInResponse and CopyOutResponse messages include fields indicating the number of columns and the format of each column.

The layout of FunctionCall and FunctionCallResponse messages has changed. FunctionCall can now support passing NULL arguments to functions. It also can handle passing parameters and retrieving results in either text or binary format. There is no longer any reason to consider FunctionCall a potential security hole, since it does not offer direct access to internal server data representations.

The backend sends ParameterStatus ('S') messages during connection startup for all parameters it considers interesting to the client library. Subsequently, a ParameterStatus message is sent whenever the active value changes for any of these parameters.

The RowDescription ('T') message carries new table OID and column number fields for each column of the described row. It also shows the format code for each column.

The CursorResponse ('P') message is no longer generated by the backend.

The NotificationResponse ('A') message has an additional string field, which can carry a “payload” string passed from the NOTIFY event sender.

The EmptyQueryResponse ('I') message used to include an empty string parameter; this has been removed.

---


---

## 54.6. Message Data Types #


**URL:** https://www.postgresql.org/docs/18/protocol-message-types.html

**Contents:**
- 54.6. Message Data Types #
  - Note

This section describes the base data types used in messages.

An n-bit integer in network byte order (most significant byte first). If i is specified it is the exact value that will appear, otherwise the value is variable. Eg. Int16, Int32(42).

An array of k n-bit integers, each in network byte order. The array length k is always determined by an earlier field in the message. Eg. Int16[M].

A null-terminated string (C-style string). There is no specific length limitation on strings. If s is specified it is the exact value that will appear, otherwise the value is variable. Eg. String, String("user").

There is no predefined limit on the length of a string that can be returned by the backend. Good coding strategy for a frontend is to use an expandable buffer so that anything that fits in memory can be accepted. If that's not feasible, read the full string and discard trailing characters that don't fit into your fixed-size buffer.

Exactly n bytes. If the field width n is not a constant, it is always determinable from an earlier field in the message. If c is specified it is the exact value. Eg. Byte2, Byte1('\n').

---


---

