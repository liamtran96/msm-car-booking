# PostgreSQL - Indexes

## 65.1. B-Tree Indexes #


**URL:** https://www.postgresql.org/docs/18/btree.html

**Contents:**
- 65.1. B-Tree Indexes #
  - 65.1.1. Introduction #
  - 65.1.2. Behavior of B-Tree Operator Classes #
  - 65.1.3. B-Tree Support Functions #
  - 65.1.4. Implementation #
    - 65.1.4.1. B-Tree Structure #
    - 65.1.4.2. Bottom-up Index Deletion #
  - Note
    - 65.1.4.3. Deduplication #
  - Note

PostgreSQL includes an implementation of the standard btree (multi-way balanced tree) index data structure. Any data type that can be sorted into a well-defined linear order can be indexed by a btree index. The only limitation is that an index entry cannot exceed approximately one-third of a page (after TOAST compression, if applicable).

Because each btree operator class imposes a sort order on its data type, btree operator classes (or, really, operator families) have come to be used as PostgreSQL's general representation and understanding of sorting semantics. Therefore, they've acquired some features that go beyond what would be needed just to support btree indexes, and parts of the system that are quite distant from the btree AM make use of them.

As shown in Table 36.3, a btree operator class must provide five comparison operators, <, <=, =, >= and >. One might expect that <> should also be part of the operator class, but it is not, because it would almost never be useful to use a <> WHERE clause in an index search. (For some purposes, the planner treats <> as associated with a btree operator class; but it finds that operator via the = operator's negator link, rather than from pg_amop.)

When several data types share near-identical sorting semantics, their operator classes can be grouped into an operator family. Doing so is advantageous because it allows the planner to make deductions about cross-type comparisons. Each operator class within the family should contain the single-type operators (and associated support functions) for its input data type, while cross-type comparison operators and support functions are “loose” in the family. It is recommendable that a complete set of cross-type operators be included in the family, thus ensuring that the planner can represent any comparison conditions that it deduces from transitivity.

There are some basic assumptions that a btree operator family must satisfy:

An = operator must be an equivalence relation; that is, for all non-null values A, B, C of the data type:

A = A is true (reflexive law)

if A = B, then B = A (symmetric law)

if A = B and B = C, then A = C (transitive law)

A < operator must be a strong ordering relation; that is, for all non-null values A, B, C:

A < A is false (irreflexive law)

if A < B and B < C, then A < C (transitive law)

Furthermore, the ordering is total; that is, for all non-null values A, B:

exactly one of A < B, A = B, and B < A is true (trichotomy law)

(The trichotomy law justifies the definition of the comparison support function, of course.)

The other three operators are defined in terms of = and < in the obvious way, and must act consistently with them.

For an operator family supporting multiple data types, the above laws must hold when A, B, C are taken from any data types in the family. The transitive laws are the trickiest to ensure, as in cross-type situations they represent statements that the behaviors of two or three different operators are consistent. As an example, it would not work to put float8 and numeric into the same operator family, at least not with the current semantics that numeric values are converted to float8 for comparison to a float8. Because of the limited accuracy of float8, this means there are distinct numeric values that will compare equal to the same float8 value, and thus the transitive law would fail.

Another requirement for a multiple-data-type family is that any implicit or binary-coercion casts that are defined between data types included in the operator family must not change the associated sort ordering.

It should be fairly clear why a btree index requires these laws to hold within a single data type: without them there is no ordering to arrange the keys with. Also, index searches using a comparison key of a different data type require comparisons to behave sanely across two data types. The extensions to three or more data types within a family are not strictly required by the btree index mechanism itself, but the planner relies on them for optimization purposes.

As shown in Table 36.9, btree defines one required and five optional support functions. The six user-defined methods are:

For each combination of data types that a btree operator family provides comparison operators for, it must provide a comparison support function, registered in pg_amproc with support function number 1 and amproclefttype/amprocrighttype equal to the left and right data types for the comparison (i.e., the same data types that the matching operators are registered with in pg_amop). The comparison function must take two non-null values A and B and return an int32 value that is < 0, 0, or > 0 when A < B, A = B, or A > B, respectively. A null result is disallowed: all values of the data type must be comparable. See src/backend/access/nbtree/nbtcompare.c for examples.

If the compared values are of a collatable data type, the appropriate collation OID will be passed to the comparison support function, using the standard PG_GET_COLLATION() mechanism.

Optionally, a btree operator family may provide sort support function(s), registered under support function number 2. These functions allow implementing comparisons for sorting purposes in a more efficient way than naively calling the comparison support function. The APIs involved in this are defined in src/include/utils/sortsupport.h.

Optionally, a btree operator family may provide in_range support function(s), registered under support function number 3. These are not used during btree index operations; rather, they extend the semantics of the operator family so that it can support window clauses containing the RANGE offset PRECEDING and RANGE offset FOLLOWING frame bound types (see Section 4.2.8). Fundamentally, the extra information provided is how to add or subtract an offset value in a way that is compatible with the family's data ordering.

An in_range function must have the signature

val and base must be of the same type, which is one of the types supported by the operator family (i.e., a type for which it provides an ordering). However, offset could be of a different type, which might be one otherwise unsupported by the family. An example is that the built-in time_ops family provides an in_range function that has offset of type interval. A family can provide in_range functions for any of its supported types and one or more offset types. Each in_range function should be entered in pg_amproc with amproclefttype equal to type1 and amprocrighttype equal to type2.

The essential semantics of an in_range function depend on the two Boolean flag parameters. It should add or subtract base and offset, then compare val to the result, as follows:

if !sub and !less, return val >= (base + offset)

if !sub and less, return val <= (base + offset)

if sub and !less, return val >= (base - offset)

if sub and less, return val <= (base - offset)

Before doing so, the function should check the sign of offset: if it is less than zero, raise error ERRCODE_INVALID_PRECEDING_OR_FOLLOWING_SIZE (22013) with error text like “invalid preceding or following size in window function”. (This is required by the SQL standard, although nonstandard operator families might perhaps choose to ignore this restriction, since there seems to be little semantic necessity for it.) This requirement is delegated to the in_range function so that the core code needn't understand what “less than zero” means for a particular data type.

An additional expectation is that in_range functions should, if practical, avoid throwing an error if base + offset or base - offset would overflow. The correct comparison result can be determined even if that value would be out of the data type's range. Note that if the data type includes concepts such as “infinity” or “NaN”, extra care may be needed to ensure that in_range's results agree with the normal sort order of the operator family.

The results of the in_range function must be consistent with the sort ordering imposed by the operator family. To be precise, given any fixed values of offset and sub, then:

If in_range with less = true is true for some val1 and base, it must be true for every val2 <= val1 with the same base.

If in_range with less = true is false for some val1 and base, it must be false for every val2 >= val1 with the same base.

If in_range with less = true is true for some val and base1, it must be true for every base2 >= base1 with the same val.

If in_range with less = true is false for some val and base1, it must be false for every base2 <= base1 with the same val.

Analogous statements with inverted conditions hold when less = false.

If the type being ordered (type1) is collatable, the appropriate collation OID will be passed to the in_range function, using the standard PG_GET_COLLATION() mechanism.

in_range functions need not handle NULL inputs, and typically will be marked strict.

Optionally, a btree operator family may provide equalimage (“equality implies image equality”) support functions, registered under support function number 4. These functions allow the core code to determine when it is safe to apply the btree deduplication optimization. Currently, equalimage functions are only called when building or rebuilding an index.

An equalimage function must have the signature

The return value is static information about an operator class and collation. Returning true indicates that the order function for the operator class is guaranteed to only return 0 (“arguments are equal”) when its A and B arguments are also interchangeable without any loss of semantic information. Not registering an equalimage function or returning false indicates that this condition cannot be assumed to hold.

The opcintype argument is the pg_type.oid of the data type that the operator class indexes. This is a convenience that allows reuse of the same underlying equalimage function across operator classes. If opcintype is a collatable data type, the appropriate collation OID will be passed to the equalimage function, using the standard PG_GET_COLLATION() mechanism.

As far as the operator class is concerned, returning true indicates that deduplication is safe (or safe for the collation whose OID was passed to its equalimage function). However, the core code will only deem deduplication safe for an index when every indexed column uses an operator class that registers an equalimage function, and each function actually returns true when called.

Image equality is almost the same condition as simple bitwise equality. There is one subtle difference: When indexing a varlena data type, the on-disk representation of two image equal datums may not be bitwise equal due to inconsistent application of TOAST compression on input. Formally, when an operator class's equalimage function returns true, it is safe to assume that the datum_image_eq() C function will always agree with the operator class's order function (provided that the same collation OID is passed to both the equalimage and order functions).

The core code is fundamentally unable to deduce anything about the “equality implies image equality” status of an operator class within a multiple-data-type family based on details from other operator classes in the same family. Also, it is not sensible for an operator family to register a cross-type equalimage function, and attempting to do so will result in an error. This is because “equality implies image equality” status does not just depend on sorting/equality semantics, which are more or less defined at the operator family level. In general, the semantics that one particular data type implements must be considered separately.

The convention followed by the operator classes included with the core PostgreSQL distribution is to register a stock, generic equalimage function. Most operator classes register btequalimage(), which indicates that deduplication is safe unconditionally. Operator classes for collatable data types such as text register btvarstrequalimage(), which indicates that deduplication is safe with deterministic collations. Best practice for third-party extensions is to register their own custom function to retain control.

Optionally, a B-tree operator family may provide options (“operator class specific options”) support functions, registered under support function number 5. These functions define a set of user-visible parameters that control operator class behavior.

An options support function must have the signature

The function is passed a pointer to a local_relopts struct, which needs to be filled with a set of operator class specific options. The options can be accessed from other support functions using the PG_HAS_OPCLASS_OPTIONS() and PG_GET_OPCLASS_OPTIONS() macros.

Currently, no B-Tree operator class has an options support function. B-tree doesn't allow flexible representation of keys like GiST, SP-GiST, GIN and BRIN do. So, options probably doesn't have much application in the current B-tree index access method. Nevertheless, this support function was added to B-tree for uniformity, and will probably find uses during further evolution of B-tree in PostgreSQL.

Optionally, a btree operator family may provide a skip support function, registered under support function number 6. These functions give the B-tree code a way to iterate through every possible value that can be represented by an operator class's underlying input type, in key space order. This is used by the core code when it applies the skip scan optimization. The APIs involved in this are defined in src/include/utils/skipsupport.h.

Operator classes that do not provide a skip support function are still eligible to use skip scan. The core code can still use its fallback strategy, though that might be suboptimal for some discrete types. It usually doesn't make sense (and may not even be feasible) for operator classes on continuous types to provide a skip support function.

It is not sensible for an operator family to register a cross-type skipsupport function, and attempting to do so will result in an error. This is because determining the next indexable value must happen by incrementing a value copied from an index tuple. The values generated must all be of the same underlying data type (the “skipped” index column's opclass input type).

This section covers B-Tree index implementation details that may be of use to advanced users. See src/backend/access/nbtree/README in the source distribution for a much more detailed, internals-focused description of the B-Tree implementation.

PostgreSQL B-Tree indexes are multi-level tree structures, where each level of the tree can be used as a doubly-linked list of pages. A single metapage is stored in a fixed position at the start of the first segment file of the index. All other pages are either leaf pages or internal pages. Leaf pages are the pages on the lowest level of the tree. All other levels consist of internal pages. Each leaf page contains tuples that point to table rows. Each internal page contains tuples that point to the next level down in the tree. Typically, over 99% of all pages are leaf pages. Both internal pages and leaf pages use the standard page format described in Section 66.6.

New leaf pages are added to a B-Tree index when an existing leaf page cannot fit an incoming tuple. A page split operation makes room for items that originally belonged on the overflowing page by moving a portion of the items to a new page. Page splits must also insert a new downlink to the new page in the parent page, which may cause the parent to split in turn. Page splits “cascade upwards” in a recursive fashion. When the root page finally cannot fit a new downlink, a root page split operation takes place. This adds a new level to the tree structure by creating a new root page that is one level above the original root page.

B-Tree indexes are not directly aware that under MVCC, there might be multiple extant versions of the same logical table row; to an index, each tuple is an independent object that needs its own index entry. “Version churn” tuples may sometimes accumulate and adversely affect query latency and throughput. This typically occurs with UPDATE-heavy workloads where most individual updates cannot apply the HOT optimization. Changing the value of only one column covered by one index during an UPDATE always necessitates a new set of index tuples — one for each and every index on the table. Note in particular that this includes indexes that were not “logically modified” by the UPDATE. All indexes will need a successor physical index tuple that points to the latest version in the table. Each new tuple within each index will generally need to coexist with the original “updated” tuple for a short period of time (typically until shortly after the UPDATE transaction commits).

B-Tree indexes incrementally delete version churn index tuples by performing bottom-up index deletion passes. Each deletion pass is triggered in reaction to an anticipated “version churn page split”. This only happens with indexes that are not logically modified by UPDATE statements, where concentrated build up of obsolete versions in particular pages would occur otherwise. A page split will usually be avoided, though it's possible that certain implementation-level heuristics will fail to identify and delete even one garbage index tuple (in which case a page split or deduplication pass resolves the issue of an incoming new tuple not fitting on a leaf page). The worst-case number of versions that any index scan must traverse (for any single logical row) is an important contributor to overall system responsiveness and throughput. A bottom-up index deletion pass targets suspected garbage tuples in a single leaf page based on qualitative distinctions involving logical rows and versions. This contrasts with the “top-down” index cleanup performed by autovacuum workers, which is triggered when certain quantitative table-level thresholds are exceeded (see Section 24.1.6).

Not all deletion operations that are performed within B-Tree indexes are bottom-up deletion operations. There is a distinct category of index tuple deletion: simple index tuple deletion. This is a deferred maintenance operation that deletes index tuples that are known to be safe to delete (those whose item identifier's LP_DEAD bit is already set). Like bottom-up index deletion, simple index deletion takes place at the point that a page split is anticipated as a way of avoiding the split.

Simple deletion is opportunistic in the sense that it can only take place when recent index scans set the LP_DEAD bits of affected items in passing. Prior to PostgreSQL 14, the only category of B-Tree deletion was simple deletion. The main differences between it and bottom-up deletion are that only the former is opportunistically driven by the activity of passing index scans, while only the latter specifically targets version churn from UPDATEs that do not logically modify indexed columns.

Bottom-up index deletion performs the vast majority of all garbage index tuple cleanup for particular indexes with certain workloads. This is expected with any B-Tree index that is subject to significant version churn from UPDATEs that rarely or never logically modify the columns that the index covers. The average and worst-case number of versions per logical row can be kept low purely through targeted incremental deletion passes. It's quite possible that the on-disk size of certain indexes will never increase by even one single page/block despite constant version churn from UPDATEs. Even then, an exhaustive “clean sweep” by a VACUUM operation (typically run in an autovacuum worker process) will eventually be required as a part of collective cleanup of the table and each of its indexes.

Unlike VACUUM, bottom-up index deletion does not provide any strong guarantees about how old the oldest garbage index tuple may be. No index can be permitted to retain “floating garbage” index tuples that became dead prior to a conservative cutoff point shared by the table and all of its indexes collectively. This fundamental table-level invariant makes it safe to recycle table TIDs. This is how it is possible for distinct logical rows to reuse the same table TID over time (though this can never happen with two logical rows whose lifetimes span the same VACUUM cycle).

A duplicate is a leaf page tuple (a tuple that points to a table row) where all indexed key columns have values that match corresponding column values from at least one other leaf page tuple in the same index. Duplicate tuples are quite common in practice. B-Tree indexes can use a special, space-efficient representation for duplicates when an optional technique is enabled: deduplication.

Deduplication works by periodically merging groups of duplicate tuples together, forming a single posting list tuple for each group. The column key value(s) only appear once in this representation. This is followed by a sorted array of TIDs that point to rows in the table. This significantly reduces the storage size of indexes where each value (or each distinct combination of column values) appears several times on average. The latency of queries can be reduced significantly. Overall query throughput may increase significantly. The overhead of routine index vacuuming may also be reduced significantly.

B-Tree deduplication is just as effective with “duplicates” that contain a NULL value, even though NULL values are never equal to each other according to the = member of any B-Tree operator class. As far as any part of the implementation that understands the on-disk B-Tree structure is concerned, NULL is just another value from the domain of indexed values.

The deduplication process occurs lazily, when a new item is inserted that cannot fit on an existing leaf page, though only when index tuple deletion could not free sufficient space for the new item (typically deletion is briefly considered and then skipped over). Unlike GIN posting list tuples, B-Tree posting list tuples do not need to expand every time a new duplicate is inserted; they are merely an alternative physical representation of the original logical contents of the leaf page. This design prioritizes consistent performance with mixed read-write workloads. Most client applications will at least see a moderate performance benefit from using deduplication. Deduplication is enabled by default.

CREATE INDEX and REINDEX apply deduplication to create posting list tuples, though the strategy they use is slightly different. Each group of duplicate ordinary tuples encountered in the sorted input taken from the table is merged into a posting list tuple before being added to the current pending leaf page. Individual posting list tuples are packed with as many TIDs as possible. Leaf pages are written out in the usual way, without any separate deduplication pass. This strategy is well-suited to CREATE INDEX and REINDEX because they are once-off batch operations.

Write-heavy workloads that don't benefit from deduplication due to having few or no duplicate values in indexes will incur a small, fixed performance penalty (unless deduplication is explicitly disabled). The deduplicate_items storage parameter can be used to disable deduplication within individual indexes. There is never any performance penalty with read-only workloads, since reading posting list tuples is at least as efficient as reading the standard tuple representation. Disabling deduplication isn't usually helpful.

It is sometimes possible for unique indexes (as well as unique constraints) to use deduplication. This allows leaf pages to temporarily “absorb” extra version churn duplicates. Deduplication in unique indexes augments bottom-up index deletion, especially in cases where a long-running transaction holds a snapshot that blocks garbage collection. The goal is to buy time for the bottom-up index deletion strategy to become effective again. Delaying page splits until a single long-running transaction naturally goes away can allow a bottom-up deletion pass to succeed where an earlier deletion pass failed.

A special heuristic is applied to determine whether a deduplication pass in a unique index should take place. It can often skip straight to splitting a leaf page, avoiding a performance penalty from wasting cycles on unhelpful deduplication passes. If you're concerned about the overhead of deduplication, consider setting deduplicate_items = off selectively. Leaving deduplication enabled in unique indexes has little downside.

Deduplication cannot be used in all cases due to implementation-level restrictions. Deduplication safety is determined when CREATE INDEX or REINDEX is run.

Note that deduplication is deemed unsafe and cannot be used in the following cases involving semantically significant differences among equal datums:

text, varchar, and char cannot use deduplication when a nondeterministic collation is used. Case and accent differences must be preserved among equal datums.

numeric cannot use deduplication. Numeric display scale must be preserved among equal datums.

jsonb cannot use deduplication, since the jsonb B-Tree operator class uses numeric internally.

float4 and float8 cannot use deduplication. These types have distinct representations for -0 and 0, which are nevertheless considered equal. This difference must be preserved.

There is one further implementation-level restriction that may be lifted in a future version of PostgreSQL:

Container types (such as composite types, arrays, or range types) cannot use deduplication.

There is one further implementation-level restriction that applies regardless of the operator class or collation used:

INCLUDE indexes can never use deduplication.

**Examples:**

Example 1 (unknown):
```unknown
amproclefttype
```

Example 2 (unknown):
```unknown
amprocrighttype
```

Example 3 (unknown):
```unknown
src/backend/access/nbtree/nbtcompare.c
```

Example 4 (unknown):
```unknown
PG_GET_COLLATION()
```

---


---

## 65.5. BRIN Indexes #


**URL:** https://www.postgresql.org/docs/18/brin.html

**Contents:**
- 65.5. BRIN Indexes #
  - 65.5.1. Introduction #
    - 65.5.1.1. Index Maintenance #
  - 65.5.2. Built-in Operator Classes #
    - 65.5.2.1. Operator Class Parameters #
  - 65.5.3. Extensibility #

BRIN stands for Block Range Index. BRIN is designed for handling very large tables in which certain columns have some natural correlation with their physical location within the table.

BRIN works in terms of block ranges (or “page ranges”). A block range is a group of pages that are physically adjacent in the table; for each block range, some summary info is stored by the index. For example, a table storing a store's sale orders might have a date column on which each order was placed, and most of the time the entries for earlier orders will appear earlier in the table as well; a table storing a ZIP code column might have all codes for a city grouped together naturally.

BRIN indexes can satisfy queries via regular bitmap index scans, and will return all tuples in all pages within each range if the summary info stored by the index is consistent with the query conditions. The query executor is in charge of rechecking these tuples and discarding those that do not match the query conditions — in other words, these indexes are lossy. Because a BRIN index is very small, scanning the index adds little overhead compared to a sequential scan, but may avoid scanning large parts of the table that are known not to contain matching tuples.

The specific data that a BRIN index will store, as well as the specific queries that the index will be able to satisfy, depend on the operator class selected for each column of the index. Data types having a linear sort order can have operator classes that store the minimum and maximum value within each block range, for instance; geometrical types might store the bounding box for all the objects in the block range.

The size of the block range is determined at index creation time by the pages_per_range storage parameter. The number of index entries will be equal to the size of the relation in pages divided by the selected value for pages_per_range. Therefore, the smaller the number, the larger the index becomes (because of the need to store more index entries), but at the same time the summary data stored can be more precise and more data blocks can be skipped during an index scan.

At the time of creation, all existing heap pages are scanned and a summary index tuple is created for each range, including the possibly-incomplete range at the end. As new pages are filled with data, page ranges that are already summarized will cause the summary information to be updated with data from the new tuples. When a new page is created that does not fall within the last summarized range, the range that the new page belongs to does not automatically acquire a summary tuple; those tuples remain unsummarized until a summarization run is invoked later, creating the initial summary for that range.

There are several ways to trigger the initial summarization of a page range. If the table is vacuumed, either manually or by autovacuum, all existing unsummarized page ranges are summarized. Also, if the index's autosummarize parameter is enabled, which it isn't by default, whenever autovacuum runs in that database, summarization will occur for all unsummarized page ranges that have been filled, regardless of whether the table itself is processed by autovacuum; see below.

Lastly, the following functions can be used (while these functions run, search_path is temporarily changed to pg_catalog, pg_temp):

When autosummarization is enabled, a request is sent to autovacuum to execute a targeted summarization for a block range when an insertion is detected for the first item of the first page of the next block range, to be fulfilled the next time an autovacuum worker finishes running in the same database. If the request queue is full, the request is not recorded and a message is sent to the server log:

When this happens, the range will remain unsummarized until the next regular vacuum run on the table, or one of the functions mentioned above are invoked.

Conversely, a range can be de-summarized using the brin_desummarize_range(regclass, bigint) function, which is useful when the index tuple is no longer a very good representation because the existing values have changed. See Section 9.28.8 for details.

The core PostgreSQL distribution includes the BRIN operator classes shown in Table 65.4.

The minmax operator classes store the minimum and the maximum values appearing in the indexed column within the range. The inclusion operator classes store a value which includes the values in the indexed column within the range. The bloom operator classes build a Bloom filter for all values in the range. The minmax-multi operator classes store multiple minimum and maximum values, representing values appearing in the indexed column within the range.

Table 65.4. Built-in BRIN Operator Classes

Some of the built-in operator classes allow specifying parameters affecting behavior of the operator class. Each operator class has its own set of allowed parameters. Only the bloom and minmax-multi operator classes allow specifying parameters:

bloom operator classes accept these parameters:

Defines the estimated number of distinct non-null values in the block range, used by BRIN bloom indexes for sizing of the Bloom filter. It behaves similarly to n_distinct option for ALTER TABLE. When set to a positive value, each block range is assumed to contain this number of distinct non-null values. When set to a negative value, which must be greater than or equal to -1, the number of distinct non-null values is assumed to grow linearly with the maximum possible number of tuples in the block range (about 290 rows per block). The default value is -0.1, and the minimum number of distinct non-null values is 16.

Defines the desired false positive rate used by BRIN bloom indexes for sizing of the Bloom filter. The values must be between 0.0001 and 0.25. The default value is 0.01, which is 1% false positive rate.

minmax-multi operator classes accept these parameters:

Defines the maximum number of values stored by BRIN minmax indexes to summarize a block range. Each value may represent either a point, or a boundary of an interval. Values must be between 8 and 256, and the default value is 32.

The BRIN interface has a high level of abstraction, requiring the access method implementer only to implement the semantics of the data type being accessed. The BRIN layer itself takes care of concurrency, logging and searching the index structure.

All it takes to get a BRIN access method working is to implement a few user-defined methods, which define the behavior of summary values stored in the index and the way they interact with scan keys. In short, BRIN combines extensibility with generality, code reuse, and a clean interface.

There are four methods that an operator class for BRIN must provide:

Returns internal information about the indexed columns' summary data. The return value must point to a palloc'd BrinOpcInfo, which has this definition:

BrinOpcInfo.oi_opaque can be used by the operator class routines to pass information between support functions during an index scan.

Returns whether all the ScanKey entries are consistent with the given indexed values for a range. The attribute number to use is passed as part of the scan key. Multiple scan keys for the same attribute may be passed at once; the number of entries is determined by the nkeys parameter.

Returns whether the ScanKey is consistent with the given indexed values for a range. The attribute number to use is passed as part of the scan key. This is an older backward-compatible variant of the consistent function.

Given an index tuple and an indexed value, modifies the indicated attribute of the tuple so that it additionally represents the new value. If any modification was done to the tuple, true is returned.

Consolidates two index tuples. Given two index tuples, modifies the indicated attribute of the first of them so that it represents both tuples. The second tuple is not modified.

An operator class for BRIN can optionally specify the following method:

Defines a set of user-visible parameters that control operator class behavior.

The options function is passed a pointer to a local_relopts struct, which needs to be filled with a set of operator class specific options. The options can be accessed from other support functions using the PG_HAS_OPCLASS_OPTIONS() and PG_GET_OPCLASS_OPTIONS() macros.

Since both key extraction of indexed values and representation of the key in BRIN are flexible, they may depend on user-specified parameters.

The core distribution includes support for four types of operator classes: minmax, minmax-multi, inclusion and bloom. Operator class definitions using them are shipped for in-core data types as appropriate. Additional operator classes can be defined by the user for other data types using equivalent definitions, without having to write any source code; appropriate catalog entries being declared is enough. Note that assumptions about the semantics of operator strategies are embedded in the support functions' source code.

Operator classes that implement completely different semantics are also possible, provided implementations of the four main support functions described above are written. Note that backwards compatibility across major releases is not guaranteed: for example, additional support functions might be required in later releases.

To write an operator class for a data type that implements a totally ordered set, it is possible to use the minmax support functions alongside the corresponding operators, as shown in Table 65.5. All operator class members (functions and operators) are mandatory.

Table 65.5. Function and Support Numbers for Minmax Operator Classes

To write an operator class for a complex data type which has values included within another type, it's possible to use the inclusion support functions alongside the corresponding operators, as shown in Table 65.6. It requires only a single additional function, which can be written in any language. More functions can be defined for additional functionality. All operators are optional. Some operators require other operators, as shown as dependencies on the table.

Table 65.6. Function and Support Numbers for Inclusion Operator Classes

Support function numbers 1 through 10 are reserved for the BRIN internal functions, so the SQL level functions start with number 11. Support function number 11 is the main function required to build the index. It should accept two arguments with the same data type as the operator class, and return the union of them. The inclusion operator class can store union values with different data types if it is defined with the STORAGE parameter. The return value of the union function should match the STORAGE data type.

Support function numbers 12 and 14 are provided to support irregularities of built-in data types. Function number 12 is used to support network addresses from different families which are not mergeable. Function number 14 is used to support empty ranges. Function number 13 is an optional but recommended one, which allows the new value to be checked before it is passed to the union function. As the BRIN framework can shortcut some operations when the union is not changed, using this function can improve index performance.

To write an operator class for a data type that implements only an equality operator and supports hashing, it is possible to use the bloom support procedures alongside the corresponding operators, as shown in Table 65.7. All operator class members (procedures and operators) are mandatory.

Table 65.7. Procedure and Support Numbers for Bloom Operator Classes

Support procedure numbers 1-10 are reserved for the BRIN internal functions, so the SQL level functions start with number 11. Support function number 11 is the main function required to build the index. It should accept one argument with the same data type as the operator class, and return a hash of the value.

The minmax-multi operator class is also intended for data types implementing a totally ordered set, and may be seen as a simple extension of the minmax operator class. While minmax operator class summarizes values from each block range into a single contiguous interval, minmax-multi allows summarization into multiple smaller intervals to improve handling of outlier values. It is possible to use the minmax-multi support procedures alongside the corresponding operators, as shown in Table 65.8. All operator class members (procedures and operators) are mandatory.

Table 65.8. Procedure and Support Numbers for minmax-multi Operator Classes

Both minmax and inclusion operator classes support cross-data-type operators, though with these the dependencies become more complicated. The minmax operator class requires a full set of operators to be defined with both arguments having the same data type. It allows additional data types to be supported by defining extra sets of operators. Inclusion operator class operator strategies are dependent on another operator strategy as shown in Table 65.6, or the same operator strategy as themselves. They require the dependency operator to be defined with the STORAGE data type as the left-hand-side argument and the other supported data type to be the right-hand-side argument of the supported operator. See float4_minmax_ops as an example of minmax, and box_inclusion_ops as an example of inclusion.

**Examples:**

Example 1 (unknown):
```unknown
pages_per_range
```

Example 2 (unknown):
```unknown
pages_per_range
```

Example 3 (unknown):
```unknown
pg_catalog, pg_temp
```

Example 4 (unknown):
```unknown
brin_summarize_new_values(regclass)
```

---


---

