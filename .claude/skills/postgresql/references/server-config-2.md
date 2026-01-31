# PostgreSQL - Server Config (Part 2)

## 19.9. Run-time Statistics #


**URL:** https://www.postgresql.org/docs/18/runtime-config-statistics.html

**Contents:**
- 19.9. Run-time Statistics #
  - 19.9.1. Cumulative Query and Index Statistics #
  - Note
  - Note
  - 19.9.2. Statistics Monitoring #
  - Note

These parameters control the server-wide cumulative statistics system. When enabled, the data that is collected can be accessed via the pg_stat and pg_statio family of system views. Refer to Chapter 27 for more information.

Enables the collection of information on the currently executing command of each session, along with its identifier and the time when that command began execution. This parameter is on by default. Note that even when enabled, this information is only visible to superusers, roles with privileges of the pg_read_all_stats role and the user owning the sessions being reported on (including sessions belonging to a role they have the privileges of), so it should not represent a security risk. Only superusers and users with the appropriate SET privilege can change this setting.

Specifies the amount of memory reserved to store the text of the currently executing command for each active session, for the pg_stat_activity.query field. If this value is specified without units, it is taken as bytes. The default value is 1024 bytes. This parameter can only be set at server start.

Enables collection of statistics on database activity. This parameter is on by default, because the autovacuum daemon needs the collected information. Only superusers and users with the appropriate SET privilege can change this setting.

Enables timing of cost-based vacuum delay (see Section 19.10.2). This parameter is off by default, as it will repeatedly query the operating system for the current time, which may cause significant overhead on some platforms. You can use the pg_test_timing tool to measure the overhead of timing on your system. Cost-based vacuum delay timing information is displayed in pg_stat_progress_vacuum, pg_stat_progress_analyze, in the output of VACUUM and ANALYZE when the VERBOSE option is used, and by autovacuum for auto-vacuums and auto-analyzes when log_autovacuum_min_duration is set. Only superusers and users with the appropriate SET privilege can change this setting.

Enables timing of database I/O waits. This parameter is off by default, as it will repeatedly query the operating system for the current time, which may cause significant overhead on some platforms. You can use the pg_test_timing tool to measure the overhead of timing on your system. I/O timing information is displayed in pg_stat_database, pg_stat_io (if object is not wal), in the output of the pg_stat_get_backend_io() function (if object is not wal), in the output of EXPLAIN when the BUFFERS option is used, in the output of VACUUM when the VERBOSE option is used, by autovacuum for auto-vacuums and auto-analyzes, when log_autovacuum_min_duration is set and by pg_stat_statements. Only superusers and users with the appropriate SET privilege can change this setting.

Enables timing of WAL I/O waits. This parameter is off by default, as it will repeatedly query the operating system for the current time, which may cause significant overhead on some platforms. You can use the pg_test_timing tool to measure the overhead of timing on your system. I/O timing information is displayed in pg_stat_io for the object wal and in the output of the pg_stat_get_backend_io() function for the object wal. Only superusers and users with the appropriate SET privilege can change this setting.

Enables tracking of function call counts and time used. Specify pl to track only procedural-language functions, all to also track SQL and C language functions. The default is none, which disables function statistics tracking. Only superusers and users with the appropriate SET privilege can change this setting.

SQL-language functions that are simple enough to be “inlined” into the calling query will not be tracked, regardless of this setting.

Determines the behavior when cumulative statistics are accessed multiple times within a transaction. When set to none, each access re-fetches counters from shared memory. When set to cache, the first access to statistics for an object caches those statistics until the end of the transaction unless pg_stat_clear_snapshot() is called. When set to snapshot, the first statistics access caches all statistics accessible in the current database, until the end of the transaction unless pg_stat_clear_snapshot() is called. Changing this parameter in a transaction discards the statistics snapshot. The default is cache.

none is most suitable for monitoring systems. If values are only accessed once, it is the most efficient. cache ensures repeat accesses yield the same values, which is important for queries involving e.g. self-joins. snapshot can be useful when interactively inspecting statistics, but has higher overhead, particularly if many database objects exist.

