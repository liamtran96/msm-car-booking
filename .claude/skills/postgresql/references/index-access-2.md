# PostgreSQL - Index Access (Part 2)

## 63.3. Index Scanning #


**URL:** https://www.postgresql.org/docs/18/index-scanning.html

**Contents:**
- 63.3. Index Scanning #

In an index scan, the index access method is responsible for regurgitating the TIDs of all the tuples it has been told about that match the scan keys. The access method is not involved in actually fetching those tuples from the index's parent table, nor in determining whether they pass the scan's visibility test or other conditions.

A scan key is the internal representation of a WHERE clause of the form index_key operator constant, where the index key is one of the columns of the index and the operator is one of the members of the operator family associated with that index column. An index scan has zero or more scan keys, which are implicitly ANDed — the returned tuples are expected to satisfy all the indicated conditions.

The access method can report that the index is lossy, or requires rechecks, for a particular query. This implies that the index scan will return all the entries that pass the scan key, plus possibly additional entries that do not. The core system's index-scan machinery will then apply the index conditions again to the heap tuple to verify whether or not it really should be selected. If the recheck option is not specified, the index scan must return exactly the set of matching entries.

Note that it is entirely up to the access method to ensure that it correctly finds all and only the entries passing all the given scan keys. Also, the core system will simply hand off all the WHERE clauses that match the index keys and operator families, without any semantic analysis to determine whether they are redundant or contradictory. As an example, given WHERE x > 4 AND x > 14 where x is a b-tree indexed column, it is left to the b-tree amrescan function to realize that the first scan key is redundant and can be discarded. The extent of preprocessing needed during amrescan will depend on the extent to which the index access method needs to reduce the scan keys to a “normalized” form.

Some access methods return index entries in a well-defined order, others do not. There are actually two different ways that an access method can support sorted output:

Access methods that always return entries in the natural ordering of their data (such as btree) should set amcanorder to true. Currently, such access methods must use btree-compatible strategy numbers for their equality and ordering operators.

Access methods that support ordering operators should set amcanorderbyop to true. This indicates that the index is capable of returning entries in an order satisfying ORDER BY index_key operator constant. Scan modifiers of that form can be passed to amrescan as described previously.

The amgettuple function has a direction argument, which can be either ForwardScanDirection (the normal case) or BackwardScanDirection. If the first call after amrescan specifies BackwardScanDirection, then the set of matching index entries is to be scanned back-to-front rather than in the normal front-to-back direction, so amgettuple must return the last matching tuple in the index, rather than the first one as it normally would. (This will only occur for access methods that set amcanorder to true.) After the first call, amgettuple must be prepared to advance the scan in either direction from the most recently returned entry. (But if amcanbackward is false, all subsequent calls will have the same direction as the first one.)

Access methods that support ordered scans must support “marking” a position in a scan and later returning to the marked position. The same position might be restored multiple times. However, only one position need be remembered per scan; a new ammarkpos call overrides the previously marked position. An access method that does not support ordered scans need not provide ammarkpos and amrestrpos functions in IndexAmRoutine; set those pointers to NULL instead.

Both the scan position and the mark position (if any) must be maintained consistently in the face of concurrent insertions or deletions in the index. It is OK if a freshly-inserted entry is not returned by a scan that would have found the entry if it had existed when the scan started, or for the scan to return such an entry upon rescanning or backing up even though it had not been returned the first time through. Similarly, a concurrent delete might or might not be reflected in the results of a scan. What is important is that insertions or deletions not cause the scan to miss or multiply return entries that were not themselves being inserted or deleted.

If the index stores the original indexed data values (and not some lossy representation of them), it is useful to support index-only scans, in which the index returns the actual data not just the TID of the heap tuple. This will only avoid I/O if the visibility map shows that the TID is on an all-visible page; else the heap tuple must be visited anyway to check MVCC visibility. But that is no concern of the access method's.

