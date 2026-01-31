# PostgreSQL - Client Apps

## 


**URL:** https://www.postgresql.org/docs/18/app-initdb.html

**Contents:**
- initdb
- Synopsis
- Description
- Options
- Environment
- Notes
- See Also

initdb — create a new PostgreSQL database cluster

initdb [option...] [ --pgdata | -D ] directory

initdb creates a new PostgreSQL database cluster.

Creating a database cluster consists of creating the directories in which the cluster data will live, generating the shared catalog tables (tables that belong to the whole cluster rather than to any particular database), and creating the postgres, template1, and template0 databases. The postgres database is a default database meant for use by users, utilities and third party applications. template1 and template0 are meant as source databases to be copied by later CREATE DATABASE commands. template0 should never be modified, but you can add objects to template1, which by default will be copied into databases created later. See Section 22.3 for more details.

Although initdb will attempt to create the specified data directory, it might not have permission if the parent directory of the desired data directory is root-owned. To initialize in such a setup, create an empty data directory as root, then use chown to assign ownership of that directory to the database user account, then su to become the database user to run initdb.

initdb must be run as the user that will own the server process, because the server needs to have access to the files and directories that initdb creates. Since the server cannot be run as root, you must not run initdb as root either. (It will in fact refuse to do so.)

For security reasons the new cluster created by initdb will only be accessible by the cluster owner by default. The --allow-group-access option allows any user in the same group as the cluster owner to read files in the cluster. This is useful for performing backups as a non-privileged user.

initdb initializes the database cluster's default locale and character set encoding. These can also be set separately for each database when it is created. initdb determines those settings for the template databases, which will serve as the default for all other databases.

By default, initdb uses the locale provider libc (see Section 23.1.4). The libc locale provider takes the locale settings from the environment, and determines the encoding from the locale settings.

To choose a different locale for the cluster, use the option --locale. There are also individual options --lc-* and --icu-locale (see below) to set values for the individual locale categories. Note that inconsistent settings for different locale categories can give nonsensical results, so this should be used with care.

Alternatively, initdb can use the ICU library to provide locale services by specifying --locale-provider=icu. The server must be built with ICU support. To choose the specific ICU locale ID to apply, use the option --icu-locale. Note that for implementation reasons and to support legacy code, initdb will still select and initialize libc locale settings when the ICU locale provider is used.

When initdb runs, it will print out the locale settings it has chosen. If you have complex requirements or specified multiple options, it is advisable to check that the result matches what was intended.

More details about locale settings can be found in Section 23.1.

To alter the default encoding, use the --encoding. More details can be found in Section 23.3.

This option specifies the default authentication method for local users used in pg_hba.conf (host and local lines). See Section 20.1 for an overview of valid values.

initdb will prepopulate pg_hba.conf entries using the specified authentication method for non-replication as well as replication connections.

Do not use trust unless you trust all local users on your system. trust is the default for ease of installation.

This option specifies the authentication method for local users via TCP/IP connections used in pg_hba.conf (host lines).

This option specifies the authentication method for local users via Unix-domain socket connections used in pg_hba.conf (local lines).

This option specifies the directory where the database cluster should be stored. This is the only information required by initdb, but you can avoid writing it by setting the PGDATA environment variable, which can be convenient since the database server (postgres) can find the data directory later by the same variable.

Selects the encoding of the template databases. This will also be the default encoding of any database you create later, unless you override it then. The character sets supported by the PostgreSQL server are described in Section 23.3.1.

By default, the template database encoding is derived from the locale. If --no-locale is specified (or equivalently, if the locale is C or POSIX), then the default is UTF8 for the ICU provider and SQL_ASCII for the libc provider.

Allows users in the same group as the cluster owner to read all cluster files created by initdb. This option is ignored on Windows as it does not support POSIX-style group permissions.

Specifies the ICU locale when the ICU provider is used. Locale support is described in Section 23.1.

Specifies additional collation rules to customize the behavior of the default collation. This is supported for ICU only.

Use checksums on data pages to help detect corruption by the I/O system that would otherwise be silent. This is enabled by default; use --no-data-checksums to disable checksums.

Enabling checksums might incur a small performance penalty. If set, checksums are calculated for all objects, in all databases. All checksum failures will be reported in the pg_stat_database view. See Section 28.2 for details.