Enables in-core computation of a query identifier. Query identifiers can be displayed in the pg_stat_activity view, using EXPLAIN, or emitted in the log if configured via the log_line_prefix parameter. The pg_stat_statements extension also requires a query identifier to be computed. Note that an external module can alternatively be used if the in-core query identifier computation method is not acceptable. In this case, in-core computation must be always disabled. Valid values are off (always disabled), on (always enabled), auto, which lets modules such as pg_stat_statements automatically enable it, and regress which has the same effect as auto, except that the query identifier is not shown in the EXPLAIN output in order to facilitate automated regression testing. The default is auto.

To ensure that only one query identifier is calculated and displayed, extensions that calculate query identifiers should throw an error if a query identifier has already been computed.

For each query, output performance statistics of the respective module to the server log. This is a crude profiling instrument, similar to the Unix getrusage() operating system facility. log_statement_stats reports total statement statistics, while the others report per-module statistics. log_statement_stats cannot be enabled together with any of the per-module options. All of these options are disabled by default. Only superusers and users with the appropriate SET privilege can change these settings.

**Examples:**

Example 1 (unknown):
```unknown
track_activities
```

Example 2 (unknown):
```unknown
pg_read_all_stats
```

Example 3 (unknown):
```unknown
track_activity_query_size
```

Example 4 (unknown):
```unknown
pg_stat_activity
```

---


---

## 19.12. Lock Management #


**URL:** https://www.postgresql.org/docs/18/runtime-config-locks.html

**Contents:**
- 19.12. Lock Management #

This is the amount of time to wait on a lock before checking to see if there is a deadlock condition. The check for deadlock is relatively expensive, so the server doesn't run it every time it waits for a lock. We optimistically assume that deadlocks are not common in production applications and just wait on the lock for a while before checking for a deadlock. Increasing this value reduces the amount of time wasted in needless deadlock checks, but slows down reporting of real deadlock errors. If this value is specified without units, it is taken as milliseconds. The default is one second (1s), which is probably about the smallest value you would want in practice. On a heavily loaded server you might want to raise it. Ideally the setting should exceed your typical transaction time, so as to improve the odds that a lock will be released before the waiter decides to check for deadlock. Only superusers and users with the appropriate SET privilege can change this setting.

When log_lock_waits is set, this parameter also determines the amount of time to wait before a log message is issued about the lock wait. If you are trying to investigate locking delays you might want to set a shorter than normal deadlock_timeout.

The shared lock table has space for max_locks_per_transaction objects (e.g., tables) per server process or prepared transaction; hence, no more than this many distinct objects can be locked at any one time. This parameter limits the average number of object locks used by each transaction; individual transactions can lock more objects as long as the locks of all transactions fit in the lock table. This is not the number of rows that can be locked; that value is unlimited. The default, 64, has historically proven sufficient, but you might need to raise this value if you have queries that touch many different tables in a single transaction, e.g., query of a parent table with many children. This parameter can only be set at server start.

When running a standby server, you must set this parameter to have the same or higher value as on the primary server. Otherwise, queries will not be allowed in the standby server.

The shared predicate lock table has space for max_pred_locks_per_transaction objects (e.g., tables) per server process or prepared transaction; hence, no more than this many distinct objects can be locked at any one time. This parameter limits the average number of object locks used by each transaction; individual transactions can lock more objects as long as the locks of all transactions fit in the lock table. This is not the number of rows that can be locked; that value is unlimited. The default, 64, has historically proven sufficient, but you might need to raise this value if you have clients that touch many different tables in a single serializable transaction. This parameter can only be set at server start.

This controls how many pages or tuples of a single relation can be predicate-locked before the lock is promoted to covering the whole relation. Values greater than or equal to zero mean an absolute limit, while negative values mean max_pred_locks_per_transaction divided by the absolute value of this setting. The default is -2, which keeps the behavior from previous versions of PostgreSQL. This parameter can only be set in the postgresql.conf file or on the server command line.

This controls how many rows on a single page can be predicate-locked before the lock is promoted to covering the whole page. The default is 2. This parameter can only be set in the postgresql.conf file or on the server command line.

**Examples:**

Example 1 (unknown):
```unknown
deadlock_timeout
```

Example 2 (unknown):
```unknown
deadlock_timeout
```

Example 3 (unknown):
```unknown
max_locks_per_transaction
```

Example 4 (unknown):
```unknown
max_locks_per_transaction
```

---


---

## 19.3. Connections and Authentication #


**URL:** https://www.postgresql.org/docs/18/runtime-config-connection.html

**Contents:**
- 19.3. Connections and Authentication #
  - 19.3.1. Connection Settings #
  - 19.3.2. TCP Settings #
  - 19.3.3. Authentication #
  - Warning
  - 19.3.4. SSL #

