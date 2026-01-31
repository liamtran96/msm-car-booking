# PostgreSQL - Libpq (Part 8)

## 32.5. Pipeline Mode #


**URL:** https://www.postgresql.org/docs/18/libpq-pipeline-mode.html

**Contents:**
- 32.5. Pipeline Mode #
  - 32.5.1. Using Pipeline Mode #
  - Note
    - 32.5.1.1. Issuing Queries #
    - 32.5.1.2. Processing Results #
    - 32.5.1.3. Error Handling #
  - Note
    - 32.5.1.4. Interleaving Result Processing and Query Dispatch #
  - 32.5.2. Functions Associated with Pipeline Mode #
  - 32.5.3. When to Use Pipeline Mode #

libpq pipeline mode allows applications to send a query without having to read the result of the previously sent query. Taking advantage of the pipeline mode, a client will wait less for the server, since multiple queries/results can be sent/received in a single network transaction.

While pipeline mode provides a significant performance boost, writing clients using the pipeline mode is more complex because it involves managing a queue of pending queries and finding which result corresponds to which query in the queue.

Pipeline mode also generally consumes more memory on both the client and server, though careful and aggressive management of the send/receive queue can mitigate this. This applies whether or not the connection is in blocking or non-blocking mode.

While libpq's pipeline API was introduced in PostgreSQL 14, it is a client-side feature which doesn't require special server support and works on any server that supports the v3 extended query protocol. For more information see Section 54.2.4.

To issue pipelines, the application must switch the connection into pipeline mode, which is done with PQenterPipelineMode. PQpipelineStatus can be used to test whether pipeline mode is active. In pipeline mode, only asynchronous operations that utilize the extended query protocol are permitted, command strings containing multiple SQL commands are disallowed, and so is COPY. Using synchronous command execution functions such as PQfn, PQexec, PQexecParams, PQprepare, PQexecPrepared, PQdescribePrepared, PQdescribePortal, PQclosePrepared, PQclosePortal, is an error condition. PQsendQuery is also disallowed, because it uses the simple query protocol. Once all dispatched commands have had their results processed, and the end pipeline result has been consumed, the application may return to non-pipelined mode with PQexitPipelineMode.

It is best to use pipeline mode with libpq in non-blocking mode. If used in blocking mode it is possible for a client/server deadlock to occur. [15]

After entering pipeline mode, the application dispatches requests using PQsendQueryParams or its prepared-query sibling PQsendQueryPrepared. These requests are queued on the client-side until flushed to the server; this occurs when PQpipelineSync is used to establish a synchronization point in the pipeline, or when PQflush is called. The functions PQsendPrepare, PQsendDescribePrepared, PQsendDescribePortal, PQsendClosePrepared, and PQsendClosePortal also work in pipeline mode. Result processing is described below.

The server executes statements, and returns results, in the order the client sends them. The server will begin executing the commands in the pipeline immediately, not waiting for the end of the pipeline. Note that results are buffered on the server side; the server flushes that buffer when a synchronization point is established with either PQpipelineSync or PQsendPipelineSync, or when PQsendFlushRequest is called. If any statement encounters an error, the server aborts the current transaction and does not execute any subsequent command in the queue until the next synchronization point; a PGRES_PIPELINE_ABORTED result is produced for each such command. (This remains true even if the commands in the pipeline would rollback the transaction.) Query processing resumes after the synchronization point.

It's fine for one operation to depend on the results of a prior one; for example, one query may define a table that the next query in the same pipeline uses. Similarly, an application may create a named prepared statement and execute it with later statements in the same pipeline.

To process the result of one query in a pipeline, the application calls PQgetResult repeatedly and handles each result until PQgetResult returns null. The result from the next query in the pipeline may then be retrieved using PQgetResult again and the cycle repeated. The application handles individual statement results as normal. When the results of all the queries in the pipeline have been returned, PQgetResult returns a result containing the status value PGRES_PIPELINE_SYNC

