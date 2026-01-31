# PostgreSQL - Internals (Part 4)

## 58.4. Foreign Data Wrapper Query Planning #


**URL:** https://www.postgresql.org/docs/18/fdw-planning.html

**Contents:**
- 58.4. Foreign Data Wrapper Query Planning #

The FDW callback functions GetForeignRelSize, GetForeignPaths, GetForeignPlan, PlanForeignModify, GetForeignJoinPaths, GetForeignUpperPaths, and PlanDirectModify must fit into the workings of the PostgreSQL planner. Here are some notes about what they must do.

The information in root and baserel can be used to reduce the amount of information that has to be fetched from the foreign table (and therefore reduce the cost). baserel->baserestrictinfo is particularly interesting, as it contains restriction quals (WHERE clauses) that should be used to filter the rows to be fetched. (The FDW itself is not required to enforce these quals, as the core executor can check them instead.) baserel->reltarget->exprs can be used to determine which columns need to be fetched; but note that it only lists columns that have to be emitted by the ForeignScan plan node, not columns that are used in qual evaluation but not output by the query.

Various private fields are available for the FDW planning functions to keep information in. Generally, whatever you store in FDW private fields should be palloc'd, so that it will be reclaimed at the end of planning.

baserel->fdw_private is a void pointer that is available for FDW planning functions to store information relevant to the particular foreign table. The core planner does not touch it except to initialize it to NULL when the RelOptInfo node is created. It is useful for passing information forward from GetForeignRelSize to GetForeignPaths and/or GetForeignPaths to GetForeignPlan, thereby avoiding recalculation.

GetForeignPaths can identify the meaning of different access paths by storing private information in the fdw_private field of ForeignPath nodes. fdw_private is declared as a List pointer, but could actually contain anything since the core planner does not touch it. However, best practice is to use a representation that's dumpable by nodeToString, for use with debugging support available in the backend.

GetForeignPlan can examine the fdw_private field of the selected ForeignPath node, and can generate fdw_exprs and fdw_private lists to be placed in the ForeignScan plan node, where they will be available at execution time. Both of these lists must be represented in a form that copyObject knows how to copy. The fdw_private list has no other restrictions and is not interpreted by the core backend in any way. The fdw_exprs list, if not NIL, is expected to contain expression trees that are intended to be executed at run time. These trees will undergo post-processing by the planner to make them fully executable.

In GetForeignPlan, generally the passed-in target list can be copied into the plan node as-is. The passed scan_clauses list contains the same clauses as baserel->baserestrictinfo, but may be re-ordered for better execution efficiency. In simple cases the FDW can just strip RestrictInfo nodes from the scan_clauses list (using extract_actual_clauses) and put all the clauses into the plan node's qual list, which means that all the clauses will be checked by the executor at run time. More complex FDWs may be able to check some of the clauses internally, in which case those clauses can be removed from the plan node's qual list so that the executor doesn't waste time rechecking them.

As an example, the FDW might identify some restriction clauses of the form foreign_variable = sub_expression, which it determines can be executed on the remote server given the locally-evaluated value of the sub_expression. The actual identification of such a clause should happen during GetForeignPaths, since it would affect the cost estimate for the path. The path's fdw_private field would probably include a pointer to the identified clause's RestrictInfo node. Then GetForeignPlan would remove that clause from scan_clauses, but add the sub_expression to fdw_exprs to ensure that it gets massaged into executable form. It would probably also put control information into the plan node's fdw_private field to tell the execution functions what to do at run time. The query transmitted to the remote server would involve something like WHERE foreign_variable = $1, with the parameter value obtained at run time from evaluation of the fdw_exprs expression tree.

Any clauses removed from the plan node's qual list must instead be added to fdw_recheck_quals or rechecked by RecheckForeignScan in order to ensure correct behavior at the READ COMMITTED isolation level. When a concurrent update occurs for some other table involved in the query, the executor may need to verify that all of the original quals are still satisfied for the tuple, possibly against a different set of parameter values. Using fdw_recheck_quals is typically easier than implementing checks inside RecheckForeignScan, but this method will be insufficient when outer joins have been pushed down, since the join tuples in that case might have some fields go to NULL without rejecting the tuple entirely.

