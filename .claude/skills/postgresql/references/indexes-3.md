# PostgreSQL - Indexes (Part 3)

## 65.4. GIN Indexes #


**URL:** https://www.postgresql.org/docs/18/gin.html

**Contents:**
- 65.4. GIN Indexes #
  - 65.4.1. Introduction #
  - 65.4.2. Built-in Operator Classes #
  - 65.4.3. Extensibility #
  - 65.4.4. Implementation #
    - 65.4.4.1. GIN Fast Update Technique #
    - 65.4.4.2. Partial Match Algorithm #
  - 65.4.5. GIN Tips and Tricks #
  - 65.4.6. Limitations #
  - 65.4.7. Examples #

GIN stands for Generalized Inverted Index. GIN is designed for handling cases where the items to be indexed are composite values, and the queries to be handled by the index need to search for element values that appear within the composite items. For example, the items could be documents, and the queries could be searches for documents containing specific words.

We use the word item to refer to a composite value that is to be indexed, and the word key to refer to an element value. GIN always stores and searches for keys, not item values per se.

A GIN index stores a set of (key, posting list) pairs, where a posting list is a set of row IDs in which the key occurs. The same row ID can appear in multiple posting lists, since an item can contain more than one key. Each key value is stored only once, so a GIN index is very compact for cases where the same key appears many times.

GIN is generalized in the sense that the GIN access method code does not need to know the specific operations that it accelerates. Instead, it uses custom strategies defined for particular data types. The strategy defines how keys are extracted from indexed items and query conditions, and how to determine whether a row that contains some of the key values in a query actually satisfies the query.

One advantage of GIN is that it allows the development of custom data types with the appropriate access methods, by an expert in the domain of the data type, rather than a database expert. This is much the same advantage as using GiST.

The GIN implementation in PostgreSQL is primarily maintained by Teodor Sigaev and Oleg Bartunov. There is more information about GIN on their website.

The core PostgreSQL distribution includes the GIN operator classes shown in Table 65.3. (Some of the optional modules described in Appendix F provide additional GIN operator classes.)

Table 65.3. Built-in GIN Operator Classes

Of the two operator classes for type jsonb, jsonb_ops is the default. jsonb_path_ops supports fewer operators but offers better performance for those operators. See Section 8.14.4 for details.

The GIN interface has a high level of abstraction, requiring the access method implementer only to implement the semantics of the data type being accessed. The GIN layer itself takes care of concurrency, logging and searching the tree structure.

All it takes to get a GIN access method working is to implement a few user-defined methods, which define the behavior of keys in the tree and the relationships between keys, indexed items, and indexable queries. In short, GIN combines extensibility with generality, code reuse, and a clean interface.

There are two methods that an operator class for GIN must provide:

Returns a palloc'd array of keys given an item to be indexed. The number of returned keys must be stored into *nkeys. If any of the keys can be null, also palloc an array of *nkeys bool fields, store its address at *nullFlags, and set these null flags as needed. *nullFlags can be left NULL (its initial value) if all keys are non-null. The return value can be NULL if the item contains no keys.

Returns a palloc'd array of keys given a value to be queried; that is, query is the value on the right-hand side of an indexable operator whose left-hand side is the indexed column. n is the strategy number of the operator within the operator class (see Section 36.16.2). Often, extractQuery will need to consult n to determine the data type of query and the method it should use to extract key values. The number of returned keys must be stored into *nkeys. If any of the keys can be null, also palloc an array of *nkeys bool fields, store its address at *nullFlags, and set these null flags as needed. *nullFlags can be left NULL (its initial value) if all keys are non-null. The return value can be NULL if the query contains no keys.

