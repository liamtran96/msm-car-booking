# PostgreSQL - Libpq (Part 11)

## 32.2. Connection Status Functions #


**URL:** https://www.postgresql.org/docs/18/libpq-status.html

**Contents:**
- 32.2. Connection Status Functions #
  - Tip

These functions can be used to interrogate the status of an existing database connection object.

libpq application programmers should be careful to maintain the PGconn abstraction. Use the accessor functions described below to get at the contents of PGconn. Reference to internal PGconn fields using libpq-int.h is not recommended because they are subject to change in the future.

The following functions return parameter values established at connection. These values are fixed for the life of the connection. If a multi-host connection string is used, the values of PQhost, PQport, and PQpass can change if a new connection is established using the same PGconn object. Other values are fixed for the lifetime of the PGconn object.

Returns the database name of the connection.

Returns the user name of the connection.

Returns the password of the connection.

PQpass will return either the password specified in the connection parameters, or if there was none and the password was obtained from the password file, it will return that. In the latter case, if multiple hosts were specified in the connection parameters, it is not possible to rely on the result of PQpass until the connection is established. The status of the connection can be checked using the function PQstatus.

Returns the server host name of the active connection. This can be a host name, an IP address, or a directory path if the connection is via Unix socket. (The path case can be distinguished because it will always be an absolute path, beginning with /.)

If the connection parameters specified both host and hostaddr, then PQhost will return the host information. If only hostaddr was specified, then that is returned. If multiple hosts were specified in the connection parameters, PQhost returns the host actually connected to.

PQhost returns NULL if the conn argument is NULL. Otherwise, if there is an error producing the host information (perhaps if the connection has not been fully established or there was an error), it returns an empty string.

If multiple hosts were specified in the connection parameters, it is not possible to rely on the result of PQhost until the connection is established. The status of the connection can be checked using the function PQstatus.

Returns the server IP address of the active connection. This can be the address that a host name resolved to, or an IP address provided through the hostaddr parameter.

PQhostaddr returns NULL if the conn argument is NULL. Otherwise, if there is an error producing the host information (perhaps if the connection has not been fully established or there was an error), it returns an empty string.

Returns the port of the active connection.

If multiple ports were specified in the connection parameters, PQport returns the port actually connected to.

PQport returns NULL if the conn argument is NULL. Otherwise, if there is an error producing the port information (perhaps if the connection has not been fully established or there was an error), it returns an empty string.

If multiple ports were specified in the connection parameters, it is not possible to rely on the result of PQport until the connection is established. The status of the connection can be checked using the function PQstatus.

This function no longer does anything, but it remains for backwards compatibility. The function always return an empty string, or NULL if the conn argument is NULL.

Returns the command-line options passed in the connection request.

The following functions return status data that can change as operations are executed on the PGconn object.

Returns the status of the connection.

The status can be one of a number of values. However, only two of these are seen outside of an asynchronous connection procedure: CONNECTION_OK and CONNECTION_BAD. A good connection to the database has the status CONNECTION_OK. A failed connection attempt is signaled by status CONNECTION_BAD. Ordinarily, an OK status will remain so until PQfinish, but a communications failure might result in the status changing to CONNECTION_BAD prematurely. In that case the application could try to recover by calling PQreset.

See the entry for PQconnectStartParams, PQconnectStart and PQconnectPoll with regards to other status codes that might be returned.

Returns the current in-transaction status of the server.

The status can be PQTRANS_IDLE (currently idle), PQTRANS_ACTIVE (a command is in progress), PQTRANS_INTRANS (idle, in a valid transaction block), or PQTRANS_INERROR (idle, in a failed transaction block). PQTRANS_UNKNOWN is reported if the connection is bad. PQTRANS_ACTIVE is reported only when a query has been sent to the server and not yet completed.

Looks up a current parameter setting of the server.

Certain parameter values are reported by the server automatically at connection startup or whenever their values change. PQparameterStatus can be used to interrogate these settings. It returns the current value of a parameter if known, or NULL if the parameter is not known.

Parameters reported as of the current release include:

(default_transaction_read_only and in_hot_standby were not reported by releases before 14; scram_iterations was not reported by releases before 16; search_path was not reported by releases before 18.) Note that server_version, server_encoding and integer_datetimes cannot change after startup.

If no value for standard_conforming_strings is reported, applications can assume it is off, that is, backslashes are treated as escapes in string literals. Also, the presence of this parameter can be taken as an indication that the escape string syntax (E'...') is accepted.

Although the returned pointer is declared const, it in fact points to mutable storage associated with the PGconn structure. It is unwise to assume the pointer will remain valid across queries.

Interrogates the frontend/backend protocol being used.

Applications might wish to use this function to determine whether certain features are supported. The result is formed by multiplying the server's major version number by 10000 and adding the minor version number. For example, version 3.2 would be returned as 30002, and version 4.0 would be returned as 40000. Zero is returned if the connection is bad. The 3.0 protocol is supported by PostgreSQL server versions 7.4 and above.

The protocol version will not change after connection startup is complete, but it could theoretically change during a connection reset.

Interrogates the frontend/backend protocol major version.