The client may choose to defer result processing until the complete pipeline has been sent, or interleave that with sending further queries in the pipeline; see Section 32.5.1.4.

PQgetResult behaves the same as for normal asynchronous processing except that it may contain the new PGresult types PGRES_PIPELINE_SYNC and PGRES_PIPELINE_ABORTED. PGRES_PIPELINE_SYNC is reported exactly once for each PQpipelineSync or PQsendPipelineSync at the corresponding point in the pipeline. PGRES_PIPELINE_ABORTED is emitted in place of a normal query result for the first error and all subsequent results until the next PGRES_PIPELINE_SYNC; see Section 32.5.1.3.

PQisBusy, PQconsumeInput, etc operate as normal when processing pipeline results. In particular, a call to PQisBusy in the middle of a pipeline returns 0 if the results for all the queries issued so far have been consumed.

libpq does not provide any information to the application about the query currently being processed (except that PQgetResult returns null to indicate that we start returning the results of next query). The application must keep track of the order in which it sent queries, to associate them with their corresponding results. Applications will typically use a state machine or a FIFO queue for this.

From the client's perspective, after PQresultStatus returns PGRES_FATAL_ERROR, the pipeline is flagged as aborted. PQresultStatus will report a PGRES_PIPELINE_ABORTED result for each remaining queued operation in an aborted pipeline. The result for PQpipelineSync or PQsendPipelineSync is reported as PGRES_PIPELINE_SYNC to signal the end of the aborted pipeline and resumption of normal result processing.

The client must process results with PQgetResult during error recovery.

If the pipeline used an implicit transaction, then operations that have already executed are rolled back and operations that were queued to follow the failed operation are skipped entirely. The same behavior holds if the pipeline starts and commits a single explicit transaction (i.e. the first statement is BEGIN and the last is COMMIT) except that the session remains in an aborted transaction state at the end of the pipeline. If a pipeline contains multiple explicit transactions, all transactions that committed prior to the error remain committed, the currently in-progress transaction is aborted, and all subsequent operations are skipped completely, including subsequent transactions. If a pipeline synchronization point occurs with an explicit transaction block in aborted state, the next pipeline will become aborted immediately unless the next command puts the transaction in normal mode with ROLLBACK.

The client must not assume that work is committed when it sends a COMMIT — only when the corresponding result is received to confirm the commit is complete. Because errors arrive asynchronously, the application needs to be able to restart from the last received committed change and resend work done after that point if something goes wrong.

To avoid deadlocks on large pipelines the client should be structured around a non-blocking event loop using operating system facilities such as select, poll, WaitForMultipleObjectEx, etc.

The client application should generally maintain a queue of work remaining to be dispatched and a queue of work that has been dispatched but not yet had its results processed. When the socket is writable it should dispatch more work. When the socket is readable it should read results and process them, matching them up to the next entry in its corresponding results queue. Based on available memory, results from the socket should be read frequently: there's no need to wait until the pipeline end to read the results. Pipelines should be scoped to logical units of work, usually (but not necessarily) one transaction per pipeline. There's no need to exit pipeline mode and re-enter it between pipelines, or to wait for one pipeline to finish before sending the next.

An example using select() and a simple state machine to track sent and received work is in src/test/modules/libpq_pipeline/libpq_pipeline.c in the PostgreSQL source distribution.

Returns the current pipeline mode status of the libpq connection.

PQpipelineStatus can return one of the following values:

The libpq connection is in pipeline mode.

The libpq connection is not in pipeline mode.

The libpq connection is in pipeline mode and an error occurred while processing the current pipeline. The aborted flag is cleared when PQgetResult returns a result of type PGRES_PIPELINE_SYNC.

Causes a connection to enter pipeline mode if it is currently idle or already in pipeline mode.

Returns 1 for success. Returns 0 and has no effect if the connection is not currently idle, i.e., it has a result ready, or it is waiting for more input from the server, etc. This function does not actually send anything to the server, it just changes the libpq connection state.

