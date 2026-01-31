# PostgreSQL - Indexes (Part 4)

## 11.4. Indexes and ORDER BY #


**URL:** https://www.postgresql.org/docs/18/indexes-ordering.html

**Contents:**
- 11.4. Indexes and ORDER BY #

In addition to simply finding the rows to be returned by a query, an index may be able to deliver them in a specific sorted order. This allows a query's ORDER BY specification to be honored without a separate sorting step. Of the index types currently supported by PostgreSQL, only B-tree can produce sorted output — the other index types return matching rows in an unspecified, implementation-dependent order.

The planner will consider satisfying an ORDER BY specification either by scanning an available index that matches the specification, or by scanning the table in physical order and doing an explicit sort. For a query that requires scanning a large fraction of the table, an explicit sort is likely to be faster than using an index because it requires less disk I/O due to following a sequential access pattern. Indexes are more useful when only a few rows need be fetched. An important special case is ORDER BY in combination with LIMIT n: an explicit sort will have to process all the data to identify the first n rows, but if there is an index matching the ORDER BY, the first n rows can be retrieved directly, without scanning the remainder at all.

By default, B-tree indexes store their entries in ascending order with nulls last (table TID is treated as a tiebreaker column among otherwise equal entries). This means that a forward scan of an index on column x produces output satisfying ORDER BY x (or more verbosely, ORDER BY x ASC NULLS LAST). The index can also be scanned backward, producing output satisfying ORDER BY x DESC (or more verbosely, ORDER BY x DESC NULLS FIRST, since NULLS FIRST is the default for ORDER BY DESC).

You can adjust the ordering of a B-tree index by including the options ASC, DESC, NULLS FIRST, and/or NULLS LAST when creating the index; for example:

An index stored in ascending order with nulls first can satisfy either ORDER BY x ASC NULLS FIRST or ORDER BY x DESC NULLS LAST depending on which direction it is scanned in.

You might wonder why bother providing all four options, when two options together with the possibility of backward scan would cover all the variants of ORDER BY. In single-column indexes the options are indeed redundant, but in multicolumn indexes they can be useful. Consider a two-column index on (x, y): this can satisfy ORDER BY x, y if we scan forward, or ORDER BY x DESC, y DESC if we scan backward. But it might be that the application frequently needs to use ORDER BY x ASC, y DESC. There is no way to get that ordering from a plain index, but it is possible if the index is defined as (x ASC, y DESC) or (x DESC, y ASC).

Obviously, indexes with non-default sort orderings are a fairly specialized feature, but sometimes they can produce tremendous speedups for certain queries. Whether it's worth maintaining such an index depends on how often you use queries that require a special sort ordering.

**Examples:**

Example 1 (sql):
```sql
ORDER BY x ASC NULLS LAST
```

Example 2 (sql):
```sql
ORDER BY x DESC
```

Example 3 (sql):
```sql
ORDER BY x DESC NULLS FIRST
```

Example 4 (unknown):
```unknown
NULLS FIRST
```

---


---

## 11.9. Index-Only Scans and Covering Indexes #


**URL:** https://www.postgresql.org/docs/18/indexes-index-only-scans.html

**Contents:**
- 11.9. Index-Only Scans and Covering Indexes #

All indexes in PostgreSQL are secondary indexes, meaning that each index is stored separately from the table's main data area (which is called the table's heap in PostgreSQL terminology). This means that in an ordinary index scan, each row retrieval requires fetching data from both the index and the heap. Furthermore, while the index entries that match a given indexable WHERE condition are usually close together in the index, the table rows they reference might be anywhere in the heap. The heap-access portion of an index scan thus involves a lot of random access into the heap, which can be slow, particularly on traditional rotating media. (As described in Section 11.5, bitmap scans try to alleviate this cost by doing the heap accesses in sorted order, but that only goes so far.)

To solve this performance problem, PostgreSQL supports index-only scans, which can answer queries from an index alone without any heap access. The basic idea is to return values directly out of each index entry instead of consulting the associated heap entry. There are two fundamental restrictions on when this method can be used:

The index type must support index-only scans. B-tree indexes always do. GiST and SP-GiST indexes support index-only scans for some operator classes but not others. Other index types have no support. The underlying requirement is that the index must physically store, or else be able to reconstruct, the original data value for each index entry. As a counterexample, GIN indexes cannot support index-only scans because each index entry typically holds only part of the original data value.

