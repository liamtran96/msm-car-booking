# PostgreSQL - Appendix Release Notes (Part 3)

## E.2. Release 18 # (continued)
Add full WAL buffer count to EXPLAIN (WAL) output (Bertrand Drouvot) §

In EXPLAIN ANALYZE, report the number of index lookups used per index scan node (Peter Geoghegan) §

Modify EXPLAIN to output fractional row counts (Ibrar Ahmed, Ilia Evdokimov, Robert Haas) § §

Add memory and disk usage details to Material, Window Aggregate, and common table expression nodes to EXPLAIN output (David Rowley, Tatsuo Ishii) § § § §

Add details about window function arguments to EXPLAIN output (Tom Lane) §

Add Parallel Bitmap Heap Scan worker cache statistics to EXPLAIN ANALYZE (David Geier, Heikki Linnakangas, Donghang Lin, Alena Rybakina, David Rowley) §

Indicate disabled nodes in EXPLAIN ANALYZE output (Robert Haas, David Rowley, Laurenz Albe) § § §

Improve Unicode full case mapping and conversion (Jeff Davis) § §

This adds the ability to do conditional and title case mapping, and case map single characters to multiple characters.

Allow jsonb null values to be cast to scalar types as NULL (Tom Lane) §

Previously such casts generated an error.

Add optional parameter to json{b}_strip_nulls to allow removal of null array elements (Florents Tselai) §

Add function array_sort() which sorts an array's first dimension (Junwang Zhao, Jian He) §

Add function array_reverse() which reverses an array's first dimension (Aleksander Alekseev) §

Add function reverse() to reverse bytea bytes (Aleksander Alekseev) §

Allow casting between integer types and bytea (Aleksander Alekseev) §

The integer values are stored as bytea two's complement values.

Update Unicode data to Unicode 16.0.0 (Peter Eisentraut) §

Add full text search stemming for Estonian (Tom Lane) §

Improve the XML error codes to more closely match the SQL standard (Tom Lane) §

These errors are reported via SQLSTATE.

Add function casefold() to allow for more sophisticated case-insensitive matching (Jeff Davis) §

This allows more accurate comparisons, i.e., a character can have multiple upper or lower case equivalents, or upper or lower case conversion changes the number of characters.

Allow MIN()/MAX() aggregates on arrays and composite types (Aleksander Alekseev, Marat Buharov) § §

Add a WEEK option to EXTRACT() (Tom Lane) §

Improve the output EXTRACT(QUARTER ...) for negative values (Tom Lane) §

Add roman numeral support to to_number() (Hunaid Sohail) §

This is accessed via the RN pattern.

Add UUID version 7 generation function uuidv7() (Andrey Borodin) §

This UUID value is temporally sortable. Function alias uuidv4() has been added to explicitly generate version 4 UUIDs.

Add functions crc32() and crc32c() to compute CRC values (Aleksander Alekseev) §

Add math functions gamma() and lgamma() (Dean Rasheed) §

Allow => syntax for named cursor arguments in PL/pgSQL (Pavel Stehule) §

We previously only accepted :=.

Allow regexp_match[es]()/regexp_like()/regexp_replace()/regexp_count()/regexp_instr()/regexp_substr()/regexp_split_to_table()/regexp_split_to_array() to use named arguments (Jian He) §

Add function PQfullProtocolVersion() to report the full, including minor, protocol version number (Jacob Champion, Jelte Fennema-Nio) §

Add libpq connection parameters and environment variables to specify the minimum and maximum acceptable protocol version for connections (Jelte Fennema-Nio) § §

Report search_path changes to the client (Alexander Kukushkin, Jelte Fennema-Nio, Tomas Vondra) § §

Add PQtrace() output for all message types, including authentication (Jelte Fennema-Nio) § § § § §

Add libpq connection parameter sslkeylogfile which dumps out SSL key material (Abhishek Chanda, Daniel Gustafsson) §

This is useful for debugging.