Another ForeignScan field that can be filled by FDWs is fdw_scan_tlist, which describes the tuples returned by the FDW for this plan node. For simple foreign table scans this can be set to NIL, implying that the returned tuples have the row type declared for the foreign table. A non-NIL value must be a target list (list of TargetEntrys) containing Vars and/or expressions representing the returned columns. This might be used, for example, to show that the FDW has omitted some columns that it noticed won't be needed for the query. Also, if the FDW can compute expressions used by the query more cheaply than can be done locally, it could add those expressions to fdw_scan_tlist. Note that join plans (created from paths made by GetForeignJoinPaths) must always supply fdw_scan_tlist to describe the set of columns they will return.

The FDW should always construct at least one path that depends only on the table's restriction clauses. In join queries, it might also choose to construct path(s) that depend on join clauses, for example foreign_variable = local_variable. Such clauses will not be found in baserel->baserestrictinfo but must be sought in the relation's join lists. A path using such a clause is called a “parameterized path”. It must identify the other relations used in the selected join clause(s) with a suitable value of param_info; use get_baserel_parampathinfo to compute that value. In GetForeignPlan, the local_variable portion of the join clause would be added to fdw_exprs, and then at run time the case works the same as for an ordinary restriction clause.

If an FDW supports remote joins, GetForeignJoinPaths should produce ForeignPaths for potential remote joins in much the same way as GetForeignPaths works for base tables. Information about the intended join can be passed forward to GetForeignPlan in the same ways described above. However, baserestrictinfo is not relevant for join relations; instead, the relevant join clauses for a particular join are passed to GetForeignJoinPaths as a separate parameter (extra->restrictlist).

An FDW might additionally support direct execution of some plan actions that are above the level of scans and joins, such as grouping or aggregation. To offer such options, the FDW should generate paths and insert them into the appropriate upper relation. For example, a path representing remote aggregation should be inserted into the UPPERREL_GROUP_AGG relation, using add_path. This path will be compared on a cost basis with local aggregation performed by reading a simple scan path for the foreign relation (note that such a path must also be supplied, else there will be an error at plan time). If the remote-aggregation path wins, which it usually would, it will be converted into a plan in the usual way, by calling GetForeignPlan. The recommended place to generate such paths is in the GetForeignUpperPaths callback function, which is called for each upper relation (i.e., each post-scan/join processing step), if all the base relations of the query come from the same FDW.

PlanForeignModify and the other callbacks described in Section 58.2.4 are designed around the assumption that the foreign relation will be scanned in the usual way and then individual row updates will be driven by a local ModifyTable plan node. This approach is necessary for the general case where an update requires reading local tables as well as foreign tables. However, if the operation could be executed entirely by the foreign server, the FDW could generate a path representing that and insert it into the UPPERREL_FINAL upper relation, where it would compete against the ModifyTable approach. This approach could also be used to implement remote SELECT FOR UPDATE, rather than using the row locking callbacks described in Section 58.2.6. Keep in mind that a path inserted into UPPERREL_FINAL is responsible for implementing all behavior of the query.

When planning an UPDATE or DELETE, PlanForeignModify and PlanDirectModify can look up the RelOptInfo struct for the foreign table and make use of the baserel->fdw_private data previously created by the scan-planning functions. However, in INSERT the target table is not scanned so there is no RelOptInfo for it. The List returned by PlanForeignModify has the same restrictions as the fdw_private list of a ForeignScan plan node, that is it must contain only structures that copyObject knows how to copy.

INSERT with an ON CONFLICT clause does not support specifying the conflict target, as unique constraints or exclusion constraints on remote tables are not locally known. This in turn implies that ON CONFLICT DO UPDATE is not supported, since the specification is mandatory there.

**Examples:**

Example 1 (unknown):
```unknown
GetForeignRelSize
```

Example 2 (unknown):
```unknown
GetForeignPaths
```

Example 3 (unknown):
```unknown
GetForeignPlan
```

Example 4 (unknown):
```unknown
PlanForeignModify
```

---


---

## Chapter 60. Writing a Custom Scan Provider


**URL:** https://www.postgresql.org/docs/18/custom-scan.html

**Contents:**
- Chapter 60. Writing a Custom Scan Provider

PostgreSQL supports a set of experimental facilities which are intended to allow extension modules to add new scan types to the system. Unlike a foreign data wrapper, which is only responsible for knowing how to scan its own foreign tables, a custom scan provider can provide an alternative method of scanning any relation in the system. Typically, the motivation for writing a custom scan provider will be to allow the use of some optimization not supported by the core system, such as caching or some form of hardware acceleration. This chapter outlines how to write a new custom scan provider.

