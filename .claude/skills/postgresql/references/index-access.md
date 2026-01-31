# PostgreSQL - Index Access

## 64.2. Custom WAL Resource Managers #


**URL:** https://www.postgresql.org/docs/18/custom-rmgr.html

**Contents:**
- 64.2. Custom WAL Resource Managers #
  - Note

This section explains the interface between the core PostgreSQL system and custom WAL resource managers, which enable extensions to integrate directly with the WAL.

An extension, especially a Table Access Method or Index Access Method, may need to use WAL for recovery, replication, and/or Logical Decoding.

To create a new custom WAL resource manager, first define an RmgrData structure with implementations for the resource manager methods. Refer to src/backend/access/transam/README and src/include/access/xlog_internal.h in the PostgreSQL source.

The src/test/modules/test_custom_rmgrs module contains a working example, which demonstrates usage of custom WAL resource managers.

Then, register your new resource manager.

RegisterCustomRmgr must be called from the extension module's _PG_init function. While developing a new extension, use RM_EXPERIMENTAL_ID for rmid. When you are ready to release the extension to users, reserve a new resource manager ID at the Custom WAL Resource Manager page.

Place the extension module implementing the custom resource manager in shared_preload_libraries so that it will be loaded early during PostgreSQL startup.

The extension must remain in shared_preload_libraries as long as any custom WAL records may exist in the system. Otherwise PostgreSQL will not be able to apply or decode the custom WAL records, which may prevent the server from starting.

**Examples:**

Example 1 (unknown):
```unknown
src/backend/access/transam/README
```

Example 2 (unknown):
```unknown
src/include/access/xlog_internal.h
```

Example 3 (swift):
```swift
/*
 * Method table for resource managers.
 *
 * This struct must be kept in sync with the PG_RMGR definition in
 * rmgr.c.
 *
 * rm_identify must return a name for the record based on xl_info (without
 * reference to the rmid). For example, XLOG_BTREE_VACUUM would be named
 * "VACUUM". rm_desc can then be called to obtain additional detail for the
 * record, if available (e.g. the last block).
 *
 * rm_mask takes as input a page modified by the resource manager and masks
 * out bits that shouldn't be flagged by wal_consistency_checking.
 *
 * RmgrTable[] is indexed by RmgrId values (see rmgrlist.h). If rm_name is
 * NULL, the corresponding RmgrTable entry is considered invalid.
 */
typedef struct RmgrData
{
    const char *rm_name;
    void        (*rm_redo) (XLogReaderState *record);
    void        (*rm_desc) (StringInfo buf, XLogReaderState *record);
    const char *(*rm_identify) (uint8 info);
    void        (*rm_startup) (void);
    void        (*rm_cleanup) (void);
    void        (*rm_mask) (char *pagedata, BlockNumber blkno);
    void        (*rm_decode) (struct LogicalDecodingContext *ctx,
                              struct XLogRecordBuffer *buf);
} RmgrData;
```

Example 4 (unknown):
```unknown
src/test/modules/test_custom_rmgrs
```

---


---

## 63.5. Index Uniqueness Checks #


**URL:** https://www.postgresql.org/docs/18/index-unique-checks.html

**Contents:**
- 63.5. Index Uniqueness Checks #

PostgreSQL enforces SQL uniqueness constraints using unique indexes, which are indexes that disallow multiple entries with identical keys. An access method that supports this feature sets amcanunique true. (At present, only b-tree supports it.) Columns listed in the INCLUDE clause are not considered when enforcing uniqueness.

Because of MVCC, it is always necessary to allow duplicate entries to exist physically in an index: the entries might refer to successive versions of a single logical row. The behavior we actually want to enforce is that no MVCC snapshot could include two rows with equal index keys. This breaks down into the following cases that must be checked when inserting a new row into a unique index:

If a conflicting valid row has been deleted by the current transaction, it's okay. (In particular, since an UPDATE always deletes the old row version before inserting the new version, this will allow an UPDATE on a row without changing the key.)

If a conflicting row has been inserted by an as-yet-uncommitted transaction, the would-be inserter must wait to see if that transaction commits. If it rolls back then there is no conflict. If it commits without deleting the conflicting row again, there is a uniqueness violation. (In practice we just wait for the other transaction to end and then redo the visibility check in toto.)

Similarly, if a conflicting valid row has been deleted by an as-yet-uncommitted transaction, the would-be inserter must wait for that transaction to commit or abort, and then repeat the test.

