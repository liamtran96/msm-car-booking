# PostgreSQL - Client Apps (Part 12)

## 


**URL:** https://www.postgresql.org/docs/18/app-pgconfig.html

**Contents:**
- pg_config
- Synopsis
- Description
- Options
- Notes
- Example

pg_config — retrieve information about the installed version of PostgreSQL

pg_config [option...]

The pg_config utility prints configuration parameters of the currently installed version of PostgreSQL. It is intended, for example, to be used by software packages that want to interface to PostgreSQL to facilitate finding the required header files and libraries.

To use pg_config, supply one or more of the following options:

Print the location of user executables. Use this, for example, to find the psql program. This is normally also the location where the pg_config program resides.

Print the location of documentation files.

Print the location of HTML documentation files.

Print the location of C header files of the client interfaces.

Print the location of other C header files.

Print the location of C header files for server programming.

Print the location of object code libraries.

Print the location of dynamically loadable modules, or where the server would search for them. (Other architecture-dependent data files might also be installed in this directory.)

Print the location of locale support files. (This will be an empty string if locale support was not configured when PostgreSQL was built.)

Print the location of manual pages.

Print the location of architecture-independent support files.

Print the location of system-wide configuration files.

Print the location of extension makefiles.

Print the options that were given to the configure script when PostgreSQL was configured for building. This can be used to reproduce the identical configuration, or to find out with what options a binary package was built. (Note however that binary packages often contain vendor-specific custom patches.) See also the examples below.

Print the value of the CC variable that was used for building PostgreSQL. This shows the C compiler used.

Print the value of the CPPFLAGS variable that was used for building PostgreSQL. This shows C compiler switches needed at preprocessing time (typically, -I switches).

Print the value of the CFLAGS variable that was used for building PostgreSQL. This shows C compiler switches.

Print the value of the CFLAGS_SL variable that was used for building PostgreSQL. This shows extra C compiler switches used for building shared libraries.

Print the value of the LDFLAGS variable that was used for building PostgreSQL. This shows linker switches.

Print the value of the LDFLAGS_EX variable that was used for building PostgreSQL. This shows linker switches used for building executables only.

Print the value of the LDFLAGS_SL variable that was used for building PostgreSQL. This shows linker switches used for building shared libraries only.

Print the value of the LIBS variable that was used for building PostgreSQL. This normally contains -l switches for external libraries linked into PostgreSQL.

Print the version of PostgreSQL.

Show help about pg_config command line arguments, and exit.

If more than one option is given, the information is printed in that order, one item per line. If no options are given, all available information is printed, with labels.

The options --docdir, --pkgincludedir, --localedir, --mandir, --sharedir, --sysconfdir, --cc, --cppflags, --cflags, --cflags_sl, --ldflags, --ldflags_sl, and --libs were added in PostgreSQL 8.1. The option --htmldir was added in PostgreSQL 8.4. The option --ldflags_ex was added in PostgreSQL 9.0.

To reproduce the build configuration of the current PostgreSQL installation, run the following command:

The output of pg_config --configure contains shell quotation marks so arguments with spaces are represented correctly. Therefore, using eval is required for proper results.

**Examples:**

Example 1 (unknown):
```unknown
--includedir
```

Example 2 (unknown):
```unknown
--pkgincludedir
```

Example 3 (unknown):
```unknown
--includedir-server
```

