# PostgreSQL - Libpq (Part 9)

## 32.15. Environment Variables #


**URL:** https://www.postgresql.org/docs/18/libpq-envars.html

**Contents:**
- 32.15. Environment Variables #

The following environment variables can be used to select default connection parameter values, which will be used by PQconnectdb, PQsetdbLogin and PQsetdb if no value is directly specified by the calling code. These are useful to avoid hard-coding database connection information into simple client applications, for example.

PGHOST behaves the same as the host connection parameter.

PGSSLNEGOTIATION behaves the same as the sslnegotiation connection parameter.

PGHOSTADDR behaves the same as the hostaddr connection parameter. This can be set instead of or in addition to PGHOST to avoid DNS lookup overhead.

PGPORT behaves the same as the port connection parameter.

PGDATABASE behaves the same as the dbname connection parameter.

PGUSER behaves the same as the user connection parameter.

PGPASSWORD behaves the same as the password connection parameter. Use of this environment variable is not recommended for security reasons, as some operating systems allow non-root users to see process environment variables via ps; instead consider using a password file (see Section 32.16).

PGPASSFILE behaves the same as the passfile connection parameter.

PGREQUIREAUTH behaves the same as the require_auth connection parameter.

PGCHANNELBINDING behaves the same as the channel_binding connection parameter.

PGSERVICE behaves the same as the service connection parameter.

PGSERVICEFILE specifies the name of the per-user connection service file (see Section 32.17). Defaults to ~/.pg_service.conf, or %APPDATA%\postgresql\.pg_service.conf on Microsoft Windows.

PGOPTIONS behaves the same as the options connection parameter.

PGAPPNAME behaves the same as the application_name connection parameter.

PGSSLMODE behaves the same as the sslmode connection parameter.

PGREQUIRESSL behaves the same as the requiressl connection parameter. This environment variable is deprecated in favor of the PGSSLMODE variable; setting both variables suppresses the effect of this one.

PGSSLCOMPRESSION behaves the same as the sslcompression connection parameter.

PGSSLCERT behaves the same as the sslcert connection parameter.

PGSSLKEY behaves the same as the sslkey connection parameter.

PGSSLCERTMODE behaves the same as the sslcertmode connection parameter.

PGSSLROOTCERT behaves the same as the sslrootcert connection parameter.

PGSSLCRL behaves the same as the sslcrl connection parameter.

PGSSLCRLDIR behaves the same as the sslcrldir connection parameter.

PGSSLSNI behaves the same as the sslsni connection parameter.

PGREQUIREPEER behaves the same as the requirepeer connection parameter.

PGSSLMINPROTOCOLVERSION behaves the same as the ssl_min_protocol_version connection parameter.

PGSSLMAXPROTOCOLVERSION behaves the same as the ssl_max_protocol_version connection parameter.

PGGSSENCMODE behaves the same as the gssencmode connection parameter.

PGKRBSRVNAME behaves the same as the krbsrvname connection parameter.

PGGSSLIB behaves the same as the gsslib connection parameter.

PGGSSDELEGATION behaves the same as the gssdelegation connection parameter.

PGCONNECT_TIMEOUT behaves the same as the connect_timeout connection parameter.

PGCLIENTENCODING behaves the same as the client_encoding connection parameter.

PGTARGETSESSIONATTRS behaves the same as the target_session_attrs connection parameter.

PGLOADBALANCEHOSTS behaves the same as the load_balance_hosts connection parameter.

PGMINPROTOCOLVERSION behaves the same as the min_protocol_version connection parameter.

PGMAXPROTOCOLVERSION behaves the same as the max_protocol_version connection parameter.

The following environment variables can be used to specify default behavior for each PostgreSQL session. (See also the ALTER ROLE and ALTER DATABASE commands for ways to set default behavior on a per-user or per-database basis.)

PGDATESTYLE sets the default style of date/time representation. (Equivalent to SET datestyle TO ....)

PGTZ sets the default time zone. (Equivalent to SET timezone TO ....)

PGGEQO sets the default mode for the genetic query optimizer. (Equivalent to SET geqo TO ....)

Refer to the SQL command SET for information on correct values for these environment variables.

The following environment variables determine internal behavior of libpq; they override compiled-in defaults.

PGSYSCONFDIR sets the directory containing the pg_service.conf file and in a future version possibly other system-wide configuration files.

PGLOCALEDIR sets the directory containing the locale files for message localization.

**Examples:**

Example 1 (unknown):
```unknown
PQconnectdb
```

Example 2 (unknown):
```unknown
PQsetdbLogin
```

