# PostgreSQL - Extending (Part 5)

## 36.11. Function Optimization Information #


**URL:** https://www.postgresql.org/docs/18/xfunc-optimization.html

**Contents:**
- 36.11. Function Optimization Information #

By default, a function is just a “black box” that the database system knows very little about the behavior of. However, that means that queries using the function may be executed much less efficiently than they could be. It is possible to supply additional knowledge that helps the planner optimize function calls.

Some basic facts can be supplied by declarative annotations provided in the CREATE FUNCTION command. Most important of these is the function's volatility category (IMMUTABLE, STABLE, or VOLATILE); one should always be careful to specify this correctly when defining a function. The parallel safety property (PARALLEL UNSAFE, PARALLEL RESTRICTED, or PARALLEL SAFE) must also be specified if you hope to use the function in parallelized queries. It can also be useful to specify the function's estimated execution cost, and/or the number of rows a set-returning function is estimated to return. However, the declarative way of specifying those two facts only allows specifying a constant value, which is often inadequate.

It is also possible to attach a planner support function to an SQL-callable function (called its target function), and thereby provide knowledge about the target function that is too complex to be represented declaratively. Planner support functions have to be written in C (although their target functions might not be), so this is an advanced feature that relatively few people will use.

A planner support function must have the SQL signature

It is attached to its target function by specifying the SUPPORT clause when creating the target function.

The details of the API for planner support functions can be found in file src/include/nodes/supportnodes.h in the PostgreSQL source code. Here we provide just an overview of what planner support functions can do. The set of possible requests to a support function is extensible, so more things might be possible in future versions.

Some function calls can be simplified during planning based on properties specific to the function. For example, int4mul(n, 1) could be simplified to just n. This type of transformation can be performed by a planner support function, by having it implement the SupportRequestSimplify request type. The support function will be called for each instance of its target function found in a query parse tree. If it finds that the particular call can be simplified into some other form, it can build and return a parse tree representing that expression. This will automatically work for operators based on the function, too — in the example just given, n * 1 would also be simplified to n. (But note that this is just an example; this particular optimization is not actually performed by standard PostgreSQL.) We make no guarantee that PostgreSQL will never call the target function in cases that the support function could simplify. Ensure rigorous equivalence between the simplified expression and an actual execution of the target function.

For target functions that return boolean, it is often useful to estimate the fraction of rows that will be selected by a WHERE clause using that function. This can be done by a support function that implements the SupportRequestSelectivity request type.

If the target function's run time is highly dependent on its inputs, it may be useful to provide a non-constant cost estimate for it. This can be done by a support function that implements the SupportRequestCost request type.

For target functions that return sets, it is often useful to provide a non-constant estimate for the number of rows that will be returned. This can be done by a support function that implements the SupportRequestRows request type.

For target functions that return boolean, it may be possible to convert a function call appearing in WHERE into an indexable operator clause or clauses. The converted clauses might be exactly equivalent to the function's condition, or they could be somewhat weaker (that is, they might accept some values that the function condition does not). In the latter case the index condition is said to be lossy; it can still be used to scan an index, but the function call will have to be executed for each row returned by the index to see if it really passes the WHERE condition or not. To create such conditions, the support function must implement the SupportRequestIndexCondition request type.

**Examples:**

Example 1 (unknown):
```unknown
CREATE FUNCTION
```

Example 2 (unknown):
```unknown
PARALLEL UNSAFE
```

Example 3 (unknown):
```unknown
PARALLEL RESTRICTED
```

Example 4 (unknown):
```unknown
PARALLEL SAFE
```

---


---

## 36.12. User-Defined Aggregates #


**URL:** https://www.postgresql.org/docs/18/xaggr.html

**Contents:**
- 36.12. User-Defined Aggregates #
  - Note
  - 36.12.1. Moving-Aggregate Mode #
  - 36.12.2. Polymorphic and Variadic Aggregates #
  - Note
  - 36.12.3. Ordered-Set Aggregates #
  - 36.12.4. Partial Aggregation #
  - 36.12.5. Support Functions for Aggregates #