Modify some libpq function signatures to use int64_t (Thomas Munro) §

These previously used pg_int64, which is now deprecated.

Allow psql to parse, bind, and close named prepared statements (Anthonin Bonnefoy, Michael Paquier) § §

This is accomplished with new commands \parse, \bind_named, and \close_prepared.

Add psql backslash commands to allowing issuance of pipeline queries (Anthonin Bonnefoy) § § §

The new commands are \startpipeline, \syncpipeline, \sendpipeline, \endpipeline, \flushrequest, \flush, and \getresults.

Allow adding pipeline status to the psql prompt and add related state variables (Anthonin Bonnefoy) §

The new prompt character is %P and the new psql variables are PIPELINE_SYNC_COUNT, PIPELINE_COMMAND_COUNT, and PIPELINE_RESULT_COUNT.

Allow adding the connection service name to the psql prompt or access it via psql variable (Michael Banck) §

Add psql option to use expanded mode on all list commands (Dean Rasheed) §

Adding backslash suffix x enables this.

Change psql's \conninfo to use tabular format and include more information (Álvaro Herrera, Maiquel Grassi, Hunaid Sohail) §

Add function's leakproof indicator to psql's \df+, \do+, \dAo+, and \dC+ outputs (Yugo Nagata) §

Add access method details for partitioned relations in \dP+ (Justin Pryzby) §

Add default_version to the psql \dx extension output (Magnus Hagander) §

Add psql variable WATCH_INTERVAL to set the default \watch wait time (Daniel Gustafsson) §

Change initdb to default to enabling checksums (Greg Sabino Mullane) § §

The new initdb option --no-data-checksums disables checksums.

Add initdb option --no-sync-data-files to avoid syncing heap/index files (Nathan Bossart) §

initdb option --no-sync is still available to avoid syncing any files.

Add vacuumdb option --missing-stats-only to compute only missing optimizer statistics (Corey Huinker, Nathan Bossart) § §

This option can only be run by superusers and can only be used with options --analyze-only and --analyze-in-stages.

Add pg_combinebackup option -k/--link to enable hard linking (Israel Barth Rubio, Robert Haas) §

Only some files can be hard linked. This should not be used if the backups will be used independently.

Allow pg_verifybackup to verify tar-format backups (Amul Sul) §

If pg_rewind's --source-server specifies a database name, use it in --write-recovery-conf output (Masahiko Sawada) §

Add pg_resetwal option --char-signedness to change the default char signedness (Masahiko Sawada) §

Add pg_dump option --statistics (Jeff Davis) § §

Add pg_dump and pg_dumpall option --sequence-data to dump sequence data that would normally be excluded (Nathan Bossart) § §

Add pg_dump, pg_dumpall, and pg_restore options --statistics-only, --no-statistics, --no-data, and --no-schema (Corey Huinker, Jeff Davis) §

Add option --no-policies to disable row level security policy processing in pg_dump, pg_dumpall, pg_restore (Nikolay Samokhvalov) §

This is useful for migrating to systems with different policies.

Allow pg_upgrade to preserve optimizer statistics (Corey Huinker, Jeff Davis, Nathan Bossart) § § § §

Extended statistics are not preserved. Also add pg_upgrade option --no-statistics to disable statistics preservation.

Allow pg_upgrade to process database checks in parallel (Nathan Bossart) § § § § § § § § § § §

This is controlled by the existing --jobs option.

Add pg_upgrade option --swap to swap directories rather than copy, clone, or link files (Nathan Bossart) §

This mode is potentially the fastest.

Add pg_upgrade option --set-char-signedness to set the default char signedness of new cluster (Masahiko Sawada) § §

This is to handle cases where a pre-PostgreSQL 18 cluster's default CPU signedness does not match the new cluster.

Add pg_createsubscriber option --all to create logical replicas for all databases (Shubham Khanna) §

Add pg_createsubscriber option --clean to remove publications (Shubham Khanna) § §

