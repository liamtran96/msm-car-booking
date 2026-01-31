# PostgreSQL - Internals (Part 5)

## 61.4. Further Reading #


**URL:** https://www.postgresql.org/docs/18/geqo-biblio.html

**Contents:**
- 61.4. Further Reading #

The following resources contain additional information about genetic algorithms:

The Hitch-Hiker's Guide to Evolutionary Computation, (FAQ for news://comp.ai.genetic)

Evolutionary Computation and its application to art and design, by Craig Reynolds

---


---

## 58.1. Foreign Data Wrapper Functions #


**URL:** https://www.postgresql.org/docs/18/fdw-functions.html

**Contents:**
- 58.1. Foreign Data Wrapper Functions #

The FDW author needs to implement a handler function, and optionally a validator function. Both functions must be written in a compiled language such as C, using the version-1 interface. For details on C language calling conventions and dynamic loading, see Section 36.10.

The handler function simply returns a struct of function pointers to callback functions that will be called by the planner, executor, and various maintenance commands. Most of the effort in writing an FDW is in implementing these callback functions. The handler function must be registered with PostgreSQL as taking no arguments and returning the special pseudo-type fdw_handler. The callback functions are plain C functions and are not visible or callable at the SQL level. The callback functions are described in Section 58.2.

The validator function is responsible for validating options given in CREATE and ALTER commands for its foreign data wrapper, as well as foreign servers, user mappings, and foreign tables using the wrapper. The validator function must be registered as taking two arguments, a text array containing the options to be validated, and an OID representing the type of object the options are associated with. The latter corresponds to the OID of the system catalog the object would be stored in, one of:

ForeignDataWrapperRelationId

ForeignServerRelationId

ForeignTableRelationId

UserMappingRelationId

If no validator function is supplied, options are not checked at object creation time or object alteration time.

**Examples:**

Example 1 (unknown):
```unknown
fdw_handler
```

Example 2 (unknown):
```unknown
AttributeRelationId
```

Example 3 (unknown):
```unknown
ForeignDataWrapperRelationId
```

Example 4 (unknown):
```unknown
ForeignServerRelationId
```

---


---

## 51.2. How Connections Are Established #


**URL:** https://www.postgresql.org/docs/18/connect-estab.html

**Contents:**
- 51.2. How Connections Are Established #

PostgreSQL implements a “process per user” client/server model. In this model, every client process connects to exactly one backend process. As we do not know ahead of time how many connections will be made, we have to use a “supervisor process” that spawns a new backend process every time a connection is requested. This supervisor process is called postmaster and listens at a specified TCP/IP port for incoming connections. Whenever it detects a request for a connection, it spawns a new backend process. Those backend processes communicate with each other and with other processes of the instance using semaphores and shared memory to ensure data integrity throughout concurrent data access.

The client process can be any program that understands the PostgreSQL protocol described in Chapter 54. Many clients are based on the C-language library libpq, but several independent implementations of the protocol exist, such as the Java JDBC driver.

Once a connection is established, the client process can send a query to the backend process it's connected to. The query is transmitted using plain text, i.e., there is no parsing done in the client. The backend process parses the query, creates an execution plan, executes the plan, and returns the retrieved rows to the client by transmitting them over the established connection.

---


---

## Chapter 57. Writing a Procedural Language Handler


**URL:** https://www.postgresql.org/docs/18/plhandler.html

**Contents:**
- Chapter 57. Writing a Procedural Language Handler

All calls to functions that are written in a language other than the current “version 1” interface for compiled languages (this includes functions in user-defined procedural languages and functions written in SQL) go through a call handler function for the specific language. It is the responsibility of the call handler to execute the function in a meaningful way, such as by interpreting the supplied source text. This chapter outlines how a new procedural language's call handler can be written.

The call handler for a procedural language is a “normal” function that must be written in a compiled language such as C, using the version-1 interface, and registered with PostgreSQL as taking no arguments and returning the type language_handler. This special pseudo-type identifies the function as a call handler and prevents it from being called directly in SQL commands. For more details on C language calling conventions and dynamic loading, see Section 36.10.

The call handler is called in the same way as any other function: It receives a pointer to a FunctionCallInfoBaseData struct containing argument values and information about the called function, and it is expected to return a Datum result (and possibly set the isnull field of the FunctionCallInfoBaseData structure, if it wishes to return an SQL null result). The difference between a call handler and an ordinary callee function is that the flinfo->fn_oid field of the FunctionCallInfoBaseData structure will contain the OID of the actual function to be called, not of the call handler itself. The call handler must use this field to determine which function to execute. Also, the passed argument list has been set up according to the declaration of the target function, not of the call handler.

