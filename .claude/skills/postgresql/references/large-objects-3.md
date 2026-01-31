# PostgreSQL - Large Objects (Part 3)

## 33.3. Client Interfaces #


**URL:** https://www.postgresql.org/docs/18/lo-interfaces.html

**Contents:**
- 33.3. Client Interfaces #
  - 33.3.1. Creating a Large Object #
  - 33.3.2. Importing a Large Object #
  - 33.3.3. Exporting a Large Object #
  - 33.3.4. Opening an Existing Large Object #
  - 33.3.5. Writing Data to a Large Object #
  - 33.3.6. Reading Data from a Large Object #
  - 33.3.7. Seeking in a Large Object #
  - 33.3.8. Obtaining the Seek Position of a Large Object #
  - 33.3.9. Truncating a Large Object #

This section describes the facilities that PostgreSQL's libpq client interface library provides for accessing large objects. The PostgreSQL large object interface is modeled after the Unix file-system interface, with analogues of open, read, write, lseek, etc.

All large object manipulation using these functions must take place within an SQL transaction block, since large object file descriptors are only valid for the duration of a transaction. Write operations, including lo_open with the INV_WRITE mode, are not allowed in a read-only transaction.

If an error occurs while executing any one of these functions, the function will return an otherwise-impossible value, typically 0 or -1. A message describing the error is stored in the connection object and can be retrieved with PQerrorMessage .

Client applications that use these functions should include the header file libpq/libpq-fs.h and link with the libpq library.

Client applications cannot use these functions while a libpq connection is in pipeline mode.

creates a new large object. The OID to be assigned can be specified by lobjId; if so, failure occurs if that OID is already in use for some large object. If lobjId is InvalidOid (zero) then lo_create assigns an unused OID. The return value is the OID that was assigned to the new large object, or InvalidOid (zero) on failure.

also creates a new large object, always assigning an unused OID. The return value is the OID that was assigned to the new large object, or InvalidOid (zero) on failure.

In PostgreSQL releases 8.1 and later, the mode is ignored, so that lo_creat is exactly equivalent to lo_create with a zero second argument. However, there is little reason to use lo_creat unless you need to work with servers older than 8.1. To work with such an old server, you must use lo_creat not lo_create, and you must set mode to one of INV_READ, INV_WRITE, or INV_READ | INV_WRITE. (These symbolic constants are defined in the header file libpq/libpq-fs.h.)

To import an operating system file as a large object, call

filename specifies the operating system name of the file to be imported as a large object. The return value is the OID that was assigned to the new large object, or InvalidOid (zero) on failure. Note that the file is read by the client interface library, not by the server; so it must exist in the client file system and be readable by the client application.

also imports a new large object. The OID to be assigned can be specified by lobjId; if so, failure occurs if that OID is already in use for some large object. If lobjId is InvalidOid (zero) then lo_import_with_oid assigns an unused OID (this is the same behavior as lo_import). The return value is the OID that was assigned to the new large object, or InvalidOid (zero) on failure.

lo_import_with_oid is new as of PostgreSQL 8.4 and uses lo_create internally which is new in 8.1; if this function is run against 8.0 or before, it will fail and return InvalidOid.

To export a large object into an operating system file, call

The lobjId argument specifies the OID of the large object to export and the filename argument specifies the operating system name of the file. Note that the file is written by the client interface library, not by the server. Returns 1 on success, -1 on failure.

To open an existing large object for reading or writing, call

The lobjId argument specifies the OID of the large object to open. The mode bits control whether the object is opened for reading (INV_READ), writing (INV_WRITE), or both. (These symbolic constants are defined in the header file libpq/libpq-fs.h.) lo_open returns a (non-negative) large object descriptor for later use in lo_read, lo_write, lo_lseek, lo_lseek64, lo_tell, lo_tell64, lo_truncate, lo_truncate64, and lo_close. The descriptor is only valid for the duration of the current transaction. On failure, -1 is returned.

The server currently does not distinguish between modes INV_WRITE and INV_READ | INV_WRITE: you are allowed to read from the descriptor in either case. However there is a significant difference between these modes and INV_READ alone: with INV_READ you cannot write on the descriptor, and the data read from it will reflect the contents of the large object at the time of the transaction snapshot that was active when lo_open was executed, regardless of later writes by this or other transactions. Reading from a descriptor opened with INV_WRITE returns data that reflects all writes of other committed transactions as well as writes of the current transaction. This is similar to the behavior of REPEATABLE READ versus READ COMMITTED transaction modes for ordinary SQL SELECT commands.