Instead of using amgettuple, an index scan can be done with amgetbitmap to fetch all tuples in one call. This can be noticeably more efficient than amgettuple because it allows avoiding lock/unlock cycles within the access method. In principle amgetbitmap should have the same effects as repeated amgettuple calls, but we impose several restrictions to simplify matters. First of all, amgetbitmap returns all tuples at once and marking or restoring scan positions isn't supported. Secondly, the tuples are returned in a bitmap which doesn't have any specific ordering, which is why amgetbitmap doesn't take a direction argument. (Ordering operators will never be supplied for such a scan, either.) Also, there is no provision for index-only scans with amgetbitmap, since there is no way to return the contents of index tuples. Finally, amgetbitmap does not guarantee any locking of the returned tuples, with implications spelled out in Section 63.4.

Note that it is permitted for an access method to implement only amgetbitmap and not amgettuple, or vice versa, if its internal implementation is unsuited to one API or the other.

**Examples:**

Example 1 (sql):
```sql
WHERE x > 4 AND x > 14
```

Example 2 (unknown):
```unknown
amcanorderbyop
```

Example 3 (unknown):
```unknown
ForwardScanDirection
```

Example 4 (unknown):
```unknown
BackwardScanDirection
```

---


---

## 63.2. Index Access Method Functions #


**URL:** https://www.postgresql.org/docs/18/index-functions.html

**Contents:**
- 63.2. Index Access Method Functions #

The index construction and maintenance functions that an index access method must provide in IndexAmRoutine are:

Build a new index. The index relation has been physically created, but is empty. It must be filled in with whatever fixed data the access method requires, plus entries for all tuples already existing in the table. Ordinarily the ambuild function will call table_index_build_scan() to scan the table for existing tuples and compute the keys that need to be inserted into the index. The function must return a palloc'd struct containing statistics about the new index. The amcanbuildparallel flag indicates whether the access method supports parallel index builds. When set to true, the system will attempt to allocate parallel workers for the build. Access methods supporting only non-parallel index builds should leave this flag set to false.

Build an empty index, and write it to the initialization fork (INIT_FORKNUM) of the given relation. This method is called only for unlogged indexes; the empty index written to the initialization fork will be copied over the main relation fork on each server restart.

Insert a new tuple into an existing index. The values and isnull arrays give the key values to be indexed, and heap_tid is the TID to be indexed. If the access method supports unique indexes (its amcanunique flag is true) then checkUnique indicates the type of uniqueness check to perform. This varies depending on whether the unique constraint is deferrable; see Section 63.5 for details. Normally the access method only needs the heapRelation parameter when performing uniqueness checking (since then it will have to look into the heap to verify tuple liveness).

The indexUnchanged Boolean value gives a hint about the nature of the tuple to be indexed. When it is true, the tuple is a duplicate of some existing tuple in the index. The new tuple is a logically unchanged successor MVCC tuple version. This happens when an UPDATE takes place that does not modify any columns covered by the index, but nevertheless requires a new version in the index. The index AM may use this hint to decide to apply bottom-up index deletion in parts of the index where many versions of the same logical row accumulate. Note that updating a non-key column or a column that only appears in a partial index predicate does not affect the value of indexUnchanged. The core code determines each tuple's indexUnchanged value using a low overhead approach that allows both false positives and false negatives. Index AMs must not treat indexUnchanged as an authoritative source of information about tuple visibility or versioning.

The function's Boolean result value is significant only when checkUnique is UNIQUE_CHECK_PARTIAL. In this case a true result means the new entry is known unique, whereas false means it might be non-unique (and a deferred uniqueness check must be scheduled). For other cases a constant false result is recommended.

Some indexes might not index all tuples. If the tuple is not to be indexed, aminsert should just return without doing anything.

If the index AM wishes to cache data across successive index insertions within an SQL statement, it can allocate space in indexInfo->ii_Context and store a pointer to the data in indexInfo->ii_AmCache (which will be NULL initially). If resources other than memory have to be released after index insertions, aminsertcleanup may be provided, which will be called before the memory is released.

Clean up state that was maintained across successive inserts in indexInfo->ii_AmCache. This is useful if the data requires additional cleanup steps (e.g., releasing pinned buffers), and simply releasing the memory is not sufficient.

