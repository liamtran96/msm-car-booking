# PostgreSQL - Functions (Part 25)

## 9.28. System Administration Functions # (continued)
Computes the disk space used by the specified table, excluding indexes (but including its TOAST table if any, free space map, and visibility map).

pg_tablespace_size ( name ) → bigint

pg_tablespace_size ( oid ) → bigint

Computes the total disk space used in the tablespace with the specified name or OID. To use this function, you must have CREATE privilege on the specified tablespace or have privileges of the pg_read_all_stats role, unless it is the default tablespace for the current database.

pg_total_relation_size ( regclass ) → bigint

Computes the total disk space used by the specified table, including all indexes and TOAST data. The result is equivalent to pg_table_size + pg_indexes_size.

The functions above that operate on tables or indexes accept a regclass argument, which is simply the OID of the table or index in the pg_class system catalog. You do not have to look up the OID by hand, however, since the regclass data type's input converter will do the work for you. See Section 8.19 for details.

The functions shown in Table 9.103 assist in identifying the specific disk files associated with database objects.

Table 9.103. Database Object Location Functions

pg_relation_filenode ( relation regclass ) → oid

Returns the “filenode” number currently assigned to the specified relation. The filenode is the base component of the file name(s) used for the relation (see Section 66.1 for more information). For most relations the result is the same as pg_class.relfilenode, but for certain system catalogs relfilenode is zero and this function must be used to get the correct value. The function returns NULL if passed a relation that does not have storage, such as a view.

pg_relation_filepath ( relation regclass ) → text