searchMode is an output argument that allows extractQuery to specify details about how the search will be done. If *searchMode is set to GIN_SEARCH_MODE_DEFAULT (which is the value it is initialized to before call), only items that match at least one of the returned keys are considered candidate matches. If *searchMode is set to GIN_SEARCH_MODE_INCLUDE_EMPTY, then in addition to items containing at least one matching key, items that contain no keys at all are considered candidate matches. (This mode is useful for implementing is-subset-of operators, for example.) If *searchMode is set to GIN_SEARCH_MODE_ALL, then all non-null items in the index are considered candidate matches, whether they match any of the returned keys or not. (This mode is much slower than the other two choices, since it requires scanning essentially the entire index, but it may be necessary to implement corner cases correctly. An operator that needs this mode in most cases is probably not a good candidate for a GIN operator class.) The symbols to use for setting this mode are defined in access/gin.h.

pmatch is an output argument for use when partial match is supported. To use it, extractQuery must allocate an array of *nkeys bools and store its address at *pmatch. Each element of the array should be set to true if the corresponding key requires partial match, false if not. If *pmatch is set to NULL then GIN assumes partial match is not required. The variable is initialized to NULL before call, so this argument can simply be ignored by operator classes that do not support partial match.

extra_data is an output argument that allows extractQuery to pass additional data to the consistent and comparePartial methods. To use it, extractQuery must allocate an array of *nkeys pointers and store its address at *extra_data, then store whatever it wants to into the individual pointers. The variable is initialized to NULL before call, so this argument can simply be ignored by operator classes that do not require extra data. If *extra_data is set, the whole array is passed to the consistent method, and the appropriate element to the comparePartial method.

An operator class must also provide a function to check if an indexed item matches the query. It comes in two flavors, a Boolean consistent function, and a ternary triConsistent function. triConsistent covers the functionality of both, so providing triConsistent alone is sufficient. However, if the Boolean variant is significantly cheaper to calculate, it can be advantageous to provide both. If only the Boolean variant is provided, some optimizations that depend on refuting index items before fetching all the keys are disabled.

Returns true if an indexed item satisfies the query operator with strategy number n (or might satisfy it, if the recheck indication is returned). This function does not have direct access to the indexed item's value, since GIN does not store items explicitly. Rather, what is available is knowledge about which key values extracted from the query appear in a given indexed item. The check array has length nkeys, which is the same as the number of keys previously returned by extractQuery for this query datum. Each element of the check array is true if the indexed item contains the corresponding query key, i.e., if (check[i] == true) the i-th key of the extractQuery result array is present in the indexed item. The original query datum is passed in case the consistent method needs to consult it, and so are the queryKeys[] and nullFlags[] arrays previously returned by extractQuery. extra_data is the extra-data array returned by extractQuery, or NULL if none.

When extractQuery returns a null key in queryKeys[], the corresponding check[] element is true if the indexed item contains a null key; that is, the semantics of check[] are like IS NOT DISTINCT FROM. The consistent function can examine the corresponding nullFlags[] element if it needs to tell the difference between a regular value match and a null match.

On success, *recheck should be set to true if the heap tuple needs to be rechecked against the query operator, or false if the index test is exact. That is, a false return value guarantees that the heap tuple does not match the query; a true return value with *recheck set to false guarantees that the heap tuple does match the query; and a true return value with *recheck set to true means that the heap tuple might match the query, so it needs to be fetched and rechecked by evaluating the query operator directly against the originally indexed item.

triConsistent is similar to consistent, but instead of Booleans in the check vector, there are three possible values for each key: GIN_TRUE, GIN_FALSE and GIN_MAYBE. GIN_FALSE and GIN_TRUE have the same meaning as regular Boolean values, while GIN_MAYBE means that the presence of that key is not known. When GIN_MAYBE values are present, the function should only return GIN_TRUE if the item certainly matches whether or not the index item contains the corresponding query keys. Likewise, the function must return GIN_FALSE only if the item certainly does not match, whether or not it contains the GIN_MAYBE keys. If the result depends on the GIN_MAYBE entries, i.e., the match cannot be confirmed or refuted based on the known query keys, the function must return GIN_MAYBE.

