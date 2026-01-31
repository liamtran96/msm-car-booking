# PostgreSQL - Misc (Part 15)

## Chapter 46. Background Worker Processes


**URL:** https://www.postgresql.org/docs/18/bgworker.html

**Contents:**
- Chapter 46. Background Worker Processes
  - Warning

PostgreSQL can be extended to run user-supplied code in separate processes. Such processes are started, stopped and monitored by postgres, which permits them to have a lifetime closely linked to the server's status. These processes are attached to PostgreSQL's shared memory area and have the option to connect to databases internally; they can also run multiple transactions serially, just like a regular client-connected server process. Also, by linking to libpq they can connect to the server and behave like a regular client application.

There are considerable robustness and security risks in using background worker processes because, being written in the C language, they have unrestricted access to data. Administrators wishing to enable modules that include background worker processes should exercise extreme caution. Only carefully audited modules should be permitted to run background worker processes.

Background workers can be initialized at the time that PostgreSQL is started by including the module name in shared_preload_libraries. A module wishing to run a background worker can register it by calling RegisterBackgroundWorker(BackgroundWorker *worker) from its _PG_init() function. Background workers can also be started after the system is up and running by calling RegisterDynamicBackgroundWorker(BackgroundWorker *worker, BackgroundWorkerHandle **handle). Unlike RegisterBackgroundWorker, which can only be called from within the postmaster process, RegisterDynamicBackgroundWorker must be called from a regular backend or another background worker.

The structure BackgroundWorker is defined thus:

bgw_name and bgw_type are strings to be used in log messages, process listings and similar contexts. bgw_type should be the same for all background workers of the same type, so that it is possible to group such workers in a process listing, for example. bgw_name on the other hand can contain additional information about the specific process. (Typically, the string for bgw_name will contain the type somehow, but that is not strictly required.)

bgw_flags is a bitwise-or'd bit mask indicating the capabilities that the module wants. Possible values are:

Requests shared memory access. This flag is required.

Requests the ability to establish a database connection through which it can later run transactions and queries. A background worker using BGWORKER_BACKEND_DATABASE_CONNECTION to connect to a database must also attach shared memory using BGWORKER_SHMEM_ACCESS, or worker start-up will fail.

bgw_start_time is the server state during which postgres should start the process; it can be one of BgWorkerStart_PostmasterStart (start as soon as postgres itself has finished its own initialization; processes requesting this are not eligible for database connections), BgWorkerStart_ConsistentState (start as soon as a consistent state has been reached in a hot standby, allowing processes to connect to databases and run read-only queries), and BgWorkerStart_RecoveryFinished (start as soon as the system has entered normal read-write state). Note the last two values are equivalent in a server that's not a hot standby. Note that this setting only indicates when the processes are to be started; they do not stop when a different state is reached.

bgw_restart_time is the interval, in seconds, that postgres should wait before restarting the process in the event that it crashes. It can be any positive value, or BGW_NEVER_RESTART, indicating not to restart the process in case of a crash.

bgw_library_name is the name of a library in which the initial entry point for the background worker should be sought. The named library will be dynamically loaded by the worker process and bgw_function_name will be used to identify the function to be called. If calling a function in the core code, this must be set to "postgres".

bgw_function_name is the name of the function to use as the initial entry point for the new background worker. If this function is in a dynamically loaded library, it must be marked PGDLLEXPORT (and not static).

bgw_main_arg is the Datum argument to the background worker main function. This main function should take a single argument of type Datum and return void. bgw_main_arg will be passed as the argument. In addition, the global variable MyBgworkerEntry points to a copy of the BackgroundWorker structure passed at registration time; the worker may find it helpful to examine this structure.

On Windows (and anywhere else where EXEC_BACKEND is defined) or in dynamic background workers it is not safe to pass a Datum by reference, only by value. If an argument is required, it is safest to pass an int32 or other small value and use that as an index into an array allocated in shared memory. If a value like a cstring or text is passed then the pointer won't be valid from the new background worker process.

bgw_extra can contain extra data to be passed to the background worker. Unlike bgw_main_arg, this data is not passed as an argument to the worker's main function, but it can be accessed via MyBgworkerEntry, as discussed above.

bgw_notify_pid is the PID of a PostgreSQL backend process to which the postmaster should send SIGUSR1 when the process is started or exits. It should be 0 for workers registered at postmaster startup time, or when the backend registering the worker does not wish to wait for the worker to start up. Otherwise, it should be initialized to MyProcPid.

Once running, the process can connect to a database by calling BackgroundWorkerInitializeConnection(char *dbname, char *username, uint32 flags) or BackgroundWorkerInitializeConnectionByOid(Oid dboid, Oid useroid, uint32 flags). This allows the process to run transactions and queries using the SPI interface. If dbname is NULL or dboid is InvalidOid, the session is not connected to any particular database, but shared catalogs can be accessed. If username is NULL or useroid is InvalidOid, the process will run as the superuser created during initdb. If BGWORKER_BYPASS_ALLOWCONN is specified as flags it is possible to bypass the restriction to connect to databases not allowing user connections. If BGWORKER_BYPASS_ROLELOGINCHECK is specified as flags it is possible to bypass the login check for the role used to connect to databases. A background worker can only call one of these two functions, and only once. It is not possible to switch databases.

