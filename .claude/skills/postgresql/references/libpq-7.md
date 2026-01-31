# PostgreSQL - Libpq (Part 7)

## 32.7. Canceling Queries in Progress #


**URL:** https://www.postgresql.org/docs/18/libpq-cancel.html

**Contents:**
- 32.7. Canceling Queries in Progress #
  - 32.7.1. Functions for Sending Cancel Requests #
  - 32.7.2. Obsolete Functions for Sending Cancel Requests #

Prepares a connection over which a cancel request can be sent.

PQcancelCreate creates a PGcancelConn object, but it won't instantly start sending a cancel request over this connection. A cancel request can be sent over this connection in a blocking manner using PQcancelBlocking and in a non-blocking manner using PQcancelStart. The return value can be passed to PQcancelStatus to check if the PGcancelConn object was created successfully. The PGcancelConn object is an opaque structure that is not meant to be accessed directly by the application. This PGcancelConn object can be used to cancel the query that's running on the original connection in a thread-safe way.

Many connection parameters of the original client will be reused when setting up the connection for the cancel request. Importantly, if the original connection requires encryption of the connection and/or verification of the target host (using sslmode or gssencmode), then the connection for the cancel request is made with these same requirements. Any connection options that are only used during authentication or after authentication of the client are ignored though, because cancellation requests do not require authentication and the connection is closed right after the cancellation request is submitted.

Note that when PQcancelCreate returns a non-null pointer, you must call PQcancelFinish when you are finished with it, in order to dispose of the structure and any associated memory blocks. This must be done even if the cancel request failed or was abandoned.

Requests that the server abandons processing of the current command in a blocking manner.

The request is made over the given PGcancelConn, which needs to be created with PQcancelCreate. The return value of PQcancelBlocking is 1 if the cancel request was successfully dispatched and 0 if not. If it was unsuccessful, the error message can be retrieved using PQcancelErrorMessage .

Successful dispatch of the cancellation is no guarantee that the request will have any effect, however. If the cancellation is effective, the command being canceled will terminate early and return an error result. If the cancellation fails (say, because the server was already done processing the command), then there will be no visible result at all.

Requests that the server abandons processing of the current command in a non-blocking manner.

The request is made over the given PGcancelConn, which needs to be created with PQcancelCreate. The return value of PQcancelStart is 1 if the cancellation request could be started and 0 if not. If it was unsuccessful, the error message can be retrieved using PQcancelErrorMessage .

If PQcancelStart succeeds, the next stage is to poll libpq so that it can proceed with the cancel connection sequence. Use PQcancelSocket to obtain the descriptor of the socket underlying the database connection. (Caution: do not assume that the socket remains the same across PQcancelPoll calls.) Loop thus: If PQcancelPoll(cancelConn) last returned PGRES_POLLING_READING, wait until the socket is ready to read (as indicated by select(), poll(), or similar system function). Then call PQcancelPoll(cancelConn) again. Conversely, if PQcancelPoll(cancelConn) last returned PGRES_POLLING_WRITING, wait until the socket is ready to write, then call PQcancelPoll(cancelConn) again. On the first iteration, i.e., if you have yet to call PQcancelPoll(cancelConn), behave as if it last returned PGRES_POLLING_WRITING. Continue this loop until PQcancelPoll(cancelConn) returns PGRES_POLLING_FAILED, indicating the connection procedure has failed, or PGRES_POLLING_OK, indicating cancel request was successfully dispatched.

Successful dispatch of the cancellation is no guarantee that the request will have any effect, however. If the cancellation is effective, the command being canceled will terminate early and return an error result. If the cancellation fails (say, because the server was already done processing the command), then there will be no visible result at all.

At any time during connection, the status of the connection can be checked by calling PQcancelStatus. If this call returns CONNECTION_BAD, then the cancel procedure has failed; if the call returns CONNECTION_OK, then cancel request was successfully dispatched. Both of these states are equally detectable from the return value of PQcancelPoll, described above. Other states might also occur during (and only during) an asynchronous connection procedure. These indicate the current stage of the connection procedure and might be useful to provide feedback to the user for example. These statuses are:

Waiting for a call to PQcancelStart or PQcancelBlocking, to actually open the socket. This is the connection state right after calling PQcancelCreate or PQcancelReset. No connection to the server has been initiated yet at this point. To actually start sending the cancel request use PQcancelStart or PQcancelBlocking.

Waiting for connection to be made.

Connection OK; waiting to send.

Waiting for a response from the server.

Negotiating SSL encryption.

Negotiating GSS encryption.

Note that, although these constants will remain (in order to maintain compatibility), an application should never rely upon these occurring in a particular order, or at all, or on the status always being one of these documented values. An application might do something like this:

The connect_timeout connection parameter is ignored when using PQcancelPoll; it is the application's responsibility to decide whether an excessive amount of time has elapsed. Otherwise, PQcancelStart followed by a PQcancelPoll loop is equivalent to PQcancelBlocking.

Returns the status of the cancel connection.

The status can be one of a number of values. However, only three of these are seen outside of an asynchronous cancel procedure: CONNECTION_ALLOCATED, CONNECTION_OK and CONNECTION_BAD. The initial state of a PGcancelConn that's successfully created using PQcancelCreate is CONNECTION_ALLOCATED. A cancel request that was successfully dispatched has the status CONNECTION_OK. A failed cancel attempt is signaled by status CONNECTION_BAD. An OK status will remain so until PQcancelFinish or PQcancelReset is called.

See the entry for PQcancelStart with regards to other status codes that might be returned.

Successful dispatch of the cancellation is no guarantee that the request will have any effect, however. If the cancellation is effective, the command being canceled will terminate early and return an error result. If the cancellation fails (say, because the server was already done processing the command), then there will be no visible result at all.

Obtains the file descriptor number of the cancel connection socket to the server.

A valid descriptor will be greater than or equal to 0; a result of -1 indicates that no server connection is currently open. This might change as a result of calling any of the functions in this section on the PGcancelConn (except for PQcancelErrorMessage and PQcancelSocket itself).

Returns the error message most recently generated by an operation on the cancel connection.

Nearly all libpq functions that take a PGcancelConn will set a message for PQcancelErrorMessage if they fail. Note that by libpq convention, a nonempty PQcancelErrorMessage result can consist of multiple lines, and will include a trailing newline. The caller should not free the result directly. It will be freed when the associated PGcancelConn handle is passed to PQcancelFinish. The result string should not be expected to remain the same across operations on the PGcancelConn structure.

Closes the cancel connection (if it did not finish sending the cancel request yet). Also frees memory used by the PGcancelConn object.

Note that even if the cancel attempt fails (as indicated by PQcancelStatus), the application should call PQcancelFinish to free the memory used by the PGcancelConn object. The PGcancelConn pointer must not be used again after PQcancelFinish has been called.

Resets the PGcancelConn so it can be reused for a new cancel connection.

If the PGcancelConn is currently used to send a cancel request, then this connection is closed. It will then prepare the PGcancelConn object such that it can be used to send a new cancel request.

This can be used to create one PGcancelConn for a PGconn and reuse it multiple times throughout the lifetime of the original PGconn.

These functions represent older methods of sending cancel requests. Although they still work, they are deprecated due to not sending the cancel requests in an encrypted manner, even when the original connection specified sslmode or gssencmode to require encryption. Thus these older methods are heavily discouraged from being used in new code, and it is recommended to change existing code to use the new functions instead.

Creates a data structure containing the information needed to cancel a command using PQcancel.

PQgetCancel creates a PGcancel object given a PGconn connection object. It will return NULL if the given conn is NULL or an invalid connection. The PGcancel object is an opaque structure that is not meant to be accessed directly by the application; it can only be passed to PQcancel or PQfreeCancel.