Causes a connection to exit pipeline mode if it is currently in pipeline mode with an empty queue and no pending results.

Returns 1 for success. Returns 1 and takes no action if not in pipeline mode. If the current statement isn't finished processing, or PQgetResult has not been called to collect results from all previously sent query, returns 0 (in which case, use PQerrorMessage to get more information about the failure).

Marks a synchronization point in a pipeline by sending a sync message and flushing the send buffer. This serves as the delimiter of an implicit transaction and an error recovery point; see Section 32.5.1.3.

Returns 1 for success. Returns 0 if the connection is not in pipeline mode or sending a sync message failed.

Marks a synchronization point in a pipeline by sending a sync message without flushing the send buffer. This serves as the delimiter of an implicit transaction and an error recovery point; see Section 32.5.1.3.

Returns 1 for success. Returns 0 if the connection is not in pipeline mode or sending a sync message failed. Note that the message is not itself flushed to the server automatically; use PQflush if necessary.

Sends a request for the server to flush its output buffer.

Returns 1 for success. Returns 0 on any failure.

The server flushes its output buffer automatically as a result of PQpipelineSync being called, or on any request when not in pipeline mode; this function is useful to cause the server to flush its output buffer in pipeline mode without establishing a synchronization point. Note that the request is not itself flushed to the server automatically; use PQflush if necessary.

Much like asynchronous query mode, there is no meaningful performance overhead when using pipeline mode. It increases client application complexity, and extra caution is required to prevent client/server deadlocks, but pipeline mode can offer considerable performance improvements, in exchange for increased memory usage from leaving state around longer.

Pipeline mode is most useful when the server is distant, i.e., network latency (“ping time”) is high, and also when many small operations are being performed in rapid succession. There is usually less benefit in using pipelined commands when each query takes many multiples of the client/server round-trip time to execute. A 100-statement operation run on a server 300 ms round-trip-time away would take 30 seconds in network latency alone without pipelining; with pipelining it may spend as little as 0.3 s waiting for results from the server.

Use pipelined commands when your application does lots of small INSERT, UPDATE and DELETE operations that can't easily be transformed into operations on sets, or into a COPY operation.

Pipeline mode is not useful when information from one operation is required by the client to produce the next operation. In such cases, the client would have to introduce a synchronization point and wait for a full client/server round-trip to get the results it needs. However, it's often possible to adjust the client design to exchange the required information server-side. Read-modify-write cycles are especially good candidates; for example:

could be much more efficiently done with:

Pipelining is less useful, and more complex, when a single pipeline contains multiple transactions (see Section 32.5.1.3).

[15] The client will block trying to send queries to the server, but the server will block trying to send results to the client from queries it has already processed. This only occurs when the client sends enough queries to fill both its output buffer and the server's receive buffer before it switches to processing input from the server, but it's hard to predict exactly when that will happen.

**Examples:**

Example 1 (unknown):
```unknown
PQenterPipelineMode
```

Example 2 (unknown):
```unknown
PQpipelineStatus
```

Example 3 (unknown):
```unknown
PQexecParams
```

Example 4 (unknown):
```unknown
PQexecPrepared
```

---


---

## 32.10. Functions Associated with the COPY Command #


**URL:** https://www.postgresql.org/docs/18/libpq-copy.html

**Contents:**
- 32.10. Functions Associated with the COPY Command #
  - 32.10.1. Functions for Sending COPY Data #
  - 32.10.2. Functions for Receiving COPY Data #
  - 32.10.3. Obsolete Functions for COPY #
  - Note

The COPY command in PostgreSQL has options to read from or write to the network connection used by libpq. The functions described in this section allow applications to take advantage of this capability by supplying or consuming copied data.

