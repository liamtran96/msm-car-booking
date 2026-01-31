# PostgreSQL - Appendix Release Notes (Part 2)

## E.2. Release 18 #


**URL:** https://www.postgresql.org/docs/18/release-18.html

**Contents:**
- E.2. Release 18 #
  - E.2.1. Overview #
  - E.2.2. Migration to Version 18 #
  - E.2.3. Changes #
    - E.2.3.1. Server #
      - E.2.3.1.1. Optimizer #
      - E.2.3.1.2. Indexes #
      - E.2.3.1.3. General Performance #
      - E.2.3.1.4. Monitoring #
      - E.2.3.1.5. Privileges #

Release date: 2025-09-25

PostgreSQL 18 contains many new features and enhancements, including:

An asynchronous I/O (AIO) subsystem that can improve performance of sequential scans, bitmap heap scans, vacuums, and other operations.

pg_upgrade now retains optimizer statistics.

Support for "skip scan" lookups that allow using multicolumn B-tree indexes in more cases.

uuidv7() function for generating timestamp-ordered UUIDs.

Virtual generated columns that compute their values during read operations. This is now the default for generated columns.

OAuth authentication support.

OLD and NEW support for RETURNING clauses in INSERT, UPDATE, DELETE, and MERGE commands.

Temporal constraints, or constraints over ranges, for PRIMARY KEY, UNIQUE, and FOREIGN KEY constraints.

The above items and other new features of PostgreSQL 18 are explained in more detail in the sections below.

A dump/restore using pg_dumpall or use of pg_upgrade or logical replication is required for those wishing to migrate data from any previous release. See Section 18.6 for general information on migrating to new major releases.

Version 18 contains a number of changes that may affect compatibility with previous releases. Observe the following incompatibilities:

Change initdb default to enable data checksums (Greg Sabino Mullane) §

Checksums can be disabled with the new initdb option --no-data-checksums. pg_upgrade requires matching cluster checksum settings, so this new option can be useful to upgrade non-checksum old clusters.

Change time zone abbreviation handling (Tom Lane) §

The system will now favor the current session's time zone abbreviations before checking the server variable timezone_abbreviations. Previously timezone_abbreviations was checked first.

Deprecate MD5 password authentication (Nathan Bossart) §

Support for MD5 passwords will be removed in a future major version release. CREATE ROLE and ALTER ROLE now emit deprecation warnings when setting MD5 passwords. These warnings can be disabled by setting the md5_password_warnings parameter to off.

Change VACUUM and ANALYZE to process the inheritance children of a parent (Michael Harris) §

The previous behavior can be performed by using the new ONLY option.

Prevent COPY FROM from treating \. as an end-of-file marker when reading CSV files (Daniel Vérité, Tom Lane) § §

psql will still treat \. as an end-of-file marker when reading CSV files from STDIN. Older psql clients connecting to PostgreSQL 18 servers might experience \copy problems. This release also enforces that \. must appear alone on a line.

Disallow unlogged partitioned tables (Michael Paquier) §

Previously ALTER TABLE SET [UN]LOGGED did nothing, and the creation of an unlogged partitioned table did not cause its children to be unlogged.

Execute AFTER triggers as the role that was active when trigger events were queued (Laurenz Albe) §

Previously such triggers were run as the role that was active at trigger execution time (e.g., at COMMIT). This is significant for cases where the role is changed between queue time and transaction commit.

Remove non-functional support for rule privileges in GRANT/REVOKE (Fujii Masao) §

These have been non-functional since PostgreSQL 8.2.

Remove column pg_backend_memory_contexts.parent (Melih Mutlu) §

This is no longer needed since pg_backend_memory_contexts.path was added.

Change pg_backend_memory_contexts.level and pg_log_backend_memory_contexts() to be one-based (Melih Mutlu, Atsushi Torikoshi, David Rowley, Fujii Masao) § § §

These were previously zero-based.