Delete tuple(s) from the index. This is a “bulk delete” operation that is intended to be implemented by scanning the whole index and checking each entry to see if it should be deleted. The passed-in callback function must be called, in the style callback(TID, callback_state) returns bool, to determine whether any particular index entry, as identified by its referenced TID, is to be deleted. Must return either NULL or a palloc'd struct containing statistics about the effects of the deletion operation. It is OK to return NULL if no information needs to be passed on to amvacuumcleanup.

Because of limited maintenance_work_mem, ambulkdelete might need to be called more than once when many tuples are to be deleted. The stats argument is the result of the previous call for this index (it is NULL for the first call within a VACUUM operation). This allows the AM to accumulate statistics across the whole operation. Typically, ambulkdelete will modify and return the same struct if the passed stats is not null.

Clean up after a VACUUM operation (zero or more ambulkdelete calls). This does not have to do anything beyond returning index statistics, but it might perform bulk cleanup such as reclaiming empty index pages. stats is whatever the last ambulkdelete call returned, or NULL if ambulkdelete was not called because no tuples needed to be deleted. If the result is not NULL it must be a palloc'd struct. The statistics it contains will be used to update pg_class, and will be reported by VACUUM if VERBOSE is given. It is OK to return NULL if the index was not changed at all during the VACUUM operation, but otherwise correct stats should be returned.

amvacuumcleanup will also be called at completion of an ANALYZE operation. In this case stats is always NULL and any return value will be ignored. This case can be distinguished by checking info->analyze_only. It is recommended that the access method do nothing except post-insert cleanup in such a call, and that only in an autovacuum worker process.

Check whether the index can support index-only scans on the given column, by returning the column's original indexed value. The attribute number is 1-based, i.e., the first column's attno is 1. Returns true if supported, else false. This function should always return true for included columns (if those are supported), since there's little point in an included column that can't be retrieved. If the access method does not support index-only scans at all, the amcanreturn field in its IndexAmRoutine struct can be set to NULL.

Estimate the costs of an index scan. This function is described fully in Section 63.6, below.

Compute the height of a tree-shaped index. This information is supplied to the amcostestimate function in path->indexinfo->tree_height and can be used to support the cost estimation. The result is not used anywhere else, so this function can actually be used to compute any kind of data (that fits into an integer) about the index that the cost estimation function might want to know. If the computation is expensive, it could be useful to cache the result as part of RelationData.rd_amcache.

Parse and validate the reloptions array for an index. This is called only when a non-null reloptions array exists for the index. reloptions is a text array containing entries of the form name=value. The function should construct a bytea value, which will be copied into the rd_options field of the index's relcache entry. The data contents of the bytea value are open for the access method to define; most of the standard access methods use struct StdRdOptions. When validate is true, the function should report a suitable error message if any of the options are unrecognized or have invalid values; when validate is false, invalid entries should be silently ignored. (validate is false when loading options already stored in pg_catalog; an invalid entry could only be found if the access method has changed its rules for options, and in that case ignoring obsolete entries is appropriate.) It is OK to return NULL if default behavior is wanted.

The amproperty method allows index access methods to override the default behavior of pg_index_column_has_property and related functions. If the access method does not have any special behavior for index property inquiries, the amproperty field in its IndexAmRoutine struct can be set to NULL. Otherwise, the amproperty method will be called with index_oid and attno both zero for pg_indexam_has_property calls, or with index_oid valid and attno zero for pg_index_has_property calls, or with index_oid valid and attno greater than zero for pg_index_column_has_property calls. prop is an enum value identifying the property being tested, while propname is the original property name string. If the core code does not recognize the property name then prop is AMPROP_UNKNOWN. Access methods can define custom property names by checking propname for a match (use pg_strcasecmp to match, for consistency with the core code); for names known to the core code, it's better to inspect prop. If the amproperty method returns true then it has determined the property test result: it must set *res to the Boolean value to return, or set *isnull to true to return a NULL. (Both of the referenced variables are initialized to false before the call.) If the amproperty method returns false then the core code will proceed with its normal logic for determining the property test result.

Access methods that support ordering operators should implement AMPROP_DISTANCE_ORDERABLE property testing, as the core code does not know how to do that and will return NULL. It may also be advantageous to implement AMPROP_RETURNABLE testing, if that can be done more cheaply than by opening the index and calling amcanreturn, which is the core code's default behavior. The default behavior should be satisfactory for all other standard properties.

