# PostgreSQL - Misc (Part 17)

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-cursor-open-with-args.html

**Contents:**
- SPI_cursor_open_with_args
- Synopsis
- Description
- Arguments
- Return Value

SPI_cursor_open_with_args — set up a cursor using a query and parameters

SPI_cursor_open_with_args sets up a cursor (internally, a portal) that will execute the specified query. Most of the parameters have the same meanings as the corresponding parameters to SPI_prepare_cursor and SPI_cursor_open.

For one-time query execution, this function should be preferred over SPI_prepare_cursor followed by SPI_cursor_open. If the same command is to be executed with many different parameters, either method might be faster, depending on the cost of re-planning versus the benefit of custom plans.

The passed-in parameter data will be copied into the cursor's portal, so it can be freed while the cursor still exists.

This function is now deprecated in favor of SPI_cursor_parse_open, which provides equivalent functionality using a more modern API for handling query parameters.

name for portal, or NULL to let the system select a name

number of input parameters ($1, $2, etc.)

an array of length nargs, containing the OIDs of the data types of the parameters

an array of length nargs, containing the actual parameter values

an array of length nargs, describing which parameters are null

If nulls is NULL then SPI_cursor_open_with_args assumes that no parameters are null. Otherwise, each entry of the nulls array should be ' ' if the corresponding parameter value is non-null, or 'n' if the corresponding parameter value is null. (In the latter case, the actual value in the corresponding values entry doesn't matter.) Note that nulls is not a text string, just an array: it does not need a '\0' terminator.

true for read-only execution

integer bit mask of cursor options; zero produces default behavior

Pointer to portal containing the cursor. Note there is no error return convention; any error will be reported via elog.

**Examples:**

Example 1 (unknown):
```unknown
cursorOptions
```

Example 2 (unknown):
```unknown
SPI_cursor_open_with_args
```

Example 3 (unknown):
```unknown
SPI_prepare_cursor
```

Example 4 (unknown):
```unknown
SPI_cursor_open
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-getvalue.html

**Contents:**
- SPI_getvalue
- Synopsis
- Description
- Arguments
- Return Value

SPI_getvalue — return the string value of the specified column

SPI_getvalue returns the string representation of the value of the specified column.

The result is returned in memory allocated using palloc. (You can use pfree to release the memory when you don't need it anymore.)

input row to be examined

input row description

column number (count starts at 1)

Column value, or NULL if the column is null, colnumber is out of range (SPI_result is set to SPI_ERROR_NOATTRIBUTE), or no output function is available (SPI_result is set to SPI_ERROR_NOOUTFUNC).

**Examples:**

Example 1 (unknown):
```unknown
SPI_getvalue
```

Example 2 (unknown):
```unknown
HeapTuple row
```

Example 3 (unknown):
```unknown
TupleDesc rowdesc
```

Example 4 (unknown):
```unknown
int colnumber
```

---

---

## 1. What Is PostgreSQL? #


**URL:** https://www.postgresql.org/docs/18/intro-whatis.html

**Contents:**
- 1. What Is PostgreSQL? #

PostgreSQL is an object-relational database management system (ORDBMS) based on POSTGRES, Version 4.2, developed at the University of California at Berkeley Computer Science Department. POSTGRES pioneered many concepts that only became available in some commercial database systems much later.

PostgreSQL is an open-source descendant of this original Berkeley code. It supports a large part of the SQL standard and offers many modern features:

Also, PostgreSQL can be extended by the user in many ways, for example by adding new

And because of the liberal license, PostgreSQL can be used, modified, and distributed by anyone free of charge for any purpose, be it private, commercial, or academic.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-start-transaction.html

**Contents:**
- SPI_start_transaction
- Synopsis
- Description

SPI_start_transaction — obsolete function

SPI_start_transaction does nothing, and exists only for code compatibility with earlier PostgreSQL releases. It used to be required after calling SPI_commit or SPI_rollback, but now those functions start a new transaction automatically.

**Examples:**

Example 1 (unknown):
```unknown
SPI_start_transaction
```

Example 2 (unknown):
```unknown
SPI_rollback
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/pgwaldump.html

**Contents:**
- pg_waldump
- Synopsis
- Description
- Options
- Environment
- Notes
- See Also

pg_waldump — display a human-readable rendering of the write-ahead log of a PostgreSQL database cluster

pg_waldump [option...] [startseg [endseg]]

pg_waldump displays the write-ahead log (WAL) and is mainly useful for debugging or educational purposes.

This utility can only be run by the user who installed the server, because it requires read-only access to the data directory.

The following command-line options control the location and format of the output:

Start reading at the specified WAL segment file. This implicitly determines the path in which files will be searched for, and the timeline to use.

Stop after reading the specified WAL segment file.

Output detailed information about backup blocks.

Only display records that modify the given block. The relation must also be provided with --relation or -R.

Stop reading at the specified WAL location, instead of reading to the end of the log stream.

After reaching the end of valid WAL, keep polling once per second for new WAL to appear.

Only display records that modify blocks in the given fork. The valid values are main for the main fork, fsm for the free space map, vm for the visibility map, and init for the init fork.

Display the specified number of records, then stop.

Specifies a directory to search for WAL segment files or a directory with a pg_wal subdirectory that contains such files. The default is to search in the current directory, the pg_wal subdirectory of the current directory, and the pg_wal subdirectory of PGDATA.

Do not print any output, except for errors. This option can be useful when you want to know whether a range of WAL records can be successfully parsed but don't care about the record contents.

Only display records generated by the specified resource manager. You can specify the option multiple times to select multiple resource managers. If list is passed as name, print a list of valid resource manager names, and exit.

Extensions may define custom resource managers, but pg_waldump does not load the extension module and therefore does not recognize custom resource managers by name. Instead, you can specify the custom resource managers as custom### where ### is the three-digit resource manager ID. Names of this form will always be considered valid.

Only display records that modify blocks in the given relation. The relation is specified with tablespace OID, database OID, and relfilenode separated by slashes, for example 1234/12345/12345. This is the same format used for relations in the program's output.

WAL location at which to start reading. The default is to start reading the first valid WAL record found in the earliest file found.

Timeline from which to read WAL records. The default is to use the value in startseg, if that is specified; otherwise, the default is 1. The value can be specified in decimal or hexadecimal, for example 17 or 0x11.

Print the pg_waldump version and exit.

Only display records that include full page images.

Only display records marked with the given transaction ID.

Display summary statistics (number and size of records and full-page images) instead of individual records. Optionally generate statistics per-record instead of per-rmgr.

If pg_waldump is terminated by signal SIGINT (Control+C), the summary of the statistics computed is displayed up to the termination point. This operation is not supported on Windows.

Save full page images found in the WAL records to the save_path directory. The images saved are subject to the same filtering and limiting criteria as the records displayed.

The full page images are saved with the following file name format: TIMELINE-LSN.RELTABLESPACE.DATOID.RELNODE.BLKNO_FORK The file names are composed of the following parts:

Show help about pg_waldump command line arguments, and exit.

Data directory; see also the -p option.

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

Can give wrong results when the server is running.

Only the specified timeline is displayed (or the default, if none is specified). Records in other timelines are ignored.

pg_waldump cannot read WAL files with suffix .partial. If those files need to be read, .partial suffix needs to be removed from the file name.

**Examples:**

Example 1 (unknown):
```unknown
--bkp-details
```

Example 2 (unknown):
```unknown
--block=block
```

Example 3 (unknown):
```unknown
--fork=fork
```

Example 4 (unknown):
```unknown
--limit=limit
```

---


---