Example 3 (unknown):
```unknown
PGSSLNEGOTIATION
```

Example 4 (unknown):
```unknown
PGREQUIREAUTH
```

---


---

## 32.6. Retrieving Query Results in Chunks #


**URL:** https://www.postgresql.org/docs/18/libpq-single-row-mode.html

**Contents:**
- 32.6. Retrieving Query Results in Chunks #
  - Caution

Ordinarily, libpq collects an SQL command's entire result and returns it to the application as a single PGresult. This can be unworkable for commands that return a large number of rows. For such cases, applications can use PQsendQuery and PQgetResult in single-row mode or chunked mode. In these modes, result row(s) are returned to the application as they are received from the server, one at a time for single-row mode or in groups for chunked mode.

To enter one of these modes, call PQsetSingleRowMode or PQsetChunkedRowsMode immediately after a successful call of PQsendQuery (or a sibling function). This mode selection is effective only for the currently executing query. Then call PQgetResult repeatedly, until it returns null, as documented in Section 32.4. If the query returns any rows, they are returned as one or more PGresult objects, which look like normal query results except for having status code PGRES_SINGLE_TUPLE for single-row mode or PGRES_TUPLES_CHUNK for chunked mode, instead of PGRES_TUPLES_OK. There is exactly one result row in each PGRES_SINGLE_TUPLE object, while a PGRES_TUPLES_CHUNK object contains at least one row but not more than the specified number of rows per chunk. After the last row, or immediately if the query returns zero rows, a zero-row object with status PGRES_TUPLES_OK is returned; this is the signal that no more rows will arrive. (But note that it is still necessary to continue calling PQgetResult until it returns null.) All of these PGresult objects will contain the same row description data (column names, types, etc.) that an ordinary PGresult object for the query would have. Each object should be freed with PQclear as usual.

When using pipeline mode, single-row or chunked mode needs to be activated for each query in the pipeline before retrieving results for that query with PQgetResult. See Section 32.5 for more information.

Select single-row mode for the currently-executing query.

This function can only be called immediately after PQsendQuery or one of its sibling functions, before any other operation on the connection such as PQconsumeInput or PQgetResult. If called at the correct time, the function activates single-row mode for the current query and returns 1. Otherwise the mode stays unchanged and the function returns 0. In any case, the mode reverts to normal after completion of the current query.

Select chunked mode for the currently-executing query.

This function is similar to PQsetSingleRowMode, except that it specifies retrieval of up to chunkSize rows per PGresult, not necessarily just one row. This function can only be called immediately after PQsendQuery or one of its sibling functions, before any other operation on the connection such as PQconsumeInput or PQgetResult. If called at the correct time, the function activates chunked mode for the current query and returns 1. Otherwise the mode stays unchanged and the function returns 0. In any case, the mode reverts to normal after completion of the current query.

While processing a query, the server may return some rows and then encounter an error, causing the query to be aborted. Ordinarily, libpq discards any such rows and reports only the error. But in single-row or chunked mode, some rows may have already been returned to the application. Hence, the application will see some PGRES_SINGLE_TUPLE or PGRES_TUPLES_CHUNK PGresult objects followed by a PGRES_FATAL_ERROR object. For proper transactional behavior, the application must be designed to discard or undo whatever has been done with the previously-processed rows, if the query ultimately fails.

**Examples:**

Example 1 (unknown):
```unknown
PQsendQuery
```

Example 2 (unknown):
```unknown
PQgetResult
```

Example 3 (unknown):
```unknown
PQsetSingleRowMode
```

Example 4 (unknown):
```unknown
PQsetChunkedRowsMode
```

---


---

## 32.12. Miscellaneous Functions #


**URL:** https://www.postgresql.org/docs/18/libpq-misc.html

**Contents:**
- 32.12. Miscellaneous Functions #
  - Note

As always, there are some functions that just don't fit anywhere.

Frees memory allocated by libpq.

Frees memory allocated by libpq, particularly PQescapeByteaConn, PQescapeBytea, PQunescapeBytea, and PQnotifies. It is particularly important that this function, rather than free(), be used on Microsoft Windows. This is because allocating memory in a DLL and releasing it in the application works only if multithreaded/single-threaded, release/debug, and static/dynamic flags are the same for the DLL and the application. On non-Microsoft Windows platforms, this function is the same as the standard library function free().

Frees the data structures allocated by PQconndefaults or PQconninfoParse.

If the argument is a NULL pointer, no operation is performed.

A simple PQfreemem will not do for this, since the array contains references to subsidiary strings.

Prepares the encrypted form of a PostgreSQL password.

