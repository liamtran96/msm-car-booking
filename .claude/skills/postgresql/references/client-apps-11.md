# PostgreSQL - Client Apps (Part 11)

## 


**URL:** https://www.postgresql.org/docs/18/app-postgres.html

**Contents:**
- postgres
- Synopsis
- Description
- Options
  - General Purpose
  - Semi-Internal Options
  - Options for Single-User Mode
- Environment
- Diagnostics
- Notes

postgres — PostgreSQL database server

postgres is the PostgreSQL database server. In order for a client application to access a database it connects (over a network or locally) to a running postgres instance. The postgres instance then starts a separate server process to handle the connection.

One postgres instance always manages the data of exactly one database cluster. A database cluster is a collection of databases that is stored at a common file system location (the “data area”). More than one postgres instance can run on a system at one time, so long as they use different data areas and different communication ports (see below). When postgres starts it needs to know the location of the data area. The location must be specified by the -D option or the PGDATA environment variable; there is no default. Typically, -D or PGDATA points directly to the data area directory created by initdb. Other possible file layouts are discussed in Section 19.2.

By default postgres starts in the foreground and prints log messages to the standard error stream. In practical applications postgres should be started as a background process, perhaps at boot time.

The postgres command can also be called in single-user mode. The primary use for this mode is during bootstrapping by initdb. Sometimes it is used for debugging or disaster recovery; note that running a single-user server is not truly suitable for debugging the server, since no realistic interprocess communication and locking will happen. When invoked in single-user mode from the shell, the user can enter queries and the results will be printed to the screen, but in a form that is more useful for developers than end users. In the single-user mode, the session user will be set to the user with ID 1, and implicit superuser powers are granted to this user. This user does not actually have to exist, so the single-user mode can be used to manually recover from certain kinds of accidental damage to the system catalogs.

postgres accepts the following command-line arguments. For a detailed discussion of the options consult Chapter 19. You can save typing most of these options by setting up a configuration file. Some (safe) options can also be set from the connecting client in an application-dependent way to apply only for that session. For example, if the environment variable PGOPTIONS is set, then libpq-based clients will pass that string to the server, which will interpret it as postgres command-line options.

Sets the number of shared buffers for use by the server processes. The default value of this parameter is chosen automatically by initdb. Specifying this option is equivalent to setting the shared_buffers configuration parameter.

Sets a named run-time parameter. The configuration parameters supported by PostgreSQL are described in Chapter 19. Most of the other command line options are in fact short forms of such a parameter assignment. -c can appear multiple times to set multiple parameters.

Prints the value of the named run-time parameter, and exits. (See the -c option above for details.) This returns values from postgresql.conf, modified by any parameters supplied in this invocation. It does not reflect parameters supplied when the cluster was started.

This can be used on a running server for most parameters. However, the server must be shut down for some runtime-computed parameters (e.g., shared_memory_size, shared_memory_size_in_huge_pages, and wal_segment_size).

This option is meant for other programs that interact with a server instance, such as pg_ctl, to query configuration parameter values. User-facing applications should instead use SHOW or the pg_settings view.

Sets the debug level. The higher this value is set, the more debugging output is written to the server log. Values are from 1 to 5. It is also possible to pass -d 0 for a specific session, which will prevent the server log level of the parent postgres process from being propagated to this session.

Specifies the file system location of the database configuration files. See Section 19.2 for details.

Sets the default date style to “European”, that is DMY ordering of input date fields. This also causes the day to be printed before the month in certain date output formats. See Section 8.5 for more information.

Disables fsync calls for improved performance, at the risk of data corruption in the event of a system crash. Specifying this option is equivalent to disabling the fsync configuration parameter. Read the detailed documentation before using this!

Specifies the IP host name or address on which postgres is to listen for TCP/IP connections from client applications. The value can also be a comma-separated list of addresses, or * to specify listening on all available interfaces. An empty value specifies not listening on any IP addresses, in which case only Unix-domain sockets can be used to connect to the server. Defaults to listening only on localhost. Specifying this option is equivalent to setting the listen_addresses configuration parameter.

