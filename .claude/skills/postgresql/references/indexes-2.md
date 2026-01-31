# PostgreSQL - Indexes (Part 2)

## 11.8. Partial Indexes #


**URL:** https://www.postgresql.org/docs/18/indexes-partial.html

**Contents:**
- 11.8. Partial Indexes #

A partial index is an index built over a subset of a table; the subset is defined by a conditional expression (called the predicate of the partial index). The index contains entries only for those table rows that satisfy the predicate. Partial indexes are a specialized feature, but there are several situations in which they are useful.

One major reason for using a partial index is to avoid indexing common values. Since a query searching for a common value (one that accounts for more than a few percent of all the table rows) will not use the index anyway, there is no point in keeping those rows in the index at all. This reduces the size of the index, which will speed up those queries that do use the index. It will also speed up many table update operations because the index does not need to be updated in all cases. Example 11.1 shows a possible application of this idea.

Example 11.1. Setting up a Partial Index to Exclude Common Values

Suppose you are storing web server access logs in a database. Most accesses originate from the IP address range of your organization but some are from elsewhere (say, employees on dial-up connections). If your searches by IP are primarily for outside accesses, you probably do not need to index the IP range that corresponds to your organization's subnet.

Assume a table like this:

To create a partial index that suits our example, use a command such as this:

A typical query that can use this index would be:

Here the query's IP address is covered by the partial index. The following query cannot use the partial index, as it uses an IP address that is excluded from the index:

Observe that this kind of partial index requires that the common values be predetermined, so such partial indexes are best used for data distributions that do not change. Such indexes can be recreated occasionally to adjust for new data distributions, but this adds maintenance effort.

Another possible use for a partial index is to exclude values from the index that the typical query workload is not interested in; this is shown in Example 11.2. This results in the same advantages as listed above, but it prevents the “uninteresting” values from being accessed via that index, even if an index scan might be profitable in that case. Obviously, setting up partial indexes for this kind of scenario will require a lot of care and experimentation.

Example 11.2. Setting up a Partial Index to Exclude Uninteresting Values

If you have a table that contains both billed and unbilled orders, where the unbilled orders take up a small fraction of the total table and yet those are the most-accessed rows, you can improve performance by creating an index on just the unbilled rows. The command to create the index would look like this:

A possible query to use this index would be:

However, the index can also be used in queries that do not involve order_nr at all, e.g.:

This is not as efficient as a partial index on the amount column would be, since the system has to scan the entire index. Yet, if there are relatively few unbilled orders, using this partial index just to find the unbilled orders could be a win.

Note that this query cannot use this index:

The order 3501 might be among the billed or unbilled orders.

Example 11.2 also illustrates that the indexed column and the column used in the predicate do not need to match. PostgreSQL supports partial indexes with arbitrary predicates, so long as only columns of the table being indexed are involved. However, keep in mind that the predicate must match the conditions used in the queries that are supposed to benefit from the index. To be precise, a partial index can be used in a query only if the system can recognize that the WHERE condition of the query mathematically implies the predicate of the index. PostgreSQL does not have a sophisticated theorem prover that can recognize mathematically equivalent expressions that are written in different forms. (Not only is such a general theorem prover extremely difficult to create, it would probably be too slow to be of any real use.) The system can recognize simple inequality implications, for example “x < 1” implies “x < 2”; otherwise the predicate condition must exactly match part of the query's WHERE condition or the index will not be recognized as usable. Matching takes place at query planning time, not at run time. As a result, parameterized query clauses do not work with a partial index. For example a prepared query with a parameter might specify “x < ?” which will never imply “x < 2” for all possible values of the parameter.

A third possible use for partial indexes does not require the index to be used in queries at all. The idea here is to create a unique index over a subset of a table, as in Example 11.3. This enforces uniqueness among the rows that satisfy the index predicate, without constraining those that do not.

Example 11.3. Setting up a Partial Unique Index