When there are no GIN_MAYBE values in the check vector, a GIN_MAYBE return value is the equivalent of setting the recheck flag in the Boolean consistent function.

In addition, GIN must have a way to sort the key values stored in the index. The operator class can define the sort ordering by specifying a comparison method:

Compares two keys (not indexed items!) and returns an integer less than zero, zero, or greater than zero, indicating whether the first key is less than, equal to, or greater than the second. Null keys are never passed to this function.

Alternatively, if the operator class does not provide a compare method, GIN will look up the default btree operator class for the index key data type, and use its comparison function. It is recommended to specify the comparison function in a GIN operator class that is meant for just one data type, as looking up the btree operator class costs a few cycles. However, polymorphic GIN operator classes (such as array_ops) typically cannot specify a single comparison function.

An operator class for GIN can optionally supply the following methods:

Compare a partial-match query key to an index key. Returns an integer whose sign indicates the result: less than zero means the index key does not match the query, but the index scan should continue; zero means that the index key does match the query; greater than zero indicates that the index scan should stop because no more matches are possible. The strategy number n of the operator that generated the partial match query is provided, in case its semantics are needed to determine when to end the scan. Also, extra_data is the corresponding element of the extra-data array made by extractQuery, or NULL if none. Null keys are never passed to this function.

Defines a set of user-visible parameters that control operator class behavior.

The options function is passed a pointer to a local_relopts struct, which needs to be filled with a set of operator class specific options. The options can be accessed from other support functions using the PG_HAS_OPCLASS_OPTIONS() and PG_GET_OPCLASS_OPTIONS() macros.

Since both key extraction of indexed values and representation of the key in GIN are flexible, they may depend on user-specified parameters.

To support “partial match” queries, an operator class must provide the comparePartial method, and its extractQuery method must set the pmatch parameter when a partial-match query is encountered. See Section 65.4.4.2 for details.

The actual data types of the various Datum values mentioned above vary depending on the operator class. The item values passed to extractValue are always of the operator class's input type, and all key values must be of the class's STORAGE type. The type of the query argument passed to extractQuery, consistent and triConsistent is whatever is the right-hand input type of the class member operator identified by the strategy number. This need not be the same as the indexed type, so long as key values of the correct type can be extracted from it. However, it is recommended that the SQL declarations of these three support functions use the opclass's indexed data type for the query argument, even though the actual type might be something else depending on the operator.

Internally, a GIN index contains a B-tree index constructed over keys, where each key is an element of one or more indexed items (a member of an array, for example) and where each tuple in a leaf page contains either a pointer to a B-tree of heap pointers (a “posting tree”), or a simple list of heap pointers (a “posting list”) when the list is small enough to fit into a single index tuple along with the key value. Figure 65.1 illustrates these components of a GIN index.

As of PostgreSQL 9.1, null key values can be included in the index. Also, placeholder nulls are included in the index for indexed items that are null or contain no keys according to extractValue. This allows searches that should find empty items to do so.

Multicolumn GIN indexes are implemented by building a single B-tree over composite values (column number, key value). The key values for different columns can be of different types.

Figure 65.1. GIN Internals

Updating a GIN index tends to be slow because of the intrinsic nature of inverted indexes: inserting or updating one heap row can cause many inserts into the index (one for each key extracted from the indexed item). GIN is capable of postponing much of this work by inserting new tuples into a temporary, unsorted list of pending entries. When the table is vacuumed or autoanalyzed, or when gin_clean_pending_list function is called, or if the pending list becomes larger than gin_pending_list_limit, the entries are moved to the main GIN data structure using the same bulk insert techniques used during initial index creation. This greatly improves GIN index update speed, even counting the additional vacuum overhead. Moreover the overhead work can be done by a background process instead of in foreground query processing.