Return the textual name of the given build phase number. The phase numbers are those reported during an index build via the pgstat_progress_update_param interface. The phase names are then exposed in the pg_stat_progress_create_index view.

Validate the catalog entries for the specified operator class, so far as the access method can reasonably do that. For example, this might include testing that all required support functions are provided. The amvalidate function must return false if the opclass is invalid. Problems should be reported with ereport messages, typically at INFO level.

Validate proposed new operator and function members of an operator family, so far as the access method can reasonably do that, and set their dependency types if the default is not satisfactory. This is called during CREATE OPERATOR CLASS and during ALTER OPERATOR FAMILY ADD; in the latter case opclassoid is InvalidOid. The List arguments are lists of OpFamilyMember structs, as defined in amapi.h. Tests done by this function will typically be a subset of those performed by amvalidate, since amadjustmembers cannot assume that it is seeing a complete set of members. For example, it would be reasonable to check the signature of a support function, but not to check whether all required support functions are provided. Any problems can be reported by throwing an error. The dependency-related fields of the OpFamilyMember structs are initialized by the core code to create hard dependencies on the opclass if this is CREATE OPERATOR CLASS, or soft dependencies on the opfamily if this is ALTER OPERATOR FAMILY ADD. amadjustmembers can adjust these fields if some other behavior is more appropriate. For example, GIN, GiST, and SP-GiST always set operator members to have soft dependencies on the opfamily, since the connection between an operator and an opclass is relatively weak in these index types; so it is reasonable to allow operator members to be added and removed freely. Optional support functions are typically also given soft dependencies, so that they can be removed if necessary.

The purpose of an index, of course, is to support scans for tuples matching an indexable WHERE condition, often called a qualifier or scan key. The semantics of index scanning are described more fully in Section 63.3, below. An index access method can support “plain” index scans, “bitmap” index scans, or both. The scan-related functions that an index access method must or may provide are:

Prepare for an index scan. The nkeys and norderbys parameters indicate the number of quals and ordering operators that will be used in the scan; these may be useful for space allocation purposes. Note that the actual values of the scan keys aren't provided yet. The result must be a palloc'd struct. For implementation reasons the index access method must create this struct by calling RelationGetIndexScan(). In most cases ambeginscan does little beyond making that call and perhaps acquiring locks; the interesting parts of index-scan startup are in amrescan.

Start or restart an index scan, possibly with new scan keys. (To restart using previously-passed keys, NULL is passed for keys and/or orderbys.) Note that it is not allowed for the number of keys or order-by operators to be larger than what was passed to ambeginscan. In practice the restart feature is used when a new outer tuple is selected by a nested-loop join and so a new key comparison value is needed, but the scan key structure remains the same.

Fetch the next tuple in the given scan, moving in the given direction (forward or backward in the index). Returns true if a tuple was obtained, false if no matching tuples remain. In the true case the tuple TID is stored into the scan structure. Note that “success” means only that the index contains an entry that matches the scan keys, not that the tuple necessarily still exists in the heap or will pass the caller's snapshot test. On success, amgettuple must also set scan->xs_recheck to true or false. False means it is certain that the index entry matches the scan keys. True means this is not certain, and the conditions represented by the scan keys must be rechecked against the heap tuple after fetching it. This provision supports “lossy” index operators. Note that rechecking will extend only to the scan conditions; a partial index predicate (if any) is never rechecked by amgettuple callers.

If the index supports index-only scans (i.e., amcanreturn returns true for any of its columns), then on success the AM must also check scan->xs_want_itup, and if that is true it must return the originally indexed data for the index entry. Columns for which amcanreturn returns false can be returned as nulls. The data can be returned in the form of an IndexTuple pointer stored at scan->xs_itup, with tuple descriptor scan->xs_itupdesc; or in the form of a HeapTuple pointer stored at scan->xs_hitup, with tuple descriptor scan->xs_hitupdesc. (The latter format should be used when reconstructing data that might possibly not fit into an IndexTuple.) In either case, management of the data referenced by the pointer is the access method's responsibility. The data must remain good at least until the next amgettuple, amrescan, or amendscan call for the scan.