Unlike PQfullProtocolVersion, this returns only the major protocol version in use, but it is supported by a wider range of libpq releases back to version 7.4. Currently, the possible values are 3 (3.0 protocol), or zero (connection bad). Prior to release version 14.0, libpq could additionally return 2 (2.0 protocol).

Returns an integer representing the server version.

Applications might use this function to determine the version of the database server they are connected to. The result is formed by multiplying the server's major version number by 10000 and adding the minor version number. For example, version 10.1 will be returned as 100001, and version 11.0 will be returned as 110000. Zero is returned if the connection is bad.

Prior to major version 10, PostgreSQL used three-part version numbers in which the first two parts together represented the major version. For those versions, PQserverVersion uses two digits for each part; for example version 9.1.5 will be returned as 90105, and version 9.2.0 will be returned as 90200.

Therefore, for purposes of determining feature compatibility, applications should divide the result of PQserverVersion by 100 not 10000 to determine a logical major version number. In all release series, only the last two digits differ between minor releases (bug-fix releases).

Returns the error message most recently generated by an operation on the connection.

Nearly all libpq functions will set a message for PQerrorMessage if they fail. Note that by libpq convention, a nonempty PQerrorMessage result can consist of multiple lines, and will include a trailing newline. The caller should not free the result directly. It will be freed when the associated PGconn handle is passed to PQfinish. The result string should not be expected to remain the same across operations on the PGconn structure.

Obtains the file descriptor number of the connection socket to the server. A valid descriptor will be greater than or equal to 0; a result of -1 indicates that no server connection is currently open. (This will not change during normal operation, but could change during connection setup or reset.)

Returns the process ID (PID) of the backend process handling this connection.

The backend PID is useful for debugging purposes and for comparison to NOTIFY messages (which include the PID of the notifying backend process). Note that the PID belongs to a process executing on the database server host, not the local host!

Returns true (1) if the connection authentication method required a password, but none was available. Returns false (0) if not.

This function can be applied after a failed connection attempt to decide whether to prompt the user for a password.

Returns true (1) if the connection authentication method used a password. Returns false (0) if not.

This function can be applied after either a failed or successful connection attempt to detect whether the server demanded a password.

Returns true (1) if the connection authentication method used GSSAPI. Returns false (0) if not.

This function can be applied to detect whether the connection was authenticated with GSSAPI.

The following functions return information related to SSL. This information usually doesn't change after a connection is established.

Returns true (1) if the connection uses SSL, false (0) if not.

Returns SSL-related information about the connection.

The list of available attributes varies depending on the SSL library being used and the type of connection. Returns NULL if the connection does not use SSL or the specified attribute name is not defined for the library in use.

The following attributes are commonly available:

Name of the SSL implementation in use. (Currently, only "OpenSSL" is implemented)

SSL/TLS version in use. Common values are "TLSv1", "TLSv1.1" and "TLSv1.2", but an implementation may return other strings if some other protocol is used.

Number of key bits used by the encryption algorithm.

A short name of the ciphersuite used, e.g., "DHE-RSA-DES-CBC3-SHA". The names are specific to each SSL implementation.

Returns "on" if SSL compression is in use, else it returns "off".

Application protocol selected by the TLS Application-Layer Protocol Negotiation (ALPN) extension. The only protocol supported by libpq is postgresql, so this is mainly useful for checking whether the server supported ALPN or not. Empty string if ALPN was not used.

As a special case, the library attribute may be queried without a connection by passing NULL as the conn argument. The result will be the default SSL library name, or NULL if libpq was compiled without any SSL support. (Prior to PostgreSQL version 15, passing NULL as the conn argument always resulted in NULL. Client programs needing to differentiate between the newer and older implementations of this case may check the LIBPQ_HAS_SSL_LIBRARY_DETECTION feature macro.)

Returns an array of SSL attribute names that can be used in PQsslAttribute(). The array is terminated by a NULL pointer.

If conn is NULL, the attributes available for the default SSL library are returned, or an empty list if libpq was compiled without any SSL support. If conn is not NULL, the attributes available for the SSL library in use for the connection are returned, or an empty list if the connection is not encrypted.

Returns a pointer to an SSL-implementation-specific object describing the connection. Returns NULL if the connection is not encrypted or the requested type of object is not available from the connection's SSL implementation.

The struct(s) available depend on the SSL implementation in use. For OpenSSL, there is one struct, available under the name OpenSSL, and it returns a pointer to OpenSSL's SSL struct. To use this function, code along the following lines could be used:

This structure can be used to verify encryption levels, check server certificates, and more. Refer to the OpenSSL documentation for information about this structure.

Returns the SSL structure used in the connection, or NULL if SSL is not in use.

This function is equivalent to PQsslStruct(conn, "OpenSSL"). It should not be used in new applications, because the returned struct is specific to OpenSSL and will not be available if another SSL implementation is used. To check if a connection uses SSL, call PQsslInUse instead, and for more details about the connection, use PQsslAttribute.

**Examples:**

Example 1 (unknown):
```unknown
libpq-int.h
```

Example 2 (unknown):
```unknown
CONNECTION_OK
```

Example 3 (unknown):
```unknown
CONNECTION_BAD
```

Example 4 (unknown):
```unknown
CONNECTION_OK
```

---


---