The main disadvantage of this approach is that searches must scan the list of pending entries in addition to searching the regular index, and so a large list of pending entries will slow searches significantly. Another disadvantage is that, while most updates are fast, an update that causes the pending list to become “too large” will incur an immediate cleanup cycle and thus be much slower than other updates. Proper use of autovacuum can minimize both of these problems.

If consistent response time is more important than update speed, use of pending entries can be disabled by turning off the fastupdate storage parameter for a GIN index. See CREATE INDEX for details.

GIN can support “partial match” queries, in which the query does not determine an exact match for one or more keys, but the possible matches fall within a reasonably narrow range of key values (within the key sorting order determined by the compare support method). The extractQuery method, instead of returning a key value to be matched exactly, returns a key value that is the lower bound of the range to be searched, and sets the pmatch flag true. The key range is then scanned using the comparePartial method. comparePartial must return zero for a matching index key, less than zero for a non-match that is still within the range to be searched, or greater than zero if the index key is past the range that could match.

Insertion into a GIN index can be slow due to the likelihood of many keys being inserted for each item. So, for bulk insertions into a table it is advisable to drop the GIN index and recreate it after finishing bulk insertion.

When fastupdate is enabled for GIN (see Section 65.4.4.1 for details), the penalty is less than when it is not. But for very large updates it may still be best to drop and recreate the index.

Build time for a GIN index is very sensitive to the maintenance_work_mem setting; it doesn't pay to skimp on work memory during index creation.

During a series of insertions into an existing GIN index that has fastupdate enabled, the system will clean up the pending-entry list whenever the list grows larger than gin_pending_list_limit. To avoid fluctuations in observed response time, it's desirable to have pending-list cleanup occur in the background (i.e., via autovacuum). Foreground cleanup operations can be avoided by increasing gin_pending_list_limit or making autovacuum more aggressive. However, enlarging the threshold of the cleanup operation means that if a foreground cleanup does occur, it will take even longer.

gin_pending_list_limit can be overridden for individual GIN indexes by changing storage parameters, which allows each GIN index to have its own cleanup threshold. For example, it's possible to increase the threshold only for the GIN index which can be updated heavily, and decrease it otherwise.

The primary goal of developing GIN indexes was to create support for highly scalable full-text search in PostgreSQL, and there are often situations when a full-text search returns a very large set of results. Moreover, this often happens when the query contains very frequent words, so that the large result set is not even useful. Since reading many tuples from the disk and sorting them could take a lot of time, this is unacceptable for production. (Note that the index search itself is very fast.)

To facilitate controlled execution of such queries, GIN has a configurable soft upper limit on the number of rows returned: the gin_fuzzy_search_limit configuration parameter. It is set to 0 (meaning no limit) by default. If a non-zero limit is set, then the returned set is a subset of the whole result set, chosen at random.

“Soft” means that the actual number of returned results could differ somewhat from the specified limit, depending on the query and the quality of the system's random number generator.

From experience, values in the thousands (e.g., 5000 — 20000) work well.

GIN assumes that indexable operators are strict. This means that extractValue will not be called at all on a null item value (instead, a placeholder index entry is created automatically), and extractQuery will not be called on a null query value either (instead, the query is presumed to be unsatisfiable). Note however that null key values contained within a non-null composite item or query value are supported.

The core PostgreSQL distribution includes the GIN operator classes previously shown in Table 65.3. The following contrib modules also contain GIN operator classes:

B-tree equivalent functionality for several data types

Module for storing (key, value) pairs

Enhanced support for int[]

Text similarity using trigram matching

**Examples:**

Example 1 (unknown):
```unknown
&& (anyarray,anyarray)
```

Example 2 (unknown):
```unknown
@> (anyarray,anyarray)
```

Example 3 (unknown):
```unknown
<@ (anyarray,anyarray)
```

Example 4 (unknown):
```unknown
= (anyarray,anyarray)
```

---


---

## 11.12. Examining Index Usage #