The query must reference only columns stored in the index. For example, given an index on columns x and y of a table that also has a column z, these queries could use index-only scans:

but these queries could not:

(Expression indexes and partial indexes complicate this rule, as discussed below.)

If these two fundamental requirements are met, then all the data values required by the query are available from the index, so an index-only scan is physically possible. But there is an additional requirement for any table scan in PostgreSQL: it must verify that each retrieved row be “visible” to the query's MVCC snapshot, as discussed in Chapter 13. Visibility information is not stored in index entries, only in heap entries; so at first glance it would seem that every row retrieval would require a heap access anyway. And this is indeed the case, if the table row has been modified recently. However, for seldom-changing data there is a way around this problem. PostgreSQL tracks, for each page in a table's heap, whether all rows stored in that page are old enough to be visible to all current and future transactions. This information is stored in a bit in the table's visibility map. An index-only scan, after finding a candidate index entry, checks the visibility map bit for the corresponding heap page. If it's set, the row is known visible and so the data can be returned with no further work. If it's not set, the heap entry must be visited to find out whether it's visible, so no performance advantage is gained over a standard index scan. Even in the successful case, this approach trades visibility map accesses for heap accesses; but since the visibility map is four orders of magnitude smaller than the heap it describes, far less physical I/O is needed to access it. In most situations the visibility map remains cached in memory all the time.

In short, while an index-only scan is possible given the two fundamental requirements, it will be a win only if a significant fraction of the table's heap pages have their all-visible map bits set. But tables in which a large fraction of the rows are unchanging are common enough to make this type of scan very useful in practice.

To make effective use of the index-only scan feature, you might choose to create a covering index, which is an index specifically designed to include the columns needed by a particular type of query that you run frequently. Since queries typically need to retrieve more columns than just the ones they search on, PostgreSQL allows you to create an index in which some columns are just “payload” and are not part of the search key. This is done by adding an INCLUDE clause listing the extra columns. For example, if you commonly run queries like

the traditional approach to speeding up such queries would be to create an index on x only. However, an index defined as

could handle these queries as index-only scans, because y can be obtained from the index without visiting the heap.

Because column y is not part of the index's search key, it does not have to be of a data type that the index can handle; it's merely stored in the index and is not interpreted by the index machinery. Also, if the index is a unique index, that is

the uniqueness condition applies to just column x, not to the combination of x and y. (An INCLUDE clause can also be written in UNIQUE and PRIMARY KEY constraints, providing alternative syntax for setting up an index like this.)

It's wise to be conservative about adding non-key payload columns to an index, especially wide columns. If an index tuple exceeds the maximum size allowed for the index type, data insertion will fail. In any case, non-key columns duplicate data from the index's table and bloat the size of the index, thus potentially slowing searches. And remember that there is little point in including payload columns in an index unless the table changes slowly enough that an index-only scan is likely to not need to access the heap. If the heap tuple must be visited anyway, it costs nothing more to get the column's value from there. Other restrictions are that expressions are not currently supported as included columns, and that only B-tree, GiST and SP-GiST indexes currently support included columns.

Before PostgreSQL had the INCLUDE feature, people sometimes made covering indexes by writing the payload columns as ordinary index columns, that is writing

even though they had no intention of ever using y as part of a WHERE clause. This works fine as long as the extra columns are trailing columns; making them be leading columns is unwise for the reasons explained in Section 11.3. However, this method doesn't support the case where you want the index to enforce uniqueness on the key column(s).

Suffix truncation always removes non-key columns from upper B-Tree levels. As payload columns, they are never used to guide index scans. The truncation process also removes one or more trailing key column(s) when the remaining prefix of key column(s) happens to be sufficient to describe tuples on the lowest B-Tree level. In practice, covering indexes without an INCLUDE clause often avoid storing columns that are effectively payload in the upper levels. However, explicitly defining payload columns as non-key columns reliably keeps the tuples in upper levels small.

In principle, index-only scans can be used with expression indexes. For example, given an index on f(x) where x is a table column, it should be possible to execute