Specifies the TCP/IP address(es) on which the server is to listen for connections from client applications. The value takes the form of a comma-separated list of host names and/or numeric IP addresses. The special entry * corresponds to all available IP interfaces. The entry 0.0.0.0 allows listening for all IPv4 addresses and :: allows listening for all IPv6 addresses. If the list is empty, the server does not listen on any IP interface at all, in which case only Unix-domain sockets can be used to connect to it. If the list is not empty, the server will start if it can listen on at least one TCP/IP address. A warning will be emitted for any TCP/IP address which cannot be opened. The default value is localhost, which allows only local TCP/IP “loopback” connections to be made.

While client authentication (Chapter 20) allows fine-grained control over who can access the server, listen_addresses controls which interfaces accept connection attempts, which can help prevent repeated malicious connection requests on insecure network interfaces. This parameter can only be set at server start.

The TCP port the server listens on; 5432 by default. Note that the same port number is used for all IP addresses the server listens on. This parameter can only be set at server start.

Determines the maximum number of concurrent connections to the database server. The default is typically 100 connections, but might be less if your kernel settings will not support it (as determined during initdb). This parameter can only be set at server start.

PostgreSQL sizes certain resources based directly on the value of max_connections. Increasing its value leads to higher allocation of those resources, including shared memory.

When running a standby server, you must set this parameter to the same or higher value than on the primary server. Otherwise, queries will not be allowed in the standby server.

Determines the number of connection “slots” that are reserved for connections by roles with privileges of the pg_use_reserved_connections role. Whenever the number of free connection slots is greater than superuser_reserved_connections but less than or equal to the sum of superuser_reserved_connections and reserved_connections, new connections will be accepted only for superusers and roles with privileges of pg_use_reserved_connections. If superuser_reserved_connections or fewer connection slots are available, new connections will be accepted only for superusers.

The default value is zero connections. The value must be less than max_connections minus superuser_reserved_connections. This parameter can only be set at server start.

Determines the number of connection “slots” that are reserved for connections by PostgreSQL superusers. At most max_connections connections can ever be active simultaneously. Whenever the number of active concurrent connections is at least max_connections minus superuser_reserved_connections, new connections will be accepted only for superusers. The connection slots reserved by this parameter are intended as final reserve for emergency use after the slots reserved by reserved_connections have been exhausted.

The default value is three connections. The value must be less than max_connections minus reserved_connections. This parameter can only be set at server start.

Specifies the directory of the Unix-domain socket(s) on which the server is to listen for connections from client applications. Multiple sockets can be created by listing multiple directories separated by commas. Whitespace between entries is ignored; surround a directory name with double quotes if you need to include whitespace or commas in the name. An empty value specifies not listening on any Unix-domain sockets, in which case only TCP/IP sockets can be used to connect to the server.

A value that starts with @ specifies that a Unix-domain socket in the abstract namespace should be created (currently supported on Linux only). In that case, this value does not specify a “directory” but a prefix from which the actual socket name is computed in the same manner as for the file-system namespace. While the abstract socket name prefix can be chosen freely, since it is not a file-system location, the convention is to nonetheless use file-system-like values such as @/tmp.

The default value is normally /tmp, but that can be changed at build time. On Windows, the default is empty, which means no Unix-domain socket is created by default. This parameter can only be set at server start.

In addition to the socket file itself, which is named .s.PGSQL.nnnn where nnnn is the server's port number, an ordinary file named .s.PGSQL.nnnn.lock will be created in each of the unix_socket_directories directories. Neither file should ever be removed manually. For sockets in the abstract namespace, no lock file is created.

Sets the owning group of the Unix-domain socket(s). (The owning user of the sockets is always the user that starts the server.) In combination with the parameter unix_socket_permissions this can be used as an additional access control mechanism for Unix-domain connections. By default this is the empty string, which uses the default group of the server user. This parameter can only be set at server start.

This parameter is not supported on Windows. Any setting will be ignored. Also, sockets in the abstract namespace have no file owner, so this setting is also ignored in that case.

Sets the access permissions of the Unix-domain socket(s). Unix-domain sockets use the usual Unix file system permission set. The parameter value is expected to be a numeric mode specified in the format accepted by the chmod and umask system calls. (To use the customary octal format the number must start with a 0 (zero).)