Implementing a new type of custom scan is a three-step process. First, during planning, it is necessary to generate access paths representing a scan using the proposed strategy. Second, if one of those access paths is selected by the planner as the optimal strategy for scanning a particular relation, the access path must be converted to a plan. Finally, it must be possible to execute the plan and generate the same results that would have been generated for any other access path targeting the same relation.

---


---

## Chapter 62. Table Access Method Interface Definition


**URL:** https://www.postgresql.org/docs/18/tableam.html

**Contents:**
- Chapter 62. Table Access Method Interface Definition

This chapter explains the interface between the core PostgreSQL system and table access methods, which manage the storage for tables. The core system knows little about these access methods beyond what is specified here, so it is possible to develop entirely new access method types by writing add-on code.

Each table access method is described by a row in the pg_am system catalog. The pg_am entry specifies a name and a handler function for the table access method. These entries can be created and deleted using the CREATE ACCESS METHOD and DROP ACCESS METHOD SQL commands.

A table access method handler function must be declared to accept a single argument of type internal and to return the pseudo-type table_am_handler. The argument is a dummy value that simply serves to prevent handler functions from being called directly from SQL commands.

Here is how an extension SQL script file might create a table access method handler:

The result of the function must be a pointer to a struct of type TableAmRoutine, which contains everything that the core code needs to know to make use of the table access method. The return value needs to be of server lifetime, which is typically achieved by defining it as a static const variable in global scope.

Here is how a source file with the table access method handler might look like:

The TableAmRoutine struct, also called the access method's API struct, defines the behavior of the access method using callbacks. These callbacks are pointers to plain C functions and are not visible or callable at the SQL level. All the callbacks and their behavior is defined in the TableAmRoutine structure (with comments inside the struct defining the requirements for callbacks). Most callbacks have wrapper functions, which are documented from the point of view of a user (rather than an implementor) of the table access method. For details, please refer to the src/include/access/tableam.h file.

To implement an access method, an implementor will typically need to implement an AM-specific type of tuple table slot (see src/include/executor/tuptable.h), which allows code outside the access method to hold references to tuples of the AM, and to access the columns of the tuple.

Currently, the way an AM actually stores data is fairly unconstrained. For example, it's possible, but not required, to use postgres' shared buffer cache. In case it is used, it likely makes sense to use PostgreSQL's standard page layout as described in Section 66.6.

One fairly large constraint of the table access method API is that, currently, if the AM wants to support modifications and/or indexes, it is necessary for each tuple to have a tuple identifier (TID) consisting of a block number and an item number (see also Section 66.6). It is not strictly necessary that the sub-parts of TIDs have the same meaning they e.g., have for heap, but if bitmap scan support is desired (it is optional), the block number needs to provide locality.

For crash safety, an AM can use postgres' WAL, or a custom implementation. If WAL is chosen, either Generic WAL Records can be used, or a Custom WAL Resource Manager can be implemented.

To implement transactional support in a manner that allows different table access methods be accessed within a single transaction, it likely is necessary to closely integrate with the machinery in src/backend/access/transam/xlog.c.

Any developer of a new table access method can refer to the existing heap implementation present in src/backend/access/heap/heapam_handler.c for details of its implementation.

**Examples:**

Example 1 (unknown):
```unknown
table_am_handler
```

Example 2 (javascript):
```javascript
CREATE OR REPLACE FUNCTION my_tableam_handler(internal)
  RETURNS table_am_handler AS 'my_extension', 'my_tableam_handler'
  LANGUAGE C STRICT;

CREATE ACCESS METHOD myam TYPE TABLE HANDLER my_tableam_handler;
```

Example 3 (unknown):
```unknown
TableAmRoutine
```

Example 4 (unknown):
```unknown
static const
```

---


---

## 51.1. The Path of a Query #


**URL:** https://www.postgresql.org/docs/18/query-path.html

**Contents:**
- 51.1. The Path of a Query #

Here we give a short overview of the stages a query has to pass to obtain a result.

A connection from an application program to the PostgreSQL server has to be established. The application program transmits a query to the server and waits to receive the results sent back by the server.

The parser stage checks the query transmitted by the application program for correct syntax and creates a query tree.

The rewrite system takes the query tree created by the parser stage and looks for any rules (stored in the system catalogs) to apply to the query tree. It performs the transformations given in the rule bodies.