It's up to the call handler to fetch the entry of the function from the pg_proc system catalog and to analyze the argument and return types of the called function. The AS clause from the CREATE FUNCTION command for the function will be found in the prosrc column of the pg_proc row. This is commonly source text in the procedural language, but in theory it could be something else, such as a path name to a file, or anything else that tells the call handler what to do in detail.

Often, the same function is called many times per SQL statement. A call handler can avoid repeated lookups of information about the called function by using the flinfo->fn_extra field. This will initially be NULL, but can be set by the call handler to point at information about the called function. On subsequent calls, if flinfo->fn_extra is already non-NULL then it can be used and the information lookup step skipped. The call handler must make sure that flinfo->fn_extra is made to point at memory that will live at least until the end of the current query, since an FmgrInfo data structure could be kept that long. One way to do this is to allocate the extra data in the memory context specified by flinfo->fn_mcxt; such data will normally have the same lifespan as the FmgrInfo itself. But the handler could also choose to use a longer-lived memory context so that it can cache function definition information across queries.

When a procedural-language function is invoked as a trigger, no arguments are passed in the usual way, but the FunctionCallInfoBaseData's context field points at a TriggerData structure, rather than being NULL as it is in a plain function call. A language handler should provide mechanisms for procedural-language functions to get at the trigger information.

A template for a procedural-language handler written as a C extension is provided in src/test/modules/plsample. This is a working sample demonstrating one way to create a procedural-language handler, process parameters, and return a value.

Although providing a call handler is sufficient to create a minimal procedural language, there are two other functions that can optionally be provided to make the language more convenient to use. These are a validator and an inline handler. A validator can be provided to allow language-specific checking to be done during CREATE FUNCTION. An inline handler can be provided to allow the language to support anonymous code blocks executed via the DO command.

If a validator is provided by a procedural language, it must be declared as a function taking a single parameter of type oid. The validator's result is ignored, so it is customarily declared to return void. The validator will be called at the end of a CREATE FUNCTION command that has created or updated a function written in the procedural language. The passed-in OID is the OID of the function's pg_proc row. The validator must fetch this row in the usual way, and do whatever checking is appropriate. First, call CheckFunctionValidatorAccess() to diagnose explicit calls to the validator that the user could not achieve through CREATE FUNCTION. Typical checks then include verifying that the function's argument and result types are supported by the language, and that the function's body is syntactically correct in the language. If the validator finds the function to be okay, it should just return. If it finds an error, it should report that via the normal ereport() error reporting mechanism. Throwing an error will force a transaction rollback and thus prevent the incorrect function definition from being committed.

Validator functions should typically honor the check_function_bodies parameter: if it is turned off then any expensive or context-sensitive checking should be skipped. If the language provides for code execution at compilation time, the validator must suppress checks that would induce such execution. In particular, this parameter is turned off by pg_dump so that it can load procedural language functions without worrying about side effects or dependencies of the function bodies on other database objects. (Because of this requirement, the call handler should avoid assuming that the validator has fully checked the function. The point of having a validator is not to let the call handler omit checks, but to notify the user immediately if there are obvious errors in a CREATE FUNCTION command.) While the choice of exactly what to check is mostly left to the discretion of the validator function, note that the core CREATE FUNCTION code only executes SET clauses attached to a function when check_function_bodies is on. Therefore, checks whose results might be affected by GUC parameters definitely should be skipped when check_function_bodies is off, to avoid false failures when restoring a dump.

If an inline handler is provided by a procedural language, it must be declared as a function taking a single parameter of type internal. The inline handler's result is ignored, so it is customarily declared to return void. The inline handler will be called when a DO statement is executed specifying the procedural language. The parameter actually passed is a pointer to an InlineCodeBlock struct, which contains information about the DO statement's parameters, in particular the text of the anonymous code block to be executed. The inline handler should execute this code and return.

It's recommended that you wrap all these function declarations, as well as the CREATE LANGUAGE command itself, into an extension so that a simple CREATE EXTENSION command is sufficient to install the language. See Section 36.17 for information about writing extensions.

The procedural languages included in the standard distribution are good references when trying to write your own language handler. Look into the src/pl subdirectory of the source tree. The CREATE LANGUAGE reference page also has some useful details.

**Examples:**

Example 1 (unknown):
```unknown
language_handler
```

Example 2 (unknown):
```unknown
FunctionCallInfoBaseData
```

Example 3 (unknown):
```unknown
FunctionCallInfoBaseData
```

Example 4 (php):
```php
flinfo->fn_oid
```

---


---

## 60.2. Creating Custom Scan Plans #