Aggregate functions in PostgreSQL are defined in terms of state values and state transition functions. That is, an aggregate operates using a state value that is updated as each successive input row is processed. To define a new aggregate function, one selects a data type for the state value, an initial value for the state, and a state transition function. The state transition function takes the previous state value and the aggregate's input value(s) for the current row, and returns a new state value. A final function can also be specified, in case the desired result of the aggregate is different from the data that needs to be kept in the running state value. The final function takes the ending state value and returns whatever is wanted as the aggregate result. In principle, the transition and final functions are just ordinary functions that could also be used outside the context of the aggregate. (In practice, it's often helpful for performance reasons to create specialized transition functions that can only work when called as part of an aggregate.)

Thus, in addition to the argument and result data types seen by a user of the aggregate, there is an internal state-value data type that might be different from both the argument and result types.

If we define an aggregate that does not use a final function, we have an aggregate that computes a running function of the column values from each row. sum is an example of this kind of aggregate. sum starts at zero and always adds the current row's value to its running total. For example, if we want to make a sum aggregate to work on a data type for complex numbers, we only need the addition function for that data type. The aggregate definition would be:

which we might use like this:

(Notice that we are relying on function overloading: there is more than one aggregate named sum, but PostgreSQL can figure out which kind of sum applies to a column of type complex.)

The above definition of sum will return zero (the initial state value) if there are no nonnull input values. Perhaps we want to return null in that case instead — the SQL standard expects sum to behave that way. We can do this simply by omitting the initcond phrase, so that the initial state value is null. Ordinarily this would mean that the sfunc would need to check for a null state-value input. But for sum and some other simple aggregates like max and min, it is sufficient to insert the first nonnull input value into the state variable and then start applying the transition function at the second nonnull input value. PostgreSQL will do that automatically if the initial state value is null and the transition function is marked “strict” (i.e., not to be called for null inputs).

Another bit of default behavior for a “strict” transition function is that the previous state value is retained unchanged whenever a null input value is encountered. Thus, null values are ignored. If you need some other behavior for null inputs, do not declare your transition function as strict; instead code it to test for null inputs and do whatever is needed.

avg (average) is a more complex example of an aggregate. It requires two pieces of running state: the sum of the inputs and the count of the number of inputs. The final result is obtained by dividing these quantities. Average is typically implemented by using an array as the state value. For example, the built-in implementation of avg(float8) looks like:

float8_accum requires a three-element array, not just two elements, because it accumulates the sum of squares as well as the sum and count of the inputs. This is so that it can be used for some other aggregates as well as avg.

Aggregate function calls in SQL allow DISTINCT and ORDER BY options that control which rows are fed to the aggregate's transition function and in what order. These options are implemented behind the scenes and are not the concern of the aggregate's support functions.

For further details see the CREATE AGGREGATE command.

Aggregate functions can optionally support moving-aggregate mode, which allows substantially faster execution of aggregate functions within windows with moving frame starting points. (See Section 3.5 and Section 4.2.8 for information about use of aggregate functions as window functions.) The basic idea is that in addition to a normal “forward” transition function, the aggregate provides an inverse transition function, which allows rows to be removed from the aggregate's running state value when they exit the window frame. For example a sum aggregate, which uses addition as the forward transition function, would use subtraction as the inverse transition function. Without an inverse transition function, the window function mechanism must recalculate the aggregate from scratch each time the frame starting point moves, resulting in run time proportional to the number of input rows times the average frame length. With an inverse transition function, the run time is only proportional to the number of input rows.

The inverse transition function is passed the current state value and the aggregate input value(s) for the earliest row included in the current state. It must reconstruct what the state value would have been if the given input row had never been aggregated, but only the rows following it. This sometimes requires that the forward transition function keep more state than is needed for plain aggregation mode. Therefore, the moving-aggregate mode uses a completely separate implementation from the plain mode: it has its own state data type, its own forward transition function, and its own final function if needed. These can be the same as the plain mode's data type and functions, if there is no need for extra state.

As an example, we could extend the sum aggregate given above to support moving-aggregate mode like this:

The parameters whose names begin with m define the moving-aggregate implementation. Except for the inverse transition function minvfunc, they correspond to the plain-aggregate parameters without m.

The forward transition function for moving-aggregate mode is not allowed to return null as the new state value. If the inverse transition function returns null, this is taken as an indication that the inverse function cannot reverse the state calculation for this particular input, and so the aggregate calculation will be redone from scratch for the current frame starting position. This convention allows moving-aggregate mode to be used in situations where there are some infrequent cases that are impractical to reverse out of the running state value. The inverse transition function can “punt” on these cases, and yet still come out ahead so long as it can work for most cases. As an example, an aggregate working with floating-point numbers might choose to punt when a NaN (not a number) input has to be removed from the running state value.

When writing moving-aggregate support functions, it is important to be sure that the inverse transition function can reconstruct the correct state value exactly. Otherwise there might be user-visible differences in results depending on whether the moving-aggregate mode is used. An example of an aggregate for which adding an inverse transition function seems easy at first, yet where this requirement cannot be met is sum over float4 or float8 inputs. A naive declaration of sum(float8) could be

This aggregate, however, can give wildly different results than it would have without the inverse transition function. For example, consider

This query returns 0 as its second result, rather than the expected answer of 1. The cause is the limited precision of floating-point values: adding 1 to 1e20 results in 1e20 again, and so subtracting 1e20 from that yields 0, not 1. Note that this is a limitation of floating-point arithmetic in general, not a limitation of PostgreSQL.

Aggregate functions can use polymorphic state transition functions or final functions, so that the same functions can be used to implement multiple aggregates. See Section 36.2.5 for an explanation of polymorphic functions. Going a step further, the aggregate function itself can be specified with polymorphic input type(s) and state type, allowing a single aggregate definition to serve for multiple input data types. Here is an example of a polymorphic aggregate:

Here, the actual state type for any given aggregate call is the array type having the actual input type as elements. The behavior of the aggregate is to concatenate all the inputs into an array of that type. (Note: the built-in aggregate array_agg provides similar functionality, with better performance than this definition would have.)

Here's the output using two different actual data types as arguments:

Ordinarily, an aggregate function with a polymorphic result type has a polymorphic state type, as in the above example. This is necessary because otherwise the final function cannot be declared sensibly: it would need to have a polymorphic result type but no polymorphic argument type, which CREATE FUNCTION will reject on the grounds that the result type cannot be deduced from a call. But sometimes it is inconvenient to use a polymorphic state type. The most common case is where the aggregate support functions are to be written in C and the state type should be declared as internal because there is no SQL-level equivalent for it. To address this case, it is possible to declare the final function as taking extra “dummy” arguments that match the input arguments of the aggregate. Such dummy arguments are always passed as null values since no specific value is available when the final function is called. Their only use is to allow a polymorphic final function's result type to be connected to the aggregate's input type(s). For example, the definition of the built-in aggregate array_agg is equivalent to

Here, the finalfunc_extra option specifies that the final function receives, in addition to the state value, extra dummy argument(s) corresponding to the aggregate's input argument(s). The extra anynonarray argument allows the declaration of array_agg_finalfn to be valid.

An aggregate function can be made to accept a varying number of arguments by declaring its last argument as a VARIADIC array, in much the same fashion as for regular functions; see Section 36.5.6. The aggregate's transition function(s) must have the same array type as their last argument. The transition function(s) typically would also be marked VARIADIC, but this is not strictly required.

Variadic aggregates are easily misused in connection with the ORDER BY option (see Section 4.2.7), since the parser cannot tell whether the wrong number of actual arguments have been given in such a combination. Keep in mind that everything to the right of ORDER BY is a sort key, not an argument to the aggregate. For example, in

the parser will see this as a single aggregate function argument and three sort keys. However, the user might have intended

If myaggregate is variadic, both these calls could be perfectly valid.

For the same reason, it's wise to think twice before creating aggregate functions with the same names and different numbers of regular arguments.