Add pg_createsubscriber option --enable-two-phase to enable prepared transactions (Shubham Khanna) §

Add pg_recvlogical option --enable-failover to specify failover slots (Hayato Kuroda) §

Also add option --enable-two-phase as a synonym for --two-phase, and deprecate the latter.

Allow pg_recvlogical --drop-slot to work without --dbname (Hayato Kuroda) §

Separate the loading and running of injection points (Michael Paquier, Heikki Linnakangas) § §

Injection points can now be created, but not run, via INJECTION_POINT_LOAD(), and such injection points can be run via INJECTION_POINT_CACHED().

Support runtime arguments in injection points (Michael Paquier) §

Allow inline injection point test code with IS_INJECTION_POINT_ATTACHED() (Heikki Linnakangas) §

Improve the performance of processing long JSON strings using SIMD (Single Instruction Multiple Data) (David Rowley) §

Speed up CRC32C calculations using x86 AVX-512 instructions (Raghuveer Devulapalli, Paul Amonson) §

Add ARM Neon and SVE CPU intrinsics for popcount (integer bit counting) (Chiranmoy Bhattacharya, Devanga Susmitha, Rama Malladi) § §

Improve the speed of numeric multiplication and division (Joel Jacobson, Dean Rasheed) § § § §

Add configure option --with-libnuma to enable NUMA awareness (Jakub Wartak, Bertrand Drouvot) § § §

The function pg_numa_available() reports on NUMA awareness, and system views pg_shmem_allocations_numa and pg_buffercache_numa which report on shared memory distribution across NUMA nodes.

Add TOAST table to pg_index to allow for very large expression indexes (Nathan Bossart) §

Remove column pg_attribute.attcacheoff (David Rowley) §

Add column pg_class.relallfrozen (Melanie Plageman) §

Add amgettreeheight, amconsistentequality, and amconsistentordering to the index access method API (Mark Dilger) § §

Add GiST support function stratnum() (Paul A. Jungwirth) §

Record the default CPU signedness of char in pg_controldata (Masahiko Sawada) §

Add support for Python "Limited API" in PL/Python (Peter Eisentraut) § §

This helps prevent problems caused by Python 3.x version mismatches.

Change the minimum supported Python version to 3.6.8 (Jacob Champion) §

Remove support for OpenSSL versions older than 1.1.1 (Daniel Gustafsson) § §

If LLVM is enabled, require version 14 or later (Thomas Munro) §

Add macro PG_MODULE_MAGIC_EXT to allow extensions to report their name and version (Andrei Lepikhov) §

This information can be access via the new function pg_get_loaded_modules().

Document that SPI_connect()/SPI_connect_ext() always returns success (SPI_OK_CONNECT) (Stepan Neretin) §

Errors are always reported via ereport().

Add documentation section about API and ABI compatibility (David Wheeler, Peter Eisentraut) §

Remove the experimental designation of Meson builds on Windows (Aleksander Alekseev) §

Remove configure options --disable-spinlocks and --disable-atomics (Thomas Munro) § §

Thirty-two-bit atomic operations are now required.

Remove support for the HPPA/PA-RISC architecture (Tom Lane) §

Add extension pg_logicalinspect to inspect logical snapshots (Bertrand Drouvot) §

Add extension pg_overexplain which adds debug details to EXPLAIN output (Robert Haas) §

Add output columns to postgres_fdw_get_connections() (Hayato Kuroda, Sagar Dilip Shedge) § § § §

New output column used_in_xact indicates if the foreign data wrapper is being used by a current transaction, closed indicates if it is closed, user_name indicates the user name, and remote_backend_pid indicates the remote backend process identifier.

Allow SCRAM authentication from the client to be passed to postgres_fdw servers (Matheus Alcantara, Peter Eisentraut) §

This avoids storing postgres_fdw authentication information in the database, and is enabled with the postgres_fdw use_scram_passthrough connection option. libpq uses new connection parameters scram_client_key and scram_server_key.