Example 4 (unknown):
```unknown
--pkglibdir
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgresetwal.html

**Contents:**
- pg_resetwal
- Synopsis
- Description
- Options
  - Note
  - Note
- Environment
- Notes
- See Also

pg_resetwal — reset the write-ahead log and other control information of a PostgreSQL database cluster

pg_resetwal [ -f | --force ] [ -n | --dry-run ] [option...] [ -D | --pgdata ]datadir

pg_resetwal clears the write-ahead log (WAL) and optionally resets some other control information stored in the pg_control file. This function is sometimes needed if these files have become corrupted. It should be used only as a last resort, when the server will not start due to such corruption.

Some options, such as --wal-segsize (see below), can also be used to modify certain global settings of a database cluster without the need to rerun initdb. This can be done safely on an otherwise sound database cluster, if none of the dangerous modes mentioned below are used.

If pg_resetwal is used on a data directory where the server has been cleanly shut down and the control file is sound, then it will have no effect on the contents of the database system, except that no longer used WAL files are cleared away. Any other use is potentially dangerous and must be done with great care. pg_resetwal will require the -f (force) option to be specified before working on a data directory in an unclean shutdown state or with a corrupted control file.

After running this command on a data directory with corrupted WAL or a corrupted control file, it should be possible to start the server, but bear in mind that the database might contain inconsistent data due to partially-committed transactions. You should immediately dump your data, run initdb, and restore. After restore, check for inconsistencies and repair as needed.

If pg_resetwal complains that it cannot determine valid data for pg_control, you can force it to proceed anyway by specifying the -f (force) option. In this case plausible values will be substituted for the missing data. Most of the fields can be expected to match, but manual assistance might be needed for the next OID, next transaction ID and epoch, next multitransaction ID and offset, and WAL starting location fields. These fields can be set using the options discussed below. If you are not able to determine correct values for all these fields, -f can still be used, but the recovered database must be treated with even more suspicion than usual: an immediate dump and restore is imperative. Do not execute any data-modifying operations in the database before you dump, as any such action is likely to make the corruption worse.

This utility can only be run by the user who installed the server, because it requires read/write access to the data directory.

Specifies the location of the database directory. For safety reasons, you must specify the data directory on the command line. pg_resetwal does not use the environment variable PGDATA.

Force pg_resetwal to proceed even in situations where it could be dangerous, as explained above. Specifically, this option is required to proceed if the server had not been cleanly shut down or if pg_resetwal cannot determine valid data for pg_control.

The -n/--dry-run option instructs pg_resetwal to print the values reconstructed from pg_control and values about to be changed, and then exit without modifying anything. This is mainly a debugging tool, but can be useful as a sanity check before allowing pg_resetwal to proceed for real.

Display version information, then exit.

Show help, then exit.

The following options are only needed when pg_resetwal is unable to determine appropriate values by reading pg_control. Safe values can be determined as described below. For values that take numeric arguments, hexadecimal values can be specified by using the prefix 0x. Note that these instructions only apply with the standard block size of 8 kB.

Manually set the oldest and newest transaction IDs for which the commit time can be retrieved.

A safe value for the oldest transaction ID for which the commit time can be retrieved (first part) can be determined by looking for the numerically smallest file name in the directory pg_commit_ts under the data directory. Conversely, a safe value for the newest transaction ID for which the commit time can be retrieved (second part) can be determined by looking for the numerically greatest file name in the same directory. The file names are in hexadecimal.

Manually set the next transaction ID's epoch.

The transaction ID epoch is not actually stored anywhere in the database except in the field that is set by pg_resetwal, so any value will work so far as the database itself is concerned. You might need to adjust this value to ensure that replication systems such as Slony-I and Skytools work correctly — if so, an appropriate value should be obtainable from the state of the downstream replicated database.

Manually set the WAL starting location by specifying the name of the next WAL segment file.

The name of next WAL segment file should be larger than any WAL segment file name currently existing in the directory pg_wal under the data directory. These names are also in hexadecimal and have three parts. The first part is the “timeline ID” and should usually be kept the same. For example, if 00000001000000320000004A is the largest entry in pg_wal, use -l 00000001000000320000004B or higher.

Note that when using nondefault WAL segment sizes, the numbers in the WAL file names are different from the LSNs that are reported by system functions and system views. This option takes a WAL file name, not an LSN.

pg_resetwal itself looks at the files in pg_wal and chooses a default -l setting beyond the last existing file name. Therefore, manual adjustment of -l should only be needed if you are aware of WAL segment files that are not currently present in pg_wal, such as entries in an offline archive; or if the contents of pg_wal have been lost entirely.

Manually set the next and oldest multitransaction ID.

A safe value for the next multitransaction ID (first part) can be determined by looking for the numerically largest file name in the directory pg_multixact/offsets under the data directory, adding one, and then multiplying by 65536 (0x10000). Conversely, a safe value for the oldest multitransaction ID (second part of -m) can be determined by looking for the numerically smallest file name in the same directory and multiplying by 65536. The file names are in hexadecimal, so the easiest way to do this is to specify the option value in hexadecimal and append four zeroes.

Manually set the next OID.

There is no comparably easy way to determine a next OID that's beyond the largest one in the database, but fortunately it is not critical to get the next-OID setting right.

Manually set the next multitransaction offset.

A safe value can be determined by looking for the numerically largest file name in the directory pg_multixact/members under the data directory, adding one, and then multiplying by 52352 (0xCC80). The file names are in hexadecimal. There is no simple recipe such as the ones for other options of appending zeroes.

Manually set the oldest unfrozen transaction ID.

A safe value can be determined by looking for the numerically smallest file name in the directory pg_xact under the data directory and then multiplying by 1048576 (0x100000). Note that the file names are in hexadecimal. It is usually easiest to specify the option value in hexadecimal too. For example, if 0007 is the smallest entry in pg_xact, -u 0x700000 will work (five trailing zeroes provide the proper multiplier).

Manually set the next transaction ID.

A safe value can be determined by looking for the numerically largest file name in the directory pg_xact under the data directory, adding one, and then multiplying by 1048576 (0x100000). Note that the file names are in hexadecimal. It is usually easiest to specify the option value in hexadecimal too. For example, if 0011 is the largest entry in pg_xact, -x 0x1200000 will work (five trailing zeroes provide the proper multiplier).

Manually set the default char signedness. Possible values are signed and unsigned.

For a database cluster that pg_upgrade upgraded from a PostgreSQL version before 18, the safe value would be the default char signedness of the platform that ran the cluster before that upgrade. For all other clusters, signed would be the safe value. However, this option is exclusively for use with pg_upgrade and should not normally be used manually.

Set the new WAL segment size, in megabytes. The value must be set to a power of 2 between 1 and 1024 (megabytes). See the same option of initdb for more information.

This option can also be used to change the WAL segment size of an existing database cluster, avoiding the need to re-initdb.

While pg_resetwal will set the WAL starting address beyond the latest existing WAL segment file, some segment size changes can cause previous WAL file names to be reused. It is recommended to use -l together with this option to manually set the WAL starting address if WAL file name overlap will cause problems with your archiving strategy.

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

This command must not be used when the server is running. pg_resetwal will refuse to start up if it finds a server lock file in the data directory. If the server crashed then a lock file might have been left behind; in that case you can remove the lock file to allow pg_resetwal to run. But before you do so, make doubly certain that there is no server process still alive.

pg_resetwal works only with servers of the same major version.

**Examples:**

Example 1 (unknown):
```unknown
pg_resetwal
```

Example 2 (unknown):
```unknown
pg_resetwal
```

Example 3 (unknown):
```unknown
--wal-segsize
```

Example 4 (unknown):
```unknown
pg_resetwal
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-ecpg.html