Change full text search to use the default collation provider of the cluster to read configuration files and dictionaries, rather than always using libc (Peter Eisentraut) §

Clusters that default to non-libc collation providers (e.g., ICU, builtin) that behave differently than libc for characters processed by LC_CTYPE could observe changes in behavior of some full-text search functions, as well as the pg_trgm extension. When upgrading such clusters using pg_upgrade, it is recommended to reindex all indexes related to full-text search and pg_trgm after the upgrade.

Below you will find a detailed account of the changes between PostgreSQL 18 and the previous major release.

Automatically remove some unnecessary table self-joins (Andrey Lepikhov, Alexander Kuzmenkov, Alexander Korotkov, Alena Rybakina) §

This optimization can be disabled using server variable enable_self_join_elimination.

Convert some IN (VALUES ...) to x = ANY ... for better optimizer statistics (Alena Rybakina, Andrei Lepikhov) §

Allow transforming OR-clauses to arrays for faster index processing (Alexander Korotkov, Andrey Lepikhov) §

Speed up the processing of INTERSECT, EXCEPT, window aggregates, and view column aliases (Tom Lane, David Rowley) § § § §

Allow the keys of SELECT DISTINCT to be internally reordered to avoid sorting (Richard Guo) §

This optimization can be disabled using enable_distinct_reordering.

Ignore GROUP BY columns that are functionally dependent on other columns (Zhang Mingli, Jian He, David Rowley) §

If a GROUP BY clause includes all columns of a unique index, as well as other columns of the same table, those other columns are redundant and can be dropped from the grouping. This was already true for non-deferred primary keys.

Allow some HAVING clauses on GROUPING SETS to be pushed to WHERE clauses (Richard Guo) § § § §

This allows earlier row filtering. This release also fixes some GROUPING SETS queries that used to return incorrect results.

Improve row estimates for generate_series() using numeric and timestamp values (David Rowley, Song Jinzhou) § §

Allow the optimizer to use Right Semi Join plans (Richard Guo) §

Semi-joins are used when needing to find if there is at least one match.

Allow merge joins to use incremental sorts (Richard Guo) §

Improve the efficiency of planning queries accessing many partitions (Ashutosh Bapat, Yuya Watari, David Rowley) § §

Allow partitionwise joins in more cases, and reduce its memory usage (Richard Guo, Tom Lane, Ashutosh Bapat) § §

Improve cost estimates of partition queries (Nikita Malakhov, Andrei Lepikhov) §

Improve SQL-language function plan caching (Alexander Pyhalov, Tom Lane) § §

Improve handling of disabled optimizer features (Robert Haas) §

Allow skip scans of btree indexes (Peter Geoghegan) § §

This allows multi-column btree indexes to be used in more cases such as when there are no restrictions on the first or early indexed columns (or there are non-equality ones), and there are useful restrictions on later indexed columns.

Allow non-btree unique indexes to be used as partition keys and in materialized views (Mark Dilger) § §

The index type must still support equality.

Allow GIN indexes to be created in parallel (Tomas Vondra, Matthias van de Meent) §

Allow values to be sorted to speed range-type GiST and btree index builds (Bernd Helmle) §

Add an asynchronous I/O subsystem (Andres Freund, Thomas Munro, Nazir Bilal Yavuz, Melanie Plageman) § § § § § § § § § § §

This feature allows backends to queue multiple read requests, which allows for more efficient sequential scans, bitmap heap scans, vacuums, etc. This is enabled by server variable io_method, with server variables io_combine_limit and io_max_combine_limit added to control it. This also enables effective_io_concurrency and maintenance_io_concurrency values greater than zero for systems without fadvise() support. The new system view pg_aios shows the file handles being used for asynchronous I/O.

Improve the locking performance of queries that access many relations (Tomas Vondra) §

Improve the performance and reduce memory usage of hash joins and GROUP BY (David Rowley, Jeff Davis) § § § § §