One application of the rewrite system is in the realization of views. Whenever a query against a view (i.e., a virtual table) is made, the rewrite system rewrites the user's query to a query that accesses the base tables given in the view definition instead.

The planner/optimizer takes the (rewritten) query tree and creates a query plan that will be the input to the executor.

It does so by first creating all possible paths leading to the same result. For example if there is an index on a relation to be scanned, there are two paths for the scan. One possibility is a simple sequential scan and the other possibility is to use the index. Next the cost for the execution of each path is estimated and the cheapest path is chosen. The cheapest path is expanded into a complete plan that the executor can use.

The executor recursively steps through the plan tree and retrieves rows in the way represented by the plan. The executor makes use of the storage system while scanning relations, performs sorts and joins, evaluates qualifications and finally hands back the rows derived.

In the following sections we will cover each of the above listed items in more detail to give a better understanding of PostgreSQL's internal control and data structures.

---


---

## 56.2. For the Programmer #


**URL:** https://www.postgresql.org/docs/18/nls-programmer.html

**Contents:**
- 56.2. For the Programmer #
  - 56.2.1. Mechanics #
  - 56.2.2. Message-Writing Guidelines #

This section describes how to implement native language support in a program or library that is part of the PostgreSQL distribution. Currently, it only applies to C programs.

Adding NLS Support to a Program

Insert this code into the start-up sequence of the program:

(The progname can actually be chosen freely.)

Wherever a message that is a candidate for translation is found, a call to gettext() needs to be inserted. E.g.:

(gettext is defined as a no-op if NLS support is not configured.)

This tends to add a lot of clutter. One common shortcut is to use:

Another solution is feasible if the program does much of its communication through one or a few functions, such as ereport() in the backend. Then you make this function call gettext internally on all input strings.

Add a file nls.mk in the directory with the program sources. This file will be read as a makefile. The following variable assignments need to be made here:

The program name, as provided in the textdomain() call.

List of files that contain translatable strings, i.e., those marked with gettext or an alternative solution. Eventually, this will include nearly all source files of the program. If this list gets too long you can make the first “file” be a + and the second word be a file that contains one file name per line.

The tools that generate message catalogs for the translators to work on need to know what function calls contain translatable strings. By default, only gettext() calls are known. If you used _ or other identifiers you need to list them here. If the translatable string is not the first argument, the item needs to be of the form func:2 (for the second argument). If you have a function that supports pluralized messages, the item should look like func:1,2 (identifying the singular and plural message arguments).

Add a file po/LINGUAS, which will contain the list of provided translations — initially empty.

The build system will automatically take care of building and installing the message catalogs.

Here are some guidelines for writing messages that are easily translatable.

Do not construct sentences at run-time, like:

The word order within the sentence might be different in other languages. Also, even if you remember to call gettext() on each fragment, the fragments might not translate well separately. It's better to duplicate a little code so that each message to be translated is a coherent whole. Only numbers, file names, and such-like run-time variables should be inserted at run time into a message text.

For similar reasons, this won't work:

because it assumes how the plural is formed. If you figured you could solve it like this:

then be disappointed. Some languages have more than two forms, with some peculiar rules. It's often best to design the message to avoid the issue altogether, for instance like this:

If you really want to construct a properly pluralized message, there is support for this, but it's a bit awkward. When generating a primary or detail error message in ereport(), you can write something like this:

The first argument is the format string appropriate for English singular form, the second is the format string appropriate for English plural form, and the third is the integer control value that determines which plural form to use. Subsequent arguments are formatted per the format string as usual. (Normally, the pluralization control value will also be one of the values to be formatted, so it has to be written twice.) In English it only matters whether n is 1 or not 1, but in other languages there can be many different plural forms. The translator sees the two English forms as a group and has the opportunity to supply multiple substitute strings, with the appropriate one being selected based on the run-time value of n.

If you need to pluralize a message that isn't going directly to an errmsg or errdetail report, you have to use the underlying function ngettext. See the gettext documentation.

If you want to communicate something to the translator, such as about how a message is intended to line up with other output, precede the occurrence of the string with a comment that starts with translator, e.g.:

These comments are copied to the message catalog files so that the translators can see them.

**Examples:**

Example 1 (cpp):
```cpp
#ifdef ENABLE_NLS
#include <locale.h>
#endif

...

#ifdef ENABLE_NLS
setlocale(LC_ALL, "");
bindtextdomain("progname", LOCALEDIR);
textdomain("progname");
#endif
```