The overall process is that the application first issues the SQL COPY command via PQexec or one of the equivalent functions. The response to this (if there is no error in the command) will be a PGresult object bearing a status code of PGRES_COPY_OUT or PGRES_COPY_IN (depending on the specified copy direction). The application should then use the functions of this section to receive or transmit data rows. When the data transfer is complete, another PGresult object is returned to indicate success or failure of the transfer. Its status will be PGRES_COMMAND_OK for success or PGRES_FATAL_ERROR if some problem was encountered. At this point further SQL commands can be issued via PQexec. (It is not possible to execute other SQL commands using the same connection while the COPY operation is in progress.)

If a COPY command is issued via PQexec in a string that could contain additional commands, the application must continue fetching results via PQgetResult after completing the COPY sequence. Only when PQgetResult returns NULL is it certain that the PQexec command string is done and it is safe to issue more commands.

The functions of this section should be executed only after obtaining a result status of PGRES_COPY_OUT or PGRES_COPY_IN from PQexec or PQgetResult.

A PGresult object bearing one of these status values carries some additional data about the COPY operation that is starting. This additional data is available using functions that are also used in connection with query results:

Returns the number of columns (fields) to be copied.

0 indicates the overall copy format is textual (rows separated by newlines, columns separated by separator characters, etc.). 1 indicates the overall copy format is binary. See COPY for more information.

Returns the format code (0 for text, 1 for binary) associated with each column of the copy operation. The per-column format codes will always be zero when the overall copy format is textual, but the binary format can support both text and binary columns. (However, as of the current implementation of COPY, only binary columns appear in a binary copy; so the per-column formats always match the overall format at present.)

These functions are used to send data during COPY FROM STDIN. They will fail if called when the connection is not in COPY_IN state.

Sends data to the server during COPY_IN state.

Transmits the COPY data in the specified buffer, of length nbytes, to the server. The result is 1 if the data was queued, zero if it was not queued because of full buffers (this will only happen in nonblocking mode), or -1 if an error occurred. (Use PQerrorMessage to retrieve details if the return value is -1. If the value is zero, wait for write-ready and try again.)

The application can divide the COPY data stream into buffer loads of any convenient size. Buffer-load boundaries have no semantic significance when sending. The contents of the data stream must match the data format expected by the COPY command; see COPY for details.

Sends end-of-data indication to the server during COPY_IN state.

Ends the COPY_IN operation successfully if errormsg is NULL. If errormsg is not NULL then the COPY is forced to fail, with the string pointed to by errormsg used as the error message. (One should not assume that this exact error message will come back from the server, however, as the server might have already failed the COPY for its own reasons.)

The result is 1 if the termination message was sent; or in nonblocking mode, this may only indicate that the termination message was successfully queued. (In nonblocking mode, to be certain that the data has been sent, you should next wait for write-ready and call PQflush, repeating until it returns zero.) Zero indicates that the function could not queue the termination message because of full buffers; this will only happen in nonblocking mode. (In this case, wait for write-ready and try the PQputCopyEnd call again.) If a hard error occurs, -1 is returned; you can use PQerrorMessage to retrieve details.

After successfully calling PQputCopyEnd, call PQgetResult to obtain the final result status of the COPY command. One can wait for this result to be available in the usual way. Then return to normal operation.

These functions are used to receive data during COPY TO STDOUT. They will fail if called when the connection is not in COPY_OUT state.

Receives data from the server during COPY_OUT state.

Attempts to obtain another row of data from the server during a COPY. Data is always returned one data row at a time; if only a partial row is available, it is not returned. Successful return of a data row involves allocating a chunk of memory to hold the data. The buffer parameter must be non-NULL. *buffer is set to point to the allocated memory, or to NULL in cases where no buffer is returned. A non-NULL result buffer should be freed using PQfreemem when no longer needed.

When a row is successfully returned, the return value is the number of data bytes in the row (this will always be greater than zero). The returned string is always null-terminated, though this is probably only useful for textual COPY. A result of zero indicates that the COPY is still in progress, but no row is yet available (this is only possible when async is true). A result of -1 indicates that the COPY is done. A result of -2 indicates that an error occurred (consult PQerrorMessage for the reason).