This also improves hash set operations used by EXCEPT, and hash lookups of subplan values.

Allow normal vacuums to freeze some pages, even though they are all-visible (Melanie Plageman) § §

This reduces the overhead of later full-relation freezing. The aggressiveness of this can be controlled by server variable and per-table setting vacuum_max_eager_freeze_failure_rate. Previously vacuum never processed all-visible pages until freezing was required.

Add server variable vacuum_truncate to control file truncation during VACUUM (Nathan Bossart, Gurjeet Singh) §

A storage-level parameter with the same name and behavior already existed.

Increase server variables effective_io_concurrency's and maintenance_io_concurrency's default values to 16 (Melanie Plageman) § §

This more accurately reflects modern hardware.

Increase the logging granularity of server variable log_connections (Melanie Plageman) §

This server variable was previously only boolean, which is still supported.

Add log_connections option to report the duration of connection stages (Melanie Plageman) §

Add log_line_prefix escape %L to output the client IP address (Greg Sabino Mullane) §

Add server variable log_lock_failures to log lock acquisition failures (Yuki Seino, Fujii Masao) § §

Specifically it reports SELECT ... NOWAIT lock failures.

Modify pg_stat_all_tables and its variants to report the time spent in VACUUM, ANALYZE, and their automatic variants (Sami Imseih) §

The new columns are total_vacuum_time, total_autovacuum_time, total_analyze_time, and total_autoanalyze_time.

Add delay time reporting to VACUUM and ANALYZE (Bertrand Drouvot, Nathan Bossart) § §

This information appears in the server log, the system views pg_stat_progress_vacuum and pg_stat_progress_analyze, and the output of VACUUM and ANALYZE when in VERBOSE mode; tracking must be enabled with the server variable track_cost_delay_timing.

Add WAL, CPU, and average read statistics output to ANALYZE VERBOSE (Anthonin Bonnefoy) § §

Add full WAL buffer count to VACUUM/ANALYZE (VERBOSE) and autovacuum log output (Bertrand Drouvot) §

Add per-backend I/O statistics reporting (Bertrand Drouvot) § §

The statistics are accessed via pg_stat_get_backend_io(). Per-backend I/O statistics can be cleared via pg_stat_reset_backend_stats().

Add pg_stat_io columns to report I/O activity in bytes (Nazir Bilal Yavuz) §

The new columns are read_bytes, write_bytes, and extend_bytes. The op_bytes column, which always equaled BLCKSZ, has been removed.

Add WAL I/O activity rows to pg_stat_io (Nazir Bilal Yavuz, Bertrand Drouvot, Michael Paquier) § § §

This includes WAL receiver activity and a wait event for such writes.

Change server variable track_wal_io_timing to control tracking WAL timing in pg_stat_io instead of pg_stat_wal (Bertrand Drouvot) §

Remove read/sync columns from pg_stat_wal (Bertrand Drouvot) § §

This removes columns wal_write, wal_sync, wal_write_time, and wal_sync_time.

Add function pg_stat_get_backend_wal() to return per-backend WAL statistics (Bertrand Drouvot) §

Per-backend WAL statistics can be cleared via pg_stat_reset_backend_stats().

Add function pg_ls_summariesdir() to specifically list the contents of PGDATA/pg_wal/summaries (Yushi Ogiwara) §

Add column pg_stat_checkpointer.num_done to report the number of completed checkpoints (Anton A. Melnikov) §

Columns num_timed and num_requested count both completed and skipped checkpoints.

Add column pg_stat_checkpointer.slru_written to report SLRU buffers written (Nitin Jadhav) §

Also, modify the checkpoint server log message to report separate shared buffer and SLRU buffer values.

Add columns to pg_stat_database to report parallel worker activity (Benoit Lobréau) §

The new columns are parallel_workers_to_launch and parallel_workers_launched.

Have query id computation of constant lists consider only the first and last constants (Dmitry Dolgov, Sami Imseih) § § §