Example 2 (unknown):
```unknown
fprintf(stderr, "panic level %d\n", lvl);
```

Example 3 (unknown):
```unknown
fprintf(stderr, gettext("panic level %d\n"), lvl);
```

Example 4 (unknown):
```unknown
#define _(x) gettext(x)
```

---


---

## 58.5. Row Locking in Foreign Data Wrappers #


**URL:** https://www.postgresql.org/docs/18/fdw-row-locking.html

**Contents:**
- 58.5. Row Locking in Foreign Data Wrappers #

If an FDW's underlying storage mechanism has a concept of locking individual rows to prevent concurrent updates of those rows, it is usually worthwhile for the FDW to perform row-level locking with as close an approximation as practical to the semantics used in ordinary PostgreSQL tables. There are multiple considerations involved in this.

One key decision to be made is whether to perform early locking or late locking. In early locking, a row is locked when it is first retrieved from the underlying store, while in late locking, the row is locked only when it is known that it needs to be locked. (The difference arises because some rows may be discarded by locally-checked restriction or join conditions.) Early locking is much simpler and avoids extra round trips to a remote store, but it can cause locking of rows that need not have been locked, resulting in reduced concurrency or even unexpected deadlocks. Also, late locking is only possible if the row to be locked can be uniquely re-identified later. Preferably the row identifier should identify a specific version of the row, as PostgreSQL TIDs do.

By default, PostgreSQL ignores locking considerations when interfacing to FDWs, but an FDW can perform early locking without any explicit support from the core code. The API functions described in Section 58.2.6, which were added in PostgreSQL 9.5, allow an FDW to use late locking if it wishes.

An additional consideration is that in READ COMMITTED isolation mode, PostgreSQL may need to re-check restriction and join conditions against an updated version of some target tuple. Rechecking join conditions requires re-obtaining copies of the non-target rows that were previously joined to the target tuple. When working with standard PostgreSQL tables, this is done by including the TIDs of the non-target tables in the column list projected through the join, and then re-fetching non-target rows when required. This approach keeps the join data set compact, but it requires inexpensive re-fetch capability, as well as a TID that can uniquely identify the row version to be re-fetched. By default, therefore, the approach used with foreign tables is to include a copy of the entire row fetched from a foreign table in the column list projected through the join. This puts no special demands on the FDW but can result in reduced performance of merge and hash joins. An FDW that is capable of meeting the re-fetch requirements can choose to do it the first way.

For an UPDATE or DELETE on a foreign table, it is recommended that the ForeignScan operation on the target table perform early locking on the rows that it fetches, perhaps via the equivalent of SELECT FOR UPDATE. An FDW can detect whether a table is an UPDATE/DELETE target at plan time by comparing its relid to root->parse->resultRelation, or at execution time by using ExecRelationIsTargetRelation(). An alternative possibility is to perform late locking within the ExecForeignUpdate or ExecForeignDelete callback, but no special support is provided for this.

For foreign tables that are specified to be locked by a SELECT FOR UPDATE/SHARE command, the ForeignScan operation can again perform early locking by fetching tuples with the equivalent of SELECT FOR UPDATE/SHARE. To perform late locking instead, provide the callback functions defined in Section 58.2.6. In GetForeignRowMarkType, select rowmark option ROW_MARK_EXCLUSIVE, ROW_MARK_NOKEYEXCLUSIVE, ROW_MARK_SHARE, or ROW_MARK_KEYSHARE depending on the requested lock strength. (The core code will act the same regardless of which of these four options you choose.) Elsewhere, you can detect whether a foreign table was specified to be locked by this type of command by using get_plan_rowmark at plan time, or ExecFindRowMark at execution time; you must check not only whether a non-null rowmark struct is returned, but that its strength field is not LCS_NONE.