Returns the entire file path name (relative to the database cluster's data directory, PGDATA) of the relation.

pg_filenode_relation ( tablespace oid, filenode oid ) → regclass

Returns a relation's OID given the tablespace OID and filenode it is stored under. This is essentially the inverse mapping of pg_relation_filepath. For a relation in the database's default tablespace, the tablespace can be specified as zero. Returns NULL if no relation in the current database is associated with the given values, or if dealing with a temporary relation.

Table 9.104 lists functions used to manage collations.

Table 9.104. Collation Management Functions

pg_collation_actual_version ( oid ) → text

Returns the actual version of the collation object as it is currently installed in the operating system. If this is different from the value in pg_collation.collversion, then objects depending on the collation might need to be rebuilt. See also ALTER COLLATION.

pg_database_collation_actual_version ( oid ) → text

Returns the actual version of the database's collation as it is currently installed in the operating system. If this is different from the value in pg_database.datcollversion, then objects depending on the collation might need to be rebuilt. See also ALTER DATABASE.

pg_import_system_collations ( schema regnamespace ) → integer

Adds collations to the system catalog pg_collation based on all the locales it finds in the operating system. This is what initdb uses; see Section 23.2.2 for more details. If additional locales are installed into the operating system later on, this function can be run again to add collations for the new locales. Locales that match existing entries in pg_collation will be skipped. (But collation objects based on locales that are no longer present in the operating system are not removed by this function.) The schema parameter would typically be pg_catalog, but that is not a requirement; the collations could be installed into some other schema as well. The function returns the number of new collation objects it created. Use of this function is restricted to superusers.

Table 9.105 lists functions used to manipulate statistics. These functions cannot be executed during recovery.

Changes made by these statistics manipulation functions are likely to be overwritten by autovacuum (or manual VACUUM or ANALYZE) and should be considered temporary.

Table 9.105. Database Object Statistics Manipulation Functions

pg_restore_relation_stats ( VARIADIC kwargs "any" ) → boolean

Updates table-level statistics. Ordinarily, these statistics are collected automatically or updated as a part of VACUUM or ANALYZE, so it's not necessary to call this function. However, it is useful after a restore to enable the optimizer to choose better plans if ANALYZE has not been run yet.

The tracked statistics may change from version to version, so arguments are passed as pairs of argname and argvalue in the form:

For example, to set the relpages and reltuples values for the table mytable:

The arguments schemaname and relname are required, and specify the table. Other arguments are the names and values of statistics corresponding to certain columns in pg_class. The currently-supported relation statistics are relpages with a value of type integer, reltuples with a value of type real, relallvisible with a value of type integer, and relallfrozen with a value of type integer.

Additionally, this function accepts argument name version of type integer, which specifies the server version from which the statistics originated. This is anticipated to be helpful in porting statistics from older versions of PostgreSQL.

Minor errors are reported as a WARNING and ignored, and remaining statistics will still be restored. If all specified statistics are successfully restored, returns true, otherwise false.

The caller must have the MAINTAIN privilege on the table or be the owner of the database.

pg_clear_relation_stats ( schemaname text, relname text ) → void

Clears table-level statistics for the given relation, as though the table was newly created.

The caller must have the MAINTAIN privilege on the table or be the owner of the database.

pg_restore_attribute_stats ( VARIADIC kwargs "any" ) → boolean

Creates or updates column-level statistics. Ordinarily, these statistics are collected automatically or updated as a part of VACUUM or ANALYZE, so it's not necessary to call this function. However, it is useful after a restore to enable the optimizer to choose better plans if ANALYZE has not been run yet.

The tracked statistics may change from version to version, so arguments are passed as pairs of argname and argvalue in the form:

For example, to set the avg_width and null_frac values for the attribute col1 of the table mytable:

The required arguments are schemaname and relname with a value of type text which specify the table; either attname with a value of type text or attnum with a value of type smallint, which specifies the column; and inherited, which specifies whether the statistics include values from child tables. Other arguments are the names and values of statistics corresponding to columns in pg_stats.

Additionally, this function accepts argument name version of type integer, which specifies the server version from which the statistics originated. This is anticipated to be helpful in porting statistics from older versions of PostgreSQL.

Minor errors are reported as a WARNING and ignored, and remaining statistics will still be restored. If all specified statistics are successfully restored, returns true, otherwise false.

The caller must have the MAINTAIN privilege on the table or be the owner of the database.

pg_clear_attribute_stats ( schemaname text, relname text, attname text, inherited boolean ) → void

Clears column-level statistics for the given relation and attribute, as though the table was newly created.

The caller must have the MAINTAIN privilege on the table or be the owner of the database.

Table 9.106 lists functions that provide information about the structure of partitioned tables.

Table 9.106. Partitioning Information Functions

pg_partition_tree ( regclass ) → setof record ( relid regclass, parentrelid regclass, isleaf boolean, level integer )

Lists the tables or indexes in the partition tree of the given partitioned table or partitioned index, with one row for each partition. Information provided includes the OID of the partition, the OID of its immediate parent, a boolean value telling if the partition is a leaf, and an integer telling its level in the hierarchy. The level value is 0 for the input table or index, 1 for its immediate child partitions, 2 for their partitions, and so on. Returns no rows if the relation does not exist or is not a partition or partitioned table.

pg_partition_ancestors ( regclass ) → setof regclass

Lists the ancestor relations of the given partition, including the relation itself. Returns no rows if the relation does not exist or is not a partition or partitioned table.

pg_partition_root ( regclass ) → regclass

Returns the top-most parent of the partition tree to which the given relation belongs. Returns NULL if the relation does not exist or is not a partition or partitioned table.

For example, to check the total size of the data contained in a partitioned table measurement, one could use the following query:

Table 9.107 shows the functions available for index maintenance tasks. (Note that these maintenance tasks are normally done automatically by autovacuum; use of these functions is only required in special cases.) These functions cannot be executed during recovery. Use of these functions is restricted to superusers and the owner of the given index.

Table 9.107. Index Maintenance Functions

brin_summarize_new_values ( index regclass ) → integer

Scans the specified BRIN index to find page ranges in the base table that are not currently summarized by the index; for any such range it creates a new summary index tuple by scanning those table pages. Returns the number of new page range summaries that were inserted into the index.

brin_summarize_range ( index regclass, blockNumber bigint ) → integer

Summarizes the page range covering the given block, if not already summarized. This is like brin_summarize_new_values except that it only processes the page range that covers the given table block number.

brin_desummarize_range ( index regclass, blockNumber bigint ) → void

Removes the BRIN index tuple that summarizes the page range covering the given table block, if there is one.

gin_clean_pending_list ( index regclass ) → bigint

Cleans up the “pending” list of the specified GIN index by moving entries in it, in bulk, to the main GIN data structure. Returns the number of pages removed from the pending list. If the argument is a GIN index built with the fastupdate option disabled, no cleanup happens and the result is zero, because the index doesn't have a pending list. See Section 65.4.4.1 and Section 65.4.5 for details about the pending list and fastupdate option.

The functions shown in Table 9.108 provide native access to files on the machine hosting the server. Only files within the database cluster directory and the log_directory can be accessed, unless the user is a superuser or is granted the role pg_read_server_files. Use a relative path for files in the cluster directory, and a path matching the log_directory configuration setting for log files.

Note that granting users the EXECUTE privilege on pg_read_file(), or related functions, allows them the ability to read any file on the server that the database server process can read; these functions bypass all in-database privilege checks. This means that, for example, a user with such access is able to read the contents of the pg_authid table where authentication information is stored, as well as read any table data in the database. Therefore, granting access to these functions should be carefully considered.

When granting privilege on these functions, note that the table entries showing optional parameters are mostly implemented as several physical functions with different parameter lists. Privilege must be granted separately on each such function, if it is to be used. psql's \df command can be useful to check what the actual function signatures are.

Some of these functions take an optional missing_ok parameter, which specifies the behavior when the file or directory does not exist. If true, the function returns NULL or an empty result set, as appropriate. If false, an error is raised. (Failure conditions other than “file not found” are reported as errors in any case.) The default is false.

Table 9.108. Generic File Access Functions

pg_ls_dir ( dirname text [, missing_ok boolean, include_dot_dirs boolean ] ) → setof text

Returns the names of all files (and directories and other special files) in the specified directory. The include_dot_dirs parameter indicates whether “.” and “..” are to be included in the result set; the default is to exclude them. Including them can be useful when missing_ok is true, to distinguish an empty directory from a non-existent directory.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_ls_logdir () → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's log directory. Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and roles with privileges of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_waldir () → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's write-ahead log (WAL) directory. Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and roles with privileges of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_logicalmapdir () → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's pg_logical/mappings directory. Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and members of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_logicalsnapdir () → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's pg_logical/snapshots directory. Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and members of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_replslotdir ( slot_name text ) → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's pg_replslot/slot_name directory, where slot_name is the name of the replication slot provided as input of the function. Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and members of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_summariesdir () → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's WAL summaries directory (pg_wal/summaries). Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and members of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_archive_statusdir () → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the server's WAL archive status directory (pg_wal/archive_status). Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and members of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_ls_tmpdir ( [ tablespace oid ] ) → setof record ( name text, size bigint, modification timestamp with time zone )

Returns the name, size, and last modification time (mtime) of each ordinary file in the temporary file directory for the specified tablespace. If tablespace is not provided, the pg_default tablespace is examined. Filenames beginning with a dot, directories, and other special files are excluded.

This function is restricted to superusers and members of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_read_file ( filename text [, offset bigint, length bigint ] [, missing_ok boolean ] ) → text

Returns all or part of a text file, starting at the given byte offset, returning at most length bytes (less if the end of file is reached first). If offset is negative, it is relative to the end of the file. If offset and length are omitted, the entire file is returned. The bytes read from the file are interpreted as a string in the database's encoding; an error is thrown if they are not valid in that encoding.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

pg_read_binary_file ( filename text [, offset bigint, length bigint ] [, missing_ok boolean ] ) → bytea

Returns all or part of a file. This function is identical to pg_read_file except that it can read arbitrary binary data, returning the result as bytea not text; accordingly, no encoding checks are performed.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

In combination with the convert_from function, this function can be used to read a text file in a specified encoding and convert to the database's encoding:

pg_stat_file ( filename text [, missing_ok boolean ] ) → record ( size bigint, access timestamp with time zone, modification timestamp with time zone, change timestamp with time zone, creation timestamp with time zone, isdir boolean )

Returns a record containing the file's size, last access time stamp, last modification time stamp, last file status change time stamp (Unix platforms only), file creation time stamp (Windows only), and a flag indicating if it is a directory.

This function is restricted to superusers by default, but other users can be granted EXECUTE to run the function.

The functions shown in Table 9.109 manage advisory locks. For details about proper use of these functions, see Section 13.3.5.

All these functions are intended to be used to lock application-defined resources, which can be identified either by a single 64-bit key value or two 32-bit key values (note that these two key spaces do not overlap). If another session already holds a conflicting lock on the same resource identifier, the functions will either wait until the resource becomes available, or return a false result, as appropriate for the function. Locks can be either shared or exclusive: a shared lock does not conflict with other shared locks on the same resource, only with exclusive locks. Locks can be taken at session level (so that they are held until released or the session ends) or at transaction level (so that they are held until the current transaction ends; there is no provision for manual release). Multiple session-level lock requests stack, so that if the same resource identifier is locked three times there must then be three unlock requests to release the resource in advance of session end.

Table 9.109. Advisory Lock Functions

pg_advisory_lock ( key bigint ) → void

pg_advisory_lock ( key1 integer, key2 integer ) → void

Obtains an exclusive session-level advisory lock, waiting if necessary.

pg_advisory_lock_shared ( key bigint ) → void

pg_advisory_lock_shared ( key1 integer, key2 integer ) → void

Obtains a shared session-level advisory lock, waiting if necessary.

pg_advisory_unlock ( key bigint ) → boolean

pg_advisory_unlock ( key1 integer, key2 integer ) → boolean

Releases a previously-acquired exclusive session-level advisory lock. Returns true if the lock is successfully released. If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server.

pg_advisory_unlock_all () → void

Releases all session-level advisory locks held by the current session. (This function is implicitly invoked at session end, even if the client disconnects ungracefully.)

pg_advisory_unlock_shared ( key bigint ) → boolean

pg_advisory_unlock_shared ( key1 integer, key2 integer ) → boolean

Releases a previously-acquired shared session-level advisory lock. Returns true if the lock is successfully released. If the lock was not held, false is returned, and in addition, an SQL warning will be reported by the server.

pg_advisory_xact_lock ( key bigint ) → void

pg_advisory_xact_lock ( key1 integer, key2 integer ) → void

Obtains an exclusive transaction-level advisory lock, waiting if necessary.

pg_advisory_xact_lock_shared ( key bigint ) → void

pg_advisory_xact_lock_shared ( key1 integer, key2 integer ) → void

Obtains a shared transaction-level advisory lock, waiting if necessary.

pg_try_advisory_lock ( key bigint ) → boolean

pg_try_advisory_lock ( key1 integer, key2 integer ) → boolean

Obtains an exclusive session-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

pg_try_advisory_lock_shared ( key bigint ) → boolean

pg_try_advisory_lock_shared ( key1 integer, key2 integer ) → boolean

Obtains a shared session-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

pg_try_advisory_xact_lock ( key bigint ) → boolean

pg_try_advisory_xact_lock ( key1 integer, key2 integer ) → boolean

Obtains an exclusive transaction-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

pg_try_advisory_xact_lock_shared ( key bigint ) → boolean

pg_try_advisory_xact_lock_shared ( key1 integer, key2 integer ) → boolean

Obtains a shared transaction-level advisory lock if available. This will either obtain the lock immediately and return true, or return false without waiting if the lock cannot be acquired immediately.

**Examples:**

Example 1 (unknown):
```unknown
current_setting
```

Example 2 (unknown):
```unknown
setting_name
```

Example 3 (unknown):
```unknown
setting_name
```

Example 4 (unknown):
```unknown
current_setting
```

---


---