Sets the default locale for the database cluster. If this option is not specified, the locale is inherited from the environment that initdb runs in. Locale support is described in Section 23.1.

If --locale-provider is builtin, --locale or --builtin-locale must be specified and set to C, C.UTF-8 or PG_UNICODE_FAST.

Like --locale, but only sets the locale in the specified category.

Equivalent to --locale=C.

Specifies the locale name when the builtin provider is used. Locale support is described in Section 23.1.

This option sets the locale provider for databases created in the new cluster. It can be overridden in the CREATE DATABASE command when new databases are subsequently created. The default is libc (see Section 23.1.4).

Do not enable data checksums.

Makes initdb read the bootstrap superuser's password from a file. The first line of the file is taken as the password.

Sets the default text search configuration. See default_text_search_config for further information.

Sets the user name of the bootstrap superuser. This defaults to the name of the operating-system user running initdb.

Makes initdb prompt for a password to give the bootstrap superuser. If you don't plan on using password authentication, this is not important. Otherwise you won't be able to use password authentication until you have a password set up.

This option specifies the directory where the write-ahead log should be stored.

Set the WAL segment size, in megabytes. This is the size of each individual file in the WAL log. The default size is 16 megabytes. The value must be a power of 2 between 1 and 1024 (megabytes). This option can only be set during initialization, and cannot be changed later.

It may be useful to adjust this size to control the granularity of WAL log shipping or archiving. Also, in databases with a high volume of WAL, the sheer number of WAL files per directory can become a performance and management problem. Increasing the WAL file size will reduce the number of WAL files.

Other, less commonly used, options are also available:

Forcibly set the server parameter name to value during initdb, and also install that setting in the generated postgresql.conf file, so that it will apply during future server runs. This option can be given more than once to set several parameters. It is primarily useful when the environment is such that the server will not start at all using the default parameters.

Print debugging output from the bootstrap backend and a few other messages of lesser interest for the general public. The bootstrap backend is the program initdb uses to create the catalog tables. This option generates a tremendous amount of extremely boring output.

Run the bootstrap backend with the debug_discard_caches=1 option. This takes a very long time and is only of use for deep debugging.

Specifies where initdb should find its input files to initialize the database cluster. This is normally not necessary. You will be told if you need to specify their location explicitly.

By default, when initdb determines that an error prevented it from completely creating the database cluster, it removes any files it might have created before discovering that it cannot finish the job. This option inhibits tidying-up and is thus useful for debugging.

By default, initdb will wait for all files to be written safely to disk. This option causes initdb to return without waiting, which is faster, but means that a subsequent operating system crash can leave the data directory corrupt. Generally, this option is useful for testing, but should not be used when creating a production installation.

By default, initdb safely writes all database files to disk. This option instructs initdb to skip synchronizing all files in the individual database directories, the database directories themselves, and the tablespace directories, i.e., everything in the base subdirectory and any other tablespace directories. Other files, such as those in pg_wal and pg_xact, will still be synchronized unless the --no-sync option is also specified.

Note that if --no-sync-data-files is used in conjunction with --sync-method=syncfs, some or all of the aforementioned files and directories will be synchronized because syncfs processes entire file systems.

This option is primarily intended for internal use by tools that separately ensure the skipped files are synchronized to disk.

By default, initdb will write instructions for how to start the cluster at the end of its output. This option causes those instructions to be left out. This is primarily intended for use by tools that wrap initdb in platform-specific behavior, where those instructions are likely to be incorrect.

Show internal settings and exit, without doing anything else. This can be used to debug the initdb installation.

When set to fsync, which is the default, initdb will recursively open and synchronize all files in the data directory. The search for files will follow symbolic links for the WAL directory and each configured tablespace.

On Linux, syncfs may be used instead to ask the operating system to synchronize the whole file systems that contain the data directory, the WAL files, and each tablespace. See recovery_init_sync_method for information about the caveats to be aware of when using syncfs.

This option has no effect when --no-sync is used.

Safely write all database files to disk and exit. This does not perform any of the normal initdb operations. Generally, this option is useful for ensuring reliable recovery after changing fsync from off to on.