This function is intended to be used by client applications that wish to send commands like ALTER USER joe PASSWORD 'pwd'. It is good practice not to send the original cleartext password in such a command, because it might be exposed in command logs, activity displays, and so on. Instead, use this function to convert the password to encrypted form before it is sent.

The passwd and user arguments are the cleartext password, and the SQL name of the user it is for. algorithm specifies the encryption algorithm to use to encrypt the password. Currently supported algorithms are md5 and scram-sha-256 (on and off are also accepted as aliases for md5, for compatibility with older server versions). Note that support for scram-sha-256 was introduced in PostgreSQL version 10, and will not work correctly with older server versions. If algorithm is NULL, this function will query the server for the current value of the password_encryption setting. That can block, and will fail if the current transaction is aborted, or if the connection is busy executing another query. If you wish to use the default algorithm for the server but want to avoid blocking, query password_encryption yourself before calling PQencryptPasswordConn, and pass that value as the algorithm.

The return value is a string allocated by malloc. The caller can assume the string doesn't contain any special characters that would require escaping. Use PQfreemem to free the result when done with it. On error, returns NULL, and a suitable message is stored in the connection object.

Changes a PostgreSQL password.

This function uses PQencryptPasswordConn to build and execute the command ALTER USER ... PASSWORD '...', thereby changing the user's password. It exists for the same reason as PQencryptPasswordConn, but is more convenient as it both builds and runs the command for you. PQencryptPasswordConn is passed a NULL for the algorithm argument, hence encryption is done according to the server's password_encryption setting.

The user and passwd arguments are the SQL name of the target user, and the new cleartext password.

Returns a PGresult pointer representing the result of the ALTER USER command, or a null pointer if the routine failed before issuing any command. The PQresultStatus function should be called to check the return value for any errors (including the value of a null pointer, in which case it will return PGRES_FATAL_ERROR). Use PQerrorMessage to get more information about such errors.

Prepares the md5-encrypted form of a PostgreSQL password.

PQencryptPassword is an older, deprecated version of PQencryptPasswordConn. The difference is that PQencryptPassword does not require a connection object, and md5 is always used as the encryption algorithm.

Constructs an empty PGresult object with the given status.

This is libpq's internal function to allocate and initialize an empty PGresult object. This function returns NULL if memory could not be allocated. It is exported because some applications find it useful to generate result objects (particularly objects with error status) themselves. If conn is not null and status indicates an error, the current error message of the specified connection is copied into the PGresult. Also, if conn is not null, any event procedures registered in the connection are copied into the PGresult. (They do not get PGEVT_RESULTCREATE calls, but see PQfireResultCreateEvents.) Note that PQclear should eventually be called on the object, just as with a PGresult returned by libpq itself.

Fires a PGEVT_RESULTCREATE event (see Section 32.14) for each event procedure registered in the PGresult object. Returns non-zero for success, zero if any event procedure fails.

The conn argument is passed through to event procedures but not used directly. It can be NULL if the event procedures won't use it.

Event procedures that have already received a PGEVT_RESULTCREATE or PGEVT_RESULTCOPY event for this object are not fired again.

The main reason that this function is separate from PQmakeEmptyPGresult is that it is often appropriate to create a PGresult and fill it with data before invoking the event procedures.

Makes a copy of a PGresult object. The copy is not linked to the source result in any way and PQclear must be called when the copy is no longer needed. If the function fails, NULL is returned.

This is not intended to make an exact copy. The returned result is always put into PGRES_TUPLES_OK status, and does not copy any error message in the source. (It does copy the command status string, however.) The flags argument determines what else is copied. It is a bitwise OR of several flags. PG_COPYRES_ATTRS specifies copying the source result's attributes (column definitions). PG_COPYRES_TUPLES specifies copying the source result's tuples. (This implies copying the attributes, too.) PG_COPYRES_NOTICEHOOKS specifies copying the source result's notify hooks. PG_COPYRES_EVENTS specifies copying the source result's events. (But any instance data associated with the source is not copied.) The event procedures receive PGEVT_RESULTCOPY events.

Sets the attributes of a PGresult object.

The provided attDescs are copied into the result. If the attDescs pointer is NULL or numAttributes is less than one, the request is ignored and the function succeeds. If res already contains attributes, the function will fail. If the function fails, the return value is zero. If the function succeeds, the return value is non-zero.

Sets a tuple field value of a PGresult object.