Allows remote clients to connect via TCP/IP (Internet domain) connections. Without this option, only local connections are accepted. This option is equivalent to setting listen_addresses to * in postgresql.conf or via -h.

This option is deprecated since it does not allow access to the full functionality of listen_addresses. It's usually better to set listen_addresses directly.

Specifies the directory of the Unix-domain socket on which postgres is to listen for connections from client applications. The value can also be a comma-separated list of directories. An empty value specifies not listening on any Unix-domain sockets, in which case only TCP/IP sockets can be used to connect to the server. The default value is normally /tmp, but that can be changed at build time. Specifying this option is equivalent to setting the unix_socket_directories configuration parameter.

Enables secure connections using SSL. PostgreSQL must have been compiled with support for SSL for this option to be available. For more information on using SSL, refer to Section 18.9.

Sets the maximum number of client connections that this server will accept. The default value of this parameter is chosen automatically by initdb. Specifying this option is equivalent to setting the max_connections configuration parameter.

Specifies the TCP/IP port or local Unix domain socket file extension on which postgres is to listen for connections from client applications. Defaults to the value of the PGPORT environment variable, or if PGPORT is not set, then defaults to the value established during compilation (normally 5432). If you specify a port other than the default port, then all client applications must specify the same port using either command-line options or PGPORT.

Print time information and other statistics at the end of each command. This is useful for benchmarking or for use in tuning the number of buffers.

Specifies the base amount of memory to be used by sorts and hash tables before resorting to temporary disk files. See the description of the work_mem configuration parameter in Section 19.4.1.

Print the postgres version and exit.

Sets a named run-time parameter; a shorter form of -c.

This option dumps out the server's internal configuration variables, descriptions, and defaults in tab-delimited COPY format. It is designed primarily for use by administration tools.

Show help about postgres command line arguments, and exit.

The options described here are used mainly for debugging purposes, and in some cases to assist with recovery of severely damaged databases. There should be no reason to use them in a production database setup. They are listed here only for use by PostgreSQL system developers. Furthermore, these options might change or be removed in a future release without notice.

Forbids the use of particular scan and join methods: s and i disable sequential and index scans respectively, o, b and t disable index-only scans, bitmap index scans, and TID scans respectively, while n, m, and h disable nested-loop, merge and hash joins respectively.

Neither sequential scans nor nested-loop joins can be disabled completely; the -fs and -fn options simply discourage the optimizer from using those plan types if it has any other alternative.

Allows the structure of system tables to be modified. This is used by initdb.

Ignore system indexes when reading system tables, but still update the indexes when modifying the tables. This is useful when recovering from damaged system indexes.

Print timing statistics for each query relating to each of the major system modules. This option cannot be used together with the -s option.

This option is for debugging problems that cause a server process to die abnormally. The ordinary strategy in this situation is to notify all other server processes that they must terminate, by sending them SIGQUIT signals. With this option, SIGABRT will be sent instead, resulting in production of core dump files.

Specifies the version number of the frontend/backend protocol to be used for a particular session. This option is for internal use only.

A delay of this many seconds occurs when a new server process is started, after it conducts the authentication procedure. This is intended to give an opportunity to attach to the server process with a debugger.

The following options only apply to the single-user mode (see Single-User Mode below).

Selects the single-user mode. This must be the first argument on the command line.

Specifies the name of the database to be accessed. This must be the last argument on the command line. If it is omitted it defaults to the user name.

Echo all commands to standard output before executing them.

Use semicolon followed by two newlines, rather than just newline, as the command entry terminator.

Send all server log output to filename. This option is only honored when supplied as a command-line option.

Default character encoding used by clients. (The clients can override this individually.) This value can also be set in the configuration file.

Default data directory location

Default value of the DateStyle run-time parameter. (The use of this environment variable is deprecated.)

Default port number (preferably set in the configuration file)