**URL:** https://www.postgresql.org/docs/18/custom-scan-plan.html

**Contents:**
- 60.2. Creating Custom Scan Plans #
  - 60.2.1. Custom Scan Plan Callbacks #

A custom scan is represented in a finished plan tree using the following structure:

scan must be initialized as for any other scan, including estimated costs, target lists, qualifications, and so on. flags is a bit mask with the same meaning as in CustomPath. custom_plans can be used to store child Plan nodes. custom_exprs should be used to store expression trees that will need to be fixed up by setrefs.c and subselect.c, while custom_private should be used to store other private data that is only used by the custom scan provider itself. custom_scan_tlist can be NIL when scanning a base relation, indicating that the custom scan returns scan tuples that match the base relation's row type. Otherwise it is a target list describing the actual scan tuples. custom_scan_tlist must be provided for joins, and could be provided for scans if the custom scan provider can compute some non-Var expressions. custom_relids is set by the core code to the set of relations (range table indexes) that this scan node handles; except when this scan is replacing a join, it will have only one member. methods must point to a (usually statically allocated) object implementing the required custom scan methods, which are further detailed below.

When a CustomScan scans a single relation, scan.scanrelid must be the range table index of the table to be scanned. When it replaces a join, scan.scanrelid should be zero.

Plan trees must be able to be duplicated using copyObject, so all the data stored within the “custom” fields must consist of nodes that that function can handle. Furthermore, custom scan providers cannot substitute a larger structure that embeds a CustomScan for the structure itself, as would be possible for a CustomPath or CustomScanState.

Allocate a CustomScanState for this CustomScan. The actual allocation will often be larger than required for an ordinary CustomScanState, because many providers will wish to embed that as the first field of a larger structure. The value returned must have the node tag and methods set appropriately, but other fields should be left as zeroes at this stage; after ExecInitCustomScan performs basic initialization, the BeginCustomScan callback will be invoked to give the custom scan provider a chance to do whatever else is needed.

**Examples:**

Example 1 (swift):
```swift
typedef struct CustomScan
{
    Scan      scan;
    uint32    flags;
    List     *custom_plans;
    List     *custom_exprs;
    List     *custom_private;
    List     *custom_scan_tlist;
    Bitmapset *custom_relids;
    const CustomScanMethods *methods;
} CustomScan;
```

Example 2 (unknown):
```unknown
custom_plans
```

Example 3 (unknown):
```unknown
custom_exprs
```

Example 4 (unknown):
```unknown
subselect.c
```

---


---

## Chapter 61. Genetic Query Optimizer


**URL:** https://www.postgresql.org/docs/18/geqo.html

**Contents:**
- Chapter 61. Genetic Query Optimizer
  - Author

Written by Martin Utesch (<utesch@aut.tu-freiberg.de>) for the Institute of Automatic Control at the University of Mining and Technology in Freiberg, Germany.

**Examples:**

Example 1 (python):
```python
<utesch@aut.tu-freiberg.de>
```

---


---

## 61.2. Genetic Algorithms #


**URL:** https://www.postgresql.org/docs/18/geqo-intro2.html

**Contents:**
- 61.2. Genetic Algorithms #

The genetic algorithm (GA) is a heuristic optimization method which operates through randomized search. The set of possible solutions for the optimization problem is considered as a population of individuals. The degree of adaptation of an individual to its environment is specified by its fitness.

The coordinates of an individual in the search space are represented by chromosomes, in essence a set of character strings. A gene is a subsection of a chromosome which encodes the value of a single parameter being optimized. Typical encodings for a gene could be binary or integer.

Through simulation of the evolutionary operations recombination, mutation, and selection new generations of search points are found that show a higher average fitness than their ancestors. Figure 61.1 illustrates these steps.

Figure 61.1. Structure of a Genetic Algorithm

According to the comp.ai.genetic FAQ it cannot be stressed too strongly that a GA is not a pure random search for a solution to a problem. A GA uses stochastic processes, but the result is distinctly non-random (better than random).

---


---

## 61.3. Genetic Query Optimization (GEQO) in PostgreSQL #


**URL:** https://www.postgresql.org/docs/18/geqo-pg-intro.html

**Contents:**
- 61.3. Genetic Query Optimization (GEQO) in PostgreSQL #
  - 61.3.1. Generating Possible Plans with GEQO #
  - 61.3.2. Future Implementation Tasks for PostgreSQL GEQO #

The GEQO module approaches the query optimization problem as though it were the well-known traveling salesman problem (TSP). Possible query plans are encoded as integer strings. Each string represents the join order from one relation of the query to the next. For example, the join tree