Jumbling is used by pg_stat_statements.

Adjust query id computations to group together queries using the same relation name (Michael Paquier, Sami Imseih) §

This is true even if the tables in different schemas have different column names.

Add column pg_backend_memory_contexts.type to report the type of memory context (David Rowley) §

Add column pg_backend_memory_contexts.path to show memory context parents (Melih Mutlu) §

Add function pg_get_acl() to retrieve database access control details (Joel Jacobson) § §

Add function has_largeobject_privilege() to check large object privileges (Yugo Nagata) §

Allow ALTER DEFAULT PRIVILEGES to define large object default privileges (Takatsuka Haruka, Yugo Nagata, Laurenz Albe) §

Add predefined role pg_signal_autovacuum_worker (Kirill Reshke) §

This allows sending signals to autovacuum workers.

Add support for the OAuth authentication method (Jacob Champion, Daniel Gustafsson, Thomas Munro) §

This adds an oauth authentication method to pg_hba.conf, libpq OAuth options, a server variable oauth_validator_libraries to load token validation libraries, and a configure flag --with-libcurl to add the required compile-time libraries.

Add server variable ssl_tls13_ciphers to allow specification of multiple colon-separated TLSv1.3 cipher suites (Erica Zhang, Daniel Gustafsson) §

Change server variable ssl_groups's default to include elliptic curve X25519 (Daniel Gustafsson, Jacob Champion) §

Rename server variable ssl_ecdh_curve to ssl_groups and allow multiple colon-separated ECDH curves to be specified (Erica Zhang, Daniel Gustafsson) §

The previous name still works.

Make cancel request keys 256 bits (Heikki Linnakangas, Jelte Fennema-Nio) § §

This is only possible when the server and client support wire protocol version 3.2, introduced in this release.

Add server variable autovacuum_worker_slots to specify the maximum number of background workers (Nathan Bossart) §

With this variable set, autovacuum_max_workers can be adjusted at runtime up to this maximum without a server restart.

Allow specification of the fixed number of dead tuples that will trigger an autovacuum (Nathan Bossart, Frédéric Yhuel) §

The server variable is autovacuum_vacuum_max_threshold. Percentages are still used for triggering.

Change server variable max_files_per_process to limit only files opened by a backend (Andres Freund) §

Previously files opened by the postmaster were also counted toward this limit.

Add server variable num_os_semaphores to report the required number of semaphores (Nathan Bossart) §

This is useful for operating system configuration.

Add server variable extension_control_path to specify the location of extension control files (Peter Eisentraut, Matheus Alcantara) § §

Allow inactive replication slots to be automatically invalidated using server variable idle_replication_slot_timeout (Nisha Moond, Bharath Rupireddy) §

Add server variable max_active_replication_origins to control the maximum active replication origins (Euler Taveira) §

This was previously controlled by max_replication_slots, but this new setting allows a higher origin count in cases where fewer slots are required.

Allow the values of generated columns to be logically replicated (Shubham Khanna, Vignesh C, Zhijie Hou, Shlok Kyal, Peter Smith) § § § §

If the publication specifies a column list, all specified columns, generated and non-generated, are published. Without a specified column list, publication option publish_generated_columns controls whether generated columns are published. Previously generated columns were not replicated and the subscriber had to compute the values if possible; this is particularly useful for non-PostgreSQL subscribers which lack such a capability.

Change the default CREATE SUBSCRIPTION streaming option from off to parallel (Vignesh C) §

Allow ALTER SUBSCRIPTION to change the replication slot's two-phase commit behavior (Hayato Kuroda, Ajin Cherian, Amit Kapila, Zhijie Hou) § §

Log conflicts while applying logical replication changes (Zhijie Hou, Nisha Moond) § § § § §

Also report in new columns of pg_stat_subscription_stats.

Allow generated columns to be virtual, and make them the default (Peter Eisentraut, Jian He, Richard Guo, Dean Rasheed) § § §

