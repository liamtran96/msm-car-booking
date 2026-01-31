# PostgreSQL - Protocol (Part 4)

## 54.7. Message Formats #


**URL:** https://www.postgresql.org/docs/18/protocol-message-formats.html

**Contents:**
- 54.7. Message Formats #

This section describes the detailed format of each message. Each is marked to indicate that it can be sent by a frontend (F), a backend (B), or both (F & B). Notice that although each message includes a byte count at the beginning, most messages are defined so that the message end can be found without reference to the byte count. This is for historical reasons, as the original, now-obsolete protocol version 2 did not have an explicit length field. It also aids validity checking though.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that the authentication was successful.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that Kerberos V5 authentication is required.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that a clear-text password is required.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that an MD5-encrypted password is required.

The salt to use when encrypting the password.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that GSSAPI authentication is required.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that this message contains GSSAPI or SSPI data.

GSSAPI or SSPI authentication data.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that SSPI authentication is required.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that SASL authentication is required.

The message body is a list of SASL authentication mechanisms, in the server's order of preference. A zero byte is required as terminator after the last authentication mechanism name. For each mechanism, there is the following:

Name of a SASL authentication mechanism.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that this message contains a SASL challenge.

SASL data, specific to the SASL mechanism being used.

Identifies the message as an authentication request.

Length of message contents in bytes, including self.

Specifies that SASL authentication has completed.

SASL outcome "additional data", specific to the SASL mechanism being used.

Identifies the message as cancellation key data. The frontend must save these values if it wishes to be able to issue CancelRequest messages later.

Length of message contents in bytes, including self.

The process ID of this backend.

The secret key of this backend. This field extends to the end of the message, indicated by the length field.

The minimum and maximum key length are 4 and 256 bytes, respectively. The PostgreSQL server only sends keys up to 32 bytes, but the larger maximum size allows for future server versions, as well as connection poolers and other middleware, to use longer keys. One possible use case is augmenting the server's key with extra information. Middleware is therefore also encouraged to not use up all of the bytes, in case multiple middleware applications are layered on top of each other, each of which may wrap the key with extra data.

Before protocol version 3.2, the secret key was always 4 bytes long.

Identifies the message as a Bind command.

Length of message contents in bytes, including self.

The name of the destination portal (an empty string selects the unnamed portal).

The name of the source prepared statement (an empty string selects the unnamed prepared statement).

The number of parameter format codes that follow (denoted C below). This can be zero to indicate that there are no parameters or that the parameters all use the default format (text); or one, in which case the specified format code is applied to all parameters; or it can equal the actual number of parameters.

The parameter format codes. Each must presently be zero (text) or one (binary).

The number of parameter values that follow (possibly zero). This must match the number of parameters needed by the query.

Next, the following pair of fields appear for each parameter:

The length of the parameter value, in bytes (this count does not include itself). Can be zero. As a special case, -1 indicates a NULL parameter value. No value bytes follow in the NULL case.

The value of the parameter, in the format indicated by the associated format code. n is the above length.

After the last parameter, the following fields appear:

The number of result-column format codes that follow (denoted R below). This can be zero to indicate that there are no result columns or that the result columns should all use the default format (text); or one, in which case the specified format code is applied to all result columns (if any); or it can equal the actual number of result columns of the query.

The result-column format codes. Each must presently be zero (text) or one (binary).

Identifies the message as a Bind-complete indicator.

Length of message contents in bytes, including self.

Length of message contents in bytes, including self.

The cancel request code. The value is chosen to contain 1234 in the most significant 16 bits, and 5678 in the least significant 16 bits. (To avoid confusion, this code must not be the same as any protocol version number.)

The process ID of the target backend.

The secret key for the target backend. This field extends to the end of the message, indicated by the length field. The maximum key length is 256 bytes.

Before protocol version 3.2, the secret key was always 4 bytes long.

Identifies the message as a Close command.

Length of message contents in bytes, including self.

'S' to close a prepared statement; or 'P' to close a portal.

The name of the prepared statement or portal to close (an empty string selects the unnamed prepared statement or portal).

