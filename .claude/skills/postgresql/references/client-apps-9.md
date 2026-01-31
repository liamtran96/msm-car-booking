# PostgreSQL - Client Apps (Part 9)

## 


**URL:** https://www.postgresql.org/docs/18/app-pg-dumpall.html

**Contents:**
- pg_dumpall
- Synopsis
- Description
  - Warning
- Options
- Environment
- Notes
- Examples
- See Also

pg_dumpall — extract a PostgreSQL database cluster into a script file

pg_dumpall [connection-option...] [option...]

pg_dumpall is a utility for writing out (“dumping”) all PostgreSQL databases of a cluster into one script file. The script file contains SQL commands that can be used as input to psql to restore the databases. It does this by calling pg_dump for each database in the cluster. pg_dumpall also dumps global objects that are common to all databases, namely database roles, tablespaces, and privilege grants for configuration parameters. (pg_dump does not save these objects.)

Since pg_dumpall reads tables from all databases you will most likely have to connect as a database superuser in order to produce a complete dump. Also you will need superuser privileges to execute the saved script in order to be allowed to add roles and create databases.

The SQL script will be written to the standard output. Use the -f/--file option or shell operators to redirect it into a file.

pg_dumpall needs to connect several times to the PostgreSQL server (once per database). If you use password authentication it will ask for a password each time. It is convenient to have a ~/.pgpass file in such cases. See Section 32.16 for more information.

Restoring a dump causes the destination to execute arbitrary code of the source superusers' choice. Partial dumps and partial restores do not limit that. If the source superusers are not trusted, the dumped SQL statements must be inspected before restoring. Note that the client running the dump and restore need not trust the source or destination superusers.

The following command-line options control the content and format of the output.

Dump only the data, not the schema (data definitions) or statistics.

Emit SQL commands to DROP all the dumped databases, roles, and tablespaces before recreating them. This option is useful when the restore is to overwrite an existing cluster. If any of the objects do not exist in the destination cluster, ignorable error messages will be reported during restore, unless --if-exists is also specified.

Create the dump in the specified character set encoding. By default, the dump is created in the database encoding. (Another way to get the same result is to set the PGCLIENTENCODING environment variable to the desired dump encoding.)

Send output to the specified file. If this is omitted, the standard output is used.

Dump only global objects (roles and tablespaces), no databases.

Do not output commands to set ownership of objects to match the original database. By default, pg_dumpall issues ALTER OWNER or SET SESSION AUTHORIZATION statements to set ownership of created schema elements. These statements will fail when the script is run unless it is started by a superuser (or the same user that owns all of the objects in the script). To make a script that can be restored by any user, but will give that user ownership of all the objects, specify -O.

Dump only roles, no databases or tablespaces.

Dump only the object definitions (schema), not data.