as an index-only scan; and this is very attractive if f() is an expensive-to-compute function. However, PostgreSQL's planner is currently not very smart about such cases. It considers a query to be potentially executable by index-only scan only when all columns needed by the query are available from the index. In this example, x is not needed except in the context f(x), but the planner does not notice that and concludes that an index-only scan is not possible. If an index-only scan seems sufficiently worthwhile, this can be worked around by adding x as an included column, for example

An additional caveat, if the goal is to avoid recalculating f(x), is that the planner won't necessarily match uses of f(x) that aren't in indexable WHERE clauses to the index column. It will usually get this right in simple queries such as shown above, but not in queries that involve joins. These deficiencies may be remedied in future versions of PostgreSQL.

Partial indexes also have interesting interactions with index-only scans. Consider the partial index shown in Example 11.3:

In principle, we could do an index-only scan on this index to satisfy a query like

But there's a problem: the WHERE clause refers to success which is not available as a result column of the index. Nonetheless, an index-only scan is possible because the plan does not need to recheck that part of the WHERE clause at run time: all entries found in the index necessarily have success = true so this need not be explicitly checked in the plan. PostgreSQL versions 9.6 and later will recognize such cases and allow index-only scans to be generated, but older versions will not.

**Examples:**

Example 1 (sql):
```sql
SELECT x, y FROM tab WHERE x = 'key';
SELECT x FROM tab WHERE x = 'key' AND y < 42;
```

Example 2 (sql):
```sql
SELECT x, z FROM tab WHERE x = 'key';
SELECT x FROM tab WHERE x = 'key' AND z < 42;
```

Example 3 (sql):
```sql
SELECT y FROM tab WHERE x = 'key';
```

Example 4 (unknown):
```unknown
CREATE INDEX tab_x_y ON tab(x) INCLUDE (y);
```

---


---

## Chapter 11. Indexes


**URL:** https://www.postgresql.org/docs/18/indexes.html

**Contents:**
- Chapter 11. Indexes

Indexes are a common way to enhance database performance. An index allows the database server to find and retrieve specific rows much faster than it could do without an index. But indexes also add overhead to the database system as a whole, so they should be used sensibly.

---


---

## 65.2. GiST Indexes #


**URL:** https://www.postgresql.org/docs/18/gist.html

**Contents:**
- 65.2. GiST Indexes #
  - 65.2.1. Introduction #
  - 65.2.2. Built-in Operator Classes #
  - 65.2.3. Extensibility #
  - 65.2.4. Implementation #
    - 65.2.4.1. GiST Index Build Methods #
  - 65.2.5. Examples #

GiST stands for Generalized Search Tree. It is a balanced, tree-structured access method, that acts as a base template in which to implement arbitrary indexing schemes. B-trees, R-trees and many other indexing schemes can be implemented in GiST.

One advantage of GiST is that it allows the development of custom data types with the appropriate access methods, by an expert in the domain of the data type, rather than a database expert.

Some of the information here is derived from the University of California at Berkeley's GiST Indexing Project web site and Marcel Kornacker's thesis, Access Methods for Next-Generation Database Systems. The GiST implementation in PostgreSQL is primarily maintained by Teodor Sigaev and Oleg Bartunov, and there is more information on their web site.

The core PostgreSQL distribution includes the GiST operator classes shown in Table 65.1. (Some of the optional modules described in Appendix F provide additional GiST operator classes.)

Table 65.1. Built-in GiST Operator Classes

For historical reasons, the inet_ops operator class is not the default class for types inet and cidr. To use it, mention the class name in CREATE INDEX, for example

Traditionally, implementing a new index access method meant a lot of difficult work. It was necessary to understand the inner workings of the database, such as the lock manager and Write-Ahead Log. The GiST interface has a high level of abstraction, requiring the access method implementer only to implement the semantics of the data type being accessed. The GiST layer itself takes care of concurrency, logging and searching the tree structure.

This extensibility should not be confused with the extensibility of the other standard search trees in terms of the data they can handle. For example, PostgreSQL supports extensible B-trees and hash indexes. That means that you can use PostgreSQL to build a B-tree or hash over any data type you want. But B-trees only support range predicates (<, =, >), and hash indexes only support equality queries.

So if you index, say, an image collection with a PostgreSQL B-tree, you can only issue queries such as “is imagex equal to imagey”, “is imagex less than imagey” and “is imagex greater than imagey”. Depending on how you define “equals”, “less than” and “greater than” in this context, this could be useful. However, by using a GiST based index, you could create ways to ask domain-specific questions, perhaps “find all images of horses” or “find all over-exposed images”.