The amgettuple function need only be provided if the access method supports “plain” index scans. If it doesn't, the amgettuple field in its IndexAmRoutine struct must be set to NULL.

Fetch all tuples in the given scan and add them to the caller-supplied TIDBitmap (that is, OR the set of tuple IDs into whatever set is already in the bitmap). The number of tuples fetched is returned (this might be just an approximate count, for instance some AMs do not detect duplicates). While inserting tuple IDs into the bitmap, amgetbitmap can indicate that rechecking of the scan conditions is required for specific tuple IDs. This is analogous to the xs_recheck output parameter of amgettuple. Note: in the current implementation, support for this feature is conflated with support for lossy storage of the bitmap itself, and therefore callers recheck both the scan conditions and the partial index predicate (if any) for recheckable tuples. That might not always be true, however. amgetbitmap and amgettuple cannot be used in the same index scan; there are other restrictions too when using amgetbitmap, as explained in Section 63.3.

The amgetbitmap function need only be provided if the access method supports “bitmap” index scans. If it doesn't, the amgetbitmap field in its IndexAmRoutine struct must be set to NULL.

End a scan and release resources. The scan struct itself should not be freed, but any locks or pins taken internally by the access method must be released, as well as any other memory allocated by ambeginscan and other scan-related functions.

Mark current scan position. The access method need only support one remembered scan position per scan.

The ammarkpos function need only be provided if the access method supports ordered scans. If it doesn't, the ammarkpos field in its IndexAmRoutine struct may be set to NULL.

Restore the scan to the most recently marked position.

The amrestrpos function need only be provided if the access method supports ordered scans. If it doesn't, the amrestrpos field in its IndexAmRoutine struct may be set to NULL.

In addition to supporting ordinary index scans, some types of index may wish to support parallel index scans, which allow multiple backends to cooperate in performing an index scan. The index access method should arrange things so that each cooperating process returns a subset of the tuples that would be performed by an ordinary, non-parallel index scan, but in such a way that the union of those subsets is equal to the set of tuples that would be returned by an ordinary, non-parallel index scan. Furthermore, while there need not be any global ordering of tuples returned by a parallel scan, the ordering of that subset of tuples returned within each cooperating backend must match the requested ordering. The following functions may be implemented to support parallel index scans:

Estimate and return the number of bytes of dynamic shared memory which the access method will be needed to perform a parallel scan. (This number is in addition to, not in lieu of, the amount of space needed for AM-independent data in ParallelIndexScanDescData.)

The nkeys and norderbys parameters indicate the number of quals and ordering operators that will be used in the scan; the same values will be passed to amrescan. Note that the actual values of the scan keys aren't provided yet.

It is not necessary to implement this function for access methods which do not support parallel scans or for which the number of additional bytes of storage required is zero.

This function will be called to initialize dynamic shared memory at the beginning of a parallel scan. target will point to at least the number of bytes previously returned by amestimateparallelscan, and this function may use that amount of space to store whatever data it wishes.

It is not necessary to implement this function for access methods which do not support parallel scans or in cases where the shared memory space required needs no initialization.

This function, if implemented, will be called when a parallel index scan must be restarted. It should reset any shared state set up by aminitparallelscan such that the scan will be restarted from the beginning.

These functions, if implemented, will be called by the planner and executor to convert between fixed CompareType values and the specific strategy numbers used by the access method. These functions can be implemented by access methods that implement functionality similar to the built-in btree or hash access methods, and by implementing these translations, the system can learn about the semantics of the access method's operations and can use them in place of btree or hash indexes in various places. If the functionality of the access method is not similar to those built-in access methods, these functions do not need to be implemented. If the functions are not implemented, the access method will be ignored for certain planner and executor decisions, but is otherwise fully functional.

**Examples:**

Example 1 (unknown):
```unknown
IndexAmRoutine
```

Example 2 (unknown):
```unknown
IndexBuildResult *
ambuild (Relation heapRelation,
         Relation indexRelation,
         IndexInfo *indexInfo);
```

Example 3 (unknown):
```unknown
table_index_build_scan()
```

Example 4 (unknown):
```unknown
amcanbuildparallel
```

---


---

## 63.1. Basic API Structure for Indexes #


