# PostgreSQL - Contrib Modules (Part 3)

## F.37. pg_walinspect — low-level WAL inspection #


**URL:** https://www.postgresql.org/docs/18/pgwalinspect.html

**Contents:**
- F.37. pg_walinspect — low-level WAL inspection #
  - Note
  - Tip
  - F.37.1. General Functions #
  - Tip
  - F.37.2. Author #

The pg_walinspect module provides SQL functions that allow you to inspect the contents of write-ahead log of a running PostgreSQL database cluster at a low level, which is useful for debugging, analytical, reporting or educational purposes. It is similar to pg_waldump, but accessible through SQL rather than a separate utility.

All the functions of this module will provide the WAL information using the server's current timeline ID.

The pg_walinspect functions are often called using an LSN argument that specifies the location at which a known WAL record of interest begins. However, some functions, such as pg_logical_emit_message, return the LSN after the record that was just inserted.

All of the pg_walinspect functions that show information about records that fall within a certain LSN range are permissive about accepting end_lsn arguments that are after the server's current LSN. Using an end_lsn “from the future” will not raise an error.

It may be convenient to provide the value FFFFFFFF/FFFFFFFF (the maximum valid pg_lsn value) as an end_lsn argument. This is equivalent to providing an end_lsn argument matching the server's current LSN.

By default, use of these functions is restricted to superusers and members of the pg_read_server_files role. Access may be granted by superusers to others using GRANT.

Gets WAL record information about a record that is located at or after the in_lsn argument. For example:

If in_lsn isn't at the start of a WAL record, information about the next valid WAL record is shown instead. If there is no next valid WAL record, the function raises an error.

Gets information of all the valid WAL records between start_lsn and end_lsn. Returns one row per WAL record. For example:

The function raises an error if start_lsn is not available.

Gets information about each block reference from all the valid WAL records between start_lsn and end_lsn with one or more block references. Returns one row per block reference per WAL record. For example:

This example involves a WAL record that only contains one block reference, but many WAL records contain several block references. Rows output by pg_get_wal_block_info are guaranteed to have a unique combination of start_lsn and block_id values.

Much of the information shown here matches the output that pg_get_wal_records_info would show, given the same arguments. However, pg_get_wal_block_info unnests the information from each WAL record into an expanded form by outputting one row per block reference, so certain details are tracked at the block reference level rather than at the whole-record level. This structure is useful with queries that track how individual blocks changed over time. Note that records with no block references (e.g., COMMIT WAL records) will have no rows returned, so pg_get_wal_block_info may actually return fewer rows than pg_get_wal_records_info.

The reltablespace, reldatabase, and relfilenode parameters reference pg_tablespace.oid, pg_database.oid, and pg_class.relfilenode respectively. The relforknumber field is the fork number within the relation for the block reference; see common/relpath.h for details.

The pg_filenode_relation function (see Table 9.103) can help you to determine which relation was modified during original execution.

It is possible for clients to avoid the overhead of materializing block data. This may make function execution significantly faster. When show_data is set to false, block_data and block_fpi_data values are omitted (that is, the block_data and block_fpi_data OUT arguments are NULL for all rows returned). Obviously, this optimization is only feasible with queries where block data isn't truly required.

The function raises an error if start_lsn is not available.

Gets statistics of all the valid WAL records between start_lsn and end_lsn. By default, it returns one row per resource_manager type. When per_record is set to true, it returns one row per record_type. For example:

The function raises an error if start_lsn is not available.

Bharath Rupireddy <bharath.rupireddyforpostgres@gmail.com>

**Examples:**

Example 1 (unknown):
```unknown
pg_walinspect
```

Example 2 (unknown):
```unknown
pg_walinspect
```

Example 3 (unknown):
```unknown
pg_logical_emit_message
```

Example 4 (unknown):
```unknown
pg_walinspect
```

---


---

## F.1. amcheck — tools to verify table and index consistency #


**URL:** https://www.postgresql.org/docs/18/amcheck.html

**Contents:**
- F.1. amcheck — tools to verify table and index consistency #
  - F.1.1. Functions #
  - Tip
  - F.1.2. Optional heapallindexed Verification #
  - F.1.3. Using amcheck Effectively #
  - F.1.4. Repairing Corruption #

The amcheck module provides functions that allow you to verify the logical consistency of the structure of relations.

The B-Tree checking functions verify various invariants in the structure of the representation of particular relations. The correctness of the access method functions behind index scans and other important operations relies on these invariants always holding. For example, certain functions verify, among other things, that all B-Tree pages have items in “logical” order (e.g., for B-Tree indexes on text, index tuples should be in collated lexical order). If that particular invariant somehow fails to hold, we can expect binary searches on the affected page to incorrectly guide index scans, resulting in wrong answers to SQL queries. If the structure appears to be valid, no error is raised. While these checking functions are run, the search_path is temporarily changed to pg_catalog, pg_temp.

