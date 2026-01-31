# PostgreSQL - Misc (Part 7)

## 


**URL:** https://www.postgresql.org/docs/18/pgarchivecleanup.html

**Contents:**
- pg_archivecleanup
- Synopsis
- Description
- Options
- Environment
- Notes
- Examples

pg_archivecleanup — clean up PostgreSQL WAL archive files

pg_archivecleanup [option...] archivelocation oldestkeptwalfile

pg_archivecleanup is designed to be used as an archive_cleanup_command to clean up WAL file archives when running as a standby server (see Section 26.2). pg_archivecleanup can also be used as a standalone program to clean WAL file archives.

To configure a standby server to use pg_archivecleanup, put this into its postgresql.conf configuration file:

where archivelocation is the directory from which WAL segment files should be removed.

When used within archive_cleanup_command, all WAL files logically preceding the value of the %r argument will be removed from archivelocation. This minimizes the number of files that need to be retained, while preserving crash-restart capability. Use of this parameter is appropriate if the archivelocation is a transient staging area for this particular standby server, but not when the archivelocation is intended as a long-term WAL archive area, or when multiple standby servers are recovering from the same archive location.

When used as a standalone program all WAL files logically preceding the oldestkeptwalfile will be removed from archivelocation. In this mode, if you specify a .partial or .backup file name, then only the file prefix will be used as the oldestkeptwalfile. This treatment of .backup file name allows you to remove all WAL files archived prior to a specific base backup without error. For example, the following example will remove all files older than WAL file name 000000010000003700000010:

pg_archivecleanup assumes that archivelocation is a directory readable and writable by the server-owning user.

pg_archivecleanup accepts the following command-line arguments:

Remove backup history files as well. See Section 25.3.2 for details about backup history files.

Print lots of debug logging output on stderr.

Print the names of the files that would have been removed on stdout (performs a dry run).

Print the pg_archivecleanup version and exit.

Provide an extension that will be stripped from all file names before deciding if they should be deleted. This is typically useful for cleaning up archives that have been compressed during storage, and therefore have had an extension added by the compression program. For example: -x .gz.

Show help about pg_archivecleanup command line arguments, and exit.

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

pg_archivecleanup is designed to work with PostgreSQL 8.0 and later when used as a standalone utility, or with PostgreSQL 9.0 and later when used as an archive cleanup command.

pg_archivecleanup is written in C and has an easy-to-modify source code, with specifically designated sections to modify for your own needs

On Linux or Unix systems, you might use:

where the archive directory is physically located on the standby server, so that the archive_command is accessing it across NFS, but the files are local to the standby. This will:

produce debugging output in cleanup.log

remove no-longer-needed files from the archive directory

**Examples:**

Example 1 (unknown):
```unknown
pg_archivecleanup
```

Example 2 (unknown):
```unknown
archivelocation
```

Example 3 (unknown):
```unknown
oldestkeptwalfile
```

Example 4 (unknown):
```unknown
archive_cleanup_command
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-result-code-string.html

**Contents:**
- SPI_result_code_string
- Synopsis
- Description
- Arguments
- Return Value

SPI_result_code_string — return error code as string

SPI_result_code_string returns a string representation of the result code returned by various SPI functions or stored in SPI_result.

A string representation of the result code.

**Examples:**

Example 1 (unknown):
```unknown
SPI_result_code_string
```

---


---