lo_open will fail if SELECT privilege is not available for the large object, or if INV_WRITE is specified and UPDATE privilege is not available. (Prior to PostgreSQL 11, these privilege checks were instead performed at the first actual read or write call using the descriptor.) These privilege checks can be disabled with the lo_compat_privileges run-time parameter.

writes len bytes from buf (which must be of size len) to large object descriptor fd. The fd argument must have been returned by a previous lo_open. The number of bytes actually written is returned (in the current implementation, this will always equal len unless there is an error). In the event of an error, the return value is -1.

Although the len parameter is declared as size_t, this function will reject length values larger than INT_MAX. In practice, it's best to transfer data in chunks of at most a few megabytes anyway.

reads up to len bytes from large object descriptor fd into buf (which must be of size len). The fd argument must have been returned by a previous lo_open. The number of bytes actually read is returned; this will be less than len if the end of the large object is reached first. In the event of an error, the return value is -1.

Although the len parameter is declared as size_t, this function will reject length values larger than INT_MAX. In practice, it's best to transfer data in chunks of at most a few megabytes anyway.

To change the current read or write location associated with a large object descriptor, call

This function moves the current location pointer for the large object descriptor identified by fd to the new location specified by offset. The valid values for whence are SEEK_SET (seek from object start), SEEK_CUR (seek from current position), and SEEK_END (seek from object end). The return value is the new location pointer, or -1 on error.

When dealing with large objects that might exceed 2GB in size, instead use

This function has the same behavior as lo_lseek, but it can accept an offset larger than 2GB and/or deliver a result larger than 2GB. Note that lo_lseek will fail if the new location pointer would be greater than 2GB.

lo_lseek64 is new as of PostgreSQL 9.3. If this function is run against an older server version, it will fail and return -1.

To obtain the current read or write location of a large object descriptor, call

If there is an error, the return value is -1.

When dealing with large objects that might exceed 2GB in size, instead use

This function has the same behavior as lo_tell, but it can deliver a result larger than 2GB. Note that lo_tell will fail if the current read/write location is greater than 2GB.

lo_tell64 is new as of PostgreSQL 9.3. If this function is run against an older server version, it will fail and return -1.

To truncate a large object to a given length, call

This function truncates the large object descriptor fd to length len. The fd argument must have been returned by a previous lo_open. If len is greater than the large object's current length, the large object is extended to the specified length with null bytes ('\0'). On success, lo_truncate returns zero. On error, the return value is -1.

The read/write location associated with the descriptor fd is not changed.

Although the len parameter is declared as size_t, lo_truncate will reject length values larger than INT_MAX.

When dealing with large objects that might exceed 2GB in size, instead use

This function has the same behavior as lo_truncate, but it can accept a len value exceeding 2GB.

lo_truncate is new as of PostgreSQL 8.3; if this function is run against an older server version, it will fail and return -1.

lo_truncate64 is new as of PostgreSQL 9.3; if this function is run against an older server version, it will fail and return -1.

A large object descriptor can be closed by calling

where fd is a large object descriptor returned by lo_open. On success, lo_close returns zero. On error, the return value is -1.

Any large object descriptors that remain open at the end of a transaction will be closed automatically.

To remove a large object from the database, call

The lobjId argument specifies the OID of the large object to remove. Returns 1 if successful, -1 on failure.

**Examples:**

Example 1 (unknown):
```unknown
PQerrorMessage
```

Example 2 (unknown):
```unknown
libpq/libpq-fs.h
```

Example 3 (unknown):
```unknown
inv_oid = lo_create(conn, desired_oid);
```

Example 4 (unknown):
```unknown
libpq/libpq-fs.h
```

---


---

## 33.1. Introduction #


**URL:** https://www.postgresql.org/docs/18/lo-intro.html

**Contents:**
- 33.1. Introduction #

All large objects are stored in a single system table named pg_largeobject. Each large object also has an entry in the system table pg_largeobject_metadata. Large objects can be created, modified, and deleted using a read/write API that is similar to standard operations on files.

PostgreSQL also supports a storage system called “TOAST”, which automatically stores values larger than a single database page into a secondary storage area per table. This makes the large object facility partially obsolete. One remaining advantage of the large object facility is that it allows values up to 4 TB in size, whereas TOASTed fields can be at most 1 GB. Also, reading and updating portions of a large object can be done efficiently, while most operations on a TOASTed field will read or write the whole value as a unit.

**Examples:**

Example 1 (unknown):
```unknown
pg_largeobject
```

Example 2 (unknown):
```unknown
pg_largeobject_metadata
```

---


---

