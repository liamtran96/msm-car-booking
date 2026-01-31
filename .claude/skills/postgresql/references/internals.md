# PostgreSQL - Internals

## 51.5. Planner/Optimizer #


**URL:** https://www.postgresql.org/docs/18/planner-optimizer.html

**Contents:**
- 51.5. Planner/Optimizer #
  - Note
  - 51.5.1. Generating Possible Plans #

The task of the planner/optimizer is to create an optimal execution plan. A given SQL query (and hence, a query tree) can be actually executed in a wide variety of different ways, each of which will produce the same set of results. If it is computationally feasible, the query optimizer will examine each of these possible execution plans, ultimately selecting the execution plan that is expected to run the fastest.

In some situations, examining each possible way in which a query can be executed would take an excessive amount of time and memory. In particular, this occurs when executing queries involving large numbers of join operations. In order to determine a reasonable (not necessarily optimal) query plan in a reasonable amount of time, PostgreSQL uses a Genetic Query Optimizer (see Chapter 61) when the number of joins exceeds a threshold (see geqo_threshold).

The planner's search procedure actually works with data structures called paths, which are simply cut-down representations of plans containing only as much information as the planner needs to make its decisions. After the cheapest path is determined, a full-fledged plan tree is built to pass to the executor. This represents the desired execution plan in sufficient detail for the executor to run it. In the rest of this section we'll ignore the distinction between paths and plans.

The planner/optimizer starts by generating plans for scanning each individual relation (table) used in the query. The possible plans are determined by the available indexes on each relation. There is always the possibility of performing a sequential scan on a relation, so a sequential scan plan is always created. Assume an index is defined on a relation (for example a B-tree index) and a query contains the restriction relation.attribute OPR constant. If relation.attribute happens to match the key of the B-tree index and OPR is one of the operators listed in the index's operator class, another plan is created using the B-tree index to scan the relation. If there are further indexes present and the restrictions in the query happen to match a key of an index, further plans will be considered. Index scan plans are also generated for indexes that have a sort ordering that can match the query's ORDER BY clause (if any), or a sort ordering that might be useful for merge joining (see below).

If the query requires joining two or more relations, plans for joining relations are considered after all feasible plans have been found for scanning single relations. The three available join strategies are:

nested loop join: The right relation is scanned once for every row found in the left relation. This strategy is easy to implement but can be very time consuming. (However, if the right relation can be scanned with an index scan, this can be a good strategy. It is possible to use values from the current row of the left relation as keys for the index scan of the right.)

merge join: Each relation is sorted on the join attributes before the join starts. Then the two relations are scanned in parallel, and matching rows are combined to form join rows. This kind of join is attractive because each relation has to be scanned only once. The required sorting might be achieved either by an explicit sort step, or by scanning the relation in the proper order using an index on the join key.

hash join: the right relation is first scanned and loaded into a hash table, using its join attributes as hash keys. Next the left relation is scanned and the appropriate values of every row found are used as hash keys to locate the matching rows in the table.

When the query involves more than two relations, the final result must be built up by a tree of join steps, each with two inputs. The planner examines different possible join sequences to find the cheapest one.

If the query uses fewer than geqo_threshold relations, a near-exhaustive search is conducted to find the best join sequence. The planner preferentially considers joins between any two relations for which there exists a corresponding join clause in the WHERE qualification (i.e., for which a restriction like where rel1.attr1=rel2.attr2 exists). Join pairs with no join clause are considered only when there is no other choice, that is, a particular relation has no available join clauses to any other relation. All possible plans are generated for every join pair considered by the planner, and the one that is (estimated to be) the cheapest is chosen.

When geqo_threshold is exceeded, the join sequences considered are determined by heuristics, as described in Chapter 61. Otherwise the process is the same.

The finished plan tree consists of sequential or index scans of the base relations, plus nested-loop, merge, or hash join nodes as needed, plus any auxiliary steps needed, such as sort nodes or aggregate-function calculation nodes. Most of these plan node types have the additional ability to do selection (discarding rows that do not meet a specified Boolean condition) and projection (computation of a derived column set based on given column values, that is, evaluation of scalar expressions where needed). One of the responsibilities of the planner is to attach selection conditions from the WHERE clause and computation of required output expressions to the most appropriate nodes of the plan tree.

**Examples:**

Example 1 (unknown):
```unknown
relation.attribute OPR constant
```

Example 2 (unknown):
```unknown
relation.attribute
```

Example 3 (sql):
```sql
where rel1.attr1=rel2.attr2
```

Example 4 (unknown):
```unknown
geqo_threshold
```

---


---

## 51.3. The Parser Stage #


**URL:** https://www.postgresql.org/docs/18/parser-stage.html

**Contents:**
- 51.3. The Parser Stage #
  - 51.3.1. Parser #
  - Note
  - 51.3.2. Transformation Process #

The parser stage consists of two parts:

The parser defined in gram.y and scan.l is built using the Unix tools bison and flex.

The transformation process does modifications and augmentations to the data structures returned by the parser.

The parser has to check the query string (which arrives as plain text) for valid syntax. If the syntax is correct a parse tree is built up and handed back; otherwise an error is returned. The parser and lexer are implemented using the well-known Unix tools bison and flex.