Verification is performed using the same procedures as those used by index scans themselves, which may be user-defined operator class code. For example, B-Tree index verification relies on comparisons made with one or more B-Tree support function 1 routines. See Section 36.16.3 for details of operator class support functions.

Unlike the B-Tree checking functions which report corruption by raising errors, the heap checking function verify_heapam checks a table and attempts to return a set of rows, one row per corruption detected. Despite this, if facilities that verify_heapam relies upon are themselves corrupted, the function may be unable to continue and may instead raise an error.

Permission to execute amcheck functions may be granted to non-superusers, but before granting such permissions careful consideration should be given to data security and privacy concerns. Although the corruption reports generated by these functions do not focus on the contents of the corrupted data so much as on the structure of that data and the nature of the corruptions found, an attacker who gains permission to execute these functions, particularly if the attacker can also induce corruption, might be able to infer something of the data itself from such messages.

bt_index_check tests that its target, a B-Tree index, respects a variety of invariants. Example usage:

This example shows a session that performs verification of the 10 largest catalog indexes in the database “test”. Verification of the presence of heap tuples as index tuples is requested for the subset that are unique indexes. Since no error is raised, all indexes tested appear to be logically consistent. Naturally, this query could easily be changed to call bt_index_check for every index in the database where verification is supported.

bt_index_check acquires an AccessShareLock on the target index and the heap relation it belongs to. This lock mode is the same lock mode acquired on relations by simple SELECT statements. bt_index_check does not verify invariants that span child/parent relationships, but will verify the presence of all heap tuples as index tuples within the index when heapallindexed is true. When checkunique is true bt_index_check will check that no more than one among duplicate entries in unique index is visible. When a routine, lightweight test for corruption is required in a live production environment, using bt_index_check often provides the best trade-off between thoroughness of verification and limiting the impact on application performance and availability.

bt_index_parent_check tests that its target, a B-Tree index, respects a variety of invariants. Optionally, when the heapallindexed argument is true, the function verifies the presence of all heap tuples that should be found within the index. When checkunique is true bt_index_parent_check will check that no more than one among duplicate entries in unique index is visible. When the optional rootdescend argument is true, verification re-finds tuples on the leaf level by performing a new search from the root page for each tuple. The checks that can be performed by bt_index_parent_check are a superset of the checks that can be performed by bt_index_check. bt_index_parent_check can be thought of as a more thorough variant of bt_index_check: unlike bt_index_check, bt_index_parent_check also checks invariants that span parent/child relationships, including checking that there are no missing downlinks in the index structure. bt_index_parent_check follows the general convention of raising an error if it finds a logical inconsistency or other problem.

A ShareLock is required on the target index by bt_index_parent_check (a ShareLock is also acquired on the heap relation). These locks prevent concurrent data modification from INSERT, UPDATE, and DELETE commands. The locks also prevent the underlying relation from being concurrently processed by VACUUM, as well as all other utility commands. Note that the function holds locks only while running, not for the entire transaction.

bt_index_parent_check's additional verification is more likely to detect various pathological cases. These cases may involve an incorrectly implemented B-Tree operator class used by the index that is checked, or, hypothetically, undiscovered bugs in the underlying B-Tree index access method code. Note that bt_index_parent_check cannot be used when hot standby mode is enabled (i.e., on read-only physical replicas), unlike bt_index_check.

gin_index_check tests that its target GIN index has consistent parent-child tuples relations (no parent tuples require tuple adjustment) and page graph respects balanced-tree invariants (internal pages reference only leaf page or only internal pages).

bt_index_check and bt_index_parent_check both output log messages about the verification process at DEBUG1 and DEBUG2 severity levels. These messages provide detailed information about the verification process that may be of interest to PostgreSQL developers. Advanced users may also find this information helpful, since it provides additional context should verification actually detect an inconsistency. Running:

in an interactive psql session before running a verification query will display messages about the progress of verification with a manageable level of detail.

Checks a table, sequence, or materialized view for structural corruption, where pages in the relation contain data that is invalidly formatted, and for logical corruption, where pages are structurally valid but inconsistent with the rest of the database cluster.

The following optional arguments are recognized:

If true, corruption checking stops at the end of the first block in which any corruptions are found.

If true, toasted values are checked against the target relation's TOAST table.

This option is known to be slow. Also, if the toast table or its index is corrupt, checking it against toast values could conceivably crash the server, although in many cases this would just produce an error.

If not none, corruption checking skips blocks that are marked as all-visible or all-frozen, as specified. Valid options are all-visible, all-frozen and none.