Allow SCRAM authentication from the client to be passed to dblink servers (Matheus Alcantara) §

Add on_error and log_verbosity options to file_fdw (Atsushi Torikoshi) §

These control how file_fdw handles and reports invalid file rows.

Add reject_limit to control the number of invalid rows file_fdw can ignore (Atsushi Torikoshi) §

This is active when ON_ERROR = 'ignore'.

Add configurable variable min_password_length to passwordcheck (Emanuele Musella, Maurizio Boriani) §

This controls the minimum password length.

Have pgbench report the number of failed, retried, or skipped transactions in per-script reports (Yugo Nagata) §

Add isn server variable weak to control invalid check digit acceptance (Viktor Holmberg) §

This was previously only controlled by function isn_weak().

Allow values to be sorted to speed btree_gist index builds (Bernd Helmle, Andrey Borodin) §

Add amcheck check function gin_index_check() to verify GIN indexes (Grigory Kryachko, Heikki Linnakangas, Andrey Borodin) §

Add functions pg_buffercache_evict_relation() and pg_buffercache_evict_all() to evict unpinned shared buffers (Nazir Bilal Yavuz) §

The existing function pg_buffercache_evict() now returns the buffer flush status.

Allow extensions to install custom EXPLAIN options (Robert Haas, Sami Imseih) § § §

Allow extensions to use the server's cumulative statistics API (Michael Paquier) § §

Allow the queries of CREATE TABLE AS and DECLARE to be tracked by pg_stat_statements (Anthonin Bonnefoy) §

They are also now assigned query ids.

Allow the parameterization of SET values in pg_stat_statements (Greg Sabino Mullane, Michael Paquier) §

This reduces the bloat caused by SET statements with differing constants.

Add pg_stat_statements columns to report parallel activity (Guillaume Lelarge) §

The new columns are parallel_workers_to_launch and parallel_workers_launched.

Add pg_stat_statements.wal_buffers_full to report full WAL buffers (Bertrand Drouvot) §

Add pgcrypto algorithms sha256crypt and sha512crypt (Bernd Helmle) §

Add CFB mode to pgcrypto encryption and decryption (Umar Hayat) §

Add function fips_mode() to report the server's FIPS mode (Daniel Gustafsson) §

Add pgcrypto server variable builtin_crypto_enabled to allow disabling builtin non-FIPS mode cryptographic functions (Daniel Gustafsson, Joe Conway) §

This is useful for guaranteeing FIPS mode behavior.

The following individuals (in alphabetical order) have contributed to this release as patch authors, committers, reviewers, testers, or reporters of issues.

**Examples:**

Example 1 (unknown):
```unknown
--no-data-checksums
```

Example 2 (unknown):
```unknown
timezone_abbreviations
```

Example 3 (unknown):
```unknown
ALTER TABLE SET [UN]LOGGED
```

Example 4 (unknown):
```unknown
pg_backend_memory_contexts
```

---


---

## Appendix E. Release Notes


**URL:** https://www.postgresql.org/docs/18/release.html

**Contents:**
- Appendix E. Release Notes

The release notes contain the significant changes in each PostgreSQL release, with major features and migration issues listed at the top. The release notes do not contain changes that affect only a few users or changes that are internal and therefore not user-visible. For example, the optimizer is improved in almost every release, but the improvements are usually observed by users as simply faster queries.

A complete list of changes for each release can be obtained by viewing the Git logs for each release. The pgsql-committers email list records all source code changes as well. There is also a web interface that shows changes to specific files.

The name appearing next to each item represents the major developer for that item. Of course all changes involve community discussion and patch review, so each item is truly a community effort.

Section markers (§) in the release notes link to gitweb pages which show the primary git commit messages and source tree changes responsible for the release note item. There might be additional git commits which are not shown.

**Examples:**

Example 1 (unknown):
```unknown
pgsql-committers
```

---


---