All it takes to get a GiST access method up and running is to implement several user-defined methods, which define the behavior of keys in the tree. Of course these methods have to be pretty fancy to support fancy queries, but for all the standard queries (B-trees, R-trees, etc.) they're relatively straightforward. In short, GiST combines extensibility along with generality, code reuse, and a clean interface.

There are five methods that an index operator class for GiST must provide, and seven that are optional. Correctness of the index is ensured by proper implementation of the same, consistent and union methods, while efficiency (size and speed) of the index will depend on the penalty and picksplit methods. Two optional methods are compress and decompress, which allow an index to have internal tree data of a different type than the data it indexes. The leaves are to be of the indexed data type, while the other tree nodes can be of any C struct (but you still have to follow PostgreSQL data type rules here, see about varlena for variable sized data). If the tree's internal data type exists at the SQL level, the STORAGE option of the CREATE OPERATOR CLASS command can be used. The optional eighth method is distance, which is needed if the operator class wishes to support ordered scans (nearest-neighbor searches). The optional ninth method fetch is needed if the operator class wishes to support index-only scans, except when the compress method is omitted. The optional tenth method options is needed if the operator class has user-specified parameters. The optional eleventh method sortsupport is used to speed up building a GiST index. The optional twelfth method stratnum is used to translate compare types (from src/include/nodes/primnodes.h) into strategy numbers used by the operator class. This lets the core code look up operators for temporal constraint indexes.

Given an index entry p and a query value q, this function determines whether the index entry is “consistent” with the query; that is, could the predicate “indexed_column indexable_operator q” be true for any row represented by the index entry? For a leaf index entry this is equivalent to testing the indexable condition, while for an internal tree node this determines whether it is necessary to scan the subtree of the index represented by the tree node. When the result is true, a recheck flag must also be returned. This indicates whether the predicate is certainly true or only possibly true. If recheck = false then the index has tested the predicate condition exactly, whereas if recheck = true the row is only a candidate match. In that case the system will automatically evaluate the indexable_operator against the actual row value to see if it is really a match. This convention allows GiST to support both lossless and lossy index structures.

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

Here, key is an element in the index and query the value being looked up in the index. The StrategyNumber parameter indicates which operator of your operator class is being applied — it matches one of the operator numbers in the CREATE OPERATOR CLASS command.

Depending on which operators you have included in the class, the data type of query could vary with the operator, since it will be whatever type is on the right-hand side of the operator, which might be different from the indexed data type appearing on the left-hand side. (The above code skeleton assumes that only one type is possible; if not, fetching the query argument value would have to depend on the operator.) It is recommended that the SQL declaration of the consistent function use the opclass's indexed data type for the query argument, even though the actual type might be something else depending on the operator.

This method consolidates information in the tree. Given a set of entries, this function generates a new index entry that represents all the given entries.

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

As you can see, in this skeleton we're dealing with a data type where union(X, Y, Z) = union(union(X, Y), Z). It's easy enough to support data types where this is not the case, by implementing the proper union algorithm in this GiST support method.

The result of the union function must be a value of the index's storage type, whatever that is (it might or might not be different from the indexed column's type). The union function should return a pointer to newly palloc()ed memory. You can't just return the input value as-is, even if there is no type change.

As shown above, the union function's first internal argument is actually a GistEntryVector pointer. The second argument is a pointer to an integer variable, which can be ignored. (It used to be required that the union function store the size of its result value into that variable, but this is no longer necessary.)

Converts a data item into a format suitable for physical storage in an index page. If the compress method is omitted, data items are stored in the index without modification.

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

You have to adapt compressed_data_type to the specific type you're converting to in order to compress your leaf nodes, of course.

