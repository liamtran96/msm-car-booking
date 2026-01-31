# PostgreSQL - Client Apps (Part 15)

## 


**URL:** https://www.postgresql.org/docs/18/app-pgrecvlogical.html

**Contents:**
- pg_recvlogical
- Synopsis
- Description
- Options
- Exit Status
- Environment
- Notes
- Examples
- See Also

pg_recvlogical — control PostgreSQL logical decoding streams

pg_recvlogical [option...]

pg_recvlogical controls logical decoding replication slots and streams data from such replication slots.

It creates a replication-mode connection, so it is subject to the same constraints as pg_receivewal, plus those for logical replication (see Chapter 47).

pg_recvlogical has no equivalent to the logical decoding SQL interface's peek and get modes. It sends replay confirmations for data lazily as it receives it and on clean exit. To examine pending data on a slot without consuming it, use pg_logical_slot_peek_changes.

In the absence of fatal errors, pg_recvlogical will run until terminated by the SIGINT (Control+C) or SIGTERM signal.

When pg_recvlogical receives a SIGHUP signal, it closes the current output file and opens a new one using the filename specified by the --file option. This allows us to rotate the output file by first renaming the current file and then sending a SIGHUP signal to pg_recvlogical.

At least one of the following options must be specified to select an action:

Create a new logical replication slot with the name specified by --slot, using the output plugin specified by --plugin, for the database specified by --dbname.

The --slot and --dbname are required for this action.

The --enable-two-phase and --enable-failover options can be specified with --create-slot.

Drop the replication slot with the name specified by --slot, then exit.

The --slot is required for this action.

Begin streaming changes from the logical replication slot specified by --slot, continuing until terminated by a signal. If the server side change stream ends with a server shutdown or disconnect, retry in a loop unless --no-loop is specified.

The --slot and --dbname, --file are required for this action.

The stream format is determined by the output plugin specified when the slot was created.

The connection must be to the same database used to create the slot.

--create-slot and --start can be specified together. --drop-slot cannot be combined with another action.

The following command-line options control the location and format of the output and other replication behavior:

In --start mode, automatically stop replication and exit with normal exit status 0 when receiving reaches the specified LSN. If specified when not in --start mode, an error is raised.

If there's a record with LSN exactly equal to lsn, the record will be output.

The --endpos option is not aware of transaction boundaries and may truncate output partway through a transaction. Any partially output transaction will not be consumed and will be replayed again when the slot is next read from. Individual messages are never truncated.

Enables the slot to be synchronized to the standbys. This option may only be specified with --create-slot.

Write received and decoded transaction data into this file. Use - for stdout.

This parameter is required for --start.

Specifies how often pg_recvlogical should issue fsync() calls to ensure the output file is safely flushed to disk.

The server will occasionally request the client to perform a flush and report the flush position to the server. This setting is in addition to that, to perform flushes more frequently.

Specifying an interval of 0 disables issuing fsync() calls altogether, while still reporting progress to the server. In this case, data could be lost in the event of a crash.

In --start mode, start replication from the given LSN. For details on the effect of this, see the documentation in Chapter 47 and Section 54.4. Ignored in other modes.

Do not error out when --create-slot is specified and a slot with the specified name already exists.

When the connection to the server is lost, do not retry in a loop, just exit.

Pass the option name to the output plugin with, if specified, the option value value. Which options exist and their effects depends on the used output plugin.

When creating a slot, use the specified logical decoding output plugin. See Chapter 47. This option has no effect if the slot already exists.

This option has the same effect as the option of the same name in pg_receivewal. See the description there.

In --start mode, use the existing logical replication slot named slot_name. In --create-slot mode, create the slot with this name. In --drop-slot mode, delete the slot with this name.

This parameter is required for any of actions.

Enables decoding of prepared transactions. This option may only be specified with --create-slot.

Enables verbose mode.

The following command-line options control the database connection parameters.

The database to connect to. See the description of the actions for what this means in detail. The dbname can be a connection string. If so, connection string parameters will override any conflicting command line options.

This parameter is required for --create-slot and --start.

Specifies the host name of the machine on which the server is running. If the value begins with a slash, it is used as the directory for the Unix domain socket. The default is taken from the PGHOST environment variable, if set, else a Unix domain socket connection is attempted.

Specifies the TCP port or local Unix domain socket file extension on which the server is listening for connections. Defaults to the PGPORT environment variable, if set, or a compiled-in default.

User name to connect as. Defaults to current operating system user name.

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force pg_recvlogical to prompt for a password before connecting to a database.

This option is never essential, since pg_recvlogical will automatically prompt for a password if the server demands password authentication. However, pg_recvlogical will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

The following additional options are available:

Print the pg_recvlogical version and exit.

Show help about pg_recvlogical command line arguments, and exit.

pg_recvlogical will exit with status 0 when terminated by the SIGINT or SIGTERM signal. (That is the normal way to end it. Hence it is not an error.) For fatal errors or other signals, the exit status will be nonzero.

This utility, like most other PostgreSQL utilities, uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

pg_recvlogical will preserve group permissions on the received WAL files if group permissions are enabled on the source cluster.

See Section 47.1 for an example.

**Examples:**

Example 1 (unknown):
```unknown
pg_recvlogical
```

Example 2 (unknown):
```unknown
pg_recvlogical
```

Example 3 (unknown):
```unknown
pg_recvlogical
```

Example 4 (unknown):
```unknown
pg_logical_slot_peek_changes
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-dropuser.html

**Contents:**
- dropuser
- Synopsis
- Description
- Options
- Environment
- Diagnostics
- Examples
- See Also

dropuser — remove a PostgreSQL user account

dropuser [connection-option...] [option...] [username]

dropuser removes an existing PostgreSQL user. Superusers can use this command to remove any role; otherwise, only non-superuser roles can be removed, and only by a user who possesses the CREATEROLE privilege and has been granted ADMIN OPTION on the target role.

dropuser is a wrapper around the SQL command DROP ROLE. There is no effective difference between dropping users via this utility and via other methods for accessing the server.

dropuser accepts the following command-line arguments:

Specifies the name of the PostgreSQL user to be removed. You will be prompted for a name if none is specified on the command line and the -i/--interactive option is used.

Echo the commands that dropuser generates and sends to the server.

Prompt for confirmation before actually removing the user, and prompt for the user name if none is specified on the command line.

Print the dropuser version and exit.

Do not throw an error if the user does not exist. A notice is issued in this case.

Show help about dropuser command line arguments, and exit.

dropuser also accepts the following command-line arguments for connection parameters:

Specifies the host name of the machine on which the server is running. If the value begins with a slash, it is used as the directory for the Unix domain socket.

Specifies the TCP port or local Unix domain socket file extension on which the server is listening for connections.

User name to connect as (not the user name to drop).

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force dropuser to prompt for a password before connecting to a database.

This option is never essential, since dropuser will automatically prompt for a password if the server demands password authentication. However, dropuser will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

Default connection parameters

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

This utility, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

In case of difficulty, see DROP ROLE and psql for discussions of potential problems and error messages. The database server must be running at the targeted host. Also, any default connection settings and environment variables used by the libpq front-end library will apply.

To remove user joe from the default database server:

To remove user joe using the server on host eden, port 5000, with verification and a peek at the underlying command:

**Examples:**

Example 1 (unknown):
```unknown
connection-option
```

Example 2 (unknown):
```unknown
ADMIN OPTION
```

Example 3 (unknown):
```unknown
--interactive
```

Example 4 (unknown):
```unknown
--interactive
```

---


---