**URL:** https://www.postgresql.org/docs/18/indexes-examine.html

**Contents:**
- 11.12. Examining Index Usage #

Although indexes in PostgreSQL do not need maintenance or tuning, it is still important to check which indexes are actually used by the real-life query workload. Examining index usage for an individual query is done with the EXPLAIN command; its application for this purpose is illustrated in Section 14.1. It is also possible to gather overall statistics about index usage in a running server, as described in Section 27.2.

It is difficult to formulate a general procedure for determining which indexes to create. There are a number of typical cases that have been shown in the examples throughout the previous sections. A good deal of experimentation is often necessary. The rest of this section gives some tips for that:

Always run ANALYZE first. This command collects statistics about the distribution of the values in the table. This information is required to estimate the number of rows returned by a query, which is needed by the planner to assign realistic costs to each possible query plan. In absence of any real statistics, some default values are assumed, which are almost certain to be inaccurate. Examining an application's index usage without having run ANALYZE is therefore a lost cause. See Section 24.1.3 and Section 24.1.6 for more information.

Use real data for experimentation. Using test data for setting up indexes will tell you what indexes you need for the test data, but that is all.

It is especially fatal to use very small test data sets. While selecting 1000 out of 100000 rows could be a candidate for an index, selecting 1 out of 100 rows will hardly be, because the 100 rows probably fit within a single disk page, and there is no plan that can beat sequentially fetching 1 disk page.

Also be careful when making up test data, which is often unavoidable when the application is not yet in production. Values that are very similar, completely random, or inserted in sorted order will skew the statistics away from the distribution that real data would have.

When indexes are not used, it can be useful for testing to force their use. There are run-time parameters that can turn off various plan types (see Section 19.7.1). For instance, turning off sequential scans (enable_seqscan) and nested-loop joins (enable_nestloop), which are the most basic plans, will force the system to use a different plan. If the system still chooses a sequential scan or nested-loop join then there is probably a more fundamental reason why the index is not being used; for example, the query condition does not match the index. (What kind of query can use what kind of index is explained in the previous sections.)

If forcing index usage does use the index, then there are two possibilities: Either the system is right and using the index is indeed not appropriate, or the cost estimates of the query plans are not reflecting reality. So you should time your query with and without indexes. The EXPLAIN ANALYZE command can be useful here.

If it turns out that the cost estimates are wrong, there are, again, two possibilities. The total cost is computed from the per-row costs of each plan node times the selectivity estimate of the plan node. The costs estimated for the plan nodes can be adjusted via run-time parameters (described in Section 19.7.2). An inaccurate selectivity estimate is due to insufficient statistics. It might be possible to improve this by tuning the statistics-gathering parameters (see ALTER TABLE).

If you do not succeed in adjusting the costs to be more appropriate, then you might have to resort to forcing index usage explicitly. You might also want to contact the PostgreSQL developers to examine the issue.

**Examples:**

Example 1 (unknown):
```unknown
enable_seqscan
```

Example 2 (unknown):
```unknown
enable_nestloop
```

Example 3 (unknown):
```unknown
EXPLAIN ANALYZE
```

---


---

## 65.6. Hash Indexes #


**URL:** https://www.postgresql.org/docs/18/hash-index.html

**Contents:**
- 65.6. Hash Indexes #
  - 65.6.1. Overview #
  - 65.6.2. Implementation #

PostgreSQL includes an implementation of persistent on-disk hash indexes, which are fully crash recoverable. Any data type can be indexed by a hash index, including data types that do not have a well-defined linear ordering. Hash indexes store only the hash value of the data being indexed, thus there are no restrictions on the size of the data column being indexed.

Hash indexes support only single-column indexes and do not allow uniqueness checking.

Hash indexes support only the = operator, so WHERE clauses that specify range operations will not be able to take advantage of hash indexes.

