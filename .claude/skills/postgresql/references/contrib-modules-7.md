# PostgreSQL - Contrib Modules (Part 7)

## F.23. pageinspect — low-level inspection of database pages #


**URL:** https://www.postgresql.org/docs/18/pageinspect.html

**Contents:**
- F.23. pageinspect — low-level inspection of database pages #
  - F.23.1. General Functions #
  - F.23.2. Heap Functions #
  - F.23.3. B-Tree Functions #
  - F.23.4. BRIN Functions #
  - F.23.5. GIN Functions #
  - F.23.6. GiST Functions #
  - F.23.7. Hash Functions #

The pageinspect module provides functions that allow you to inspect the contents of database pages at a low level, which is useful for debugging purposes. All of these functions may be used only by superusers.

get_raw_page reads the specified block of the named relation and returns a copy as a bytea value. This allows a single time-consistent copy of the block to be obtained. fork should be 'main' for the main data fork, 'fsm' for the free space map, 'vm' for the visibility map, or 'init' for the initialization fork.

A shorthand version of get_raw_page, for reading from the main fork. Equivalent to get_raw_page(relname, 'main', blkno)

page_header shows fields that are common to all PostgreSQL heap and index pages.

A page image obtained with get_raw_page should be passed as argument. For example:

The returned columns correspond to the fields in the PageHeaderData struct. See src/include/storage/bufpage.h for details.

The checksum field is the checksum stored in the page, which might be incorrect if the page is somehow corrupted. If data checksums are disabled for this instance, then the value stored is meaningless.

page_checksum computes the checksum for the page, as if it was located at the given block.

A page image obtained with get_raw_page should be passed as argument. For example:

Note that the checksum depends on the block number, so matching block numbers should be passed (except when doing esoteric debugging).

The checksum computed with this function can be compared with the checksum result field of the function page_header. If data checksums are enabled for this instance, then the two values should be equal.

fsm_page_contents shows the internal node structure of an FSM page. For example:

The output is a multiline string, with one line per node in the binary tree within the page. Only those nodes that are not zero are printed. The so-called "next" pointer, which points to the next slot to be returned from the page, is also printed.

See src/backend/storage/freespace/README for more information on the structure of an FSM page.

heap_page_items shows all line pointers on a heap page. For those line pointers that are in use, tuple headers as well as tuple raw data are also shown. All tuples are shown, whether or not the tuples were visible to an MVCC snapshot at the time the raw page was copied.

A heap page image obtained with get_raw_page should be passed as argument. For example:

See src/include/storage/itemid.h and src/include/access/htup_details.h for explanations of the fields returned.

The heap_tuple_infomask_flags function can be used to unpack the flag bits of t_infomask and t_infomask2 for heap tuples.

tuple_data_split splits tuple data into attributes in the same way as backend internals.

This function should be called with the same arguments as the return attributes of heap_page_items.

If do_detoast is true, attributes will be detoasted as needed. Default value is false.

heap_page_item_attrs is equivalent to heap_page_items except that it returns tuple raw data as an array of attributes that can optionally be detoasted by do_detoast which is false by default.

A heap page image obtained with get_raw_page should be passed as argument. For example:

heap_tuple_infomask_flags decodes the t_infomask and t_infomask2 returned by heap_page_items into a human-readable set of arrays made of flag names, with one column for all the flags and one column for combined flags. For example:

This function should be called with the same arguments as the return attributes of heap_page_items.

Combined flags are displayed for source-level macros that take into account the value of more than one raw bit, such as HEAP_XMIN_FROZEN.

See src/include/access/htup_details.h for explanations of the flag names returned.

bt_metap returns information about a B-tree index's metapage. For example:

bt_page_stats returns summary information about a data page of a B-tree index. For example:

bt_multi_page_stats returns the same information as bt_page_stats, but does so for each page of the range of pages beginning at blkno and extending for blk_count pages. If blk_count is negative, all pages from blkno to the end of the index are reported on. For example:

bt_page_items returns detailed information about all of the items on a B-tree index page. For example:

This is a B-tree leaf page. All tuples that point to the table happen to be posting list tuples (all of which store a total of 100 6 byte TIDs). There is also a “high key” tuple at itemoffset number 1. ctid is used to store encoded information about each tuple in this example, though leaf page tuples often store a heap TID directly in the ctid field instead. tids is the list of TIDs stored as a posting list.

In an internal page (not shown), the block number part of ctid is a “downlink”, which is a block number of another page in the index itself. The offset part (the second number) of ctid stores encoded information about the tuple, such as the number of columns present (suffix truncation may have removed unneeded suffix columns). Truncated columns are treated as having the value “minus infinity”.

htid shows a heap TID for the tuple, regardless of the underlying tuple representation. This value may match ctid, or may be decoded from the alternative representations used by posting list tuples and tuples from internal pages. Tuples in internal pages usually have the implementation level heap TID column truncated away, which is represented as a NULL htid value.

Note that the first item on any non-rightmost page (any page with a non-zero value in the btpo_next field) is the page's “high key”, meaning its data serves as an upper bound on all items appearing on the page, while its ctid field does not point to another block. Also, on internal pages, the first real data item (the first item that is not a high key) reliably has every column truncated away, leaving no actual value in its data field. Such an item does have a valid downlink in its ctid field, however.

For more details about the structure of B-tree indexes, see Section 65.1.4.1. For more details about deduplication and posting lists, see Section 65.1.4.3.

It is also possible to pass a page to bt_page_items as a bytea value. A page image obtained with get_raw_page should be passed as argument. So the last example could also be rewritten like this:

All the other details are the same as explained in the previous item.

brin_page_type returns the page type of the given BRIN index page, or throws an error if the page is not a valid BRIN page. For example:

brin_metapage_info returns assorted information about a BRIN index metapage. For example:

brin_revmap_data returns the list of tuple identifiers in a BRIN index range map page. For example:

brin_page_items returns the data stored in the BRIN data page. For example:

The returned columns correspond to the fields in the BrinMemTuple and BrinValues structs. See src/include/access/brin_tuple.h for details.

gin_metapage_info returns information about a GIN index metapage. For example:

gin_page_opaque_info returns information about a GIN index opaque area, like the page type. For example:

gin_leafpage_items returns information about the data stored in a compressed GIN leaf page. For example:

gist_page_opaque_info returns information from a GiST index page's opaque area, such as the NSN, rightlink and page type. For example:

gist_page_items returns information about the data stored in a page of a GiST index. For example:

Same as gist_page_items, but returns the key data as a raw bytea blob. Since it does not attempt to decode the key, it does not need to know which index is involved. For example:

hash_page_type returns page type of the given HASH index page. For example:

hash_page_stats returns information about a bucket or overflow page of a HASH index. For example:

hash_page_items returns information about the data stored in a bucket or overflow page of a HASH index page. For example:

hash_bitmap_info shows the status of a bit in the bitmap page for a particular overflow page of HASH index. For example:

hash_metapage_info returns information stored in the meta page of a HASH index. For example:

**Examples:**

Example 1 (unknown):
```unknown
pageinspect
```

Example 2 (unknown):
```unknown
get_raw_page(relname text, fork text, blkno bigint) returns bytea
```

Example 3 (unknown):
```unknown
get_raw_page
```

Example 4 (unknown):
```unknown
get_raw_page(relname text, blkno bigint) returns bytea
```

---


---

## F.18. intagg — integer aggregator and enumerator #


**URL:** https://www.postgresql.org/docs/18/intagg.html

**Contents:**
- F.18. intagg — integer aggregator and enumerator #
  - F.18.1. Functions #
  - F.18.2. Sample Uses #

The intagg module provides an integer aggregator and an enumerator. intagg is now obsolete, because there are built-in functions that provide a superset of its capabilities. However, the module is still provided as a compatibility wrapper around the built-in functions.

The aggregator is an aggregate function int_array_aggregate(integer) that produces an integer array containing exactly the integers it is fed. This is a wrapper around array_agg, which does the same thing for any array type.

The enumerator is a function int_array_enum(integer[]) that returns setof integer. It is essentially the reverse operation of the aggregator: given an array of integers, expand it into a set of rows. This is a wrapper around unnest, which does the same thing for any array type.