The aggregates we have been describing so far are “normal” aggregates. PostgreSQL also supports ordered-set aggregates, which differ from normal aggregates in two key ways. First, in addition to ordinary aggregated arguments that are evaluated once per input row, an ordered-set aggregate can have “direct” arguments that are evaluated only once per aggregation operation. Second, the syntax for the ordinary aggregated arguments specifies a sort ordering for them explicitly. An ordered-set aggregate is usually used to implement a computation that depends on a specific row ordering, for instance rank or percentile, so that the sort ordering is a required aspect of any call. For example, the built-in definition of percentile_disc is equivalent to:

This aggregate takes a float8 direct argument (the percentile fraction) and an aggregated input that can be of any sortable data type. It could be used to obtain a median household income like this:

Here, 0.5 is a direct argument; it would make no sense for the percentile fraction to be a value varying across rows.

Unlike the case for normal aggregates, the sorting of input rows for an ordered-set aggregate is not done behind the scenes, but is the responsibility of the aggregate's support functions. The typical implementation approach is to keep a reference to a “tuplesort” object in the aggregate's state value, feed the incoming rows into that object, and then complete the sorting and read out the data in the final function. This design allows the final function to perform special operations such as injecting additional “hypothetical” rows into the data to be sorted. While normal aggregates can often be implemented with support functions written in PL/pgSQL or another PL language, ordered-set aggregates generally have to be written in C, since their state values aren't definable as any SQL data type. (In the above example, notice that the state value is declared as type internal — this is typical.) Also, because the final function performs the sort, it is not possible to continue adding input rows by executing the transition function again later. This means the final function is not READ_ONLY; it must be declared in CREATE AGGREGATE as READ_WRITE, or as SHAREABLE if it's possible for additional final-function calls to make use of the already-sorted state.

The state transition function for an ordered-set aggregate receives the current state value plus the aggregated input values for each row, and returns the updated state value. This is the same definition as for normal aggregates, but note that the direct arguments (if any) are not provided. The final function receives the last state value, the values of the direct arguments if any, and (if finalfunc_extra is specified) null values corresponding to the aggregated input(s). As with normal aggregates, finalfunc_extra is only really useful if the aggregate is polymorphic; then the extra dummy argument(s) are needed to connect the final function's result type to the aggregate's input type(s).

Currently, ordered-set aggregates cannot be used as window functions, and therefore there is no need for them to support moving-aggregate mode.

Optionally, an aggregate function can support partial aggregation. The idea of partial aggregation is to run the aggregate's state transition function over different subsets of the input data independently, and then to combine the state values resulting from those subsets to produce the same state value that would have resulted from scanning all the input in a single operation. This mode can be used for parallel aggregation by having different worker processes scan different portions of a table. Each worker produces a partial state value, and at the end those state values are combined to produce a final state value. (In the future this mode might also be used for purposes such as combining aggregations over local and remote tables; but that is not implemented yet.)

To support partial aggregation, the aggregate definition must provide a combine function, which takes two values of the aggregate's state type (representing the results of aggregating over two subsets of the input rows) and produces a new value of the state type, representing what the state would have been after aggregating over the combination of those sets of rows. It is unspecified what the relative order of the input rows from the two sets would have been. This means that it's usually impossible to define a useful combine function for aggregates that are sensitive to input row order.

As simple examples, MAX and MIN aggregates can be made to support partial aggregation by specifying the combine function as the same greater-of-two or lesser-of-two comparison function that is used as their transition function. SUM aggregates just need an addition function as combine function. (Again, this is the same as their transition function, unless the state value is wider than the input data type.)

The combine function is treated much like a transition function that happens to take a value of the state type, not of the underlying input type, as its second argument. In particular, the rules for dealing with null values and strict functions are similar. Also, if the aggregate definition specifies a non-null initcond, keep in mind that that will be used not only as the initial state for each partial aggregation run, but also as the initial state for the combine function, which will be called to combine each partial result into that state.

If the aggregate's state type is declared as internal, it is the combine function's responsibility that its result is allocated in the correct memory context for aggregate state values. This means in particular that when the first input is NULL it's invalid to simply return the second input, as that value will be in the wrong context and will not have sufficient lifespan.