Lastly, for foreign tables that are used in an UPDATE, DELETE or SELECT FOR UPDATE/SHARE command but are not specified to be row-locked, you can override the default choice to copy entire rows by having GetForeignRowMarkType select option ROW_MARK_REFERENCE when it sees lock strength LCS_NONE. This will cause RefetchForeignRow to be called with that value for markType; it should then re-fetch the row without acquiring any new lock. (If you have a GetForeignRowMarkType function but don't wish to re-fetch unlocked rows, select option ROW_MARK_COPY for LCS_NONE.)

See src/include/nodes/lockoptions.h, the comments for RowMarkType and PlanRowMark in src/include/nodes/plannodes.h, and the comments for ExecRowMark in src/include/nodes/execnodes.h for additional information.

**Examples:**

Example 1 (unknown):
```unknown
READ COMMITTED
```

Example 2 (unknown):
```unknown
ForeignScan
```

Example 3 (sql):
```sql
SELECT FOR UPDATE
```

Example 4 (php):
```php
root->parse->resultRelation
```

---


---

## 60.1. Creating Custom Scan Paths #


**URL:** https://www.postgresql.org/docs/18/custom-scan-path.html

**Contents:**
- 60.1. Creating Custom Scan Paths #
  - 60.1.1. Custom Scan Path Callbacks #

A custom scan provider will typically add paths for a base relation by setting the following hook, which is called after the core code has generated all the access paths it can for the relation (except for Gather and Gather Merge paths, which are made after this call so that they can use partial paths added by the hook):

Although this hook function can be used to examine, modify, or remove paths generated by the core system, a custom scan provider will typically confine itself to generating CustomPath objects and adding them to rel using add_path, or add_partial_path if they are partial paths. The custom scan provider is responsible for initializing the CustomPath object, which is declared like this:

path must be initialized as for any other path, including the row-count estimate, start and total cost, and sort ordering provided by this path. flags is a bit mask, which specifies whether the scan provider can support certain optional capabilities. flags should include CUSTOMPATH_SUPPORT_BACKWARD_SCAN if the custom path can support a backward scan, CUSTOMPATH_SUPPORT_MARK_RESTORE if it can support mark and restore, and CUSTOMPATH_SUPPORT_PROJECTION if it can perform projections. (If CUSTOMPATH_SUPPORT_PROJECTION is not set, the scan node will only be asked to produce Vars of the scanned relation; while if that flag is set, the scan node must be able to evaluate scalar expressions over these Vars.) An optional custom_paths is a list of Path nodes used by this custom-path node; these will be transformed into Plan nodes by planner. As described below, custom paths can be created for join relations as well. In such a case, custom_restrictinfo should be used to store the set of join clauses to apply to the join the custom path replaces. Otherwise it should be NIL. custom_private can be used to store the custom path's private data. Private data should be stored in a form that can be handled by nodeToString, so that debugging routines that attempt to print the custom path will work as designed. methods must point to a (usually statically allocated) object implementing the required custom path methods, which are further detailed below.

A custom scan provider can also provide join paths. Just as for base relations, such a path must produce the same output as would normally be produced by the join it replaces. To do this, the join provider should set the following hook, and then within the hook function, create CustomPath path(s) for the join relation.

This hook will be invoked repeatedly for the same join relation, with different combinations of inner and outer relations; it is the responsibility of the hook to minimize duplicated work.

Note also that the set of join clauses to apply to the join, which is passed as extra->restrictlist, varies depending on the combination of inner and outer relations. A CustomPath path generated for the joinrel must contain the set of join clauses it uses, which will be used by the planner to convert the CustomPath path into a plan, if it is selected by the planner as the best path for the joinrel.

Convert a custom path to a finished plan. The return value will generally be a CustomScan object, which the callback must allocate and initialize. See Section 60.2 for more details.

This callback is called while converting a path parameterized by the top-most parent of the given child relation child_rel to be parameterized by the child relation. The callback is used to reparameterize any paths or translate any expression nodes saved in the given custom_private member of a CustomPath. The callback may use reparameterize_path_by_child, adjust_appendrel_attrs or adjust_appendrel_attrs_multilevel as required.

**Examples:**

Example 1 (unknown):
```unknown
typedef void (*set_rel_pathlist_hook_type) (PlannerInfo *root,
                                            RelOptInfo *rel,
                                            Index rti,
                                            RangeTblEntry *rte);
extern PGDLLIMPORT set_rel_pathlist_hook_type set_rel_pathlist_hook;
```

Example 2 (unknown):
```unknown
add_partial_path
```

Example 3 (swift):
```swift
typedef struct CustomPath
{
    Path      path;
    uint32    flags;
    List     *custom_paths;
    List     *custom_restrictinfo;
    List     *custom_private;
    const CustomPathMethods *methods;
} CustomPath;
```

Example 4 (unknown):
```unknown
CUSTOMPATH_SUPPORT_BACKWARD_SCAN
```

---


---