Many database systems have the notion of a many to many table. Such a table usually sits between two indexed tables, for example:

It is typically used like this:

This will return all the items in the right hand table for an entry in the left hand table. This is a very common construct in SQL.

Now, this methodology can be cumbersome with a very large number of entries in the many_to_many table. Often, a join like this would result in an index scan and a fetch for each right hand entry in the table for a particular left hand entry. If you have a very dynamic system, there is not much you can do. However, if you have some data which is fairly static, you can create a summary table with the aggregator.

This will create a table with one row per left item, and an array of right items. Now this is pretty useless without some way of using the array; that's why there is an array enumerator. You can do

The above query using int_array_enum produces the same results as

The difference is that the query against the summary table has to get only one row from the table, whereas the direct query against many_to_many must index scan and fetch a row for each entry.

On one system, an EXPLAIN showed a query with a cost of 8488 was reduced to a cost of 329. The original query was a join involving the many_to_many table, which was replaced by:

**Examples:**

Example 1 (unknown):
```unknown
int_array_aggregate(integer)
```

Example 2 (unknown):
```unknown
int_array_enum(integer[])
```

Example 3 (unknown):
```unknown
setof integer
```

Example 4 (sql):
```sql
CREATE TABLE left_table  (id INT PRIMARY KEY, ...);
CREATE TABLE right_table (id INT PRIMARY KEY, ...);
CREATE TABLE many_to_many(id_left  INT REFERENCES left_table,
                          id_right INT REFERENCES right_table);
```

---


---

## F.3. auto_explain — log execution plans of slow queries #


**URL:** https://www.postgresql.org/docs/18/auto-explain.html

**Contents:**
- F.3. auto_explain — log execution plans of slow queries #
  - F.3.1. Configuration Parameters #
  - Note
  - F.3.2. Example #
  - F.3.3. Author #

The auto_explain module provides a means for logging execution plans of slow statements automatically, without having to run EXPLAIN by hand. This is especially helpful for tracking down un-optimized queries in large applications.

The module provides no SQL-accessible functions. To use it, simply load it into the server. You can load it into an individual session:

(You must be superuser to do that.) More typical usage is to preload it into some or all sessions by including auto_explain in session_preload_libraries or shared_preload_libraries in postgresql.conf. Then you can track unexpectedly slow queries no matter when they happen. Of course there is a price in overhead for that.

There are several configuration parameters that control the behavior of auto_explain. Note that the default behavior is to do nothing, so you must set at least auto_explain.log_min_duration if you want any results.

auto_explain.log_min_duration is the minimum statement execution time, in milliseconds, that will cause the statement's plan to be logged. Setting this to 0 logs all plans. -1 (the default) disables logging of plans. For example, if you set it to 250ms then all statements that run 250ms or longer will be logged. Only superusers can change this setting.

auto_explain.log_parameter_max_length controls the logging of query parameter values. A value of -1 (the default) logs the parameter values in full. 0 disables logging of parameter values. A value greater than zero truncates each parameter value to that many bytes. Only superusers can change this setting.

auto_explain.log_analyze causes EXPLAIN ANALYZE output, rather than just EXPLAIN output, to be printed when an execution plan is logged. This parameter is off by default. Only superusers can change this setting.

When this parameter is on, per-plan-node timing occurs for all statements executed, whether or not they run long enough to actually get logged. This can have an extremely negative impact on performance. Turning off auto_explain.log_timing ameliorates the performance cost, at the price of obtaining less information.

auto_explain.log_buffers controls whether buffer usage statistics are printed when an execution plan is logged; it's equivalent to the BUFFERS option of EXPLAIN. This parameter has no effect unless auto_explain.log_analyze is enabled. This parameter is off by default. Only superusers can change this setting.

auto_explain.log_wal controls whether WAL usage statistics are printed when an execution plan is logged; it's equivalent to the WAL option of EXPLAIN. This parameter has no effect unless auto_explain.log_analyze is enabled. This parameter is off by default. Only superusers can change this setting.