The function will automatically grow the result's internal tuples array as needed. However, the tup_num argument must be less than or equal to PQntuples, meaning this function can only grow the tuples array one tuple at a time. But any field of any existing tuple can be modified in any order. If a value at field_num already exists, it will be overwritten. If len is -1 or value is NULL, the field value will be set to an SQL null value. The value is copied into the result's private storage, thus is no longer needed after the function returns. If the function fails, the return value is zero. If the function succeeds, the return value is non-zero.

Allocate subsidiary storage for a PGresult object.

Any memory allocated with this function will be freed when res is cleared. If the function fails, the return value is NULL. The result is guaranteed to be adequately aligned for any type of data, just as for malloc.

Retrieves the number of bytes allocated for a PGresult object.

This value is the sum of all malloc requests associated with the PGresult object, that is, all the memory that will be freed by PQclear. This information can be useful for managing memory consumption.

Return the version of libpq that is being used.

The result of this function can be used to determine, at run time, whether specific functionality is available in the currently loaded version of libpq. The function can be used, for example, to determine which connection options are available in PQconnectdb.

The result is formed by multiplying the library's major version number by 10000 and adding the minor version number. For example, version 10.1 will be returned as 100001, and version 11.0 will be returned as 110000.

Prior to major version 10, PostgreSQL used three-part version numbers in which the first two parts together represented the major version. For those versions, PQlibVersion uses two digits for each part; for example version 9.1.5 will be returned as 90105, and version 9.2.0 will be returned as 90200.

Therefore, for purposes of determining feature compatibility, applications should divide the result of PQlibVersion by 100 not 10000 to determine a logical major version number. In all release series, only the last two digits differ between minor releases (bug-fix releases).

This function appeared in PostgreSQL version 9.1, so it cannot be used to detect required functionality in earlier versions, since calling it will create a link dependency on version 9.1 or later.

Retrieves the current time, expressed as the number of microseconds since the Unix epoch (that is, time_t times 1 million).

This is primarily useful for calculating timeout values to use with PQsocketPoll.

**Examples:**

Example 1 (unknown):
```unknown
PQescapeByteaConn
```

Example 2 (unknown):
```unknown
PQescapeBytea
```

Example 3 (unknown):
```unknown
PQunescapeBytea
```

Example 4 (unknown):
```unknown
PQconninfoFree
```

---


---

## 32.13. Notice Processing #


**URL:** https://www.postgresql.org/docs/18/libpq-notice-processing.html

**Contents:**
- 32.13. Notice Processing #

Notice and warning messages generated by the server are not returned by the query execution functions, since they do not imply failure of the query. Instead they are passed to a notice handling function, and execution continues normally after the handler returns. The default notice handling function prints the message on stderr, but the application can override this behavior by supplying its own handling function.

For historical reasons, there are two levels of notice handling, called the notice receiver and notice processor. The default behavior is for the notice receiver to format the notice and pass a string to the notice processor for printing. However, an application that chooses to provide its own notice receiver will typically ignore the notice processor layer and just do all the work in the notice receiver.

The function PQsetNoticeReceiver sets or examines the current notice receiver for a connection object. Similarly, PQsetNoticeProcessor sets or examines the current notice processor.

Each of these functions returns the previous notice receiver or processor function pointer, and sets the new value. If you supply a null function pointer, no action is taken, but the current pointer is returned.

When a notice or warning message is received from the server, or generated internally by libpq, the notice receiver function is called. It is passed the message in the form of a PGRES_NONFATAL_ERROR PGresult. (This allows the receiver to extract individual fields using PQresultErrorField, or obtain a complete preformatted message using PQresultErrorMessage or PQresultVerboseErrorMessage.) The same void pointer passed to PQsetNoticeReceiver is also passed. (This pointer can be used to access application-specific state if needed.)

The default notice receiver simply extracts the message (using PQresultErrorMessage) and passes it to the notice processor.

The notice processor is responsible for handling a notice or warning message given in text form. It is passed the string text of the message (including a trailing newline), plus a void pointer that is the same one passed to PQsetNoticeProcessor. (This pointer can be used to access application-specific state if needed.)

The default notice processor is simply:

Once you have set a notice receiver or processor, you should expect that that function could be called as long as either the PGconn object or PGresult objects made from it exist. At creation of a PGresult, the PGconn's current notice handling pointers are copied into the PGresult for possible use by functions like PQgetvalue.

**Examples:**

Example 1 (unknown):
```unknown
PQsetNoticeReceiver
```

Example 2 (unknown):
```unknown
PQsetNoticeProcessor
```

Example 3 (unknown):
```unknown
PGRES_NONFATAL_ERROR
```

Example 4 (unknown):
```unknown
PQresultErrorField
```

---


---