Signals are initially blocked when control reaches the background worker's main function, and must be unblocked by it; this is to allow the process to customize its signal handlers, if necessary. Signals can be unblocked in the new process by calling BackgroundWorkerUnblockSignals and blocked by calling BackgroundWorkerBlockSignals.

If bgw_restart_time for a background worker is configured as BGW_NEVER_RESTART, or if it exits with an exit code of 0 or is terminated by TerminateBackgroundWorker, it will be automatically unregistered by the postmaster on exit. Otherwise, it will be restarted after the time period configured via bgw_restart_time, or immediately if the postmaster reinitializes the cluster due to a backend failure. Backends which need to suspend execution only temporarily should use an interruptible sleep rather than exiting; this can be achieved by calling WaitLatch(). Make sure the WL_POSTMASTER_DEATH flag is set when calling that function, and verify the return code for a prompt exit in the emergency case that postgres itself has terminated.

When a background worker is registered using the RegisterDynamicBackgroundWorker function, it is possible for the backend performing the registration to obtain information regarding the status of the worker. Backends wishing to do this should pass the address of a BackgroundWorkerHandle * as the second argument to RegisterDynamicBackgroundWorker. If the worker is successfully registered, this pointer will be initialized with an opaque handle that can subsequently be passed to GetBackgroundWorkerPid(BackgroundWorkerHandle *, pid_t *) or TerminateBackgroundWorker(BackgroundWorkerHandle *). GetBackgroundWorkerPid can be used to poll the status of the worker: a return value of BGWH_NOT_YET_STARTED indicates that the worker has not yet been started by the postmaster; BGWH_STOPPED indicates that it has been started but is no longer running; and BGWH_STARTED indicates that it is currently running. In this last case, the PID will also be returned via the second argument. TerminateBackgroundWorker causes the postmaster to send SIGTERM to the worker if it is running, and to unregister it as soon as it is not.

In some cases, a process which registers a background worker may wish to wait for the worker to start up. This can be accomplished by initializing bgw_notify_pid to MyProcPid and then passing the BackgroundWorkerHandle * obtained at registration time to WaitForBackgroundWorkerStartup(BackgroundWorkerHandle *handle, pid_t *) function. This function will block until the postmaster has attempted to start the background worker, or until the postmaster dies. If the background worker is running, the return value will be BGWH_STARTED, and the PID will be written to the provided address. Otherwise, the return value will be BGWH_STOPPED or BGWH_POSTMASTER_DIED.

A process can also wait for a background worker to shut down, by using the WaitForBackgroundWorkerShutdown(BackgroundWorkerHandle *handle) function and passing the BackgroundWorkerHandle * obtained at registration. This function will block until the background worker exits, or postmaster dies. When the background worker exits, the return value is BGWH_STOPPED, if postmaster dies it will return BGWH_POSTMASTER_DIED.

Background workers can send asynchronous notification messages, either by using the NOTIFY command via SPI, or directly via Async_Notify(). Such notifications will be sent at transaction commit. Background workers should not register to receive asynchronous notifications with the LISTEN command, as there is no infrastructure for a worker to consume such notifications.

The src/test/modules/worker_spi module contains a working example, which demonstrates some useful techniques.

The maximum number of registered background workers is limited by max_worker_processes.

**Examples:**

Example 1 (unknown):
```unknown
shared_preload_libraries
```

Example 2 (unknown):
```unknown
RegisterBackgroundWorker(BackgroundWorker *worker)
```

Example 3 (unknown):
```unknown
BackgroundWorker
```