**URL:** https://www.postgresql.org/docs/18/index-api.html

**Contents:**
- 63.1. Basic API Structure for Indexes #

Each index access method is described by a row in the pg_am system catalog. The pg_am entry specifies a name and a handler function for the index access method. These entries can be created and deleted using the CREATE ACCESS METHOD and DROP ACCESS METHOD SQL commands.

An index access method handler function must be declared to accept a single argument of type internal and to return the pseudo-type index_am_handler. The argument is a dummy value that simply serves to prevent handler functions from being called directly from SQL commands. The result of the function must be a palloc'd struct of type IndexAmRoutine, which contains everything that the core code needs to know to make use of the index access method. The IndexAmRoutine struct, also called the access method's API struct, includes fields specifying assorted fixed properties of the access method, such as whether it can support multicolumn indexes. More importantly, it contains pointers to support functions for the access method, which do all of the real work to access indexes. These support functions are plain C functions and are not visible or callable at the SQL level. The support functions are described in Section 63.2.

The structure IndexAmRoutine is defined thus:

To be useful, an index access method must also have one or more operator families and operator classes defined in pg_opfamily, pg_opclass, pg_amop, and pg_amproc. These entries allow the planner to determine what kinds of query qualifications can be used with indexes of this access method. Operator families and classes are described in Section 36.16, which is prerequisite material for reading this chapter.

An individual index is defined by a pg_class entry that describes it as a physical relation, plus a pg_index entry that shows the logical content of the index — that is, the set of index columns it has and the semantics of those columns, as captured by the associated operator classes. The index columns (key values) can be either simple columns of the underlying table or expressions over the table rows. The index access method normally has no interest in where the index key values come from (it is always handed precomputed key values) but it will be very interested in the operator class information in pg_index. Both of these catalog entries can be accessed as part of the Relation data structure that is passed to all operations on the index.

Some of the flag fields of IndexAmRoutine have nonobvious implications. The requirements of amcanunique are discussed in Section 63.5. The amcanmulticol flag asserts that the access method supports multi-key-column indexes, while amoptionalkey asserts that it allows scans where no indexable restriction clause is given for the first index column. When amcanmulticol is false, amoptionalkey essentially says whether the access method supports full-index scans without any restriction clause. Access methods that support multiple index columns must support scans that omit restrictions on any or all of the columns after the first; however they are permitted to require some restriction to appear for the first index column, and this is signaled by setting amoptionalkey false. One reason that an index AM might set amoptionalkey false is if it doesn't index null values. Since most indexable operators are strict and hence cannot return true for null inputs, it is at first sight attractive to not store index entries for null values: they could never be returned by an index scan anyway. However, this argument fails when an index scan has no restriction clause for a given index column. In practice this means that indexes that have amoptionalkey true must index nulls, since the planner might decide to use such an index with no scan keys at all. A related restriction is that an index access method that supports multiple index columns must support indexing null values in columns after the first, because the planner will assume the index can be used for queries that do not restrict these columns. For example, consider an index on (a,b) and a query with WHERE a = 4. The system will assume the index can be used to scan for rows with a = 4, which is wrong if the index omits rows where b is null. It is, however, OK to omit rows where the first indexed column is null. An index access method that does index nulls may also set amsearchnulls, indicating that it supports IS NULL and IS NOT NULL clauses as search conditions.

The amcaninclude flag indicates whether the access method supports “included” columns, that is it can store (without processing) additional columns beyond the key column(s). The requirements of the preceding paragraph apply only to the key columns. In particular, the combination of amcanmulticol=false and amcaninclude=true is sensible: it means that there can only be one key column, but there can also be included column(s). Also, included columns must be allowed to be null, independently of amoptionalkey.

The amsummarizing flag indicates whether the access method summarizes the indexed tuples, with summarizing granularity of at least per block. Access methods that do not point to individual tuples, but to block ranges (like BRIN), may allow the HOT optimization to continue. This does not apply to attributes referenced in index predicates, an update of such an attribute always disables HOT.

**Examples:**

Example 1 (unknown):
```unknown
index_am_handler
```

Example 2 (unknown):
```unknown
IndexAmRoutine
```