Suppose that we have a table describing test outcomes. We wish to ensure that there is only one “successful” entry for a given subject and target combination, but there might be any number of “unsuccessful” entries. Here is one way to do it:

This is a particularly efficient approach when there are few successful tests and many unsuccessful ones. It is also possible to allow only one null in a column by creating a unique partial index with an IS NULL restriction.

Finally, a partial index can also be used to override the system's query plan choices. Also, data sets with peculiar distributions might cause the system to use an index when it really should not. In that case the index can be set up so that it is not available for the offending query. Normally, PostgreSQL makes reasonable choices about index usage (e.g., it avoids them when retrieving common values, so the earlier example really only saves index size, it is not required to avoid index usage), and grossly incorrect plan choices are cause for a bug report.

Keep in mind that setting up a partial index indicates that you know at least as much as the query planner knows, in particular you know when an index might be profitable. Forming this knowledge requires experience and understanding of how indexes in PostgreSQL work. In most cases, the advantage of a partial index over a regular index will be minimal. There are cases where they are quite counterproductive, as in Example 11.4.

Example 11.4. Do Not Use Partial Indexes as a Substitute for Partitioning

You might be tempted to create a large set of non-overlapping partial indexes, for example

This is a bad idea! Almost certainly, you'll be better off with a single non-partial index, declared like

(Put the category column first, for the reasons described in Section 11.3.) While a search in this larger index might have to descend through a couple more tree levels than a search in a smaller index, that's almost certainly going to be cheaper than the planner effort needed to select the appropriate one of the partial indexes. The core of the problem is that the system does not understand the relationship among the partial indexes, and will laboriously test each one to see if it's applicable to the current query.

If your table is large enough that a single index really is a bad idea, you should look into using partitioning instead (see Section 5.12). With that mechanism, the system does understand that the tables and indexes are non-overlapping, so far better performance is possible.

More information about partial indexes can be found in [ston89b], [olson93], and [seshadri95].

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE access_log (
    url varchar,
    client_ip inet,
    ...
);
```

Example 2 (sql):
```sql
CREATE INDEX access_log_client_ip_ix ON access_log (client_ip)
WHERE NOT (client_ip > inet '192.168.100.0' AND
           client_ip < inet '192.168.100.255');