auto_explain.log_timing controls whether per-node timing information is printed when an execution plan is logged; it's equivalent to the TIMING option of EXPLAIN. The overhead of repeatedly reading the system clock can slow down queries significantly on some systems, so it may be useful to set this parameter to off when only actual row counts, and not exact times, are needed. This parameter has no effect unless auto_explain.log_analyze is enabled. This parameter is on by default. Only superusers can change this setting.

auto_explain.log_triggers causes trigger execution statistics to be included when an execution plan is logged. This parameter has no effect unless auto_explain.log_analyze is enabled. This parameter is off by default. Only superusers can change this setting.

auto_explain.log_verbose controls whether verbose details are printed when an execution plan is logged; it's equivalent to the VERBOSE option of EXPLAIN. This parameter is off by default. Only superusers can change this setting.

auto_explain.log_settings controls whether information about modified configuration options is printed when an execution plan is logged. Only options affecting query planning with value different from the built-in default value are included in the output. This parameter is off by default. Only superusers can change this setting.

auto_explain.log_format selects the EXPLAIN output format to be used. The allowed values are text, xml, json, and yaml. The default is text. Only superusers can change this setting.

auto_explain.log_level selects the log level at which auto_explain will log the query plan. Valid values are DEBUG5, DEBUG4, DEBUG3, DEBUG2, DEBUG1, INFO, NOTICE, WARNING, and LOG. The default is LOG. Only superusers can change this setting.

auto_explain.log_nested_statements causes nested statements (statements executed inside a function) to be considered for logging. When it is off, only top-level query plans are logged. This parameter is off by default. Only superusers can change this setting.

auto_explain.sample_rate causes auto_explain to only explain a fraction of the statements in each session. The default is 1, meaning explain all the queries. In case of nested statements, either all will be explained or none. Only superusers can change this setting.

In ordinary usage, these parameters are set in postgresql.conf, although superusers can alter them on-the-fly within their own sessions. Typical usage might be:

This might produce log output such as:

Takahiro Itagaki <itagaki.takahiro@oss.ntt.co.jp>

**Examples:**

Example 1 (unknown):
```unknown
auto_explain
```

Example 2 (unknown):
```unknown
LOAD 'auto_explain';
```

Example 3 (unknown):
```unknown
auto_explain
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

## F.12. dict_int — example full-text search dictionary for integers #


**URL:** https://www.postgresql.org/docs/18/dict-int.html

**Contents:**
- F.12. dict_int — example full-text search dictionary for integers #
  - F.12.1. Configuration #
  - F.12.2. Usage #

dict_int is an example of an add-on dictionary template for full-text search. The motivation for this example dictionary is to control the indexing of integers (signed and unsigned), allowing such numbers to be indexed while preventing excessive growth in the number of unique words, which greatly affects the performance of searching.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

The dictionary accepts three options:

The maxlen parameter specifies the maximum number of digits allowed in an integer word. The default value is 6.

The rejectlong parameter specifies whether an overlength integer should be truncated or ignored. If rejectlong is false (the default), the dictionary returns the first maxlen digits of the integer. If rejectlong is true, the dictionary treats an overlength integer as a stop word, so that it will not be indexed. Note that this also means that such an integer cannot be searched for.

The absval parameter specifies whether leading “+” or “-” signs should be removed from integer words. The default is false. When true, the sign is removed before maxlen is applied.

Installing the dict_int extension creates a text search template intdict_template and a dictionary intdict based on it, with the default parameters. You can alter the parameters, for example

or create new dictionaries based on the template.

To test the dictionary, you can try

but real-world usage will involve including it in a text search configuration as described in Chapter 12. That might look like this:

**Examples:**

Example 1 (unknown):
```unknown
intdict_template
```

Example 2 (unknown):
```unknown
mydb# ALTER TEXT SEARCH DICTIONARY intdict (MAXLEN = 4, REJECTLONG = true);
ALTER TEXT SEARCH DICTIONARY
```

Example 3 (sql):
```sql
mydb# select ts_lexize('intdict', '12345678');
 ts_lexize
-----------
 {123456}
```

Example 4 (unknown):
```unknown
ALTER TEXT SEARCH CONFIGURATION english
    ALTER MAPPING FOR int, uint WITH intdict;
```

---


---