When async is true (not zero), PQgetCopyData will not block waiting for input; it will return zero if the COPY is still in progress but no complete row is available. (In this case wait for read-ready and then call PQconsumeInput before calling PQgetCopyData again.) When async is false (zero), PQgetCopyData will block until data is available or the operation completes.

After PQgetCopyData returns -1, call PQgetResult to obtain the final result status of the COPY command. One can wait for this result to be available in the usual way. Then return to normal operation.

These functions represent older methods of handling COPY. Although they still work, they are deprecated due to poor error handling, inconvenient methods of detecting end-of-data, and lack of support for binary or nonblocking transfers.

Reads a newline-terminated line of characters (transmitted by the server) into a buffer string of size length.

This function copies up to length-1 characters into the buffer and converts the terminating newline into a zero byte. PQgetline returns EOF at the end of input, 0 if the entire line has been read, and 1 if the buffer is full but the terminating newline has not yet been read.

Note that the application must check to see if a new line consists of the two characters \., which indicates that the server has finished sending the results of the COPY command. If the application might receive lines that are more than length-1 characters long, care is needed to be sure it recognizes the \. line correctly (and does not, for example, mistake the end of a long data line for a terminator line).

Reads a row of COPY data (transmitted by the server) into a buffer without blocking.

This function is similar to PQgetline, but it can be used by applications that must read COPY data asynchronously, that is, without blocking. Having issued the COPY command and gotten a PGRES_COPY_OUT response, the application should call PQconsumeInput and PQgetlineAsync until the end-of-data signal is detected.

Unlike PQgetline, this function takes responsibility for detecting end-of-data.

On each call, PQgetlineAsync will return data if a complete data row is available in libpq's input buffer. Otherwise, no data is returned until the rest of the row arrives. The function returns -1 if the end-of-copy-data marker has been recognized, or 0 if no data is available, or a positive number giving the number of bytes of data returned. If -1 is returned, the caller must next call PQendcopy, and then return to normal processing.

The data returned will not extend beyond a data-row boundary. If possible a whole row will be returned at one time. But if the buffer offered by the caller is too small to hold a row sent by the server, then a partial data row will be returned. With textual data this can be detected by testing whether the last returned byte is \n or not. (In a binary COPY, actual parsing of the COPY data format will be needed to make the equivalent determination.) The returned string is not null-terminated. (If you want to add a terminating null, be sure to pass a bufsize one smaller than the room actually available.)

Sends a null-terminated string to the server. Returns 0 if OK and EOF if unable to send the string.

The COPY data stream sent by a series of calls to PQputline has the same format as that returned by PQgetlineAsync, except that applications are not obliged to send exactly one data row per PQputline call; it is okay to send a partial line or multiple lines per call.

Before PostgreSQL protocol 3.0, it was necessary for the application to explicitly send the two characters \. as a final line to indicate to the server that it had finished sending COPY data. While this still works, it is deprecated and the special meaning of \. can be expected to be removed in a future release. (It already will misbehave in CSV mode.) It is sufficient to call PQendcopy after having sent the actual data.

Sends a non-null-terminated string to the server. Returns 0 if OK and EOF if unable to send the string.

This is exactly like PQputline, except that the data buffer need not be null-terminated since the number of bytes to send is specified directly. Use this procedure when sending binary data.

Synchronizes with the server.

This function waits until the server has finished the copying. It should either be issued when the last string has been sent to the server using PQputline or when the last string has been received from the server using PQgetline. It must be issued or the server will get “out of sync” with the client. Upon return from this function, the server is ready to receive the next SQL command. The return value is 0 on successful completion, nonzero otherwise. (Use PQerrorMessage to retrieve details if the return value is nonzero.)

