# PostgreSQL - Libpq

## 32.21. Behavior in Threaded Programs #


**URL:** https://www.postgresql.org/docs/18/libpq-threading.html

**Contents:**
- 32.21. Behavior in Threaded Programs #

As of version 17, libpq is always reentrant and thread-safe. However, one restriction is that no two threads attempt to manipulate the same PGconn object at the same time. In particular, you cannot issue concurrent commands from different threads through the same connection object. (If you need to run concurrent commands, use multiple connections.)

PGresult objects are normally read-only after creation, and so can be passed around freely between threads. However, if you use any of the PGresult-modifying functions described in Section 32.12 or Section 32.14, it's up to you to avoid concurrent operations on the same PGresult, too.

In earlier versions, libpq could be compiled with or without thread support, depending on compiler options. This function allows the querying of libpq's thread-safe status:

Returns the thread safety status of the libpq library.

Returns 1 if the libpq is thread-safe and 0 if it is not. Always returns 1 on version 17 and above.

The deprecated functions PQrequestCancel and PQoidStatus are not thread-safe and should not be used in multithread programs. PQrequestCancel can be replaced by PQcancelBlocking. PQoidStatus can be replaced by PQoidValue.

If you are using Kerberos inside your application (in addition to inside libpq), you will need to do locking around Kerberos calls because Kerberos functions are not thread-safe. See function PQregisterThreadLock in the libpq source code for a way to do cooperative locking between libpq and your application.

Similarly, if you are using Curl inside your application, and you do not already initialize libcurl globally before starting new threads, you will need to cooperatively lock (again via PQregisterThreadLock) around any code that may initialize libcurl. This restriction is lifted for more recent versions of Curl that are built to support thread-safe initialization; those builds can be identified by the advertisement of a threadsafe feature in their version metadata.

**Examples:**

Example 1 (unknown):
```unknown
PQisthreadsafe
```

Example 2 (unknown):
```unknown
PQrequestCancel
```

Example 3 (unknown):
```unknown
PQoidStatus
```

Example 4 (unknown):
```unknown
PQrequestCancel
```

---


---

## 32.18. LDAP Lookup of Connection Parameters #


**URL:** https://www.postgresql.org/docs/18/libpq-ldap.html

**Contents:**
- 32.18. LDAP Lookup of Connection Parameters #

If libpq has been compiled with LDAP support (option --with-ldap for configure) it is possible to retrieve connection options like host or dbname via LDAP from a central server. The advantage is that if the connection parameters for a database change, the connection information doesn't have to be updated on all client machines.

LDAP connection parameter lookup uses the connection service file pg_service.conf (see Section 32.17). A line in a pg_service.conf stanza that starts with ldap:// will be recognized as an LDAP URL and an LDAP query will be performed. The result must be a list of keyword = value pairs which will be used to set connection options. The URL must conform to RFC 1959 and be of the form

where hostname defaults to localhost and port defaults to 389.

Processing of pg_service.conf is terminated after a successful LDAP lookup, but is continued if the LDAP server cannot be contacted. This is to provide a fallback with further LDAP URL lines that point to different LDAP servers, classical keyword = value pairs, or default connection options. If you would rather get an error message in this case, add a syntactically incorrect line after the LDAP URL.

A sample LDAP entry that has been created with the LDIF file

might be queried with the following LDAP URL:

You can also mix regular service file entries with LDAP lookups. A complete example for a stanza in pg_service.conf would be:

**Examples:**

Example 1 (unknown):
```unknown
--with-ldap
```

Example 2 (unknown):
```unknown
--with-ldap
```

Example 3 (unknown):
```unknown
pg_service.conf
```

Example 4 (unknown):
```unknown
pg_service.conf
```

---


---

## 32.17. The Connection Service File #


**URL:** https://www.postgresql.org/docs/18/libpq-pgservice.html

**Contents:**
- 32.17. The Connection Service File #

The connection service file allows libpq connection parameters to be associated with a single service name. That service name can then be specified using the service key word in a libpq connection string, and the associated settings will be used. This allows connection parameters to be modified without requiring a recompile of the libpq-using application. The service name can also be specified using the PGSERVICE environment variable.

Service names can be defined in either a per-user service file or a system-wide file. If the same service name exists in both the user and the system file, the user file takes precedence. By default, the per-user service file is named ~/.pg_service.conf. On Microsoft Windows, it is named %APPDATA%\postgresql\.pg_service.conf (where %APPDATA% refers to the Application Data subdirectory in the user's profile). A different file name can be specified by setting the environment variable PGSERVICEFILE. The system-wide file is named pg_service.conf. By default it is sought in the etc directory of the PostgreSQL installation (use pg_config --sysconfdir to identify this directory precisely). Another directory, but not a different file name, can be specified by setting the environment variable PGSYSCONFDIR.

Either service file uses an “INI file” format where the section name is the service name and the parameters are connection parameters; see Section 32.1.2 for a list. For example:

An example file is provided in the PostgreSQL installation at share/pg_service.conf.sample.

Connection parameters obtained from a service file are combined with parameters obtained from other sources. A service file setting overrides the corresponding environment variable, and in turn can be overridden by a value given directly in the connection string. For example, using the above service file, a connection string service=mydb port=5434 will use host somehost, port 5434, user admin, and other parameters as set by environment variables or built-in defaults.

**Examples:**

Example 1 (unknown):
```unknown
~/.pg_service.conf
```

Example 2 (unknown):
```unknown
%APPDATA%\postgresql\.pg_service.conf
```

Example 3 (unknown):
```unknown
PGSERVICEFILE
```

Example 4 (unknown):
```unknown
pg_service.conf
```

---


---

