# PostgreSQL - Protocol (Part 2)

## 54.9. Logical Replication Message Formats #


**URL:** https://www.postgresql.org/docs/18/protocol-logicalrep-message-formats.html

**Contents:**
- 54.9. Logical Replication Message Formats #

This section describes the detailed format of each logical replication message. These messages are either returned by the replication slot SQL interface or are sent by a walsender. In the case of a walsender, they are encapsulated inside replication protocol WAL messages as described in Section 54.4, and generally obey the same message flow as physical replication.

Identifies the message as a begin message.

The final LSN of the transaction.

Commit timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Xid of the transaction.

Identifies the message as a logical decoding message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

Flags; Either 0 for no flags or 1 if the logical decoding message is transactional.

The LSN of the logical decoding message.

The prefix of the logical decoding message.

Length of the content.

The content of the logical decoding message.

Identifies the message as a commit message.

Flags; currently unused.

The LSN of the commit.

The end LSN of the transaction.

Commit timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Identifies the message as an origin message.

The LSN of the commit on the origin server.

Note that there can be multiple Origin messages inside a single transaction.

Identifies the message as a relation message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

Namespace (empty string for pg_catalog).

Replica identity setting for the relation (same as relreplident in pg_class).

Next, the following message part appears for each column included in the publication:

Flags for the column. Currently can be either 0 for no flags or 1 which marks the column as part of the key.

OID of the column's data type.

Type modifier of the column (atttypmod).

Identifies the message as a type message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

OID of the data type.

Namespace (empty string for pg_catalog).

Name of the data type.

Identifies the message as an insert message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

OID of the relation corresponding to the ID in the relation message.

Identifies the following TupleData message as a new tuple.

TupleData message part representing the contents of new tuple.

Identifies the message as an update message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

OID of the relation corresponding to the ID in the relation message.

Identifies the following TupleData submessage as a key. This field is optional and is only present if the update changed data in any of the column(s) that are part of the REPLICA IDENTITY index.

Identifies the following TupleData submessage as an old tuple. This field is optional and is only present if table in which the update happened has REPLICA IDENTITY set to FULL.

TupleData message part representing the contents of the old tuple or primary key. Only present if the previous 'O' or 'K' part is present.

Identifies the following TupleData message as a new tuple.

TupleData message part representing the contents of a new tuple.

The Update message may contain either a 'K' message part or an 'O' message part or neither of them, but never both of them.

Identifies the message as a delete message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

OID of the relation corresponding to the ID in the relation message.

Identifies the following TupleData submessage as a key. This field is present if the table in which the delete has happened uses an index as REPLICA IDENTITY.

Identifies the following TupleData message as an old tuple. This field is present if the table in which the delete happened has REPLICA IDENTITY set to FULL.

TupleData message part representing the contents of the old tuple or primary key, depending on the previous field.

The Delete message may contain either a 'K' message part or an 'O' message part, but never both of them.

Identifies the message as a truncate message.

Xid of the transaction (only present for streamed transactions). This field is available since protocol version 2.

Option bits for TRUNCATE: 1 for CASCADE, 2 for RESTART IDENTITY

OID of the relation corresponding to the ID in the relation message. This field is repeated for each relation.

The following messages (Stream Start, Stream Stop, Stream Commit, and Stream Abort) are available since protocol version 2.

Identifies the message as a stream start message.

Xid of the transaction.

A value of 1 indicates this is the first stream segment for this XID, 0 for any other stream segment.

Identifies the message as a stream stop message.

Identifies the message as a stream commit message.

Xid of the transaction.

Flags; currently unused.

The LSN of the commit.

The end LSN of the transaction.

Commit timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Identifies the message as a stream abort message.

Xid of the transaction.

Xid of the subtransaction (will be same as xid of the transaction for top-level transactions).

The LSN of the abort operation, present only when streaming is set to parallel. This field is available since protocol version 4.

Abort timestamp of the transaction, present only when streaming is set to parallel. The value is in number of microseconds since PostgreSQL epoch (2000-01-01). This field is available since protocol version 4.

The following messages (Begin Prepare, Prepare, Commit Prepared, Rollback Prepared, Stream Prepare) are available since protocol version 3.

Identifies the message as the beginning of a prepared transaction message.

The LSN of the prepare.

The end LSN of the prepared transaction.

Prepare timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Xid of the transaction.

The user defined GID of the prepared transaction.

Identifies the message as a prepared transaction message.