Furthermore, immediately before reporting a uniqueness violation according to the above rules, the access method must recheck the liveness of the row being inserted. If it is committed dead then no violation should be reported. (This case cannot occur during the ordinary scenario of inserting a row that's just been created by the current transaction. It can happen during CREATE UNIQUE INDEX CONCURRENTLY, however.)

We require the index access method to apply these tests itself, which means that it must reach into the heap to check the commit status of any row that is shown to have a duplicate key according to the index contents. This is without a doubt ugly and non-modular, but it saves redundant work: if we did a separate probe then the index lookup for a conflicting row would be essentially repeated while finding the place to insert the new row's index entry. What's more, there is no obvious way to avoid race conditions unless the conflict check is an integral part of insertion of the new index entry.

If the unique constraint is deferrable, there is additional complexity: we need to be able to insert an index entry for a new row, but defer any uniqueness-violation error until end of statement or even later. To avoid unnecessary repeat searches of the index, the index access method should do a preliminary uniqueness check during the initial insertion. If this shows that there is definitely no conflicting live tuple, we are done. Otherwise, we schedule a recheck to occur when it is time to enforce the constraint. If, at the time of the recheck, both the inserted tuple and some other tuple with the same key are live, then the error must be reported. (Note that for this purpose, “live” actually means “any tuple in the index entry's HOT chain is live”.) To implement this, the aminsert function is passed a checkUnique parameter having one of the following values:

UNIQUE_CHECK_NO indicates that no uniqueness checking should be done (this is not a unique index).

UNIQUE_CHECK_YES indicates that this is a non-deferrable unique index, and the uniqueness check must be done immediately, as described above.

UNIQUE_CHECK_PARTIAL indicates that the unique constraint is deferrable. PostgreSQL will use this mode to insert each row's index entry. The access method must allow duplicate entries into the index, and report any potential duplicates by returning false from aminsert. For each row for which false is returned, a deferred recheck will be scheduled.

The access method must identify any rows which might violate the unique constraint, but it is not an error for it to report false positives. This allows the check to be done without waiting for other transactions to finish; conflicts reported here are not treated as errors and will be rechecked later, by which time they may no longer be conflicts.

UNIQUE_CHECK_EXISTING indicates that this is a deferred recheck of a row that was reported as a potential uniqueness violation. Although this is implemented by calling aminsert, the access method must not insert a new index entry in this case. The index entry is already present. Rather, the access method must check to see if there is another live index entry. If so, and if the target row is also still live, report error.

It is recommended that in a UNIQUE_CHECK_EXISTING call, the access method further verify that the target row actually does have an existing entry in the index, and report error if not. This is a good idea because the index tuple values passed to aminsert will have been recomputed. If the index definition involves functions that are not really immutable, we might be checking the wrong area of the index. Checking that the target row is found in the recheck verifies that we are scanning for the same tuple values as were used in the original insertion.

**Examples:**

Example 1 (unknown):
```unknown
amcanunique
```

Example 2 (unknown):
```unknown
CREATE UNIQUE INDEX CONCURRENTLY
```

Example 3 (unknown):
```unknown
checkUnique
```

Example 4 (unknown):
```unknown
UNIQUE_CHECK_NO
```

---


---

## 64.1. Generic WAL Records #


**URL:** https://www.postgresql.org/docs/18/generic-wal.html

**Contents:**
- 64.1. Generic WAL Records #
  - Note

Although all built-in WAL-logged modules have their own types of WAL records, there is also a generic WAL record type, which describes changes to pages in a generic way.

Generic WAL records are ignored during Logical Decoding. If logical decoding is required for your extension, consider a Custom WAL Resource Manager.

The API for constructing generic WAL records is defined in access/generic_xlog.h and implemented in access/transam/generic_xlog.c.

To perform a WAL-logged data update using the generic WAL record facility, follow these steps:

state = GenericXLogStart(relation) — start construction of a generic WAL record for the given relation.

page = GenericXLogRegisterBuffer(state, buffer, flags) — register a buffer to be modified within the current generic WAL record. This function returns a pointer to a temporary copy of the buffer's page, where modifications should be made. (Do not modify the buffer's contents directly.) The third argument is a bit mask of flags applicable to the operation. Currently the only such flag is GENERIC_XLOG_FULL_IMAGE, which indicates that a full-page image rather than a delta update should be included in the WAL record. Typically this flag would be set if the page is new or has been rewritten completely. GenericXLogRegisterBuffer can be repeated if the WAL-logged action needs to modify multiple pages.

Apply modifications to the page images obtained in the previous step.

GenericXLogFinish(state) — apply the changes to the buffers and emit the generic WAL record.

WAL record construction can be canceled between any of the above steps by calling GenericXLogAbort(state). This will discard all changes to the page image copies.

Please note the following points when using the generic WAL record facility:

No direct modifications of buffers are allowed! All modifications must be done in copies acquired from GenericXLogRegisterBuffer(). In other words, code that makes generic WAL records should never call BufferGetPage() for itself. However, it remains the caller's responsibility to pin/unpin and lock/unlock the buffers at appropriate times. Exclusive lock must be held on each target buffer from before GenericXLogRegisterBuffer() until after GenericXLogFinish().

Registrations of buffers (step 2) and modifications of page images (step 3) can be mixed freely, i.e., both steps may be repeated in any sequence. Keep in mind that buffers should be registered in the same order in which locks are to be obtained on them during replay.

The maximum number of buffers that can be registered for a generic WAL record is MAX_GENERIC_XLOG_PAGES. An error will be thrown if this limit is exceeded.

Generic WAL assumes that the pages to be modified have standard layout, and in particular that there is no useful data between pd_lower and pd_upper.

Since you are modifying copies of buffer pages, GenericXLogStart() does not start a critical section. Thus, you can safely do memory allocation, error throwing, etc. between GenericXLogStart() and GenericXLogFinish(). The only actual critical section is present inside GenericXLogFinish(). There is no need to worry about calling GenericXLogAbort() during an error exit, either.

GenericXLogFinish() takes care of marking buffers dirty and setting their LSNs. You do not need to do this explicitly.

For unlogged relations, everything works the same except that no actual WAL record is emitted. Thus, you typically do not need to do any explicit checks for unlogged relations.

The generic WAL redo function will acquire exclusive locks to buffers in the same order as they were registered. After redoing all changes, the locks will be released in the same order.

If GENERIC_XLOG_FULL_IMAGE is not specified for a registered buffer, the generic WAL record contains a delta between the old and the new page images. This delta is based on byte-by-byte comparison. This is not very compact for the case of moving data within a page, and might be improved in the future.

**Examples:**

Example 1 (unknown):
```unknown
access/generic_xlog.h
```

Example 2 (unknown):
```unknown
access/transam/generic_xlog.c
```

Example 3 (unknown):
```unknown
state = GenericXLogStart(relation)
```

Example 4 (unknown):
```unknown
page = GenericXLogRegisterBuffer(state, buffer, flags)
```

---


---

## Chapter 63. Index Access Method Interface Definition


**URL:** https://www.postgresql.org/docs/18/indexam.html

**Contents:**
- Chapter 63. Index Access Method Interface Definition

This chapter defines the interface between the core PostgreSQL system and index access methods, which manage individual index types. The core system knows nothing about indexes beyond what is specified here, so it is possible to develop entirely new index types by writing add-on code.

All indexes in PostgreSQL are what are known technically as secondary indexes; that is, the index is physically separate from the table file that it describes. Each index is stored as its own physical relation and so is described by an entry in the pg_class catalog. The contents of an index are entirely under the control of its index access method. In practice, all index access methods divide indexes into standard-size pages so that they can use the regular storage manager and buffer manager to access the index contents. (All the existing index access methods furthermore use the standard page layout described in Section 66.6, and most use the same format for index tuple headers; but these decisions are not forced on an access method.)

An index is effectively a mapping from some data key values to tuple identifiers, or TIDs, of row versions (tuples) in the index's parent table. A TID consists of a block number and an item number within that block (see Section 66.6). This is sufficient information to fetch a particular row version from the table. Indexes are not directly aware that under MVCC, there might be multiple extant versions of the same logical row; to an index, each tuple is an independent object that needs its own index entry. Thus, an update of a row always creates all-new index entries for the row, even if the key values did not change. (HOT tuples are an exception to this statement; but indexes do not deal with those, either.) Index entries for dead tuples are reclaimed (by vacuuming) when the dead tuples themselves are reclaimed.

---


---

## 63.6. Index Cost Estimation Functions #


**URL:** https://www.postgresql.org/docs/18/index-cost-estimation.html

**Contents:**
- 63.6. Index Cost Estimation Functions #

The amcostestimate function is given information describing a possible index scan, including lists of WHERE and ORDER BY clauses that have been determined to be usable with the index. It must return estimates of the cost of accessing the index and the selectivity of the WHERE clauses (that is, the fraction of parent-table rows that will be retrieved during the index scan). For simple cases, nearly all the work of the cost estimator can be done by calling standard routines in the optimizer; the point of having an amcostestimate function is to allow index access methods to provide index-type-specific knowledge, in case it is possible to improve on the standard estimates.

Each amcostestimate function must have the signature:

The first three parameters are inputs:

The planner's information about the query being processed.

The index access path being considered. All fields except cost and selectivity values are valid.

The number of repetitions of the index scan that should be factored into the cost estimates. This will typically be greater than one when considering a parameterized scan for use in the inside of a nestloop join. Note that the cost estimates should still be for just one scan; a larger loop_count means that it may be appropriate to allow for some caching effects across multiple scans.

The last five parameters are pass-by-reference outputs:

Set to cost of index start-up processing

Set to total cost of index processing

Set to index selectivity

Set to correlation coefficient between index scan order and underlying table's order

Set to number of index leaf pages

Note that cost estimate functions must be written in C, not in SQL or any available procedural language, because they must access internal data structures of the planner/optimizer.

The index access costs should be computed using the parameters used by src/backend/optimizer/path/costsize.c: a sequential disk block fetch has cost seq_page_cost, a nonsequential fetch has cost random_page_cost, and the cost of processing one index row should usually be taken as cpu_index_tuple_cost. In addition, an appropriate multiple of cpu_operator_cost should be charged for any comparison operators invoked during index processing (especially evaluation of the indexquals themselves).

The access costs should include all disk and CPU costs associated with scanning the index itself, but not the costs of retrieving or processing the parent-table rows that are identified by the index.

The “start-up cost” is the part of the total scan cost that must be expended before we can begin to fetch the first row. For most indexes this can be taken as zero, but an index type with a high start-up cost might want to set it nonzero.

The indexSelectivity should be set to the estimated fraction of the parent table rows that will be retrieved during the index scan. In the case of a lossy query, this will typically be higher than the fraction of rows that actually pass the given qual conditions.

The indexCorrelation should be set to the correlation (ranging between -1.0 and 1.0) between the index order and the table order. This is used to adjust the estimate for the cost of fetching rows from the parent table.

The indexPages should be set to the number of leaf pages. This is used to estimate the number of workers for parallel index scan.

When loop_count is greater than one, the returned numbers should be averages expected for any one scan of the index.

A typical cost estimator will proceed as follows:

Estimate and return the fraction of parent-table rows that will be visited based on the given qual conditions. In the absence of any index-type-specific knowledge, use the standard optimizer function clauselist_selectivity():

Estimate the number of index rows that will be visited during the scan. For many index types this is the same as indexSelectivity times the number of rows in the index, but it might be more. (Note that the index's size in pages and rows is available from the path->indexinfo struct.)

Estimate the number of index pages that will be retrieved during the scan. This might be just indexSelectivity times the index's size in pages.

Compute the index access cost. A generic estimator might do this:

However, the above does not account for amortization of index reads across repeated index scans.

Estimate the index correlation. For a simple ordered index on a single field, this can be retrieved from pg_statistic. If the correlation is not known, the conservative estimate is zero (no correlation).

Examples of cost estimator functions can be found in src/backend/utils/adt/selfuncs.c.

**Examples:**

Example 1 (unknown):
```unknown
amcostestimate
```

Example 2 (unknown):
```unknown
amcostestimate
```

Example 3 (unknown):
```unknown
amcostestimate
```

Example 4 (cpp):
```cpp
void
amcostestimate (PlannerInfo *root,
                IndexPath *path,
                double loop_count,
                Cost *indexStartupCost,
                Cost *indexTotalCost,
                Selectivity *indexSelectivity,
                double *indexCorrelation,
                double *indexPages);
```

---


---

## Chapter 64. Write Ahead Logging for Extensions


**URL:** https://www.postgresql.org/docs/18/wal-for-extensions.html

**Contents:**
- Chapter 64. Write Ahead Logging for Extensions

Certain extensions, principally extensions that implement custom access methods, may need to perform write-ahead logging in order to ensure crash-safety. PostgreSQL provides two ways for extensions to achieve this goal.

First, extensions can choose to use generic WAL, a special type of WAL record which describes changes to pages in a generic way. This method is simple to implement and does not require that an extension library be loaded in order to apply the records. However, generic WAL records will be ignored when performing logical decoding.

Second, extensions can choose to use a custom resource manager. This method is more flexible, supports logical decoding, and can sometimes generate much smaller write-ahead log records than would be possible with generic WAL. However, it is more complex for an extension to implement.

---


---