Identifies the message as a Close-complete indicator.

Length of message contents in bytes, including self.

Identifies the message as a command-completed response.

Length of message contents in bytes, including self.

The command tag. This is usually a single word that identifies which SQL command was completed.

For an INSERT command, the tag is INSERT oid rows, where rows is the number of rows inserted. oid used to be the object ID of the inserted row if rows was 1 and the target table had OIDs, but OIDs system columns are not supported anymore; therefore oid is always 0.

For a DELETE command, the tag is DELETE rows where rows is the number of rows deleted.

For an UPDATE command, the tag is UPDATE rows where rows is the number of rows updated.

For a MERGE command, the tag is MERGE rows where rows is the number of rows inserted, updated, or deleted.

For a SELECT or CREATE TABLE AS command, the tag is SELECT rows where rows is the number of rows retrieved.

For a MOVE command, the tag is MOVE rows where rows is the number of rows the cursor's position has been changed by.

For a FETCH command, the tag is FETCH rows where rows is the number of rows that have been retrieved from the cursor.

For a COPY command, the tag is COPY rows where rows is the number of rows copied. (Note: the row count appears only in PostgreSQL 8.2 and later.)

Identifies the message as COPY data.

Length of message contents in bytes, including self.

Data that forms part of a COPY data stream. Messages sent from the backend will always correspond to single data rows, but messages sent by frontends might divide the data stream arbitrarily.

Identifies the message as a COPY-complete indicator.

Length of message contents in bytes, including self.

Identifies the message as a COPY-failure indicator.

Length of message contents in bytes, including self.

An error message to report as the cause of failure.

Identifies the message as a Start Copy In response. The frontend must now send copy-in data (if not prepared to do so, send a CopyFail message).

Length of message contents in bytes, including self.

0 indicates the overall COPY format is textual (rows separated by newlines, columns separated by separator characters, etc.). 1 indicates the overall copy format is binary (similar to DataRow format). See COPY for more information.

The number of columns in the data to be copied (denoted N below).

The format codes to be used for each column. Each must presently be zero (text) or one (binary). All must be zero if the overall copy format is textual.

Identifies the message as a Start Copy Out response. This message will be followed by copy-out data.

Length of message contents in bytes, including self.

0 indicates the overall COPY format is textual (rows separated by newlines, columns separated by separator characters, etc.). 1 indicates the overall copy format is binary (similar to DataRow format). See COPY for more information.

The number of columns in the data to be copied (denoted N below).

The format codes to be used for each column. Each must presently be zero (text) or one (binary). All must be zero if the overall copy format is textual.

Identifies the message as a Start Copy Both response. This message is used only for Streaming Replication.

Length of message contents in bytes, including self.

0 indicates the overall COPY format is textual (rows separated by newlines, columns separated by separator characters, etc.). 1 indicates the overall copy format is binary (similar to DataRow format). See COPY for more information.

The number of columns in the data to be copied (denoted N below).

The format codes to be used for each column. Each must presently be zero (text) or one (binary). All must be zero if the overall copy format is textual.

Identifies the message as a data row.

Length of message contents in bytes, including self.

The number of column values that follow (possibly zero).

Next, the following pair of fields appear for each column:

The length of the column value, in bytes (this count does not include itself). Can be zero. As a special case, -1 indicates a NULL column value. No value bytes follow in the NULL case.

The value of the column, in the format indicated by the associated format code. n is the above length.

Identifies the message as a Describe command.

Length of message contents in bytes, including self.

'S' to describe a prepared statement; or 'P' to describe a portal.

The name of the prepared statement or portal to describe (an empty string selects the unnamed prepared statement or portal).

Identifies the message as a response to an empty query string. (This substitutes for CommandComplete.)

Length of message contents in bytes, including self.

Identifies the message as an error.

Length of message contents in bytes, including self.

The message body consists of one or more identified fields, followed by a zero byte as a terminator. Fields can appear in any order. For each field there is the following:

A code identifying the field type; if zero, this is the message terminator and no string follows. The presently defined field types are listed in Section 54.8. Since more field types might be added in future, frontends should silently ignore fields of unrecognized type.