When using PQgetResult, the application should respond to a PGRES_COPY_OUT result by executing PQgetline repeatedly, followed by PQendcopy after the terminator line is seen. It should then return to the PQgetResult loop until PQgetResult returns a null pointer. Similarly a PGRES_COPY_IN result is processed by a series of PQputline calls followed by PQendcopy, then return to the PQgetResult loop. This arrangement will ensure that a COPY command embedded in a series of SQL commands will be executed correctly.

Older applications are likely to submit a COPY via PQexec and assume that the transaction is done after PQendcopy. This will work correctly only if the COPY is the only SQL command in the command string.

**Examples:**

Example 1 (unknown):
```unknown
PGRES_COPY_OUT
```

Example 2 (unknown):
```unknown
PGRES_COPY_IN
```

Example 3 (unknown):
```unknown
PGRES_COMMAND_OK
```

Example 4 (unknown):
```unknown
PGRES_FATAL_ERROR
```

---


---

## 32.20. OAuth Support #


**URL:** https://www.postgresql.org/docs/18/libpq-oauth.html

**Contents:**
- 32.20. OAuth Support #
  - Note
  - 32.20.1. Authdata Hooks #
    - 32.20.1.1. Hook Types #
  - 32.20.2. Debugging and Developer Settings #
  - Warning

libpq implements support for the OAuth v2 Device Authorization client flow, documented in RFC 8628, as an optional module. See the installation documentation for information on how to enable support for Device Authorization as a builtin flow.

When support is enabled and the optional module installed, libpq will use the builtin flow by default if the server requests a bearer token during authentication. This flow can be utilized even if the system running the client application does not have a usable web browser, for example when running a client via SSH.

The builtin flow will, by default, print a URL to visit and a user code to enter there:

(This prompt may be customized.) The user will then log into their OAuth provider, which will ask whether to allow libpq and the server to perform actions on their behalf. It is always a good idea to carefully review the URL and permissions displayed, to ensure they match expectations, before continuing. Permissions should not be given to untrusted third parties.

Client applications may implement their own flows to customize interaction and integration with applications. See Section 32.20.1 for more information on how add a custom flow to libpq.