If specified, corruption checking begins at the specified block, skipping all previous blocks. It is an error to specify a startblock outside the range of blocks in the target table.

By default, checking begins at the first block.

If specified, corruption checking ends at the specified block, skipping all remaining blocks. It is an error to specify an endblock outside the range of blocks in the target table.

By default, all blocks are checked.

For each corruption detected, verify_heapam returns a row with the following columns:

The number of the block containing the corrupt page.

The OffsetNumber of the corrupt tuple.

The attribute number of the corrupt column in the tuple, if the corruption is specific to a column and not the tuple as a whole.

A message describing the problem detected.

When the heapallindexed argument to B-Tree verification functions is true, an additional phase of verification is performed against the table associated with the target index relation. This consists of a “dummy” CREATE INDEX operation, which checks for the presence of all hypothetical new index tuples against a temporary, in-memory summarizing structure (this is built when needed during the basic first phase of verification). The summarizing structure “fingerprints” every tuple found within the target index. The high level principle behind heapallindexed verification is that a new index that is equivalent to the existing, target index must only have entries that can be found in the existing structure.

The additional heapallindexed phase adds significant overhead: verification will typically take several times longer. However, there is no change to the relation-level locks acquired when heapallindexed verification is performed.

The summarizing structure is bound in size by maintenance_work_mem. In order to ensure that there is no more than a 2% probability of failure to detect an inconsistency for each heap tuple that should be represented in the index, approximately 2 bytes of memory are needed per tuple. As less memory is made available per tuple, the probability of missing an inconsistency slowly increases. This approach limits the overhead of verification significantly, while only slightly reducing the probability of detecting a problem, especially for installations where verification is treated as a routine maintenance task. Any single absent or malformed tuple has a new opportunity to be detected with each new verification attempt.

amcheck can be effective at detecting various types of failure modes that data checksums will fail to catch. These include:

Structural inconsistencies caused by incorrect operator class implementations.

This includes issues caused by the comparison rules of operating system collations changing. Comparisons of datums of a collatable type like text must be immutable (just as all comparisons used for B-Tree index scans must be immutable), which implies that operating system collation rules must never change. Though rare, updates to operating system collation rules can cause these issues. More commonly, an inconsistency in the collation order between a primary server and a standby server is implicated, possibly because the major operating system version in use is inconsistent. Such inconsistencies will generally only arise on standby servers, and so can generally only be detected on standby servers.

If a problem like this arises, it may not affect each individual index that is ordered using an affected collation, simply because indexed values might happen to have the same absolute ordering regardless of the behavioral inconsistency. See Section 23.1 and Section 23.2 for further details about how PostgreSQL uses operating system locales and collations.

Structural inconsistencies between indexes and the heap relations that are indexed (when heapallindexed verification is performed).

There is no cross-checking of indexes against their heap relation during normal operation. Symptoms of heap corruption can be subtle.

Corruption caused by hypothetical undiscovered bugs in the underlying PostgreSQL access method code, sort code, or transaction management code.

Automatic verification of the structural integrity of indexes plays a role in the general testing of new or proposed PostgreSQL features that could plausibly allow a logical inconsistency to be introduced. Verification of table structure and associated visibility and transaction status information plays a similar role. One obvious testing strategy is to call amcheck functions continuously when running the standard regression tests. See Section 31.1 for details on running the tests.

File system or storage subsystem faults when data checksums are disabled.

Note that amcheck examines a page as represented in some shared memory buffer at the time of verification if there is only a shared buffer hit when accessing the block. Consequently, amcheck does not necessarily examine data read from the file system at the time of verification. Note that when checksums are enabled, amcheck may raise an error due to a checksum failure when a corrupt block is read into a buffer.

Corruption caused by faulty RAM, or the broader memory subsystem.

PostgreSQL does not protect against correctable memory errors and it is assumed you will operate using RAM that uses industry standard Error Correcting Codes (ECC) or better protection. However, ECC memory is typically only immune to single-bit errors, and should not be assumed to provide absolute protection against failures that result in memory corruption.

When heapallindexed verification is performed, there is generally a greatly increased chance of detecting single-bit errors, since strict binary equality is tested, and the indexed attributes within the heap are tested.

Structural corruption can happen due to faulty storage hardware, or relation files being overwritten or modified by unrelated software. This kind of corruption can also be detected with data page checksums.

Relation pages which are correctly formatted, internally consistent, and correct relative to their own internal checksums may still contain logical corruption. As such, this kind of corruption cannot be detected with checksums. Examples include toasted values in the main table which lack a corresponding entry in the toast table, and tuples in the main table with a Transaction ID that is older than the oldest valid Transaction ID in the database or cluster.