The lexer is defined in the file scan.l and is responsible for recognizing identifiers, the SQL key words etc. For every key word or identifier that is found, a token is generated and handed to the parser.

The parser is defined in the file gram.y and consists of a set of grammar rules and actions that are executed whenever a rule is fired. The code of the actions (which is actually C code) is used to build up the parse tree.

The file scan.l is transformed to the C source file scan.c using the program flex and gram.y is transformed to gram.c using bison. After these transformations have taken place a normal C compiler can be used to create the parser. Never make any changes to the generated C files as they will be overwritten the next time flex or bison is called.

The mentioned transformations and compilations are normally done automatically using the makefiles shipped with the PostgreSQL source distribution.

A detailed description of bison or the grammar rules given in gram.y would be beyond the scope of this manual. There are many books and documents dealing with flex and bison. You should be familiar with bison before you start to study the grammar given in gram.y otherwise you won't understand what happens there.

The parser stage creates a parse tree using only fixed rules about the syntactic structure of SQL. It does not make any lookups in the system catalogs, so there is no possibility to understand the detailed semantics of the requested operations. After the parser completes, the transformation process takes the tree handed back by the parser as input and does the semantic interpretation needed to understand which tables, functions, and operators are referenced by the query. The data structure that is built to represent this information is called the query tree.

The reason for separating raw parsing from semantic analysis is that system catalog lookups can only be done within a transaction, and we do not wish to start a transaction immediately upon receiving a query string. The raw parsing stage is sufficient to identify the transaction control commands (BEGIN, ROLLBACK, etc.), and these can then be correctly executed without any further analysis. Once we know that we are dealing with an actual query (such as SELECT or UPDATE), it is okay to start a transaction if we're not already in one. Only then can the transformation process be invoked.

The query tree created by the transformation process is structurally similar to the raw parse tree in most places, but it has many differences in detail. For example, a FuncCall node in the parse tree represents something that looks syntactically like a function call. This might be transformed to either a FuncExpr or Aggref node depending on whether the referenced name turns out to be an ordinary function or an aggregate function. Also, information about the actual data types of columns and expression results is added to the query tree.

---


---

## 51.6. Executor #


**URL:** https://www.postgresql.org/docs/18/executor.html

**Contents:**
- 51.6. Executor #

The executor takes the plan created by the planner/optimizer and recursively processes it to extract the required set of rows. This is essentially a demand-pull pipeline mechanism. Each time a plan node is called, it must deliver one more row, or report that it is done delivering rows.

To provide a concrete example, assume that the top node is a MergeJoin node. Before any merge can be done two rows have to be fetched (one from each subplan). So the executor recursively calls itself to process the subplans (it starts with the subplan attached to lefttree). The new top node (the top node of the left subplan) is, let's say, a Sort node and again recursion is needed to obtain an input row. The child node of the Sort might be a SeqScan node, representing actual reading of a table. Execution of this node causes the executor to fetch a row from the table and return it up to the calling node. The Sort node will repeatedly call its child to obtain all the rows to be sorted. When the input is exhausted (as indicated by the child node returning a NULL instead of a row), the Sort code performs the sort, and finally is able to return its first output row, namely the first one in sorted order. It keeps the remaining rows stored so that it can deliver them in sorted order in response to later demands.

The MergeJoin node similarly demands the first row from its right subplan. Then it compares the two rows to see if they can be joined; if so, it returns a join row to its caller. On the next call, or immediately if it cannot join the current pair of inputs, it advances to the next row of one table or the other (depending on how the comparison came out), and again checks for a match. Eventually, one subplan or the other is exhausted, and the MergeJoin node returns NULL to indicate that no more join rows can be formed.

Complex queries can involve many levels of plan nodes, but the general approach is the same: each node computes and returns its next output row each time it is called. Each node is also responsible for applying any selection or projection expressions that were assigned to it by the planner.

The executor mechanism is used to evaluate all five basic SQL query types: SELECT, INSERT, UPDATE, DELETE, and MERGE. For SELECT, the top-level executor code only needs to send each row returned by the query plan tree off to the client. INSERT ... SELECT, UPDATE, DELETE, and MERGE are effectively SELECTs under a special top-level plan node called ModifyTable.

INSERT ... SELECT feeds the rows up to ModifyTable for insertion. For UPDATE, the planner arranges that each computed row includes all the updated column values, plus the TID (tuple ID, or row ID) of the original target row; this data is fed up to the ModifyTable node, which uses the information to create a new updated row and mark the old row deleted. For DELETE, the only column that is actually returned by the plan is the TID, and the ModifyTable node simply uses the TID to visit each target row and mark it deleted. For MERGE, the planner joins the source and target relations, and includes all column values required by any of the WHEN clauses, plus the TID of the target row; this data is fed up to the ModifyTable node, which uses the information to work out which WHEN clause to execute, and then inserts, updates or deletes the target row, as required.

A simple INSERT ... VALUES command creates a trivial plan tree consisting of a single Result node, which computes just one result row, feeding that up to ModifyTable to perform the insertion.

**Examples:**

Example 1 (unknown):
```unknown
INSERT ... SELECT
```

Example 2 (unknown):
```unknown
ModifyTable
```

Example 3 (unknown):
```unknown
INSERT ... SELECT
```

Example 4 (unknown):
```unknown
ModifyTable
```

---


---