Each hash index tuple stores just the 4-byte hash value, not the actual column value. As a result, hash indexes may be much smaller than B-trees when indexing longer data items such as UUIDs, URLs, etc. The absence of the column value also makes all hash index scans lossy. Hash indexes may take part in bitmap index scans and backward scans.

Hash indexes are best optimized for SELECT and UPDATE-heavy workloads that use equality scans on larger tables. In a B-tree index, searches must descend through the tree until the leaf page is found. In tables with millions of rows, this descent can increase access time to data. The equivalent of a leaf page in a hash index is referred to as a bucket page. In contrast, a hash index allows accessing the bucket pages directly, thereby potentially reducing index access time in larger tables. This reduction in "logical I/O" becomes even more pronounced on indexes/data larger than shared_buffers/RAM.

Hash indexes have been designed to cope with uneven distributions of hash values. Direct access to the bucket pages works well if the hash values are evenly distributed. When inserts mean that the bucket page becomes full, additional overflow pages are chained to that specific bucket page, locally expanding the storage for index tuples that match that hash value. When scanning a hash bucket during queries, we need to scan through all of the overflow pages. Thus an unbalanced hash index might actually be worse than a B-tree in terms of number of block accesses required, for some data.

As a result of the overflow cases, we can say that hash indexes are most suitable for unique, nearly unique data or data with a low number of rows per hash bucket. One possible way to avoid problems is to exclude highly non-unique values from the index using a partial index condition, but this may not be suitable in many cases.