Example 4 (unknown):
```unknown
RegisterDynamicBackgroundWorker(BackgroundWorker *worker, BackgroundWorkerHandle **handle)
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/oid2name.html

**Contents:**
- oid2name
- Synopsis
- Description
  - Note
- Options
- Environment
- Notes
- Examples
- Author

oid2name — resolve OIDs and file nodes in a PostgreSQL data directory

oid2name is a utility program that helps administrators to examine the file structure used by PostgreSQL. To make use of it, you need to be familiar with the database file structure, which is described in Chapter 66.

The name “oid2name” is historical, and is actually rather misleading, since most of the time when you use it, you will really be concerned with tables' filenode numbers (which are the file names visible in the database directories). Be sure you understand the difference between table OIDs and table filenodes!

oid2name connects to a target database and extracts OID, filenode, and/or table name information. You can also have it show database OIDs or tablespace OIDs.

oid2name accepts the following command-line arguments:

show info for table with filenode filenode.

include indexes and sequences in the listing.

show info for table with OID oid.

omit headers (useful for scripting).

show tablespace OIDs.

include system objects (those in information_schema, pg_toast and pg_catalog schemas).

show info for table(s) matching tablename_pattern.

Print the oid2name version and exit.

display more information about each object shown: tablespace name, schema name, and OID.

Show help about oid2name command line arguments, and exit.

oid2name also accepts the following command-line arguments for connection parameters:

database to connect to.

database server's host.

database server's host. Use of this parameter is deprecated as of PostgreSQL 12.

database server's port.

user name to connect as.

To display specific tables, select which tables to show by using -o, -f and/or -t. -o takes an OID, -f takes a filenode, and -t takes a table name (actually, it's a LIKE pattern, so you can use things like foo%). You can use as many of these options as you like, and the listing will include all objects matched by any of the options. But note that these options can only show objects in the database given by -d.

If you don't give any of -o, -f or -t, but do give -d, it will list all tables in the database named by -d. In this mode, the -S and -i options control what gets listed.

If you don't give -d either, it will show a listing of database OIDs. Alternatively you can give -s to get a tablespace listing.

Default connection parameters.

This utility, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

oid2name requires a running database server with non-corrupt system catalogs. It is therefore of only limited use for recovering from catastrophic database corruption situations.

B. Palmer <bpalmer@crimelabs.net>

**Examples:**

Example 1 (unknown):
```unknown
-f filenode
```

Example 2 (unknown):
```unknown
--filenode=filenode
```

Example 3 (unknown):
```unknown
--tablespaces
```

Example 4 (unknown):
```unknown
--system-objects
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-saveplan.html

**Contents:**
- SPI_saveplan
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_saveplan — save a prepared statement

SPI_saveplan copies a passed statement (prepared by SPI_prepare) into memory that will not be freed by SPI_finish nor by the transaction manager, and returns a pointer to the copied statement. This gives you the ability to reuse prepared statements in the subsequent invocations of your C function in the current session.

the prepared statement to be saved

Pointer to the copied statement; or NULL if unsuccessful. On error, SPI_result is set thus:

if plan is NULL or invalid

if called from an unconnected C function

The originally passed-in statement is not freed, so you might wish to do SPI_freeplan on it to avoid leaking memory until SPI_finish.

In most cases, SPI_keepplan is preferred to this function, since it accomplishes largely the same result without needing to physically copy the prepared statement's data structures.

**Examples:**

Example 1 (unknown):
```unknown
SPI_saveplan
```

Example 2 (unknown):
```unknown
SPI_prepare
```

Example 3 (unknown):
```unknown
SPIPlanPtr plan
```

Example 4 (unknown):
```unknown
SPI_ERROR_ARGUMENT
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/pgtestfsync.html

**Contents:**
- pg_test_fsync
- Synopsis
- Description
- Options
- Environment
- See Also

pg_test_fsync — determine fastest wal_sync_method for PostgreSQL

pg_test_fsync [option...]

pg_test_fsync is intended to give you a reasonable idea of what the fastest wal_sync_method is on your specific system, as well as supplying diagnostic information in the event of an identified I/O problem. However, differences shown by pg_test_fsync might not make any significant difference in real database throughput, especially since many database servers are not speed-limited by their write-ahead logs. pg_test_fsync reports average file sync operation time in microseconds for each wal_sync_method, which can also be used to inform efforts to optimize the value of commit_delay.

pg_test_fsync accepts the following command-line options:

Specifies the file name to write test data in. This file should be in the same file system that the pg_wal directory is or will be placed in. (pg_wal contains the WAL files.) The default is pg_test_fsync.out in the current directory.

Specifies the number of seconds for each test. The more time per test, the greater the test's accuracy, but the longer it takes to run. The default is 5 seconds, which allows the program to complete in under 2 minutes.

Print the pg_test_fsync version and exit.

Show help about pg_test_fsync command line arguments, and exit.

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

**Examples:**

Example 1 (unknown):
```unknown
wal_sync_method
```

Example 2 (unknown):
```unknown
pg_test_fsync
```

Example 3 (unknown):
```unknown
wal_sync_method
```

Example 4 (unknown):
```unknown
pg_test_fsync.out
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-fnumber.html

**Contents:**
- SPI_fnumber
- Synopsis
- Description
- Arguments
- Return Value

SPI_fnumber — determine the column number for the specified column name

SPI_fnumber returns the column number for the column with the specified name.

If colname refers to a system column (e.g., ctid) then the appropriate negative column number will be returned. The caller should be careful to test the return value for exact equality to SPI_ERROR_NOATTRIBUTE to detect an error; testing the result for less than or equal to 0 is not correct unless system columns should be rejected.

input row description

Column number (count starts at 1 for user-defined columns), or SPI_ERROR_NOATTRIBUTE if the named column was not found.

**Examples:**

Example 1 (unknown):
```unknown
SPI_fnumber
```

Example 2 (unknown):
```unknown
SPI_ERROR_NOATTRIBUTE
```

Example 3 (unknown):
```unknown
TupleDesc rowdesc
```

Example 4 (unknown):
```unknown
const char * colname
```

---


---