Identifies the message as an Execute command.

Length of message contents in bytes, including self.

The name of the portal to execute (an empty string selects the unnamed portal).

Maximum number of rows to return, if portal contains a query that returns rows (ignored otherwise). Zero denotes “no limit”.

Identifies the message as a Flush command.

Length of message contents in bytes, including self.

Identifies the message as a function call.

Length of message contents in bytes, including self.

Specifies the object ID of the function to call.

The number of argument format codes that follow (denoted C below). This can be zero to indicate that there are no arguments or that the arguments all use the default format (text); or one, in which case the specified format code is applied to all arguments; or it can equal the actual number of arguments.

The argument format codes. Each must presently be zero (text) or one (binary).

Specifies the number of arguments being supplied to the function.

Next, the following pair of fields appear for each argument:

The length of the argument value, in bytes (this count does not include itself). Can be zero. As a special case, -1 indicates a NULL argument value. No value bytes follow in the NULL case.

The value of the argument, in the format indicated by the associated format code. n is the above length.

After the last argument, the following field appears:

The format code for the function result. Must presently be zero (text) or one (binary).

Identifies the message as a function call result.

Length of message contents in bytes, including self.

The length of the function result value, in bytes (this count does not include itself). Can be zero. As a special case, -1 indicates a NULL function result. No value bytes follow in the NULL case.

The value of the function result, in the format indicated by the associated format code. n is the above length.

Length of message contents in bytes, including self.

The GSSAPI Encryption request code. The value is chosen to contain 1234 in the most significant 16 bits, and 5680 in the least significant 16 bits. (To avoid confusion, this code must not be the same as any protocol version number.)

Identifies the message as a GSSAPI or SSPI response. Note that this is also used for SASL and password response messages. The exact message type can be deduced from the context.

Length of message contents in bytes, including self.

GSSAPI/SSPI specific message data.

Identifies the message as a protocol version negotiation message.

Length of message contents in bytes, including self.

Newest minor protocol version supported by the server for the major protocol version requested by the client.

Number of protocol options not recognized by the server.

Then, for protocol option not recognized by the server, there is the following:

Identifies the message as a no-data indicator.

Length of message contents in bytes, including self.

Identifies the message as a notice.

Length of message contents in bytes, including self.

The message body consists of one or more identified fields, followed by a zero byte as a terminator. Fields can appear in any order. For each field there is the following:

A code identifying the field type; if zero, this is the message terminator and no string follows. The presently defined field types are listed in Section 54.8. Since more field types might be added in future, frontends should silently ignore fields of unrecognized type.

Identifies the message as a notification response.

Length of message contents in bytes, including self.

The process ID of the notifying backend process.

The name of the channel that the notify has been raised on.

The “payload” string passed from the notifying process.

Identifies the message as a parameter description.

Length of message contents in bytes, including self.

The number of parameters used by the statement (can be zero).

Then, for each parameter, there is the following:

Specifies the object ID of the parameter data type.

Identifies the message as a run-time parameter status report.

Length of message contents in bytes, including self.

The name of the run-time parameter being reported.

The current value of the parameter.

Identifies the message as a Parse command.

Length of message contents in bytes, including self.

The name of the destination prepared statement (an empty string selects the unnamed prepared statement).

The query string to be parsed.

The number of parameter data types specified (can be zero). Note that this is not an indication of the number of parameters that might appear in the query string, only the number that the frontend wants to prespecify types for.

Then, for each parameter, there is the following:

Specifies the object ID of the parameter data type. Placing a zero here is equivalent to leaving the type unspecified.

Identifies the message as a Parse-complete indicator.

Length of message contents in bytes, including self.

Identifies the message as a password response. Note that this is also used for GSSAPI, SSPI and SASL response messages. The exact message type can be deduced from the context.

Length of message contents in bytes, including self.

The password (encrypted, if requested).

Identifies the message as a portal-suspended indicator. Note this only appears if an Execute message's row-count limit was reached.

Length of message contents in bytes, including self.

*(continued...)*
---