Like B-Trees, hash indexes perform simple index tuple deletion. This is a deferred maintenance operation that deletes index tuples that are known to be safe to delete (those whose item identifier's LP_DEAD bit is already set). If an insert finds no space is available on a page we try to avoid creating a new overflow page by attempting to remove dead index tuples. Removal cannot occur if the page is pinned at that time. Deletion of dead index pointers also occurs during VACUUM.

If it can, VACUUM will also try to squeeze the index tuples onto as few overflow pages as possible, minimizing the overflow chain. If an overflow page becomes empty, overflow pages can be recycled for reuse in other buckets, though we never return them to the operating system. There is currently no provision to shrink a hash index, other than by rebuilding it with REINDEX. There is no provision for reducing the number of buckets, either.

Hash indexes may expand the number of bucket pages as the number of rows indexed grows. The hash key-to-bucket-number mapping is chosen so that the index can be incrementally expanded. When a new bucket is to be added to the index, exactly one existing bucket will need to be "split", with some of its tuples being transferred to the new bucket according to the updated key-to-bucket-number mapping.

The expansion occurs in the foreground, which could increase execution time for user inserts. Thus, hash indexes may not be suitable for tables with rapidly increasing number of rows.

There are four kinds of pages in a hash index: the meta page (page zero), which contains statically allocated control information; primary bucket pages; overflow pages; and bitmap pages, which keep track of overflow pages that have been freed and are available for re-use. For addressing purposes, bitmap pages are regarded as a subset of the overflow pages.

Both scanning the index and inserting tuples require locating the bucket where a given tuple ought to be located. To do this, we need the bucket count, highmask, and lowmask from the metapage; however, it's undesirable for performance reasons to have to have to lock and pin the metapage for every such operation. Instead, we retain a cached copy of the metapage in each backend's relcache entry. This will produce the correct bucket mapping as long as the target bucket hasn't been split since the last cache refresh.

Primary bucket pages and overflow pages are allocated independently since any given index might need more or fewer overflow pages relative to its number of buckets. The hash code uses an interesting set of addressing rules to support a variable number of overflow pages while not having to move primary bucket pages around after they are created.

Each row in the table indexed is represented by a single index tuple in the hash index. Hash index tuples are stored in bucket pages, and if they exist, overflow pages. We speed up searches by keeping the index entries in any one index page sorted by hash code, thus allowing binary search to be used within an index page. Note however that there is *no* assumption about the relative ordering of hash codes across different index pages of a bucket.

The bucket splitting algorithms to expand the hash index are too complex to be worthy of mention here, though are described in more detail in src/backend/access/hash/README. The split algorithm is crash safe and can be restarted if not completed successfully.

**Examples:**

Example 1 (unknown):
```unknown
src/backend/access/hash/README
```

---


---

## 11.11. Indexes and Collations #


**URL:** https://www.postgresql.org/docs/18/indexes-collations.html

**Contents:**
- 11.11. Indexes and Collations #

An index can support only one collation per index column. If multiple collations are of interest, multiple indexes may be needed.

Consider these statements:

The index automatically uses the collation of the underlying column. So a query of the form

could use the index, because the comparison will by default use the collation of the column. However, this index cannot accelerate queries that involve some other collation. So if queries of the form, say,

are also of interest, an additional index could be created that supports the "y" collation, like this:

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE test1c (
    id integer,
    content varchar COLLATE "x"
);

CREATE INDEX test1c_content_index ON test1c (content);
```

Example 2 (sql):
```sql
SELECT * FROM test1c WHERE content > constant;
```

Example 3 (sql):
```sql
SELECT * FROM test1c WHERE content > constant COLLATE "y";
```

Example 4 (unknown):
```unknown
CREATE INDEX test1c_content_y_index ON test1c (content COLLATE "y");
```

---


---

## 11.10. Operator Classes and Operator Families #


**URL:** https://www.postgresql.org/docs/18/indexes-opclass.html

**Contents:**
- 11.10. Operator Classes and Operator Families #
  - Tip

An index definition can specify an operator class for each column of an index.

The operator class identifies the operators to be used by the index for that column. For example, a B-tree index on the type int4 would use the int4_ops class; this operator class includes comparison functions for values of type int4. In practice the default operator class for the column's data type is usually sufficient. The main reason for having operator classes is that for some data types, there could be more than one meaningful index behavior. For example, we might want to sort a complex-number data type either by absolute value or by real part. We could do this by defining two operator classes for the data type and then selecting the proper class when making an index. The operator class determines the basic sort ordering (which can then be modified by adding sort options COLLATE, ASC/DESC and/or NULLS FIRST/NULLS LAST).

There are also some built-in operator classes besides the default ones:

The operator classes text_pattern_ops, varchar_pattern_ops, and bpchar_pattern_ops support B-tree indexes on the types text, varchar, and char respectively. The difference from the default operator classes is that the values are compared strictly character by character rather than according to the locale-specific collation rules. This makes these operator classes suitable for use by queries involving pattern matching expressions (LIKE or POSIX regular expressions) when the database does not use the standard “C” locale. As an example, you might index a varchar column like this:

Note that you should also create an index with the default operator class if you want queries involving ordinary <, <=, >, or >= comparisons to use an index. Such queries cannot use the xxx_pattern_ops operator classes. (Ordinary equality comparisons can use these operator classes, however.) It is possible to create multiple indexes on the same column with different operator classes. If you do use the C locale, you do not need the xxx_pattern_ops operator classes, because an index with the default operator class is usable for pattern-matching queries in the C locale.

The following query shows all defined operator classes:

An operator class is actually just a subset of a larger structure called an operator family. In cases where several data types have similar behaviors, it is frequently useful to define cross-data-type operators and allow these to work with indexes. To do this, the operator classes for each of the types must be grouped into the same operator family. The cross-type operators are members of the family, but are not associated with any single class within the family.

This expanded version of the previous query shows the operator family each operator class belongs to:

This query shows all defined operator families and all the operators included in each family:

psql has commands \dAc, \dAf, and \dAo, which provide slightly more sophisticated versions of these queries.

**Examples:**

Example 1 (unknown):
```unknown
opclass_options
```

Example 2 (unknown):
```unknown
sort options
```

Example 3 (unknown):
```unknown
NULLS FIRST
```

Example 4 (unknown):
```unknown
text_pattern_ops
```

---


---