A failure message mentioning semget or shmget probably indicates you need to configure your kernel to provide adequate shared memory and semaphores. For more discussion see Section 18.4. You might be able to postpone reconfiguring your kernel by decreasing shared_buffers to reduce the shared memory consumption of PostgreSQL, and/or by reducing max_connections to reduce the semaphore consumption.

A failure message suggesting that another server is already running should be checked carefully, for example by using the command

depending on your system. If you are certain that no conflicting server is running, you can remove the lock file mentioned in the message and try again.

A failure message indicating inability to bind to a port might indicate that that port is already in use by some non-PostgreSQL process. You might also get this error if you terminate postgres and immediately restart it using the same port; in this case, you must simply wait a few seconds until the operating system closes the port before trying again. Finally, you might get this error if you specify a port number that your operating system considers to be reserved. For example, many versions of Unix consider port numbers under 1024 to be “trusted” and only permit the Unix superuser to access them.

The utility command pg_ctl can be used to start and shut down the postgres server safely and comfortably.

If at all possible, do not use SIGKILL to kill the main postgres server. Doing so will prevent postgres from freeing the system resources (e.g., shared memory and semaphores) that it holds before terminating. This might cause problems for starting a fresh postgres run.

To terminate the postgres server normally, the signals SIGTERM, SIGINT, or SIGQUIT can be used. The first will wait for all clients to terminate before quitting, the second will forcefully disconnect all clients, and the third will quit immediately without proper shutdown, resulting in a recovery run during restart.

The SIGHUP signal will reload the server configuration files. It is also possible to send SIGHUP to an individual server process, but that is usually not sensible.

To cancel a running query, send the SIGINT signal to the process running that command. To terminate a backend process cleanly, send SIGTERM to that process. See also pg_cancel_backend and pg_terminate_backend in Section 9.28.2 for the SQL-callable equivalents of these two actions.

The postgres server uses SIGQUIT to tell subordinate server processes to terminate without normal cleanup. This signal should not be used by users. It is also unwise to send SIGKILL to a server process — the main postgres process will interpret this as a crash and will force all the sibling processes to quit as part of its standard crash-recovery procedure.

The -- options will not work on FreeBSD or OpenBSD. Use -c instead. This is a bug in the affected operating systems; a future release of PostgreSQL will provide a workaround if this is not fixed.

To start a single-user mode server, use a command like

Provide the correct path to the database directory with -D, or make sure that the environment variable PGDATA is set. Also specify the name of the particular database you want to work in.

Normally, the single-user mode server treats newline as the command entry terminator; there is no intelligence about semicolons, as there is in psql. To continue a command across multiple lines, you must type backslash just before each newline except the last one. The backslash and adjacent newline are both dropped from the input command. Note that this will happen even when within a string literal or comment.

But if you use the -j command line switch, a single newline does not terminate command entry; instead, the sequence semicolon-newline-newline does. That is, type a semicolon immediately followed by a completely empty line. Backslash-newline is not treated specially in this mode. Again, there is no intelligence about such a sequence appearing within a string literal or comment.

In either input mode, if you type a semicolon that is not just before or part of a command entry terminator, it is considered a command separator. When you do type a command entry terminator, the multiple statements you've entered will be executed as a single transaction.

To quit the session, type EOF (Control+D, usually). If you've entered any text since the last command entry terminator, then EOF will be taken as a command entry terminator, and another EOF will be needed to exit.

Note that the single-user mode server does not provide sophisticated line-editing features (no command history, for example). Single-user mode also does not do any background processing, such as automatic checkpoints or replication.

To start postgres in the background using default values, type:

To start postgres with a specific port, e.g., 1234:

To connect to this server using psql, specify this port with the -p option:

or set the environment variable PGPORT:

Named run-time parameters can be set in either of these styles:

Either form overrides whatever setting might exist for work_mem in postgresql.conf. Notice that underscores in parameter names can be written as either underscore or dash on the command line. Except for short-term experiments, it's probably better practice to edit the setting in postgresql.conf than to rely on a command-line switch to set a parameter.

**Examples:**