Flags; currently unused.

The LSN of the prepare.

The end LSN of the prepared transaction.

Prepare timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Xid of the transaction.

The user defined GID of the prepared transaction.

Identifies the message as the commit of a prepared transaction message.

Flags; currently unused.

The LSN of the commit of the prepared transaction.

The end LSN of the commit of the prepared transaction.

Commit timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Xid of the transaction.

The user defined GID of the prepared transaction.

Identifies the message as the rollback of a prepared transaction message.

Flags; currently unused.

The end LSN of the prepared transaction.

The end LSN of the rollback of the prepared transaction.

Prepare timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Rollback timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Xid of the transaction.

The user defined GID of the prepared transaction.

Identifies the message as a stream prepared transaction message.

Flags; currently unused.

The LSN of the prepare.

The end LSN of the prepared transaction.

Prepare timestamp of the transaction. The value is in number of microseconds since PostgreSQL epoch (2000-01-01).

Xid of the transaction.

The user defined GID of the prepared transaction.

The following message parts are shared by the above messages.

Next, one of the following submessages appears for each published column:

Identifies the data as NULL value.

Identifies unchanged TOASTed value (the actual value is not sent).

Identifies the data as text formatted value.

Identifies the data as binary formatted value.

Length of the column value.

The value of the column, either in binary or in text format. (As specified in the preceding format byte). n is the above length.

**Examples:**

Example 1 (unknown):
```unknown
relreplident
```

Example 2 (unknown):
```unknown
RESTART IDENTITY
```

---


---

## 54.1. Overview #


**URL:** https://www.postgresql.org/docs/18/protocol-overview.html

**Contents:**
- 54.1. Overview #
  - 54.1.1. Messaging Overview #
  - 54.1.2. Extended Query Overview #
  - 54.1.3. Formats and Format Codes #
  - 54.1.4. Protocol Versions #

The protocol has separate phases for startup and normal operation. In the startup phase, the frontend opens a connection to the server and authenticates itself to the satisfaction of the server. (This might involve a single message, or multiple messages depending on the authentication method being used.) If all goes well, the server then sends status information to the frontend, and finally enters normal operation. Except for the initial startup-request message, this part of the protocol is driven by the server.

During normal operation, the frontend sends queries and other commands to the backend, and the backend sends back query results and other responses. There are a few cases (such as NOTIFY) wherein the backend will send unsolicited messages, but for the most part this portion of a session is driven by frontend requests.

Termination of the session is normally by frontend choice, but can be forced by the backend in certain cases. In any case, when the backend closes the connection, it will roll back any open (incomplete) transaction before exiting.

Within normal operation, SQL commands can be executed through either of two sub-protocols. In the “simple query” protocol, the frontend just sends a textual query string, which is parsed and immediately executed by the backend. In the “extended query” protocol, processing of queries is separated into multiple steps: parsing, binding of parameter values, and execution. This offers flexibility and performance benefits, at the cost of extra complexity.

Normal operation has additional sub-protocols for special operations such as COPY.

All communication is through a stream of messages. The first byte of a message identifies the message type, and the next four bytes specify the length of the rest of the message (this length count includes itself, but not the message-type byte). The remaining contents of the message are determined by the message type. For historical reasons, the very first message sent by the client (the startup message) has no initial message-type byte.

To avoid losing synchronization with the message stream, both servers and clients typically read an entire message into a buffer (using the byte count) before attempting to process its contents. This allows easy recovery if an error is detected while processing the contents. In extreme situations (such as not having enough memory to buffer the message), the receiver can use the byte count to determine how much input to skip before it resumes reading messages.

Conversely, both servers and clients must take care never to send an incomplete message. This is commonly done by marshaling the entire message in a buffer before beginning to send it. If a communications failure occurs partway through sending or receiving a message, the only sensible response is to abandon the connection, since there is little hope of recovering message-boundary synchronization.