Specify the superuser user name to use when disabling triggers. This is relevant only if --disable-triggers is used. (Usually, it's better to leave this out, and instead start the resulting script as superuser.)

Dump only tablespaces, no databases or roles.

Specifies verbose mode. This will cause pg_dumpall to output start/stop times to the dump file, and progress messages to standard error. Repeating the option causes additional debug-level messages to appear on standard error. The option is also passed down to pg_dump.

Print the pg_dumpall version and exit.

Prevent dumping of access privileges (grant/revoke commands).

This option is for use by in-place upgrade utilities. Its use for other purposes is not recommended or supported. The behavior of the option may change in future releases without notice.

Dump data as INSERT commands with explicit column names (INSERT INTO table (column, ...) VALUES ...). This will make restoration very slow; it is mainly useful for making dumps that can be loaded into non-PostgreSQL databases.

This option disables the use of dollar quoting for function bodies, and forces them to be quoted using SQL standard string syntax.

This option is relevant only when creating a dump with data and without schema. It instructs pg_dumpall to include commands to temporarily disable triggers on the target tables while the data is restored. Use this if you have referential integrity checks or other triggers on the tables that you do not want to invoke during data restore.

Presently, the commands emitted for --disable-triggers must be done as superuser. So, you should also specify a superuser name with -S, or preferably be careful to start the resulting script as a superuser.

Do not dump databases whose name matches pattern. Multiple patterns can be excluded by writing multiple --exclude-database switches. The pattern parameter is interpreted as a pattern according to the same rules used by psql's \d commands (see Patterns), so multiple databases can also be excluded by writing wildcard characters in the pattern. When using wildcards, be careful to quote the pattern if needed to prevent shell wildcard expansion.

Use the specified value of extra_float_digits when dumping floating-point data, instead of the maximum available precision. Routine dumps made for backup purposes should not use this option.

Specify a filename from which to read patterns for databases excluded from the dump. The patterns are interpreted according to the same rules as --exclude-database. To read from STDIN, use - as the filename. The --filter option can be specified in conjunction with --exclude-database for excluding databases, and can also be specified more than once for multiple filter files.

The file lists one database pattern per row, with the following format:

Lines starting with # are considered comments and ignored. Comments can be placed after an object pattern row as well. Blank lines are also ignored. See Patterns for how to perform quoting in patterns.

Use DROP ... IF EXISTS commands to drop objects in --clean mode. This suppresses “does not exist” errors that might otherwise be reported. This option is not valid unless --clean is also specified.

Dump data as INSERT commands (rather than COPY). This will make restoration very slow; it is mainly useful for making dumps that can be loaded into non-PostgreSQL databases. Note that the restore might fail altogether if you have rearranged column order. The --column-inserts option is safer, though even slower.

When dumping data for a table partition, make the COPY or INSERT statements target the root of the partitioning hierarchy that contains it, rather than the partition itself. This causes the appropriate partition to be re-determined for each row when the data is loaded. This may be useful when restoring data on a server where rows do not always fall into the same partitions as they did on the original server. That could happen, for example, if the partitioning column is of type text and the two systems have different definitions of the collation used to sort the partitioning column.

Do not wait forever to acquire shared table locks at the beginning of the dump. Instead, fail if unable to lock a table within the specified timeout. The timeout may be specified in any of the formats accepted by SET statement_timeout.

Do not dump COMMENT commands.

Do not dump row security policies.

Do not dump publications.

Do not dump passwords for roles. When restored, roles will have a null password, and password authentication will always fail until the password is set. Since password values aren't needed when this option is specified, the role information is read from the catalog view pg_roles instead of pg_authid. Therefore, this option also helps if access to pg_authid is restricted by some security policy.

Do not dump schema (data definitions).

Do not dump security labels.

Do not dump statistics. This is the default.

Do not dump subscriptions.

By default, pg_dumpall will wait for all files to be written safely to disk. This option causes pg_dumpall to return without waiting, which is faster, but means that a subsequent operating system crash can leave the dump corrupt. Generally, this option is useful for testing but should not be used when dumping data from production installation.

Do not output commands to select table access methods. With this option, all objects will be created with whichever table access method is the default during restore.

Do not output commands to create tablespaces nor select tablespaces for objects. With this option, all objects will be created in whichever tablespace is the default during restore.

Do not output commands to set TOAST compression methods. With this option, all columns will be restored with the default compression setting.

Do not dump the contents of unlogged tables. This option has no effect on whether or not the table definitions (schema) are dumped; it only suppresses dumping the table data.

Add ON CONFLICT DO NOTHING to INSERT commands. This option is not valid unless --inserts or --column-inserts is also specified.

Force quoting of all identifiers. This option is recommended when dumping a database from a server whose PostgreSQL major version is different from pg_dumpall's, or when the output is intended to be loaded into a server of a different major version. By default, pg_dumpall quotes only identifiers that are reserved words in its own major version. This sometimes results in compatibility issues when dealing with servers of other versions that may have slightly different sets of reserved words. Using --quote-all-identifiers prevents such issues, at the price of a harder-to-read dump script.

Use the provided string as the psql \restrict key in the dump output. If no restrict key is specified, pg_dumpall will generate a random one as needed. Keys may contain only alphanumeric characters.

This option is primarily intended for testing purposes and other scenarios that require repeatable output (e.g., comparing dump files). It is not recommended for general use, as a malicious server with advance knowledge of the key may be able to inject arbitrary code that will be executed on the machine that runs psql with the dump output.

Dump data as INSERT commands (rather than COPY). Controls the maximum number of rows per INSERT command. The value specified must be a number greater than zero. Any error during restoring will cause only rows that are part of the problematic INSERT to be lost, rather than the entire table contents.

Dump only the statistics, not the schema (data definitions) or data. Statistics for tables, materialized views, foreign tables, and indexes are dumped.

Include sequence data in the dump. This is the default behavior except when --no-data, --schema-only, or --statistics-only is specified.

Output SQL-standard SET SESSION AUTHORIZATION commands instead of ALTER OWNER commands to determine object ownership. This makes the dump more standards compatible, but depending on the history of the objects in the dump, might not restore properly.

Show help about pg_dumpall command line arguments, and exit.

The following command-line options control the database connection parameters.

Specifies parameters used to connect to the server, as a connection string; these will override any conflicting command line options.

The option is called --dbname for consistency with other client applications, but because pg_dumpall needs to connect to many databases, the database name in the connection string will be ignored. Use the -l option to specify the name of the database used for the initial connection, which will dump global objects and discover what other databases should be dumped.

Specifies the host name of the machine on which the database server is running. If the value begins with a slash, it is used as the directory for the Unix domain socket. The default is taken from the PGHOST environment variable, if set, else a Unix domain socket connection is attempted.

Specifies the name of the database to connect to for dumping global objects and discovering what other databases should be dumped. If not specified, the postgres database will be used, and if that does not exist, template1 will be used.

Specifies the TCP port or local Unix domain socket file extension on which the server is listening for connections. Defaults to the PGPORT environment variable, if set, or a compiled-in default.

User name to connect as.

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force pg_dumpall to prompt for a password before connecting to a database.

This option is never essential, since pg_dumpall will automatically prompt for a password if the server demands password authentication. However, pg_dumpall will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

Note that the password prompt will occur again for each database to be dumped. Usually, it's better to set up a ~/.pgpass file than to rely on manual password entry.

Specifies a role name to be used to create the dump. This option causes pg_dumpall to issue a SET ROLE rolename command after connecting to the database. It is useful when the authenticated user (specified by -U) lacks privileges needed by pg_dumpall, but can switch to a role with the required rights. Some installations have a policy against logging in directly as a superuser, and use of this option allows dumps to be made without violating the policy.

Default connection parameters

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

This utility, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

Since pg_dumpall calls pg_dump internally, some diagnostic messages will refer to pg_dump.

The --clean option can be useful even when your intention is to restore the dump script into a fresh cluster. Use of --clean authorizes the script to drop and re-create the built-in postgres and template1 databases, ensuring that those databases will retain the same properties (for instance, locale and encoding) that they had in the source cluster. Without the option, those databases will retain their existing database-level properties, as well as any pre-existing contents.

If --statistics is specified, pg_dumpall will include most optimizer statistics in the resulting dump file. However, some statistics may not be included, such as those created explicitly with CREATE STATISTICS or custom statistics added by an extension. Therefore, it may be useful to run ANALYZE on each database after restoring from a dump file to ensure optimal performance. You can also run vacuumdb -a -z to analyze all databases.

The dump script should not be expected to run completely without errors. In particular, because the script will issue CREATE ROLE for every role existing in the source cluster, it is certain to get a “role already exists” error for the bootstrap superuser, unless the destination cluster was initialized with a different bootstrap superuser name. This error is harmless and should be ignored. Use of the --clean option is likely to produce additional harmless error messages about non-existent objects, although you can minimize those by adding --if-exists.

pg_dumpall requires all needed tablespace directories to exist before the restore; otherwise, database creation will fail for databases in non-default locations.

It is generally recommended to use the -X (--no-psqlrc) option when restoring a database from a pg_dumpall script to ensure a clean restore process and prevent potential conflicts with non-default psql configurations. Additionally, because the pg_dumpall script may include psql meta-commands, it may be incompatible with clients other than psql.

To dump all databases:

To restore database(s) from this file, you can use:

It is not important which database you connect to here since the script file created by pg_dumpall will contain the appropriate commands to create and connect to the saved databases. An exception is that if you specified --clean, you must connect to the postgres database initially; the script will attempt to drop other databases immediately, and that will fail for the database you are connected to.

Check pg_dump for details on possible error conditions.

**Examples:**

Example 1 (unknown):
```unknown
connection-option
```

Example 2 (unknown):
```unknown
--data-only
```

Example 3 (unknown):
```unknown
--if-exists
```

Example 4 (unknown):
```unknown
-E encoding
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgreceivewal.html

**Contents:**
- pg_receivewal
- Synopsis
- Description
- Options
- Exit Status
- Environment
- Notes
- Examples
- See Also

pg_receivewal — stream write-ahead logs from a PostgreSQL server

pg_receivewal [option...]

pg_receivewal is used to stream the write-ahead log from a running PostgreSQL cluster. The write-ahead log is streamed using the streaming replication protocol, and is written to a local directory of files. This directory can be used as the archive location for doing a restore using point-in-time recovery (see Section 25.3).

pg_receivewal streams the write-ahead log in real time as it's being generated on the server, and does not wait for segments to complete like archive_command and archive_library do. For this reason, it is not necessary to set archive_timeout when using pg_receivewal.

Unlike the WAL receiver of a PostgreSQL standby server, pg_receivewal by default flushes WAL data only when a WAL file is closed. The option --synchronous must be specified to flush WAL data in real time. Since pg_receivewal does not apply WAL, you should not allow it to become a synchronous standby when synchronous_commit equals remote_apply. If it does, it will appear to be a standby that never catches up, and will cause transaction commits to block. To avoid this, you should either configure an appropriate value for synchronous_standby_names, or specify application_name for pg_receivewal that does not match it, or change the value of synchronous_commit to something other than remote_apply.

The write-ahead log is streamed over a regular PostgreSQL connection and uses the replication protocol. The connection must be made with a user having REPLICATION permissions (see Section 21.2) or a superuser, and pg_hba.conf must permit the replication connection. The server must also be configured with max_wal_senders set high enough to leave at least one session available for the stream.

The starting point of the write-ahead log streaming is calculated when pg_receivewal starts:

First, scan the directory where the WAL segment files are written and find the newest completed segment file, using as the starting point the beginning of the next WAL segment file.

If a starting point cannot be calculated with the previous method, and if a replication slot is used, an extra READ_REPLICATION_SLOT command is issued to retrieve the slot's restart_lsn to use as the starting point. This option is only available when streaming write-ahead logs from PostgreSQL 15 and up.

If a starting point cannot be calculated with the previous method, the latest WAL flush location is used as reported by the server from an IDENTIFY_SYSTEM command.

If the connection is lost, or if it cannot be initially established, with a non-fatal error, pg_receivewal will retry the connection indefinitely, and reestablish streaming as soon as possible. To avoid this behavior, use the -n parameter.

In the absence of fatal errors, pg_receivewal will run until terminated by the SIGINT (Control+C) or SIGTERM signal.

Directory to write the output to.

This parameter is required.

Automatically stop replication and exit with normal exit status 0 when receiving reaches the specified LSN.

If there is a record with LSN exactly equal to lsn, the record will be processed.

Do not error out when --create-slot is specified and a slot with the specified name already exists.

Don't loop on connection errors. Instead, exit right away with an error.

This option causes pg_receivewal to not force WAL data to be flushed to disk. This is faster, but means that a subsequent operating system crash can leave the WAL segments corrupt. Generally, this option is useful for testing but should not be used when doing WAL archiving on a production deployment.

This option is incompatible with --synchronous.

Specifies the number of seconds between status packets sent back to the server. This allows for easier monitoring of the progress from server. A value of zero disables the periodic status updates completely, although an update will still be sent when requested by the server, to avoid timeout disconnect. The default value is 10 seconds.

Require pg_receivewal to use an existing replication slot (see Section 26.2.6). When this option is used, pg_receivewal will report a flush position to the server, indicating when each segment has been synchronized to disk so that the server can remove that segment if it is not otherwise needed.

When the replication client of pg_receivewal is configured on the server as a synchronous standby, then using a replication slot will report the flush position to the server, but only when a WAL file is closed. Therefore, that configuration will cause transactions on the primary to wait for a long time and effectively not work satisfactorily. The option --synchronous (see below) must be specified in addition to make this work correctly.

Flush the WAL data to disk immediately after it has been received. Also send a status packet back to the server immediately after flushing, regardless of --status-interval.

This option should be specified if the replication client of pg_receivewal is configured on the server as a synchronous standby, to ensure that timely feedback is sent to the server.

Enables verbose mode.

Enables compression of write-ahead logs.

The compression method can be set to gzip, lz4 (if PostgreSQL was compiled with --with-lz4) or none for no compression. A compression detail string can optionally be specified. If the detail string is an integer, it specifies the compression level. Otherwise, it should be a comma-separated list of items, each of the form keyword or keyword=value. Currently, the only supported keyword is level.

If no compression level is specified, the default compression level will be used. If only a level is specified without mentioning an algorithm, gzip compression will be used if the level is greater than 0, and no compression will be used if the level is 0.

The suffix .gz will automatically be added to all filenames when using gzip, and the suffix .lz4 is added when using lz4.

The following command-line options control the database connection parameters.

Specifies parameters used to connect to the server, as a connection string; these will override any conflicting command line options.

This option is called --dbname for consistency with other client applications, but because pg_receivewal doesn't connect to any particular database in the cluster, any database name included in the connection string will be ignored by the server. However, a database name supplied that way overrides the default database name (replication) for purposes of looking up the replication connection's password in ~/.pgpass. Similarly, middleware or proxies used in connecting to PostgreSQL might utilize the name for purposes such as connection routing.

Specifies the host name of the machine on which the server is running. If the value begins with a slash, it is used as the directory for the Unix domain socket. The default is taken from the PGHOST environment variable, if set, else a Unix domain socket connection is attempted.

Specifies the TCP port or local Unix domain socket file extension on which the server is listening for connections. Defaults to the PGPORT environment variable, if set, or a compiled-in default.

User name to connect as.

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force pg_receivewal to prompt for a password before connecting to a database.

This option is never essential, since pg_receivewal will automatically prompt for a password if the server demands password authentication. However, pg_receivewal will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

pg_receivewal can perform one of the two following actions in order to control physical replication slots:

Create a new physical replication slot with the name specified in --slot, then exit.

Drop the replication slot with the name specified in --slot, then exit.

Other options are also available:

Print the pg_receivewal version and exit.

Show help about pg_receivewal command line arguments, and exit.

pg_receivewal will exit with status 0 when terminated by the SIGINT or SIGTERM signal. (That is the normal way to end it. Hence it is not an error.) For fatal errors or other signals, the exit status will be nonzero.

This utility, like most other PostgreSQL utilities, uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

When using pg_receivewal instead of archive_command or archive_library as the main WAL backup method, it is strongly recommended to use replication slots. Otherwise, the server is free to recycle or remove write-ahead log files before they are backed up, because it does not have any information, either from archive_command or archive_library or the replication slots, about how far the WAL stream has been archived. Note, however, that a replication slot will fill up the server's disk space if the receiver does not keep up with fetching the WAL data.

pg_receivewal will preserve group permissions on the received WAL files if group permissions are enabled on the source cluster.

To stream the write-ahead log from the server at mydbserver and store it in the local directory /usr/local/pgsql/archive:

**Examples:**

Example 1 (unknown):
```unknown
pg_receivewal
```

Example 2 (unknown):
```unknown
--synchronous
```

Example 3 (unknown):
```unknown
remote_apply
```

Example 4 (unknown):
```unknown
application_name
```

---


---