The default permissions are 0777, meaning anyone can connect. Reasonable alternatives are 0770 (only user and group, see also unix_socket_group) and 0700 (only user). (Note that for a Unix-domain socket, only write permission matters, so there is no point in setting or revoking read or execute permissions.)

This access control mechanism is independent of the one described in Chapter 20.

This parameter can only be set at server start.

This parameter is irrelevant on systems, notably Solaris as of Solaris 10, that ignore socket permissions entirely. There, one can achieve a similar effect by pointing unix_socket_directories to a directory having search permission limited to the desired audience.

Sockets in the abstract namespace have no file permissions, so this setting is also ignored in that case.

Enables advertising the server's existence via Bonjour. The default is off. This parameter can only be set at server start.

Specifies the Bonjour service name. The computer name is used if this parameter is set to the empty string '' (which is the default). This parameter is ignored if the server was not compiled with Bonjour support. This parameter can only be set at server start.

Specifies the amount of time with no network activity after which the operating system should send a TCP keepalive message to the client. If this value is specified without units, it is taken as seconds. A value of 0 (the default) selects the operating system's default. On Windows, setting a value of 0 will set this parameter to 2 hours, since Windows does not provide a way to read the system default value. This parameter is supported only on systems that support TCP_KEEPIDLE or an equivalent socket option, and on Windows; on other systems, it must be zero. In sessions connected via a Unix-domain socket, this parameter is ignored and always reads as zero.

Specifies the amount of time after which a TCP keepalive message that has not been acknowledged by the client should be retransmitted. If this value is specified without units, it is taken as seconds. A value of 0 (the default) selects the operating system's default. On Windows, setting a value of 0 will set this parameter to 1 second, since Windows does not provide a way to read the system default value. This parameter is supported only on systems that support TCP_KEEPINTVL or an equivalent socket option, and on Windows; on other systems, it must be zero. In sessions connected via a Unix-domain socket, this parameter is ignored and always reads as zero.

Specifies the number of TCP keepalive messages that can be lost before the server's connection to the client is considered dead. A value of 0 (the default) selects the operating system's default. This parameter is supported only on systems that support TCP_KEEPCNT or an equivalent socket option (which does not include Windows); on other systems, it must be zero. In sessions connected via a Unix-domain socket, this parameter is ignored and always reads as zero.

Specifies the amount of time that transmitted data may remain unacknowledged before the TCP connection is forcibly closed. If this value is specified without units, it is taken as milliseconds. A value of 0 (the default) selects the operating system's default. This parameter is supported only on systems that support TCP_USER_TIMEOUT (which does not include Windows); on other systems, it must be zero. In sessions connected via a Unix-domain socket, this parameter is ignored and always reads as zero.

Sets the time interval between optional checks that the client is still connected, while running queries. The check is performed by polling the socket, and allows long running queries to be aborted sooner if the kernel reports that the connection is closed.

This option relies on kernel events exposed by Linux, macOS, illumos and the BSD family of operating systems, and is not currently available on other systems.

If the value is specified without units, it is taken as milliseconds. The default value is 0, which disables connection checks. Without connection checks, the server will detect the loss of the connection only at the next interaction with the socket, when it waits for, receives or sends data.

For the kernel itself to detect lost TCP connections reliably and within a known timeframe in all scenarios including network failure, it may also be necessary to adjust the TCP keepalive settings of the operating system, or the tcp_keepalives_idle, tcp_keepalives_interval and tcp_keepalives_count settings of PostgreSQL.

Maximum amount of time allowed to complete client authentication. If a would-be client has not completed the authentication protocol in this much time, the server closes the connection. This prevents hung clients from occupying a connection indefinitely. If this value is specified without units, it is taken as seconds. The default is one minute (1m). This parameter can only be set in the postgresql.conf file or on the server command line.

When a password is specified in CREATE ROLE or ALTER ROLE, this parameter determines the algorithm to use to encrypt the password. Possible values are scram-sha-256, which will encrypt the password with SCRAM-SHA-256, and md5, which stores the password as an MD5 hash. The default is scram-sha-256.

Note that older clients might lack support for the SCRAM authentication mechanism, and hence not work with passwords encrypted with SCRAM-SHA-256. See Section 20.5 for more details.

Support for MD5-encrypted passwords is deprecated and will be removed in a future release of PostgreSQL. Refer to Section 20.5 for details about migrating to another password type.