In the extended-query protocol, execution of SQL commands is divided into multiple steps. The state retained between steps is represented by two types of objects: prepared statements and portals. A prepared statement represents the result of parsing and semantic analysis of a textual query string. A prepared statement is not in itself ready to execute, because it might lack specific values for parameters. A portal represents a ready-to-execute or already-partially-executed statement, with any missing parameter values filled in. (For SELECT statements, a portal is equivalent to an open cursor, but we choose to use a different term since cursors don't handle non-SELECT statements.)

The overall execution cycle consists of a parse step, which creates a prepared statement from a textual query string; a bind step, which creates a portal given a prepared statement and values for any needed parameters; and an execute step that runs a portal's query. In the case of a query that returns rows (SELECT, SHOW, etc.), the execute step can be told to fetch only a limited number of rows, so that multiple execute steps might be needed to complete the operation.

The backend can keep track of multiple prepared statements and portals (but note that these exist only within a session, and are never shared across sessions). Existing prepared statements and portals are referenced by names assigned when they were created. In addition, an “unnamed” prepared statement and portal exist. Although these behave largely the same as named objects, operations on them are optimized for the case of executing a query only once and then discarding it, whereas operations on named objects are optimized on the expectation of multiple uses.

Data of a particular data type might be transmitted in any of several different formats. As of PostgreSQL 7.4 the only supported formats are “text” and “binary”, but the protocol makes provision for future extensions. The desired format for any value is specified by a format code. Clients can specify a format code for each transmitted parameter value and for each column of a query result. Text has format code zero, binary has format code one, and all other format codes are reserved for future definition.

The text representation of values is whatever strings are produced and accepted by the input/output conversion functions for the particular data type. In the transmitted representation, there is no trailing null character; the frontend must add one to received values if it wants to process them as C strings. (The text format does not allow embedded nulls, by the way.)

Binary representations for integers use network byte order (most significant byte first). For other data types consult the documentation or source code to learn about the binary representation. Keep in mind that binary representations for complex data types might change across server versions; the text format is usually the more portable choice.

The current, latest version of the protocol is version 3.2. However, for backwards compatibility with old server versions and middleware that don't support the version negotiation yet, libpq still uses protocol version 3.0 by default.

A single server can support multiple protocol versions. The initial startup-request message tells the server which protocol version the client is attempting to use. If the major version requested by the client is not supported by the server, the connection will be rejected (for example, this would occur if the client requested protocol version 4.0, which does not exist as of this writing). If the minor version requested by the client is not supported by the server (e.g., the client requests version 3.2, but the server supports only 3.0), the server may either reject the connection or may respond with a NegotiateProtocolVersion message containing the highest minor protocol version which it supports. The client may then choose either to continue with the connection using the specified protocol version or to abort the connection.

The protocol negotiation was introduced in PostgreSQL version 9.3.21. Earlier versions would reject the connection if the client requested a minor version that was not supported by the server.

Table 54.1 shows the currently supported protocol versions.

Table 54.1. Protocol Versions

---


---

## 55.1. Formatting #


**URL:** https://www.postgresql.org/docs/18/source-format.html

**Contents:**
- 55.1. Formatting #

Source code formatting uses 4 column tab spacing, with tabs preserved (i.e., tabs are not expanded to spaces). Each logical indentation level is one additional tab stop.

Layout rules (brace positioning, etc.) follow BSD conventions. In particular, curly braces for the controlled blocks of if, while, switch, etc. go on their own lines.

Limit line lengths so that the code is readable in an 80-column window. (This doesn't mean that you must never go past 80 columns. For instance, breaking a long error message string in arbitrary places just to keep the code within 80 columns is probably not a net gain in readability.)

To maintain a consistent coding style, do not use C++ style comments (// comments). pgindent will replace them with /* ... */.

The preferred style for multi-line comment blocks is

Note that comment blocks that begin in column 1 will be preserved as-is by pgindent, but it will re-flow indented comment blocks as though they were plain text. If you want to preserve the line breaks in an indented block, add dashes like this:

While submitted patches do not absolutely have to follow these formatting rules, it's a good idea to do so. Your code will get run through pgindent before the next release, so there's no point in making it look nice under some other set of formatting conventions. A good rule of thumb for patches is “make the new code look like the existing code around it”.

The src/tools/editors directory contains sample settings files that can be used with the Emacs, xemacs or vim editors to help ensure that they format code according to these conventions.

If you'd like to run pgindent locally to help make your code match project style, see the src/tools/pgindent directory.

The text browsing tools more and less can be invoked as:

to make them show tabs appropriately.

**Examples:**

Example 1 (markdown):
```markdown
/*
 * comment text begins here
 * and continues here
 */
```

Example 2 (yaml):
```yaml
/*----------
     * comment text begins here
     * and continues here
     *----------
     */
```

Example 3 (unknown):
```unknown
src/tools/editors
```

Example 4 (unknown):
```unknown
src/tools/pgindent
```

---


---