Frees a data structure created by PQgetCancel.

PQfreeCancel frees a data object previously created by PQgetCancel.

PQcancel is a deprecated and insecure variant of PQcancelBlocking, but one that can be used safely from within a signal handler.

PQcancel only exists because of backwards compatibility reasons. PQcancelBlocking should be used instead. The only benefit that PQcancel has is that it can be safely invoked from a signal handler, if the errbuf is a local variable in the signal handler. However, this is generally not considered a big enough benefit to be worth the security issues that this function has.

The PGcancel object is read-only as far as PQcancel is concerned, so it can also be invoked from a thread that is separate from the one manipulating the PGconn object.

The return value of PQcancel is 1 if the cancel request was successfully dispatched and 0 if not. If not, errbuf is filled with an explanatory error message. errbuf must be a char array of size errbufsize (the recommended size is 256 bytes).

PQrequestCancel is a deprecated and insecure variant of PQcancelBlocking.

PQrequestCancel only exists because of backwards compatibility reasons. PQcancelBlocking should be used instead. There is no benefit to using PQrequestCancel over PQcancelBlocking.

Requests that the server abandon processing of the current command. It operates directly on the PGconn object, and in case of failure stores the error message in the PGconn object (whence it can be retrieved by PQerrorMessage ). Although the functionality is the same, this approach is not safe within multiple-thread programs or signal handlers, since it is possible that overwriting the PGconn's error message will mess up the operation currently in progress on the connection.

**Examples:**

Example 1 (unknown):
```unknown
PQcancelCreate
```

Example 2 (unknown):
```unknown
PQcancelCreate
```

Example 3 (unknown):
```unknown
PGcancelConn
```

Example 4 (unknown):
```unknown
PQcancelBlocking
```

---


---

## 32.8. The Fast-Path Interface #


**URL:** https://www.postgresql.org/docs/18/libpq-fastpath.html

**Contents:**
- 32.8. The Fast-Path Interface #
  - Tip

PostgreSQL provides a fast-path interface to send simple function calls to the server.

This interface is somewhat obsolete, as one can achieve similar performance and greater functionality by setting up a prepared statement to define the function call. Then, executing the statement with binary transmission of parameters and results substitutes for a fast-path function call.

The function PQfn requests execution of a server function via the fast-path interface:

The fnid argument is the OID of the function to be executed. args and nargs define the parameters to be passed to the function; they must match the declared function argument list. When the isint field of a parameter structure is true, the u.integer value is sent to the server as an integer of the indicated length (this must be 2 or 4 bytes); proper byte-swapping occurs. When isint is false, the indicated number of bytes at *u.ptr are sent with no processing; the data must be in the format expected by the server for binary transmission of the function's argument data type. (The declaration of u.ptr as being of type int * is historical; it would be better to consider it void *.) result_buf points to the buffer in which to place the function's return value. The caller must have allocated sufficient space to store the return value. (There is no check!) The actual result length in bytes will be returned in the integer pointed to by result_len. If a 2- or 4-byte integer result is expected, set result_is_int to 1, otherwise set it to 0. Setting result_is_int to 1 causes libpq to byte-swap the value if necessary, so that it is delivered as a proper int value for the client machine; note that a 4-byte integer is delivered into *result_buf for either allowed result size. When result_is_int is 0, the binary-format byte string sent by the server is returned unmodified. (In this case it's better to consider result_buf as being of type void *.)

PQfn always returns a valid PGresult pointer, with status PGRES_COMMAND_OK for success or PGRES_FATAL_ERROR if some problem was encountered. The result status should be checked before the result is used. The caller is responsible for freeing the PGresult with PQclear when it is no longer needed.

To pass a NULL argument to the function, set the len field of that parameter structure to -1; the isint and u fields are then irrelevant.

If the function returns NULL, *result_len is set to -1, and *result_buf is not modified.

Note that it is not possible to handle set-valued results when using this interface. Also, the function must be a plain function, not an aggregate, window function, or procedure.

**Examples:**

Example 1 (unknown):
```unknown
result_is_int
```

Example 2 (unknown):
```unknown
result_is_int
```

Example 3 (unknown):
```unknown
*result_buf
```

Example 4 (unknown):
```unknown
result_is_int
```

---


---

## 32.14. Event System #


**URL:** https://www.postgresql.org/docs/18/libpq-events.html

**Contents:**
- 32.14. Event System #
  - 32.14.1. Event Types #
  - 32.14.2. Event Callback Procedure #
  - Caution
  - 32.14.3. Event Support Functions #
  - 32.14.4. Event Example #

libpq's event system is designed to notify registered event handlers about interesting libpq events, such as the creation or destruction of PGconn and PGresult objects. A principal use case is that this allows applications to associate their own data with a PGconn or PGresult and ensure that that data is freed at an appropriate time.

Each registered event handler is associated with two pieces of data, known to libpq only as opaque void * pointers. There is a pass-through pointer that is provided by the application when the event handler is registered with a PGconn. The pass-through pointer never changes for the life of the PGconn and all PGresults generated from it; so if used, it must point to long-lived data. In addition there is an instance data pointer, which starts out NULL in every PGconn and PGresult. This pointer can be manipulated using the PQinstanceData, PQsetInstanceData, PQresultInstanceData and PQresultSetInstanceData functions. Note that unlike the pass-through pointer, instance data of a PGconn is not automatically inherited by PGresults created from it. libpq does not know what pass-through and instance data pointers point to (if anything) and will never attempt to free them — that is the responsibility of the event handler.

The enum PGEventId names the types of events handled by the event system. All its values have names beginning with PGEVT. For each event type, there is a corresponding event info structure that carries the parameters passed to the event handlers. The event types are:

The register event occurs when PQregisterEventProc is called. It is the ideal time to initialize any instanceData an event procedure may need. Only one register event will be fired per event handler per connection. If the event procedure fails (returns zero), the registration is canceled.

When a PGEVT_REGISTER event is received, the evtInfo pointer should be cast to a PGEventRegister *. This structure contains a PGconn that should be in the CONNECTION_OK status; guaranteed if one calls PQregisterEventProc right after obtaining a good PGconn. When returning a failure code, all cleanup must be performed as no PGEVT_CONNDESTROY event will be sent.

The connection reset event is fired on completion of PQreset or PQresetPoll. In both cases, the event is only fired if the reset was successful. The return value of the event procedure is ignored in PostgreSQL v15 and later. With earlier versions, however, it's important to return success (nonzero) or the connection will be aborted.

When a PGEVT_CONNRESET event is received, the evtInfo pointer should be cast to a PGEventConnReset *. Although the contained PGconn was just reset, all event data remains unchanged. This event should be used to reset/reload/requery any associated instanceData. Note that even if the event procedure fails to process PGEVT_CONNRESET, it will still receive a PGEVT_CONNDESTROY event when the connection is closed.

The connection destroy event is fired in response to PQfinish. It is the event procedure's responsibility to properly clean up its event data as libpq has no ability to manage this memory. Failure to clean up will lead to memory leaks.

When a PGEVT_CONNDESTROY event is received, the evtInfo pointer should be cast to a PGEventConnDestroy *. This event is fired prior to PQfinish performing any other cleanup. The return value of the event procedure is ignored since there is no way of indicating a failure from PQfinish. Also, an event procedure failure should not abort the process of cleaning up unwanted memory.

The result creation event is fired in response to any query execution function that generates a result, including PQgetResult. This event will only be fired after the result has been created successfully.

When a PGEVT_RESULTCREATE event is received, the evtInfo pointer should be cast to a PGEventResultCreate *. The conn is the connection used to generate the result. This is the ideal place to initialize any instanceData that needs to be associated with the result. If an event procedure fails (returns zero), that event procedure will be ignored for the remaining lifetime of the result; that is, it will not receive PGEVT_RESULTCOPY or PGEVT_RESULTDESTROY events for this result or results copied from it.

The result copy event is fired in response to PQcopyResult. This event will only be fired after the copy is complete. Only event procedures that have successfully handled the PGEVT_RESULTCREATE or PGEVT_RESULTCOPY event for the source result will receive PGEVT_RESULTCOPY events.

When a PGEVT_RESULTCOPY event is received, the evtInfo pointer should be cast to a PGEventResultCopy *. The src result is what was copied while the dest result is the copy destination. This event can be used to provide a deep copy of instanceData, since PQcopyResult cannot do that. If an event procedure fails (returns zero), that event procedure will be ignored for the remaining lifetime of the new result; that is, it will not receive PGEVT_RESULTCOPY or PGEVT_RESULTDESTROY events for that result or results copied from it.

The result destroy event is fired in response to a PQclear. It is the event procedure's responsibility to properly clean up its event data as libpq has no ability to manage this memory. Failure to clean up will lead to memory leaks.

When a PGEVT_RESULTDESTROY event is received, the evtInfo pointer should be cast to a PGEventResultDestroy *. This event is fired prior to PQclear performing any other cleanup. The return value of the event procedure is ignored since there is no way of indicating a failure from PQclear. Also, an event procedure failure should not abort the process of cleaning up unwanted memory.

PGEventProc is a typedef for a pointer to an event procedure, that is, the user callback function that receives events from libpq. The signature of an event procedure must be

The evtId parameter indicates which PGEVT event occurred. The evtInfo pointer must be cast to the appropriate structure type to obtain further information about the event. The passThrough parameter is the pointer provided to PQregisterEventProc when the event procedure was registered. The function should return a non-zero value if it succeeds and zero if it fails.

A particular event procedure can be registered only once in any PGconn. This is because the address of the procedure is used as a lookup key to identify the associated instance data.

On Windows, functions can have two different addresses: one visible from outside a DLL and another visible from inside the DLL. One should be careful that only one of these addresses is used with libpq's event-procedure functions, else confusion will result. The simplest rule for writing code that will work is to ensure that event procedures are declared static. If the procedure's address must be available outside its own source file, expose a separate function to return the address.

Registers an event callback procedure with libpq.

An event procedure must be registered once on each PGconn you want to receive events about. There is no limit, other than memory, on the number of event procedures that can be registered with a connection. The function returns a non-zero value if it succeeds and zero if it fails.

The proc argument will be called when a libpq event is fired. Its memory address is also used to lookup instanceData. The name argument is used to refer to the event procedure in error messages. This value cannot be NULL or a zero-length string. The name string is copied into the PGconn, so what is passed need not be long-lived. The passThrough pointer is passed to the proc whenever an event occurs. This argument can be NULL.

Sets the connection conn's instanceData for procedure proc to data. This returns non-zero for success and zero for failure. (Failure is only possible if proc has not been properly registered in conn.)

Returns the connection conn's instanceData associated with procedure proc, or NULL if there is none.

Sets the result's instanceData for proc to data. This returns non-zero for success and zero for failure. (Failure is only possible if proc has not been properly registered in the result.)

Beware that any storage represented by data will not be accounted for by PQresultMemorySize, unless it is allocated using PQresultAlloc. (Doing so is recommendable because it eliminates the need to free such storage explicitly when the result is destroyed.)

Returns the result's instanceData associated with proc, or NULL if there is none.

Here is a skeleton example of managing private data associated with libpq connections and results.

**Examples:**

Example 1 (unknown):
```unknown
PQinstanceData
```

Example 2 (unknown):
```unknown
PQsetInstanceData
```

Example 3 (unknown):
```unknown
PQresultInstanceData
```

Example 4 (unknown):
```unknown
PQresultSetInstanceData
```

---


---