The number of computational iterations to be performed when encrypting a password using SCRAM-SHA-256. The default is 4096. A higher number of iterations provides additional protection against brute-force attacks on stored passwords, but makes authentication slower. Changing the value has no effect on existing passwords encrypted with SCRAM-SHA-256 as the iteration count is fixed at the time of encryption. In order to make use of a changed value, a new password must be set.

Controls whether a WARNING about MD5 password deprecation is produced when a CREATE ROLE or ALTER ROLE statement sets an MD5-encrypted password. The default value is on.

Sets the location of the server's Kerberos key file. The default is FILE:/usr/local/pgsql/etc/krb5.keytab (where the directory part is whatever was specified as sysconfdir at build time; use pg_config --sysconfdir to determine that). If this parameter is set to an empty string, it is ignored and a system-dependent default is used. This parameter can only be set in the postgresql.conf file or on the server command line. See Section 20.6 for more information.

Sets whether GSSAPI user names should be treated case-insensitively. The default is off (case sensitive). This parameter can only be set in the postgresql.conf file or on the server command line.

Sets whether GSSAPI delegation should be accepted from the client. The default is off meaning credentials from the client will not be accepted. Changing this to on will make the server accept credentials delegated to it from the client. This parameter can only be set in the postgresql.conf file or on the server command line.

The library/libraries to use for validating OAuth connection tokens. If only one validator library is provided, it will be used by default for any OAuth connections; otherwise, all oauth HBA entries must explicitly set a validator chosen from this list. If set to an empty string (the default), OAuth connections will be refused. This parameter can only be set in the postgresql.conf file.

Validator modules must be implemented/obtained separately; PostgreSQL does not ship with any default implementations. For more information on implementing OAuth validators, see Chapter 50.

See Section 18.9 for more information about setting up SSL. The configuration parameters for controlling transfer encryption using TLS protocols are named ssl for historic reasons, even though support for the SSL protocol has been deprecated. SSL is in this context used interchangeably with TLS.

Enables SSL connections. This parameter can only be set in the postgresql.conf file or on the server command line. The default is off.

Specifies the name of the file containing the SSL server certificate authority (CA). Relative paths are relative to the data directory. This parameter can only be set in the postgresql.conf file or on the server command line. The default is empty, meaning no CA file is loaded, and client certificate verification is not performed.

Specifies the name of the file containing the SSL server certificate. Relative paths are relative to the data directory. This parameter can only be set in the postgresql.conf file or on the server command line. The default is server.crt.

Specifies the name of the file containing the SSL client certificate revocation list (CRL). Relative paths are relative to the data directory. This parameter can only be set in the postgresql.conf file or on the server command line. The default is empty, meaning no CRL file is loaded (unless ssl_crl_dir is set).

Specifies the name of the directory containing the SSL client certificate revocation list (CRL). Relative paths are relative to the data directory. This parameter can only be set in the postgresql.conf file or on the server command line. The default is empty, meaning no CRLs are used (unless ssl_crl_file is set).

The directory needs to be prepared with the OpenSSL command openssl rehash or c_rehash. See its documentation for details.

When using this setting, CRLs in the specified directory are loaded on-demand at connection time. New CRLs can be added to the directory and will be used immediately. This is unlike ssl_crl_file, which causes the CRL in the file to be loaded at server start time or when the configuration is reloaded. Both settings can be used together.

Specifies the name of the file containing the SSL server private key. Relative paths are relative to the data directory. This parameter can only be set in the postgresql.conf file or on the server command line. The default is server.key.

Specifies a list of cipher suites that are allowed by connections using TLS version 1.3. Multiple cipher suites can be specified by using a colon separated list. If left blank, the default set of cipher suites in OpenSSL will be used.

This parameter can only be set in the postgresql.conf file or on the server command line.

Specifies a list of SSL ciphers that are allowed by connections using TLS version 1.2 and lower, see ssl_tls13_ciphers for TLS version 1.3 connections. See the ciphers manual page in the OpenSSL package for the syntax of this setting and a list of supported values. The default value is HIGH:MEDIUM:+3DES:!aNULL. The default is usually a reasonable choice unless you have specific security requirements.

This parameter can only be set in the postgresql.conf file or on the server command line.

Explanation of the default value:

Cipher suites that use ciphers from HIGH group (e.g., AES, Camellia, 3DES)