Example 1 (unknown):
```unknown
-B nbuffers
```

Example 2 (unknown):
```unknown
-c name=value
```

Example 3 (unknown):
```unknown
postgresql.conf
```

Example 4 (unknown):
```unknown
pg_settings
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgamcheck.html

**Contents:**
- pg_amcheck
- Synopsis
- Description
- Options
  - Warning
- Environment
- Notes
- See Also

pg_amcheck — checks for corruption in one or more PostgreSQL databases

pg_amcheck [option...] [dbname]

pg_amcheck supports running amcheck's corruption checking functions against one or more databases, with options to select which schemas, tables and indexes to check, which kinds of checking to perform, and whether to perform the checks in parallel, and if so, the number of parallel connections to establish and use.

Only ordinary and toast table relations, materialized views, sequences, and btree indexes are currently supported. Other relation types are silently skipped.

If dbname is specified, it should be the name of a single database to check, and no other database selection options should be present. Otherwise, if any database selection options are present, all matching databases will be checked. If no such options are present, the default database will be checked. Database selection options include --all, --database and --exclude-database. They also include --relation, --exclude-relation, --table, --exclude-table, --index, and --exclude-index, but only when such options are used with a three-part pattern (e.g. mydb*.myschema*.myrel*). Finally, they include --schema and --exclude-schema when such options are used with a two-part pattern (e.g. mydb*.myschema*).

dbname can also be a connection string.

The following command-line options control what is checked:

Check all databases, except for any excluded via --exclude-database.

Check databases matching the specified pattern, except for any excluded by --exclude-database. This option can be specified more than once.

Exclude databases matching the given pattern. This option can be specified more than once.

Check indexes matching the specified pattern, unless they are otherwise excluded. This option can be specified more than once.

This is similar to the --relation option, except that it applies only to indexes, not to other relation types.

Exclude indexes matching the specified pattern. This option can be specified more than once.

This is similar to the --exclude-relation option, except that it applies only to indexes, not other relation types.

Check relations matching the specified pattern, unless they are otherwise excluded. This option can be specified more than once.

Patterns may be unqualified, e.g. myrel*, or they may be schema-qualified, e.g. myschema*.myrel* or database-qualified and schema-qualified, e.g. mydb*.myschema*.myrel*. A database-qualified pattern will add matching databases to the list of databases to be checked.

Exclude relations matching the specified pattern. This option can be specified more than once.

As with --relation, the pattern may be unqualified, schema-qualified, or database- and schema-qualified.

Check tables and indexes in schemas matching the specified pattern, unless they are otherwise excluded. This option can be specified more than once.

To select only tables in schemas matching a particular pattern, consider using something like --table=SCHEMAPAT.* --no-dependent-indexes. To select only indexes, consider using something like --index=SCHEMAPAT.*.

A schema pattern may be database-qualified. For example, you may write --schema=mydb*.myschema* to select schemas matching myschema* in databases matching mydb*.

Exclude tables and indexes in schemas matching the specified pattern. This option can be specified more than once.

As with --schema, the pattern may be database-qualified.

Check tables matching the specified pattern, unless they are otherwise excluded. This option can be specified more than once.

This is similar to the --relation option, except that it applies only to tables, materialized views, and sequences, not to indexes.

Exclude tables matching the specified pattern. This option can be specified more than once.

This is similar to the --exclude-relation option, except that it applies only to tables, materialized views, and sequences, not to indexes.

By default, if a table is checked, any btree indexes of that table will also be checked, even if they are not explicitly selected by an option such as --index or --relation. This option suppresses that behavior.

By default, if a table is checked, its toast table, if any, will also be checked, even if it is not explicitly selected by an option such as --table or --relation. This option suppresses that behavior.

By default, if an argument to --database, --table, --index, or --relation matches no objects, it is a fatal error. This option downgrades that error to a warning.

The following command-line options control checking of tables:

By default, whenever a toast pointer is encountered in a table, a lookup is performed to ensure that it references apparently-valid entries in the toast table. These checks can be quite slow, and this option can be used to skip them.

After reporting all corruptions on the first page of a table where corruption is found, stop processing that table relation and move on to the next table or index.

Note that index checking always stops after the first corrupt page. This option only has meaning relative to table relations.

If all-frozen is given, table corruption checks will skip over pages in all tables that are marked as all frozen.

If all-visible is given, table corruption checks will skip over pages in all tables that are marked as all visible.

By default, no pages are skipped. This can be specified as none, but since this is the default, it need not be mentioned.

Start checking at the specified block number. An error will occur if the table relation being checked has fewer than this number of blocks. This option does not apply to indexes, and is probably only useful when checking a single table relation. See --endblock for further caveats.

End checking at the specified block number. An error will occur if the table relation being checked has fewer than this number of blocks. This option does not apply to indexes, and is probably only useful when checking a single table relation. If both a regular table and a toast table are checked, this option will apply to both, but higher-numbered toast blocks may still be accessed while validating toast pointers, unless that is suppressed using --exclude-toast-pointers.

The following command-line options control checking of B-tree indexes:

For each index with unique constraint checked, verify that no more than one among duplicate entries is visible in the index using amcheck's checkunique option.

For each index checked, verify the presence of all heap tuples as index tuples in the index using amcheck's heapallindexed option.

For each btree index checked, use amcheck's bt_index_parent_check function, which performs additional checks of parent/child relationships during index checking.

The default is to use amcheck's bt_index_check function, but note that use of the --rootdescend option implicitly selects bt_index_parent_check.

For each index checked, re-find tuples on the leaf level by performing a new search from the root page for each tuple using amcheck's rootdescend option.

Use of this option implicitly also selects the --parent-check option.

This form of verification was originally written to help in the development of btree index features. It may be of limited use or even of no use in helping detect the kinds of corruption that occur in practice. It may also cause corruption checking to take considerably longer and consume considerably more resources on the server.

The extra checks performed against B-tree indexes when the --parent-check option or the --rootdescend option is specified require relatively strong relation-level locks. These checks are the only checks that will block concurrent data modification from INSERT, UPDATE, and DELETE commands.

The following command-line options control the connection to the server:

Specifies the host name of the machine on which the server is running. If the value begins with a slash, it is used as the directory for the Unix domain socket.

Specifies the TCP port or local Unix domain socket file extension on which the server is listening for connections.

User name to connect as.

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force pg_amcheck to prompt for a password before connecting to a database.

This option is never essential, since pg_amcheck will automatically prompt for a password if the server demands password authentication. However, pg_amcheck will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

Specifies a database or connection string to be used to discover the list of databases to be checked. If neither --all nor any option including a database pattern is used, no such connection is required and this option does nothing. Otherwise, any connection string parameters other than the database name which are included in the value for this option will also be used when connecting to the databases being checked. If this option is omitted, the default is postgres or, if that fails, template1.

Other options are also available:

Echo to stdout all SQL sent to the server.

Use num concurrent connections to the server, or one per object to be checked, whichever is less.

The default is to use a single connection.

Show progress information. Progress information includes the number of relations for which checking has been completed, and the total size of those relations. It also includes the total number of relations that will eventually be checked, and the estimated size of those relations.

Print more messages. In particular, this will print a message for each relation being checked, and will increase the level of detail shown for server errors.

Print the pg_amcheck version and exit.

Install any missing extensions that are required to check the database(s). If not yet installed, each extension's objects will be installed into the given schema, or if not specified into schema pg_catalog.

At present, the only required extension is amcheck.

Show help about pg_amcheck command line arguments, and exit.

pg_amcheck, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

pg_amcheck is designed to work with PostgreSQL 14.0 and later.

**Examples:**

Example 1 (unknown):
```unknown
--exclude-database
```

Example 2 (unknown):
```unknown
--exclude-relation
```

Example 3 (unknown):
```unknown
--exclude-table
```

Example 4 (unknown):
```unknown
--exclude-index
```

---


---