Example 3 (unknown):
```unknown
IndexAmRoutine
```

Example 4 (unknown):
```unknown
IndexAmRoutine
```

---


---

## 63.4. Index Locking Considerations #


**URL:** https://www.postgresql.org/docs/18/index-locking.html

**Contents:**
- 63.4. Index Locking Considerations #

Index access methods must handle concurrent updates of the index by multiple processes. The core PostgreSQL system obtains AccessShareLock on the index during an index scan, and RowExclusiveLock when updating the index (including plain VACUUM). Since these lock types do not conflict, the access method is responsible for handling any fine-grained locking it might need. An ACCESS EXCLUSIVE lock on the index as a whole will be taken only during index creation, destruction, or REINDEX (SHARE UPDATE EXCLUSIVE is taken instead with CONCURRENTLY).

Building an index type that supports concurrent updates usually requires extensive and subtle analysis of the required behavior. For the b-tree and hash index types, you can read about the design decisions involved in src/backend/access/nbtree/README and src/backend/access/hash/README.

Aside from the index's own internal consistency requirements, concurrent updates create issues about consistency between the parent table (the heap) and the index. Because PostgreSQL separates accesses and updates of the heap from those of the index, there are windows in which the index might be inconsistent with the heap. We handle this problem with the following rules:

A new heap entry is made before making its index entries. (Therefore a concurrent index scan is likely to fail to see the heap entry. This is okay because the index reader would be uninterested in an uncommitted row anyway. But see Section 63.5.)

When a heap entry is to be deleted (by VACUUM), all its index entries must be removed first.

An index scan must maintain a pin on the index page holding the item last returned by amgettuple, and ambulkdelete cannot delete entries from pages that are pinned by other backends. The need for this rule is explained below.

Without the third rule, it is possible for an index reader to see an index entry just before it is removed by VACUUM, and then to arrive at the corresponding heap entry after that was removed by VACUUM. This creates no serious problems if that item number is still unused when the reader reaches it, since an empty item slot will be ignored by heap_fetch(). But what if a third backend has already re-used the item slot for something else? When using an MVCC-compliant snapshot, there is no problem because the new occupant of the slot is certain to be too new to pass the snapshot test. However, with a non-MVCC-compliant snapshot (such as SnapshotAny), it would be possible to accept and return a row that does not in fact match the scan keys. We could defend against this scenario by requiring the scan keys to be rechecked against the heap row in all cases, but that is too expensive. Instead, we use a pin on an index page as a proxy to indicate that the reader might still be “in flight” from the index entry to the matching heap entry. Making ambulkdelete block on such a pin ensures that VACUUM cannot delete the heap entry before the reader is done with it. This solution costs little in run time, and adds blocking overhead only in the rare cases where there actually is a conflict.

This solution requires that index scans be “synchronous”: we have to fetch each heap tuple immediately after scanning the corresponding index entry. This is expensive for a number of reasons. An “asynchronous” scan in which we collect many TIDs from the index, and only visit the heap tuples sometime later, requires much less index locking overhead and can allow a more efficient heap access pattern. Per the above analysis, we must use the synchronous approach for non-MVCC-compliant snapshots, but an asynchronous scan is workable for a query using an MVCC snapshot.

In an amgetbitmap index scan, the access method does not keep an index pin on any of the returned tuples. Therefore it is only safe to use such scans with MVCC-compliant snapshots.

When the ampredlocks flag is not set, any scan using that index access method within a serializable transaction will acquire a nonblocking predicate lock on the full index. This will generate a read-write conflict with the insert of any tuple into that index by a concurrent serializable transaction. If certain patterns of read-write conflicts are detected among a set of concurrent serializable transactions, one of those transactions may be canceled to protect data integrity. When the flag is set, it indicates that the index access method implements finer-grained predicate locking, which will tend to reduce the frequency of such transaction cancellations.

**Examples:**

Example 1 (unknown):
```unknown
AccessShareLock
```

Example 2 (unknown):
```unknown
RowExclusiveLock
```

Example 3 (unknown):
```unknown
ACCESS EXCLUSIVE
```

Example 4 (sql):
```sql
SHARE UPDATE EXCLUSIVE
```

---


---