Virtual generated columns generate their values when the columns are read, not written. The write behavior can still be specified via the STORED option.

Add OLD/NEW support to RETURNING in DML queries (Dean Rasheed) §

Previously RETURNING only returned new values for INSERT and UPDATE, and old values for DELETE; MERGE would return the appropriate value for the internal query executed. This new syntax allows the RETURNING list of INSERT/UPDATE/DELETE/MERGE to explicitly return old and new values by using the special aliases old and new. These aliases can be renamed to avoid identifier conflicts.

Allow foreign tables to be created like existing local tables (Zhang Mingli) §

The syntax is CREATE FOREIGN TABLE ... LIKE.

Allow LIKE with nondeterministic collations (Peter Eisentraut) §

Allow text position search functions with nondeterministic collations (Peter Eisentraut) §

These used to generate an error.

Add builtin collation provider PG_UNICODE_FAST (Jeff Davis) §

This locale supports case mapping, but sorts in code point order, not natural language order.

Allow VACUUM and ANALYZE to process partitioned tables without processing their children (Michael Harris) §

This is enabled with the new ONLY option. This is useful since autovacuum does not process partitioned tables, just its children.

Add functions to modify per-relation and per-column optimizer statistics (Corey Huinker) § § §

The functions are pg_restore_relation_stats(), pg_restore_attribute_stats(), pg_clear_relation_stats(), and pg_clear_attribute_stats().

Add server variable file_copy_method to control the file copying method (Nazir Bilal Yavuz) §

This controls whether CREATE DATABASE ... STRATEGY=FILE_COPY and ALTER DATABASE ... SET TABLESPACE uses file copy or clone.

Allow the specification of non-overlapping PRIMARY KEY, UNIQUE, and foreign key constraints (Paul A. Jungwirth) § §

This is specified by WITHOUT OVERLAPS for PRIMARY KEY and UNIQUE, and by PERIOD for foreign keys, all applied to the last specified column.

Allow CHECK and foreign key constraints to be specified as NOT ENFORCED (Amul Sul) § §

This also adds column pg_constraint.conenforced.

Require primary/foreign key relationships to use either deterministic collations or the the same nondeterministic collations (Peter Eisentraut) §

The restore of a pg_dump, also used by pg_upgrade, will fail if these requirements are not met; schema changes must be made for these upgrade methods to succeed.

Store column NOT NULL specifications in pg_constraint (Álvaro Herrera, Bernd Helmle) § §

This allows names to be specified for NOT NULL constraint. This also adds NOT NULL constraints to foreign tables and NOT NULL inheritance control to local tables.

Allow ALTER TABLE to set the NOT VALID attribute of NOT NULL constraints (Rushabh Lathia, Jian He) §

Allow modification of the inheritability of NOT NULL constraints (Suraj Kharage, Álvaro Herrera) § §

The syntax is ALTER TABLE ... ALTER CONSTRAINT ... [NO] INHERIT.

Allow NOT VALID foreign key constraints on partitioned tables (Amul Sul) §

Allow dropping of constraints ONLY on partitioned tables (Álvaro Herrera) §

This was previously erroneously prohibited.

Add REJECT_LIMIT to control the number of invalid rows COPY FROM can ignore (Atsushi Torikoshi) §

This is available when ON_ERROR = 'ignore'.

Allow COPY TO to copy rows from populated materialized views (Jian He) §

Add COPY LOG_VERBOSITY level silent to suppress log output of ignored rows (Atsushi Torikoshi) §

This new level suppresses output for discarded input rows when on_error = 'ignore'.

Disallow COPY FREEZE on foreign tables (Nathan Bossart) §

Previously, the COPY worked but the FREEZE was ignored, so disallow this command.

Automatically include BUFFERS output in EXPLAIN ANALYZE (Guillaume Lelarge, David Rowley) §


*(continued...)*
---