Converts the stored representation of a data item into a format that can be manipulated by the other GiST methods in the operator class. If the decompress method is omitted, it is assumed that the other GiST methods can work directly on the stored data format. (decompress is not necessarily the reverse of the compress method; in particular, if compress is lossy then it's impossible for decompress to exactly reconstruct the original data. decompress is not necessarily equivalent to fetch, either, since the other GiST methods might not require full reconstruction of the data.)

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

The above skeleton is suitable for the case where no decompression is needed. (But, of course, omitting the method altogether is even easier, and is recommended in such cases.)

Returns a value indicating the “cost” of inserting the new entry into a particular branch of the tree. Items will be inserted down the path of least penalty in the tree. Values returned by penalty should be non-negative. If a negative value is returned, it will be treated as zero.

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

For historical reasons, the penalty function doesn't just return a float result; instead it has to store the value at the location indicated by the third argument. The return value per se is ignored, though it's conventional to pass back the address of that argument.

The penalty function is crucial to good performance of the index. It'll get used at insertion time to determine which branch to follow when choosing where to add the new entry in the tree. At query time, the more balanced the index, the quicker the lookup.

When an index page split is necessary, this function decides which entries on the page are to stay on the old page, and which are to move to the new page.

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

Notice that the picksplit function's result is delivered by modifying the passed-in v structure. The return value per se is ignored, though it's conventional to pass back the address of v.

Like penalty, the picksplit function is crucial to good performance of the index. Designing suitable penalty and picksplit implementations is where the challenge of implementing well-performing GiST indexes lies.

Returns true if two index entries are identical, false otherwise. (An “index entry” is a value of the index's storage type, not necessarily the original indexed column's type.)

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

For historical reasons, the same function doesn't just return a Boolean result; instead it has to store the flag at the location indicated by the third argument. The return value per se is ignored, though it's conventional to pass back the address of that argument.

Given an index entry p and a query value q, this function determines the index entry's “distance” from the query value. This function must be supplied if the operator class contains any ordering operators. A query using the ordering operator will be implemented by returning index entries with the smallest “distance” values first, so the results must be consistent with the operator's semantics. For a leaf index entry the result just represents the distance to the index entry; for an internal tree node, the result must be the smallest distance that any child entry could have.

The SQL declaration of the function must look like this:

And the matching code in the C module could then follow this skeleton:

The arguments to the distance function are identical to the arguments of the consistent function.

Some approximation is allowed when determining the distance, so long as the result is never greater than the entry's actual distance. Thus, for example, distance to a bounding box is usually sufficient in geometric applications. For an internal tree node, the distance returned must not be greater than the distance to any of the child nodes. If the returned distance is not exact, the function must set *recheck to true. (This is not necessary for internal tree nodes; for them, the calculation is always assumed to be inexact.) In this case the executor will calculate the accurate distance after fetching the tuple from the heap, and reorder the tuples if necessary.

If the distance function returns *recheck = true for any leaf node, the original ordering operator's return type must be float8 or float4, and the distance function's result values must be comparable to those of the original ordering operator, since the executor will sort using both distance function results and recalculated ordering-operator results. Otherwise, the distance function's result values can be any finite float8 values, so long as the relative order of the result values matches the order returned by the ordering operator. (Infinity and minus infinity are used internally to handle cases such as nulls, so it is not recommended that distance functions return these values.)

Converts the compressed index representation of a data item into the original data type, for index-only scans. The returned data must be an exact, non-lossy copy of the originally indexed value.

The SQL declaration of the function must look like this:

The argument is a pointer to a GISTENTRY struct. On entry, its key field contains a non-NULL leaf datum in compressed form. The return value is another GISTENTRY struct, whose key field contains the same datum in its original, uncompressed form. If the opclass's compress function does nothing for leaf entries, the fetch method can return the argument as-is. Or, if the opclass does not have a compress function, the fetch method can be omitted as well, since it would necessarily be a no-op.

The matching code in the C module could then follow this skeleton:

If the compress method is lossy for leaf entries, the operator class cannot support index-only scans, and must not define a fetch function.

Allows definition of user-visible parameters that control operator class behavior.

The SQL declaration of the function must look like this:

The function is passed a pointer to a local_relopts struct, which needs to be filled with a set of operator class specific options. The options can be accessed from other support functions using the PG_HAS_OPCLASS_OPTIONS() and PG_GET_OPCLASS_OPTIONS() macros.

An example implementation of my_options() and parameters use from other support functions are given below:

Since the representation of the key in GiST is flexible, it may depend on user-specified parameters. For instance, the length of key signature may be specified. See gtsvector_options() for example.

Returns a comparator function to sort data in a way that preserves locality. It is used by CREATE INDEX and REINDEX commands. The quality of the created index depends on how well the sort order determined by the comparator function preserves locality of the inputs.

The sortsupport method is optional. If it is not provided, CREATE INDEX builds the index by inserting each tuple to the tree using the penalty and picksplit functions, which is much slower.

The SQL declaration of the function must look like this:

The argument is a pointer to a SortSupport struct. At a minimum, the function must fill in its comparator field. The comparator takes three arguments: two Datums to compare, and a pointer to the SortSupport struct. The Datums are the two indexed values in the format that they are stored in the index; that is, in the format returned by the compress method. The full API is defined in src/include/utils/sortsupport.h.

The matching code in the C module could then follow this skeleton:

Given a CompareType value from src/include/nodes/primnodes.h, returns a strategy number used by this operator class for matching functionality. The function should return InvalidStrategy if the operator class has no matching strategy.

This is used for temporal index constraints (i.e., PRIMARY KEY and UNIQUE). If the operator class provides this function and it returns results for COMPARE_EQ, it can be used in the non-WITHOUT OVERLAPS part(s) of an index constraint.

This support function corresponds to the index access method callback function amtranslatecmptype (see Section 63.2). The amtranslatecmptype callback function for GiST indexes merely calls down to the translate_cmptype support function of the respective operator family, since the GiST index access method has no fixed strategy numbers itself.

The SQL declaration of the function must look like this:

And the operator family registration must look like this:

The matching code in the C module could then follow this skeleton:

One translation function is provided by PostgreSQL: gist_translate_cmptype_common is for operator classes that use the RT*StrategyNumber constants. The btree_gist extension defines a second translation function, gist_translate_cmptype_btree, for operator classes that use the BT*StrategyNumber constants.

All the GiST support methods are normally called in short-lived memory contexts; that is, CurrentMemoryContext will get reset after each tuple is processed. It is therefore not very important to worry about pfree'ing everything you palloc. However, in some cases it's useful for a support method to cache data across repeated calls. To do that, allocate the longer-lived data in fcinfo->flinfo->fn_mcxt, and keep a pointer to it in fcinfo->flinfo->fn_extra. Such data will survive for the life of the index operation (e.g., a single GiST index scan, index build, or index tuple insertion). Be careful to pfree the previous value when replacing a fn_extra value, or the leak will accumulate for the duration of the operation.

The simplest way to build a GiST index is just to insert all the entries, one by one. This tends to be slow for large indexes, because if the index tuples are scattered across the index and the index is large enough to not fit in cache, a lot of random I/O will be needed. PostgreSQL supports two alternative methods for initial build of a GiST index: sorted and buffered modes.

The sorted method is only available if each of the opclasses used by the index provides a sortsupport function, as described in Section 65.2.3. If they do, this method is usually the best, so it is used by default.

The buffered method works by not inserting tuples directly into the index right away. It can dramatically reduce the amount of random I/O needed for non-ordered data sets. For well-ordered data sets the benefit is smaller or non-existent, because only a small number of pages receive new tuples at a time, and those pages fit in cache even if the index as a whole does not.

The buffered method needs to call the penalty function more often than the simple method does, which consumes some extra CPU resources. Also, the buffers need temporary disk space, up to the size of the resulting index. Buffering can also influence the quality of the resulting index, in both positive and negative directions. That influence depends on various factors, like the distribution of the input data and the operator class implementation.

If sorting is not possible, then by default a GiST index build switches to the buffering method when the index size reaches effective_cache_size. Buffering can be manually forced or prevented by the buffering parameter to the CREATE INDEX command. The default behavior is good for most cases, but turning buffering off might speed up the build somewhat if the input data is ordered.

The PostgreSQL source distribution includes several examples of index methods implemented using GiST. The core system currently provides text search support (indexing for tsvector and tsquery) as well as R-Tree equivalent functionality for some of the built-in geometric data types (see src/backend/access/gist/gistproc.c). The following contrib modules also contain GiST operator classes:

B-tree equivalent functionality for several data types

Indexing for multidimensional cubes

Module for storing (key, value) pairs

RD-Tree for one-dimensional array of int4 values

Indexing for tree-like structures

Text similarity using trigram matching

Indexing for “float ranges”

**Examples:**

Example 1 (unknown):
```unknown
<< (box, box)
```

Example 2 (r):
```r
<-> (box, point)
```

Example 3 (unknown):
```unknown
&< (box, box)
```

Example 4 (unknown):
```unknown
&& (box, box)
```

---


---