Multiple causes of logical corruption have been observed in production systems, including bugs in the PostgreSQL server software, faulty and ill-conceived backup and restore tools, and user error.

Corrupt relations are most concerning in live production environments, precisely the same environments where high risk activities are least welcome. For this reason, verify_heapam has been designed to diagnose corruption without undue risk. It cannot guard against all causes of backend crashes, as even executing the calling query could be unsafe on a badly corrupted system. Access to catalog tables is performed and could be problematic if the catalogs themselves are corrupted.

In general, amcheck can only prove the presence of corruption; it cannot prove its absence.

No error concerning corruption raised by amcheck should ever be a false positive. amcheck raises errors in the event of conditions that, by definition, should never happen, and so careful analysis of amcheck errors is often required.

There is no general method of repairing problems that amcheck detects. An explanation for the root cause of an invariant violation should be sought. pageinspect may play a useful role in diagnosing corruption that amcheck detects. A REINDEX may not be effective in repairing corruption.

**Examples:**

Example 1 (unknown):
```unknown
heapallindexed
```

Example 2 (unknown):
```unknown
pg_catalog, pg_temp
```

Example 3 (unknown):
```unknown
verify_heapam
```

Example 4 (unknown):
```unknown
verify_heapam
```

---


---

## F.24. passwordcheck — verify password strength #


**URL:** https://www.postgresql.org/docs/18/passwordcheck.html

**Contents:**
- F.24. passwordcheck — verify password strength #
  - Caution
  - F.24.1. Configuration Parameters #
  - Note

The passwordcheck module checks users' passwords whenever they are set with CREATE ROLE or ALTER ROLE. If a password is considered too weak, it will be rejected and the command will terminate with an error.

To enable this module, add '$libdir/passwordcheck' to shared_preload_libraries in postgresql.conf, then restart the server.

You can adapt this module to your needs by changing the source code. For example, you can use CrackLib to check passwords — this only requires uncommenting two lines in the Makefile and rebuilding the module. (We cannot include CrackLib by default for license reasons.) Without CrackLib, the module enforces a few simple rules for password strength, which you can modify or extend as you see fit.

To prevent unencrypted passwords from being sent across the network, written to the server log or otherwise stolen by a database administrator, PostgreSQL allows the user to supply pre-encrypted passwords. Many client programs make use of this functionality and encrypt the password before sending it to the server.

This limits the usefulness of the passwordcheck module, because in that case it can only try to guess the password. For this reason, passwordcheck is not recommended if your security requirements are high. It is more secure to use an external authentication method such as GSSAPI (see Chapter 20) than to rely on passwords within the database.

Alternatively, you could modify passwordcheck to reject pre-encrypted passwords, but forcing users to set their passwords in clear text carries its own security risks.

The minimum acceptable password length in bytes. The default is 8. Only superusers can change this setting.

This parameter has no effect if a user supplies a pre-encrypted password.

In ordinary usage, this parameter is set in postgresql.conf, but superusers can alter it on-the-fly within their own sessions. Typical usage might be:

**Examples:**

Example 1 (unknown):
```unknown
passwordcheck
```

Example 2 (bash):
```bash
'$libdir/passwordcheck'
```

Example 3 (unknown):
```unknown
postgresql.conf
```

Example 4 (unknown):
```unknown
passwordcheck
```

---


---

## F.31. pgrowlocks — show a table's row locking information #


**URL:** https://www.postgresql.org/docs/18/pgrowlocks.html

**Contents:**
- F.31. pgrowlocks — show a table's row locking information #
  - F.31.1. Overview #
  - F.31.2. Sample Output #
  - F.31.3. Author #

The pgrowlocks module provides a function to show row locking information for a specified table.

By default use is restricted to superusers, roles with privileges of the pg_stat_scan_tables role, and users with SELECT permissions on the table.

The parameter is the name of a table. The result is a set of records, with one row for each locked row within the table. The output columns are shown in Table F.21.

Table F.21. pgrowlocks Output Columns

pgrowlocks takes AccessShareLock for the target table and reads each row one by one to collect the row locking information. This is not very speedy for a large table. Note that:

If an ACCESS EXCLUSIVE lock is taken on the table, pgrowlocks will be blocked.

pgrowlocks is not guaranteed to produce a self-consistent snapshot. It is possible that a new row lock is taken, or an old lock is freed, during its execution.

pgrowlocks does not show the contents of locked rows. If you want to take a look at the row contents at the same time, you could do something like this:

Be aware however that such a query will be very inefficient.

**Examples:**

Example 1 (unknown):
```unknown
pg_stat_scan_tables
```

Example 2 (unknown):
```unknown
For Key Share
```

Example 3 (unknown):
```unknown
For No Key Update
```

Example 4 (unknown):
```unknown
No Key Update
```

---


---