When the aggregate's state type is declared as internal, it is usually also appropriate for the aggregate definition to provide a serialization function and a deserialization function, which allow such a state value to be copied from one process to another. Without these functions, parallel aggregation cannot be performed, and future applications such as local/remote aggregation will probably not work either.

A serialization function must take a single argument of type internal and return a result of type bytea, which represents the state value packaged up into a flat blob of bytes. Conversely, a deserialization function reverses that conversion. It must take two arguments of types bytea and internal, and return a result of type internal. (The second argument is unused and is always zero, but it is required for type-safety reasons.) The result of the deserialization function should simply be allocated in the current memory context, as unlike the combine function's result, it is not long-lived.

Worth noting also is that for an aggregate to be executed in parallel, the aggregate itself must be marked PARALLEL SAFE. The parallel-safety markings on its support functions are not consulted.

A function written in C can detect that it is being called as an aggregate support function by calling AggCheckCallContext, for example:

One reason for checking this is that when it is true, the first input must be a temporary state value and can therefore safely be modified in-place rather than allocating a new copy. See int8inc() for an example. (While aggregate transition functions are always allowed to modify the transition value in-place, aggregate final functions are generally discouraged from doing so; if they do so, the behavior must be declared when creating the aggregate. See CREATE AGGREGATE for more detail.)

The second argument of AggCheckCallContext can be used to retrieve the memory context in which aggregate state values are being kept. This is useful for transition functions that wish to use “expanded” objects (see Section 36.13.1) as their state values. On first call, the transition function should return an expanded object whose memory context is a child of the aggregate state context, and then keep returning the same expanded object on subsequent calls. See array_append() for an example. (array_append() is not the transition function of any built-in aggregate, but it is written to behave efficiently when used as transition function of a custom aggregate.)

Another support routine available to aggregate functions written in C is AggGetAggref, which returns the Aggref parse node that defines the aggregate call. This is mainly useful for ordered-set aggregates, which can inspect the substructure of the Aggref node to find out what sort ordering they are supposed to implement. Examples can be found in orderedsetaggs.c in the PostgreSQL source code.

**Examples:**

Example 1 (unknown):
```unknown
CREATE AGGREGATE sum (complex)
(
    sfunc = complex_add,
    stype = complex,
    initcond = '(0,0)'
);
```

Example 2 (sql):
```sql
SELECT sum(a) FROM test_complex;

   sum
-----------
 (34,53.9)
```

Example 3 (unknown):
```unknown
avg(float8)
```

Example 4 (unknown):
```unknown
CREATE AGGREGATE avg (float8)
(
    sfunc = float8_accum,
    stype = float8[],
    finalfunc = float8_avg,
    initcond = '{0,0,0}'
);
```

---


---

## 36.3. User-Defined Functions #


**URL:** https://www.postgresql.org/docs/18/xfunc.html

**Contents:**
- 36.3. User-Defined Functions #

PostgreSQL provides four kinds of functions:

query language functions (functions written in SQL) (Section 36.5)

procedural language functions (functions written in, for example, PL/pgSQL or PL/Tcl) (Section 36.8)

internal functions (Section 36.9)

C-language functions (Section 36.10)

Every kind of function can take base types, composite types, or combinations of these as arguments (parameters). In addition, every kind of function can return a base type or a composite type. Functions can also be defined to return sets of base or composite values.

Many kinds of functions can take or return certain pseudo-types (such as polymorphic types), but the available facilities vary. Consult the description of each kind of function for more details.

It's easiest to define SQL functions, so we'll start by discussing those. Most of the concepts presented for SQL functions will carry over to the other types of functions.

Throughout this chapter, it can be useful to look at the reference page of the CREATE FUNCTION command to understand the examples better. Some examples from this chapter can be found in funcs.sql and funcs.c in the src/tutorial directory in the PostgreSQL source distribution.

**Examples:**

Example 1 (unknown):
```unknown
CREATE FUNCTION
```

Example 2 (unknown):
```unknown
src/tutorial
```

---


---