is encoded by the integer string '4-1-3-2', which means, first join relation '4' and '1', then '3', and then '2', where 1, 2, 3, 4 are relation IDs within the PostgreSQL optimizer.

Specific characteristics of the GEQO implementation in PostgreSQL are:

Usage of a steady state GA (replacement of the least fit individuals in a population, not whole-generational replacement) allows fast convergence towards improved query plans. This is essential for query handling with reasonable time;

Usage of edge recombination crossover which is especially suited to keep edge losses low for the solution of the TSP by means of a GA;

Mutation as genetic operator is deprecated so that no repair mechanisms are needed to generate legal TSP tours.

Parts of the GEQO module are adapted from D. Whitley's Genitor algorithm.

The GEQO module allows the PostgreSQL query optimizer to support large join queries effectively through non-exhaustive search.

The GEQO planning process uses the standard planner code to generate plans for scans of individual relations. Then join plans are developed using the genetic approach. As shown above, each candidate join plan is represented by a sequence in which to join the base relations. In the initial stage, the GEQO code simply generates some possible join sequences at random. For each join sequence considered, the standard planner code is invoked to estimate the cost of performing the query using that join sequence. (For each step of the join sequence, all three possible join strategies are considered; and all the initially-determined relation scan plans are available. The estimated cost is the cheapest of these possibilities.) Join sequences with lower estimated cost are considered “more fit” than those with higher cost. The genetic algorithm discards the least fit candidates. Then new candidates are generated by combining genes of more-fit candidates — that is, by using randomly-chosen portions of known low-cost join sequences to create new sequences for consideration. This process is repeated until a preset number of join sequences have been considered; then the best one found at any time during the search is used to generate the finished plan.

This process is inherently nondeterministic, because of the randomized choices made during both the initial population selection and subsequent “mutation” of the best candidates. To avoid surprising changes of the selected plan, each run of the GEQO algorithm restarts its random number generator with the current geqo_seed parameter setting. As long as geqo_seed and the other GEQO parameters are kept fixed, the same plan will be generated for a given query (and other planner inputs such as statistics). To experiment with different search paths, try changing geqo_seed.

Work is still needed to improve the genetic algorithm parameter settings. In file src/backend/optimizer/geqo/geqo_main.c, routines gimme_pool_size and gimme_number_generations, we have to find a compromise for the parameter settings to satisfy two competing demands:

Optimality of the query plan

In the current implementation, the fitness of each candidate join sequence is estimated by running the standard planner's join selection and cost estimation code from scratch. To the extent that different candidates use similar sub-sequences of joins, a great deal of work will be repeated. This could be made significantly faster by retaining cost estimates for sub-joins. The problem is to avoid expending unreasonable amounts of memory on retaining that state.

At a more basic level, it is not clear that solving query optimization with a GA algorithm designed for TSP is appropriate. In the TSP case, the cost associated with any substring (partial tour) is independent of the rest of the tour, but this is certainly not true for query optimization. Thus it is questionable whether edge recombination crossover is the most effective mutation procedure.

**Examples:**

Example 1 (unknown):
```unknown
src/backend/optimizer/geqo/geqo_main.c
```

Example 2 (unknown):
```unknown
gimme_pool_size
```

Example 3 (unknown):
```unknown
gimme_number_generations
```

---


---

## 61.1. Query Handling as a Complex Optimization Problem #


**URL:** https://www.postgresql.org/docs/18/geqo-intro.html

**Contents:**
- 61.1. Query Handling as a Complex Optimization Problem #

Among all relational operators the most difficult one to process and optimize is the join. The number of possible query plans grows exponentially with the number of joins in the query. Further optimization effort is caused by the support of a variety of join methods (e.g., nested loop, hash join, merge join in PostgreSQL) to process individual joins and a diversity of indexes (e.g., B-tree, hash, GiST and GIN in PostgreSQL) as access paths for relations.

The normal PostgreSQL query optimizer performs a near-exhaustive search over the space of alternative strategies. This algorithm, first introduced in IBM's System R database, produces a near-optimal join order, but can take an enormous amount of time and memory space when the number of joins in the query grows large. This makes the ordinary PostgreSQL query optimizer inappropriate for queries that join a large number of tables.

The Institute of Automatic Control at the University of Mining and Technology, in Freiberg, Germany, encountered some problems when it wanted to use PostgreSQL as the backend for a decision support knowledge based system for the maintenance of an electrical power grid. The DBMS needed to handle large join queries for the inference machine of the knowledge based system. The number of joins in these queries made using the normal query optimizer infeasible.

In the following we describe the implementation of a genetic algorithm to solve the join ordering problem in a manner that is efficient for queries involving large numbers of joins.

---


---