Cipher suites that use ciphers from MEDIUM group (e.g., RC4, SEED)

The OpenSSL default order for HIGH is problematic because it orders 3DES higher than AES128. This is wrong because 3DES offers less security than AES128, and it is also much slower. +3DES reorders it after all other HIGH and MEDIUM ciphers.

Disables anonymous cipher suites that do no authentication. Such cipher suites are vulnerable to MITM attacks and therefore should not be used.

Available cipher suite details will vary across OpenSSL versions. Use the command openssl ciphers -v 'HIGH:MEDIUM:+3DES:!aNULL' to see actual details for the currently installed OpenSSL version. Note that this list is filtered at run time based on the server key type.

Specifies whether to use the server's SSL cipher preferences, rather than the client's. This parameter can only be set in the postgresql.conf file or on the server command line. The default is on.

PostgreSQL versions before 9.4 do not have this setting and always use the client's preferences. This setting is mainly for backward compatibility with those versions. Using the server's preferences is usually better because it is more likely that the server is appropriately configured.

Specifies the name of the curve to use in ECDH key exchange. It needs to be supported by all clients that connect. Multiple curves can be specified by using a colon-separated list. It does not need to be the same curve used by the server's Elliptic Curve key. This parameter can only be set in the postgresql.conf file or on the server command line. The default is X25519:prime256v1.

OpenSSL names for the most common curves are: prime256v1 (NIST P-256), secp384r1 (NIST P-384), secp521r1 (NIST P-521). An incomplete list of available groups can be shown with the command openssl ecparam -list_curves. Not all of them are usable with TLS though, and many supported group names and aliases are omitted.

In PostgreSQL versions before 18.0 this setting was named ssl_ecdh_curve and only accepted a single value.

Sets the minimum SSL/TLS protocol version to use. Valid values are currently: TLSv1, TLSv1.1, TLSv1.2, TLSv1.3. Older versions of the OpenSSL library do not support all values; an error will be raised if an unsupported setting is chosen. Protocol versions before TLS 1.0, namely SSL version 2 and 3, are always disabled.

The default is TLSv1.2, which satisfies industry best practices as of this writing.

This parameter can only be set in the postgresql.conf file or on the server command line.

Sets the maximum SSL/TLS protocol version to use. Valid values are as for ssl_min_protocol_version, with addition of an empty string, which allows any protocol version. The default is to allow any version. Setting the maximum protocol version is mainly useful for testing or if some component has issues working with a newer protocol.

This parameter can only be set in the postgresql.conf file or on the server command line.

Specifies the name of the file containing Diffie-Hellman parameters used for so-called ephemeral DH family of SSL ciphers. The default is empty, in which case compiled-in default DH parameters used. Using custom DH parameters reduces the exposure if an attacker manages to crack the well-known compiled-in DH parameters. You can create your own DH parameters file with the command openssl dhparam -out dhparams.pem 2048.

This parameter can only be set in the postgresql.conf file or on the server command line.

Sets an external command to be invoked when a passphrase for decrypting an SSL file such as a private key needs to be obtained. By default, this parameter is empty, which means the built-in prompting mechanism is used.

The command must print the passphrase to the standard output and exit with code 0. In the parameter value, %p is replaced by a prompt string. (Write %% for a literal %.) Note that the prompt string will probably contain whitespace, so be sure to quote adequately. A single newline is stripped from the end of the output if present.

The command does not actually have to prompt the user for a passphrase. It can read it from a file, obtain it from a keychain facility, or similar. It is up to the user to make sure the chosen mechanism is adequately secure.

This parameter can only be set in the postgresql.conf file or on the server command line.

This parameter determines whether the passphrase command set by ssl_passphrase_command will also be called during a configuration reload if a key file needs a passphrase. If this parameter is off (the default), then ssl_passphrase_command will be ignored during a reload and the SSL configuration will not be reloaded if a passphrase is needed. That setting is appropriate for a command that requires a TTY for prompting, which might not be available when the server is running. Setting this parameter to on might be appropriate if the passphrase is obtained from a file, for example.

This parameter can only be set in the postgresql.conf file or on the server command line.

**Examples:**

Example 1 (unknown):
```unknown
listen_addresses
```

Example 2 (unknown):
```unknown
listen_addresses
```

Example 3 (unknown):
```unknown
max_connections
```

Example 4 (unknown):
```unknown
max_connections
```

---


---