Print the initdb version and exit.

Show help about initdb command line arguments, and exit.

Specifies the directory where the database cluster is to be stored; can be overridden using the -D option.

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

Specifies the default time zone of the created database cluster. The value should be a full time zone name (see Section 8.5.3).

initdb can also be invoked via pg_ctl initdb.

**Examples:**

Example 1 (unknown):
```unknown
CREATE DATABASE
```

Example 2 (unknown):
```unknown
--allow-group-access
```

Example 3 (unknown):
```unknown
--icu-locale
```

Example 4 (unknown):
```unknown
--locale-provider=icu
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgcreatesubscriber.html

**Contents:**
- pg_createsubscriber
- Synopsis
- Description
- Options
- Notes
  - Prerequisites
  - Warnings
  - How It Works
- Examples
- See Also

pg_createsubscriber — convert a physical replica into a new logical replica

pg_createsubscriber [option...] { -d | --database }dbname { -D | --pgdata }datadir { -P | --publisher-server }connstr

pg_createsubscriber creates a new logical replica from a physical standby server. All tables in the specified database are included in the logical replication setup. A pair of publication and subscription objects are created for each database. It must be run at the target server.

After a successful run, the state of the target server is analogous to a fresh logical replication setup. The main difference between the logical replication setup and pg_createsubscriber is how the data synchronization is done. pg_createsubscriber does not copy the initial table data. It does only the synchronization phase, which ensures each table is brought up to a synchronized state.

pg_createsubscriber targets large database systems because in logical replication setup, most of the time is spent doing the initial data copy. Furthermore, a side effect of this long time spent synchronizing data is usually a large amount of changes to be applied (that were produced during the initial data copy), which increases even more the time when the logical replica will be available. For smaller databases, it is recommended to set up logical replication with initial data synchronization. For details, see the CREATE SUBSCRIPTION copy_data option.

pg_createsubscriber accepts the following command-line arguments:

Create one subscription per database on the target server. Exceptions are template databases and databases that don't allow connections. To discover the list of all databases, connect to the source server using the database name specified in the --publisher-server connection string, or if not specified, the postgres database will be used, or if that does not exist, template1 will be used. Automatically generated names for subscriptions, publications, and replication slots are used when this option is specified. This option cannot be used along with --database, --publication, --replication-slot, or --subscription.

The name of the database in which to create a subscription. Multiple databases can be selected by writing multiple -d switches. This option cannot be used together with -a. If -d option is not provided, the database name will be obtained from -P option. If the database name is not specified in either the -d option, or the -P option, and -a option is not specified, an error will be reported.

The target directory that contains a cluster directory from a physical replica.

Do everything except actually modifying the target directory.

The port number on which the target server is listening for connections. Defaults to running the target server on port 50432 to avoid unintended client connections.

The connection string to the publisher. For details see Section 32.1.1.

The directory to use for postmaster sockets on target server. The default is current directory.

The maximum number of seconds to wait for recovery to end. Setting to 0 disables. The default is 0.

Enables two_phase commit for the subscription. When multiple databases are specified, this option applies uniformly to all subscriptions created on those databases. The default is false.

The user name to connect as on target server. Defaults to the current operating system user name.

Enables verbose mode. This will cause pg_createsubscriber to output progress messages and detailed information about each step to standard error. Repeating the option causes additional debug-level messages to appear on standard error.

Drop all objects of the specified type from specified databases on the target server.

publications: The FOR ALL TABLES publications established for this subscriber are always dropped; specifying this object type causes all other publications replicated from the source server to be dropped as well.

The objects selected to be dropped are individually logged, including during a --dry-run. There is no opportunity to affect or stop the dropping of the selected objects, so consider taking a backup of them using pg_dump.

Use the specified main server configuration file for the target data directory. pg_createsubscriber internally uses the pg_ctl command to start and stop the target server. It allows you to specify the actual postgresql.conf configuration file if it is stored outside the data directory.

The publication name to set up the logical replication. Multiple publications can be specified by writing multiple --publication switches. The number of publication names must match the number of specified databases, otherwise an error is reported. The order of the multiple publication name switches must match the order of database switches. If this option is not specified, a generated name is assigned to the publication name. This option cannot be used together with --all.

The replication slot name to set up the logical replication. Multiple replication slots can be specified by writing multiple --replication-slot switches. The number of replication slot names must match the number of specified databases, otherwise an error is reported. The order of the multiple replication slot name switches must match the order of database switches. If this option is not specified, the subscription name is assigned to the replication slot name. This option cannot be used together with --all.

The subscription name to set up the logical replication. Multiple subscriptions can be specified by writing multiple --subscription switches. The number of subscription names must match the number of specified databases, otherwise an error is reported. The order of the multiple subscription name switches must match the order of database switches. If this option is not specified, a generated name is assigned to the subscription name. This option cannot be used together with --all.

Print the pg_createsubscriber version and exit.

Show help about pg_createsubscriber command line arguments, and exit.

There are some prerequisites for pg_createsubscriber to convert the target server into a logical replica. If these are not met, an error will be reported. The source and target servers must have the same major version as the pg_createsubscriber. The given target data directory must have the same system identifier as the source data directory. The given database user for the target data directory must have privileges for creating subscriptions and using pg_replication_origin_advance().

The target server must be used as a physical standby. The target server must have max_active_replication_origins and max_logical_replication_workers configured to a value greater than or equal to the number of specified databases. The target server must have max_worker_processes configured to a value greater than the number of specified databases. The target server must accept local connections. If you are planning to use the --enable-two-phase switch then you will also need to set the max_prepared_transactions appropriately.

The source server must accept connections from the target server. The source server must not be in recovery. The source server must have wal_level as logical. The source server must have max_replication_slots configured to a value greater than or equal to the number of specified databases plus existing replication slots. The source server must have max_wal_senders configured to a value greater than or equal to the number of specified databases and existing WAL sender processes.

If pg_createsubscriber fails after the target server was promoted, then the data directory is likely not in a state that can be recovered. In such case, creating a new standby server is recommended.

pg_createsubscriber usually starts the target server with different connection settings during transformation. Hence, connections to the target server should fail.

Since DDL commands are not replicated by logical replication, avoid executing DDL commands that change the database schema while running pg_createsubscriber. If the target server has already been converted to logical replica, the DDL commands might not be replicated, which might cause an error.

If pg_createsubscriber fails while processing, objects (publications, replication slots) created on the source server are removed. The removal might fail if the target server cannot connect to the source server. In such a case, a warning message will inform the objects left. If the target server is running, it will be stopped.

If the replication is using primary_slot_name, it will be removed from the source server after the logical replication setup.

If the target server is a synchronous replica, transaction commits on the primary might wait for replication while running pg_createsubscriber.

Unless the --enable-two-phase switch is specified, pg_createsubscriber sets up logical replication with two-phase commit disabled. This means that any prepared transactions will be replicated at the time of COMMIT PREPARED, without advance preparation. Once setup is complete, you can manually drop and re-create the subscription(s) with the two_phase option enabled.

pg_createsubscriber changes the system identifier using pg_resetwal. It would avoid situations in which the target server might use WAL files from the source server. If the target server has a standby, replication will break and a fresh standby should be created.

Replication failures can occur if required WAL files are missing. To prevent this, the source server must set max_slot_wal_keep_size to -1 to ensure that required WAL files are not prematurely removed.

The basic idea is to have a replication start point from the source server and set up a logical replication to start from this point:

Start the target server with the specified command-line options. If the target server is already running, pg_createsubscriber will terminate with an error.

Check if the target server can be converted. There are also a few checks on the source server. If any of the prerequisites are not met, pg_createsubscriber will terminate with an error.

Create a publication and replication slot for each specified database on the source server. Each publication is created using FOR ALL TABLES. If the --publication option is not specified, the publication has the following name pattern: “pg_createsubscriber_%u_%x” (parameter: database oid, random int). If the --replication-slot option is not specified, the replication slot has the following name pattern: “pg_createsubscriber_%u_%x” (parameters: database oid, random int). These replication slots will be used by the subscriptions in a future step. The last replication slot LSN is used as a stopping point in the recovery_target_lsn parameter and by the subscriptions as a replication start point. It guarantees that no transaction will be lost.

Write recovery parameters into the target data directory and restart the target server. It specifies an LSN (recovery_target_lsn) of the write-ahead log location up to which recovery will proceed. It also specifies promote as the action that the server should take once the recovery target is reached. Additional recovery parameters are added to avoid unexpected behavior during the recovery process such as end of the recovery as soon as a consistent state is reached (WAL should be applied until the replication start location) and multiple recovery targets that can cause a failure. This step finishes once the server ends standby mode and is accepting read-write transactions. If --recovery-timeout option is set, pg_createsubscriber terminates if recovery does not end until the given number of seconds.

Create a subscription for each specified database on the target server. If the --subscription option is not specified, the subscription has the following name pattern: “pg_createsubscriber_%u_%x” (parameters: database oid, random int). It does not copy existing data from the source server. It does not create a replication slot. Instead, it uses the replication slot that was created in a previous step. The subscription is created but it is not enabled yet. The reason is the replication progress must be set to the replication start point before starting the replication.

Drop publications on the target server that were replicated because they were created before the replication start location. It has no use on the subscriber.

Set the replication progress to the replication start point for each subscription. When the target server starts the recovery process, it catches up to the replication start point. This is the exact LSN to be used as a initial replication location for each subscription. The replication origin name is obtained since the subscription was created. The replication origin name and the replication start point are used in pg_replication_origin_advance() to set up the initial replication location.

Enable the subscription for each specified database on the target server. The subscription starts applying transactions from the replication start point.

If the standby server was using primary_slot_name, it has no use from now on so drop it.

If the standby server contains failover replication slots, they cannot be synchronized anymore, so drop them.

Update the system identifier on the target server. The pg_resetwal is run to modify the system identifier. The target server is stopped as a pg_resetwal requirement.

To create a logical replica for databases hr and finance from a physical replica at foo:

**Examples:**

Example 1 (unknown):
```unknown
pg_createsubscriber
```

Example 2 (swift):
```swift
--publisher-server
```

Example 3 (unknown):
```unknown
CREATE SUBSCRIPTION
```

Example 4 (swift):
```swift
--publisher-server
```

---


---

## PostgreSQL Client Applications


**URL:** https://www.postgresql.org/docs/18/reference-client.html

**Contents:**
- PostgreSQL Client Applications

This part contains reference information for PostgreSQL client applications and utilities. Not all of these commands are of general utility; some might require special privileges. The common feature of these applications is that they can be run on any host, independent of where the database server resides.

When specified on the command line, user and database names have their case preserved — the presence of spaces or special characters might require quoting. Table names and other identifiers do not have their case preserved, except where documented, and might require quoting.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgwalsummary.html

**Contents:**
- pg_walsummary
- Synopsis
- Description
- Options
- Environment
- See Also

pg_walsummary — print contents of WAL summary files

pg_walsummary [option...] [file...]

pg_walsummary is used to print the contents of WAL summary files. These binary files are found with the pg_wal/summaries subdirectory of the data directory, and can be converted to text using this tool. This is not ordinarily necessary, since WAL summary files primarily exist to support incremental backup, but it may be useful for debugging purposes.

A WAL summary file is indexed by tablespace OID, relation OID, and relation fork. For each relation fork, it stores the list of blocks that were modified by WAL within the range summarized in the file. It can also store a "limit block," which is 0 if the relation fork was created or truncated within the relevant WAL range, and otherwise the shortest length to which the relation fork was truncated. If the relation fork was not created, deleted, or truncated within the relevant WAL range, the limit block is undefined or infinite and will not be printed by this tool.

By default, pg_walsummary prints one line of output for each range of one or more consecutive modified blocks. This can make the output a lot briefer, since a relation where all blocks from 0 through 999 were modified will produce only one line of output rather than 1000 separate lines. This option requests a separate line of output for every modified block.

Do not print any output, except for errors. This can be useful when you want to know whether a WAL summary file can be successfully parsed but don't care about the contents.

Display version information, then exit.

Shows help about pg_walsummary command line arguments, and exits.

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

**Examples:**

Example 1 (unknown):
```unknown
pg_walsummary
```

Example 2 (unknown):
```unknown
pg_wal/summaries
```

Example 3 (unknown):
```unknown
--individual
```

Example 4 (unknown):
```unknown
pg_walsummary
```

---


---