For an OAuth client flow to be usable, the connection string must at minimum contain oauth_issuer and oauth_client_id. (These settings are determined by your organization's OAuth provider.) The builtin flow additionally requires the OAuth authorization server to publish a device authorization endpoint.

The builtin Device Authorization flow is not currently supported on Windows. Custom client flows may still be implemented.

The behavior of the OAuth flow may be modified or replaced by a client using the following hook API:

Sets the PGauthDataHook, overriding libpq's handling of one or more aspects of its OAuth client flow.

If hook is NULL, the default handler will be reinstalled. Otherwise, the application passes a pointer to a callback function with the signature:

which libpq will call when an action is required of the application. type describes the request being made, conn is the connection handle being authenticated, and data points to request-specific metadata. The contents of this pointer are determined by type; see Section 32.20.1.1 for the supported list.

Hooks can be chained together to allow cooperative and/or fallback behavior. In general, a hook implementation should examine the incoming type (and, potentially, the request metadata and/or the settings for the particular conn in use) to decide whether or not to handle a specific piece of authdata. If not, it should delegate to the previous hook in the chain (retrievable via PQgetAuthDataHook).

Success is indicated by returning an integer greater than zero. Returning a negative integer signals an error condition and abandons the connection attempt. (A zero value is reserved for the default implementation.)

Retrieves the current value of PGauthDataHook.

At initialization time (before the first call to PQsetAuthDataHook), this function will return PQdefaultAuthDataHook.

The following PGauthData types and their corresponding data structures are defined:

Replaces the default user prompt during the builtin device authorization client flow. data points to an instance of PGpromptOAuthDevice:

The OAuth Device Authorization flow which can be included in libpq requires the end user to visit a URL with a browser, then enter a code which permits libpq to connect to the server on their behalf. The default prompt simply prints the verification_uri and user_code on standard error. Replacement implementations may display this information using any preferred method, for example with a GUI.

This callback is only invoked during the builtin device authorization flow. If the application installs a custom OAuth flow, or libpq was not built with support for the builtin flow, this authdata type will not be used.

If a non-NULL verification_uri_complete is provided, it may optionally be used for non-textual verification (for example, by displaying a QR code). The URL and user code should still be displayed to the end user in this case, because the code will be manually confirmed by the provider, and the URL lets users continue even if they can't use the non-textual method. For more information, see section 3.3.1 in RFC 8628.

Adds a custom implementation of a flow, replacing the builtin flow if it is installed. The hook should either directly return a Bearer token for the current user/issuer/scope combination, if one is available without blocking, or else set up an asynchronous callback to retrieve one.

data points to an instance of PGoauthBearerRequest, which should be filled in by the implementation:

Two pieces of information are provided to the hook by libpq: openid_configuration contains the URL of an OAuth discovery document describing the authorization server's supported flows, and scope contains a (possibly empty) space-separated list of OAuth scopes which are required to access the server. Either or both may be NULL to indicate that the information was not discoverable. (In this case, implementations may be able to establish the requirements using some other preconfigured knowledge, or they may choose to fail.)

The final output of the hook is token, which must point to a valid Bearer token for use on the connection. (This token should be issued by the oauth_issuer and hold the requested scopes, or the connection will be rejected by the server's validator module.) The allocated token string must remain valid until libpq is finished connecting; the hook should set a cleanup callback which will be called when libpq no longer requires it.

If an implementation cannot immediately produce a token during the initial call to the hook, it should set the async callback to handle nonblocking communication with the authorization server. [16] This will be called to begin the flow immediately upon return from the hook. When the callback cannot make further progress without blocking, it should return either PGRES_POLLING_READING or PGRES_POLLING_WRITING after setting *pgsocket to the file descriptor that will be marked ready to read/write when progress can be made again. (This descriptor is then provided to the top-level polling loop via PQsocket().) Return PGRES_POLLING_OK after setting token when the flow is complete, or PGRES_POLLING_FAILED to indicate failure.

Implementations may wish to store additional data for bookkeeping across calls to the async and cleanup callbacks. The user pointer is provided for this purpose; libpq will not touch its contents and the application may use it at its convenience. (Remember to free any allocations during token cleanup.)

A "dangerous debugging mode" may be enabled by setting the environment variable PGOAUTHDEBUG=UNSAFE. This functionality is provided for ease of local development and testing only. It does several things that you will not want a production system to do:

permits the use of unencrypted HTTP during the OAuth provider exchange

allows the system's trusted CA list to be completely replaced using the PGOAUTHCAFILE environment variable

prints HTTP traffic (containing several critical secrets) to standard error during the OAuth flow

permits the use of zero-second retry intervals, which can cause the client to busy-loop and pointlessly consume CPU

Do not share the output of the OAuth flow traffic with third parties. It contains secrets that can be used to attack your clients and servers.

[16] Performing blocking operations during the PQAUTHDATA_OAUTH_BEARER_TOKEN hook callback will interfere with nonblocking connection APIs such as PQconnectPoll and prevent concurrent connections from making progress. Applications which only ever use the synchronous connection primitives, such as PQconnectdb, may synchronously retrieve a token during the hook instead of implementing the async callback, but they will necessarily be limited to one connection at a time.

**Examples:**

Example 1 (unknown):
```unknown
$ psql 'dbname=postgres oauth_issuer=https://example.com oauth_client_id=...'
Visit https://example.com/device and enter the code: ABCD-EFGH
```

Example 2 (unknown):
```unknown
PQsetAuthDataHook
```

Example 3 (unknown):
```unknown
PGauthDataHook
```

Example 4 (unknown):
```unknown
int hook_fn(PGauthData type, PGconn *conn, void *data);
```

---


---