**Contents:**
- ecpg
- Synopsis
- Description
- Options
- Notes
- Examples

ecpg — embedded SQL C preprocessor

ecpg [option...] file...

ecpg is the embedded SQL preprocessor for C programs. It converts C programs with embedded SQL statements to normal C code by replacing the SQL invocations with special function calls. The output files can then be processed with any C compiler tool chain.

ecpg will convert each input file given on the command line to the corresponding C output file. If an input file name does not have any extension, .pgc is assumed. The file's extension will be replaced by .c to construct the output file name. But the output file name can be overridden using the -o option.

If an input file name is just -, ecpg reads the program from standard input (and writes to standard output, unless that is overridden with -o).

This reference page does not describe the embedded SQL language. See Chapter 34 for more information on that topic.

ecpg accepts the following command-line arguments:

Automatically generate certain C code from SQL code. Currently, this works for EXEC SQL TYPE.

Set a compatibility mode. mode can be INFORMIX, INFORMIX_SE, or ORACLE.

Define a preprocessor symbol, equivalently to the EXEC SQL DEFINE directive. If no value is specified, the symbol is defined with the value 1.

Process header files. When this option is specified, the output file extension becomes .h not .c, and the default input file extension is .pgh not .pgc. Also, the -c option is forced on.

Parse system include files as well.

Specify an additional include path, used to find files included via EXEC SQL INCLUDE. Defaults are . (current directory), /usr/local/include, the PostgreSQL include directory which is defined at compile time (default: /usr/local/pgsql/include), and /usr/include, in that order.

Specifies that ecpg should write all its output to the given filename. Write -o - to send all output to standard output.

Selects run-time behavior. Option can be one of the following:

Do not use indicators but instead use special values to represent null values. Historically there have been databases using this approach.

Prepare all statements before using them. Libecpg will keep a cache of prepared statements and reuse a statement if it gets executed again. If the cache runs full, libecpg will free the least used statement.

Allow question mark as placeholder for compatibility reasons. This used to be the default long ago.

Turn on autocommit of transactions. In this mode, each SQL command is automatically committed unless it is inside an explicit transaction block. In the default mode, commands are committed only when EXEC SQL COMMIT is issued.

Print additional information including the version and the "include" path.

Print the ecpg version and exit.

Show help about ecpg command line arguments, and exit.

When compiling the preprocessed C code files, the compiler needs to be able to find the ECPG header files in the PostgreSQL include directory. Therefore, you might have to use the -I option when invoking the compiler (e.g., -I/usr/local/pgsql/include).

Programs using C code with embedded SQL have to be linked against the libecpg library, for example using the linker options -L/usr/local/pgsql/lib -lecpg.

The value of either of these directories that is appropriate for the installation can be found out using pg_config.

If you have an embedded SQL C source file named prog1.pgc, you can create an executable program using the following sequence of commands:

**Examples:**

Example 1 (unknown):
```unknown
EXEC SQL TYPE
```

Example 2 (unknown):
```unknown
INFORMIX_SE
```

Example 3 (unknown):
```unknown
-D symbol[=value]
```

Example 4 (unknown):
```unknown
EXEC SQL DEFINE
```

---


---