```

Example 3 (sql):
```sql
SELECT *
FROM access_log
WHERE url = '/index.html' AND client_ip = inet '212.78.10.32';
```

Example 4 (sql):
```sql
SELECT *
FROM access_log
WHERE url = '/index.html' AND client_ip = inet '192.168.100.23';
```

---


---

## 11.7. Indexes on Expressions #


**URL:** https://www.postgresql.org/docs/18/indexes-expressional.html

**Contents:**
- 11.7. Indexes on Expressions #

An index column need not be just a column of the underlying table, but can be a function or scalar expression computed from one or more columns of the table. This feature is useful to obtain fast access to tables based on the results of computations.

For example, a common way to do case-insensitive comparisons is to use the lower function:

This query can use an index if one has been defined on the result of the lower(col1) function:

If we were to declare this index UNIQUE, it would prevent creation of rows whose col1 values differ only in case, as well as rows whose col1 values are actually identical. Thus, indexes on expressions can be used to enforce constraints that are not definable as simple unique constraints.

As another example, if one often does queries like:

then it might be worth creating an index like this:

The syntax of the CREATE INDEX command normally requires writing parentheses around index expressions, as shown in the second example. The parentheses can be omitted when the expression is just a function call, as in the first example.

Index expressions are relatively expensive to maintain, because the derived expression(s) must be computed for each row insertion and non-HOT update. However, the index expressions are not recomputed during an indexed search, since they are already stored in the index. In both examples above, the system sees the query as just WHERE indexedcolumn = 'constant' and so the speed of the search is equivalent to any other simple index query. Thus, indexes on expressions are useful when retrieval speed is more important than insertion and update speed.

**Examples:**

Example 1 (sql):
```sql
SELECT * FROM test1 WHERE lower(col1) = 'value';
```

Example 2 (unknown):
```unknown
lower(col1)
```

Example 3 (unknown):
```unknown
CREATE INDEX test1_lower_col1_idx ON test1 (lower(col1));
```

Example 4 (sql):
```sql
SELECT * FROM people WHERE (first_name || ' ' || last_name) = 'John Smith';
```

---


---

## 65.3. SP-GiST Indexes #


**URL:** https://www.postgresql.org/docs/18/spgist.html

**Contents:**
- 65.3. SP-GiST Indexes #
  - 65.3.1. Introduction #
  - 65.3.2. Built-in Operator Classes #
  - 65.3.3. Extensibility #
  - Note
  - 65.3.4. Implementation #
    - 65.3.4.1. SP-GiST Limits #
    - 65.3.4.2. SP-GiST Without Node Labels #
    - 65.3.4.3. “All-the-Same” Inner Tuples #
  - 65.3.5. Examples #

SP-GiST is an abbreviation for space-partitioned GiST. SP-GiST supports partitioned search trees, which facilitate development of a wide range of different non-balanced data structures, such as quad-trees, k-d trees, and radix trees (tries). The common feature of these structures is that they repeatedly divide the search space into partitions that need not be of equal size. Searches that are well matched to the partitioning rule can be very fast.

These popular data structures were originally developed for in-memory usage. In main memory, they are usually designed as a set of dynamically allocated nodes linked by pointers. This is not suitable for direct storing on disk, since these chains of pointers can be rather long which would require too many disk accesses. In contrast, disk-based data structures should have a high fanout to minimize I/O. The challenge addressed by SP-GiST is to map search tree nodes to disk pages in such a way that a search need access only a few disk pages, even if it traverses many nodes.

Like GiST, SP-GiST is meant to allow the development of custom data types with the appropriate access methods, by an expert in the domain of the data type, rather than a database expert.

Some of the information here is derived from Purdue University's SP-GiST Indexing Project web site. The SP-GiST implementation in PostgreSQL is primarily maintained by Teodor Sigaev and Oleg Bartunov, and there is more information on their web site.

The core PostgreSQL distribution includes the SP-GiST operator classes shown in Table 65.2.

Table 65.2. Built-in SP-GiST Operator Classes

Of the two operator classes for type point, quad_point_ops is the default. kd_point_ops supports the same operators but uses a different index data structure that may offer better performance in some applications.

The quad_point_ops, kd_point_ops and poly_ops operator classes support the <-> ordering operator, which enables the k-nearest neighbor (k-NN) search over indexed point or polygon data sets.

SP-GiST offers an interface with a high level of abstraction, requiring the access method developer to implement only methods specific to a given data type. The SP-GiST core is responsible for efficient disk mapping and searching the tree structure. It also takes care of concurrency and logging considerations.

Leaf tuples of an SP-GiST tree usually contain values of the same data type as the indexed column, although it is also possible for them to contain lossy representations of the indexed column. Leaf tuples stored at the root level will directly represent the original indexed data value, but leaf tuples at lower levels might contain only a partial value, such as a suffix. In that case the operator class support functions must be able to reconstruct the original value using information accumulated from the inner tuples that are passed through to reach the leaf level.

When an SP-GiST index is created with INCLUDE columns, the values of those columns are also stored in leaf tuples. The INCLUDE columns are of no concern to the SP-GiST operator class, so they are not discussed further here.

Inner tuples are more complex, since they are branching points in the search tree. Each inner tuple contains a set of one or more nodes, which represent groups of similar leaf values. A node contains a downlink that leads either to another, lower-level inner tuple, or to a short list of leaf tuples that all lie on the same index page. Each node normally has a label that describes it; for example, in a radix tree the node label could be the next character of the string value. (Alternatively, an operator class can omit the node labels, if it works with a fixed set of nodes for all inner tuples; see Section 65.3.4.2.) Optionally, an inner tuple can have a prefix value that describes all its members. In a radix tree this could be the common prefix of the represented strings. The prefix value is not necessarily really a prefix, but can be any data needed by the operator class; for example, in a quad-tree it can store the central point that the four quadrants are measured with respect to. A quad-tree inner tuple would then also contain four nodes corresponding to the quadrants around this central point.

Some tree algorithms require knowledge of level (or depth) of the current tuple, so the SP-GiST core provides the possibility for operator classes to manage level counting while descending the tree. There is also support for incrementally reconstructing the represented value when that is needed, and for passing down additional data (called traverse values) during a tree descent.

The SP-GiST core code takes care of null entries. Although SP-GiST indexes do store entries for nulls in indexed columns, this is hidden from the index operator class code: no null index entries or search conditions will ever be passed to the operator class methods. (It is assumed that SP-GiST operators are strict and so cannot succeed for null values.) Null values are therefore not discussed further here.

There are five user-defined methods that an index operator class for SP-GiST must provide, and two are optional. All five mandatory methods follow the convention of accepting two internal arguments, the first of which is a pointer to a C struct containing input values for the support method, while the second argument is a pointer to a C struct where output values must be placed. Four of the mandatory methods just return void, since all their results appear in the output struct; but leaf_consistent returns a boolean result. The methods must not modify any fields of their input structs. In all cases, the output struct is initialized to zeroes before calling the user-defined method. The optional sixth method compress accepts a datum to be indexed as the only argument and returns a value suitable for physical storage in a leaf tuple. The optional seventh method options accepts an internal pointer to a C struct, where opclass-specific parameters should be placed, and returns void.

The five mandatory user-defined methods are:

Returns static information about the index implementation, including the data type OIDs of the prefix and node label data types.

The SQL declaration of the function must look like this:

The first argument is a pointer to a spgConfigIn C struct, containing input data for the function. The second argument is a pointer to a spgConfigOut C struct, which the function must fill with result data.

attType is passed in order to support polymorphic index operator classes; for ordinary fixed-data-type operator classes, it will always have the same value and so can be ignored.

For operator classes that do not use prefixes, prefixType can be set to VOIDOID. Likewise, for operator classes that do not use node labels, labelType can be set to VOIDOID. canReturnData should be set true if the operator class is capable of reconstructing the originally-supplied index value. longValuesOK should be set true only when the attType is of variable length and the operator class is capable of segmenting long values by repeated suffixing (see Section 65.3.4.1).

leafType should match the index storage type defined by the operator class's opckeytype catalog entry. (Note that opckeytype can be zero, implying the storage type is the same as the operator class's input type, which is the most common situation.) For reasons of backward compatibility, the config method can set leafType to some other value, and that value will be used; but this is deprecated since the index contents are then incorrectly identified in the catalogs. Also, it's permissible to leave leafType uninitialized (zero); that is interpreted as meaning the index storage type derived from opckeytype.

When attType and leafType are different, the optional method compress must be provided. Method compress is responsible for transformation of datums to be indexed from attType to leafType.

Chooses a method for inserting a new value into an inner tuple.

The SQL declaration of the function must look like this:

The first argument is a pointer to a spgChooseIn C struct, containing input data for the function. The second argument is a pointer to a spgChooseOut C struct, which the function must fill with result data.

datum is the original datum of spgConfigIn.attType type that was to be inserted into the index. leafDatum is a value of spgConfigOut.leafType type, which is initially a result of method compress applied to datum when method compress is provided, or the same value as datum otherwise. leafDatum can change at lower levels of the tree if the choose or picksplit methods change it. When the insertion search reaches a leaf page, the current value of leafDatum is what will be stored in the newly created leaf tuple. level is the current inner tuple's level, starting at zero for the root level. allTheSame is true if the current inner tuple is marked as containing multiple equivalent nodes (see Section 65.3.4.3). hasPrefix is true if the current inner tuple contains a prefix; if so, prefixDatum is its value. nNodes is the number of child nodes contained in the inner tuple, and nodeLabels is an array of their label values, or NULL if there are no labels.

The choose function can determine either that the new value matches one of the existing child nodes, or that a new child node must be added, or that the new value is inconsistent with the tuple prefix and so the inner tuple must be split to create a less restrictive prefix.

If the new value matches one of the existing child nodes, set resultType to spgMatchNode. Set nodeN to the index (from zero) of that node in the node array. Set levelAdd to the increment in level caused by descending through that node, or leave it as zero if the operator class does not use levels. Set restDatum to equal leafDatum if the operator class does not modify datums from one level to the next, or otherwise set it to the modified value to be used as leafDatum at the next level.

If a new child node must be added, set resultType to spgAddNode. Set nodeLabel to the label to be used for the new node, and set nodeN to the index (from zero) at which to insert the node in the node array. After the node has been added, the choose function will be called again with the modified inner tuple; that call should result in an spgMatchNode result.

If the new value is inconsistent with the tuple prefix, set resultType to spgSplitTuple. This action moves all the existing nodes into a new lower-level inner tuple, and replaces the existing inner tuple with a tuple having a single downlink pointing to the new lower-level inner tuple. Set prefixHasPrefix to indicate whether the new upper tuple should have a prefix, and if so set prefixPrefixDatum to the prefix value. This new prefix value must be sufficiently less restrictive than the original to accept the new value to be indexed. Set prefixNNodes to the number of nodes needed in the new tuple, and set prefixNodeLabels to a palloc'd array holding their labels, or to NULL if node labels are not required. Note that the total size of the new upper tuple must be no more than the total size of the tuple it is replacing; this constrains the lengths of the new prefix and new labels. Set childNodeN to the index (from zero) of the node that will downlink to the new lower-level inner tuple. Set postfixHasPrefix to indicate whether the new lower-level inner tuple should have a prefix, and if so set postfixPrefixDatum to the prefix value. The combination of these two prefixes and the downlink node's label (if any) must have the same meaning as the original prefix, because there is no opportunity to alter the node labels that are moved to the new lower-level tuple, nor to change any child index entries. After the node has been split, the choose function will be called again with the replacement inner tuple. That call may return an spgAddNode result, if no suitable node was created by the spgSplitTuple action. Eventually choose must return spgMatchNode to allow the insertion to descend to the next level.

Decides how to create a new inner tuple over a set of leaf tuples.

The SQL declaration of the function must look like this:

The first argument is a pointer to a spgPickSplitIn C struct, containing input data for the function. The second argument is a pointer to a spgPickSplitOut C struct, which the function must fill with result data.

nTuples is the number of leaf tuples provided. datums is an array of their datum values of spgConfigOut.leafType type. level is the current level that all the leaf tuples share, which will become the level of the new inner tuple.

Set hasPrefix to indicate whether the new inner tuple should have a prefix, and if so set prefixDatum to the prefix value. Set nNodes to indicate the number of nodes that the new inner tuple will contain, and set nodeLabels to an array of their label values, or to NULL if node labels are not required. Set mapTuplesToNodes to an array that gives the index (from zero) of the node that each leaf tuple should be assigned to. Set leafTupleDatums to an array of the values to be stored in the new leaf tuples (these will be the same as the input datums if the operator class does not modify datums from one level to the next). Note that the picksplit function is responsible for palloc'ing the nodeLabels, mapTuplesToNodes and leafTupleDatums arrays.

If more than one leaf tuple is supplied, it is expected that the picksplit function will classify them into more than one node; otherwise it is not possible to split the leaf tuples across multiple pages, which is the ultimate purpose of this operation. Therefore, if the picksplit function ends up placing all the leaf tuples in the same node, the core SP-GiST code will override that decision and generate an inner tuple in which the leaf tuples are assigned at random to several identically-labeled nodes. Such a tuple is marked allTheSame to signify that this has happened. The choose and inner_consistent functions must take suitable care with such inner tuples. See Section 65.3.4.3 for more information.

picksplit can be applied to a single leaf tuple only in the case that the config function set longValuesOK to true and a larger-than-a-page input value has been supplied. In this case the point of the operation is to strip off a prefix and produce a new, shorter leaf datum value. The call will be repeated until a leaf datum short enough to fit on a page has been produced. See Section 65.3.4.1 for more information.

Returns set of nodes (branches) to follow during tree search.

The SQL declaration of the function must look like this:

The first argument is a pointer to a spgInnerConsistentIn C struct, containing input data for the function. The second argument is a pointer to a spgInnerConsistentOut C struct, which the function must fill with result data.

The array scankeys, of length nkeys, describes the index search condition(s). These conditions are combined with AND — only index entries that satisfy all of them are interesting. (Note that nkeys = 0 implies that all index entries satisfy the query.) Usually the consistent function only cares about the sk_strategy and sk_argument fields of each array entry, which respectively give the indexable operator and comparison value. In particular it is not necessary to check sk_flags to see if the comparison value is NULL, because the SP-GiST core code will filter out such conditions. The array orderbys, of length norderbys, describes ordering operators (if any) in the same manner. reconstructedValue is the value reconstructed for the parent tuple; it is (Datum) 0 at the root level or if the inner_consistent function did not provide a value at the parent level. traversalValue is a pointer to any traverse data passed down from the previous call of inner_consistent on the parent index tuple, or NULL at the root level. traversalMemoryContext is the memory context in which to store output traverse values (see below). level is the current inner tuple's level, starting at zero for the root level. returnData is true if reconstructed data is required for this query; this will only be so if the config function asserted canReturnData. allTheSame is true if the current inner tuple is marked “all-the-same”; in this case all the nodes have the same label (if any) and so either all or none of them match the query (see Section 65.3.4.3). hasPrefix is true if the current inner tuple contains a prefix; if so, prefixDatum is its value. nNodes is the number of child nodes contained in the inner tuple, and nodeLabels is an array of their label values, or NULL if the nodes do not have labels.

nNodes must be set to the number of child nodes that need to be visited by the search, and nodeNumbers must be set to an array of their indexes. If the operator class keeps track of levels, set levelAdds to an array of the level increments required when descending to each node to be visited. (Often these increments will be the same for all the nodes, but that's not necessarily so, so an array is used.) If value reconstruction is needed, set reconstructedValues to an array of the values reconstructed for each child node to be visited; otherwise, leave reconstructedValues as NULL. The reconstructed values are assumed to be of type spgConfigOut.leafType. (However, since the core system will do nothing with them except possibly copy them, it is sufficient for them to have the same typlen and typbyval properties as leafType.) If ordered search is performed, set distances to an array of distance values according to orderbys array (nodes with lowest distances will be processed first). Leave it NULL otherwise. If it is desired to pass down additional out-of-band information (“traverse values”) to lower levels of the tree search, set traversalValues to an array of the appropriate traverse values, one for each child node to be visited; otherwise, leave traversalValues as NULL. Note that the inner_consistent function is responsible for palloc'ing the nodeNumbers, levelAdds, distances, reconstructedValues, and traversalValues arrays in the current memory context. However, any output traverse values pointed to by the traversalValues array should be allocated in traversalMemoryContext. Each traverse value must be a single palloc'd chunk.

Returns true if a leaf tuple satisfies a query.

The SQL declaration of the function must look like this:

The first argument is a pointer to a spgLeafConsistentIn C struct, containing input data for the function. The second argument is a pointer to a spgLeafConsistentOut C struct, which the function must fill with result data.

The array scankeys, of length nkeys, describes the index search condition(s). These conditions are combined with AND — only index entries that satisfy all of them satisfy the query. (Note that nkeys = 0 implies that all index entries satisfy the query.) Usually the consistent function only cares about the sk_strategy and sk_argument fields of each array entry, which respectively give the indexable operator and comparison value. In particular it is not necessary to check sk_flags to see if the comparison value is NULL, because the SP-GiST core code will filter out such conditions. The array orderbys, of length norderbys, describes the ordering operators in the same manner. reconstructedValue is the value reconstructed for the parent tuple; it is (Datum) 0 at the root level or if the inner_consistent function did not provide a value at the parent level. traversalValue is a pointer to any traverse data passed down from the previous call of inner_consistent on the parent index tuple, or NULL at the root level. level is the current leaf tuple's level, starting at zero for the root level. returnData is true if reconstructed data is required for this query; this will only be so if the config function asserted canReturnData. leafDatum is the key value of spgConfigOut.leafType stored in the current leaf tuple.

The function must return true if the leaf tuple matches the query, or false if not. In the true case, if returnData is true then leafValue must be set to the value (of type spgConfigIn.attType) originally supplied to be indexed for this leaf tuple. Also, recheck may be set to true if the match is uncertain and so the operator(s) must be re-applied to the actual heap tuple to verify the match. If ordered search is performed, set distances to an array of distance values according to orderbys array. Leave it NULL otherwise. If at least one of returned distances is not exact, set recheckDistances to true. In this case, the executor will calculate the exact distances after fetching the tuple from the heap, and will reorder the tuples if needed.

The optional user-defined methods are:

Converts a data item into a format suitable for physical storage in a leaf tuple of the index. It accepts a value of type spgConfigIn.attType and returns a value of type spgConfigOut.leafType. The output value must not contain an out-of-line TOAST pointer.

Note: the compress method is only applied to values to be stored. The consistent methods receive query scankeys unchanged, without transformation using compress.

Defines a set of user-visible parameters that control operator class behavior.

The SQL declaration of the function must look like this:

The function is passed a pointer to a local_relopts struct, which needs to be filled with a set of operator class specific options. The options can be accessed from other support functions using the PG_HAS_OPCLASS_OPTIONS() and PG_GET_OPCLASS_OPTIONS() macros.

Since the representation of the key in SP-GiST is flexible, it may depend on user-specified parameters.

All the SP-GiST support methods are normally called in a short-lived memory context; that is, CurrentMemoryContext will be reset after processing of each tuple. It is therefore not very important to worry about pfree'ing everything you palloc. (The config method is an exception: it should try to avoid leaking memory. But usually the config method need do nothing but assign constants into the passed parameter struct.)

If the indexed column is of a collatable data type, the index collation will be passed to all the support methods, using the standard PG_GET_COLLATION() mechanism.

This section covers implementation details and other tricks that are useful for implementers of SP-GiST operator classes to know.

Individual leaf tuples and inner tuples must fit on a single index page (8kB by default). Therefore, when indexing values of variable-length data types, long values can only be supported by methods such as radix trees, in which each level of the tree includes a prefix that is short enough to fit on a page, and the final leaf level includes a suffix also short enough to fit on a page. The operator class should set longValuesOK to true only if it is prepared to arrange for this to happen. Otherwise, the SP-GiST core will reject any request to index a value that is too large to fit on an index page.

Likewise, it is the operator class's responsibility that inner tuples do not grow too large to fit on an index page; this limits the number of child nodes that can be used in one inner tuple, as well as the maximum size of a prefix value.

Another limitation is that when an inner tuple's node points to a set of leaf tuples, those tuples must all be in the same index page. (This is a design decision to reduce seeking and save space in the links that chain such tuples together.) If the set of leaf tuples grows too large for a page, a split is performed and an intermediate inner tuple is inserted. For this to fix the problem, the new inner tuple must divide the set of leaf values into more than one node group. If the operator class's picksplit function fails to do that, the SP-GiST core resorts to extraordinary measures described in Section 65.3.4.3.

When longValuesOK is true, it is expected that successive levels of the SP-GiST tree will absorb more and more information into the prefixes and node labels of the inner tuples, making the required leaf datum smaller and smaller, so that eventually it will fit on a page. To prevent bugs in operator classes from causing infinite insertion loops, the SP-GiST core will raise an error if the leaf datum does not become any smaller within ten cycles of choose method calls.

Some tree algorithms use a fixed set of nodes for each inner tuple; for example, in a quad-tree there are always exactly four nodes corresponding to the four quadrants around the inner tuple's centroid point. In such a case the code typically works with the nodes by number, and there is no need for explicit node labels. To suppress node labels (and thereby save some space), the picksplit function can return NULL for the nodeLabels array, and likewise the choose function can return NULL for the prefixNodeLabels array during a spgSplitTuple action. This will in turn result in nodeLabels being NULL during subsequent calls to choose and inner_consistent. In principle, node labels could be used for some inner tuples and omitted for others in the same index.

When working with an inner tuple having unlabeled nodes, it is an error for choose to return spgAddNode, since the set of nodes is supposed to be fixed in such cases.

The SP-GiST core can override the results of the operator class's picksplit function when picksplit fails to divide the supplied leaf values into at least two node categories. When this happens, the new inner tuple is created with multiple nodes that each have the same label (if any) that picksplit gave to the one node it did use, and the leaf values are divided at random among these equivalent nodes. The allTheSame flag is set on the inner tuple to warn the choose and inner_consistent functions that the tuple does not have the node set that they might otherwise expect.

When dealing with an allTheSame tuple, a choose result of spgMatchNode is interpreted to mean that the new value can be assigned to any of the equivalent nodes; the core code will ignore the supplied nodeN value and descend into one of the nodes at random (so as to keep the tree balanced). It is an error for choose to return spgAddNode, since that would make the nodes not all equivalent; the spgSplitTuple action must be used if the value to be inserted doesn't match the existing nodes.

When dealing with an allTheSame tuple, the inner_consistent function should return either all or none of the nodes as targets for continuing the index search, since they are all equivalent. This may or may not require any special-case code, depending on how much the inner_consistent function normally assumes about the meaning of the nodes.

The PostgreSQL source distribution includes several examples of index operator classes for SP-GiST, as described in Table 65.2. Look into src/backend/access/spgist/ and src/backend/utils/adt/ to see the code.

**Examples:**

Example 1 (unknown):
```unknown
<< (box,box)
```

Example 2 (r):
```r
<-> (box,point)
```

Example 3 (unknown):
```unknown
&< (box,box)
```

Example 4 (unknown):
```unknown
&> (box,box)
```

---


---

## 11.6. Unique Indexes #


**URL:** https://www.postgresql.org/docs/18/indexes-unique.html

**Contents:**
- 11.6. Unique Indexes #
  - Note

Indexes can also be used to enforce uniqueness of a column's value, or the uniqueness of the combined values of more than one column.

Currently, only B-tree indexes can be declared unique.

When an index is declared unique, multiple table rows with equal indexed values are not allowed. By default, null values in a unique column are not considered equal, allowing multiple nulls in the column. The NULLS NOT DISTINCT option modifies this and causes the index to treat nulls as equal. A multicolumn unique index will only reject cases where all indexed columns are equal in multiple rows.

PostgreSQL automatically creates a unique index when a unique constraint or primary key is defined for a table. The index covers the columns that make up the primary key or unique constraint (a multicolumn index, if appropriate), and is the mechanism that enforces the constraint.

There's no need to manually create indexes on unique columns; doing so would just duplicate the automatically-created index.

**Examples:**

Example 1 (unknown):
```unknown
NULLS NOT DISTINCT
```

---


---

