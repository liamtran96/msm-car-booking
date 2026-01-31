# PostgreSQL - Functions (Part 11)

## 9.25. Row and Array Comparisons #


**URL:** https://www.postgresql.org/docs/18/functions-comparisons.html

**Contents:**
- 9.25. Row and Array Comparisons #
  - 9.25.1. IN #
  - 9.25.2. NOT IN #
  - Tip
  - 9.25.3. ANY/SOME (array) #
  - 9.25.4. ALL (array) #
  - 9.25.5. Row Constructor Comparison #
  - 9.25.6. Composite Type Comparison #

This section describes several specialized constructs for making multiple comparisons between groups of values. These forms are syntactically related to the subquery forms of the previous section, but do not involve subqueries. The forms involving array subexpressions are PostgreSQL extensions; the rest are SQL-compliant. All of the expression forms documented in this section return Boolean (true/false) results.

The right-hand side is a parenthesized list of expressions. The result is “true” if the left-hand expression's result is equal to any of the right-hand expressions. This is a shorthand notation for

Note that if the left-hand expression yields null, or if there are no equal right-hand values and at least one right-hand expression yields null, the result of the IN construct will be null, not false. This is in accordance with SQL's normal rules for Boolean combinations of null values.

The right-hand side is a parenthesized list of expressions. The result is “true” if the left-hand expression's result is unequal to all of the right-hand expressions. This is a shorthand notation for

Note that if the left-hand expression yields null, or if there are no equal right-hand values and at least one right-hand expression yields null, the result of the NOT IN construct will be null, not true as one might naively expect. This is in accordance with SQL's normal rules for Boolean combinations of null values.

x NOT IN y is equivalent to NOT (x IN y) in all cases. However, null values are much more likely to trip up the novice when working with NOT IN than when working with IN. It is best to express your condition positively if possible.

The right-hand side is a parenthesized expression, which must yield an array value. The left-hand expression is evaluated and compared to each element of the array using the given operator, which must yield a Boolean result. The result of ANY is “true” if any true result is obtained. The result is “false” if no true result is found (including the case where the array has zero elements).

If the array expression yields a null array, the result of ANY will be null. If the left-hand expression yields null, the result of ANY is ordinarily null (though a non-strict comparison operator could possibly yield a different result). Also, if the right-hand array contains any null elements and no true comparison result is obtained, the result of ANY will be null, not false (again, assuming a strict comparison operator). This is in accordance with SQL's normal rules for Boolean combinations of null values.

SOME is a synonym for ANY.

The right-hand side is a parenthesized expression, which must yield an array value. The left-hand expression is evaluated and compared to each element of the array using the given operator, which must yield a Boolean result. The result of ALL is “true” if all comparisons yield true (including the case where the array has zero elements). The result is “false” if any false result is found.

If the array expression yields a null array, the result of ALL will be null. If the left-hand expression yields null, the result of ALL is ordinarily null (though a non-strict comparison operator could possibly yield a different result). Also, if the right-hand array contains any null elements and no false comparison result is obtained, the result of ALL will be null, not true (again, assuming a strict comparison operator). This is in accordance with SQL's normal rules for Boolean combinations of null values.

Each side is a row constructor, as described in Section 4.2.13. The two row constructors must have the same number of fields. The given operator is applied to each pair of corresponding fields. (Since the fields could be of different types, this means that a different specific operator could be selected for each pair.) All the selected operators must be members of some B-tree operator class, or be the negator of an = member of a B-tree operator class, meaning that row constructor comparison is only possible when the operator is =, <>, <, <=, >, or >=, or has semantics similar to one of these.

The = and <> cases work slightly differently from the others. Two rows are considered equal if all their corresponding members are non-null and equal; the rows are unequal if any corresponding members are non-null and unequal; otherwise the result of the row comparison is unknown (null).

For the <, <=, > and >= cases, the row elements are compared left-to-right, stopping as soon as an unequal or null pair of elements is found. If either of this pair of elements is null, the result of the row comparison is unknown (null); otherwise comparison of this pair of elements determines the result. For example, ROW(1,2,NULL) < ROW(1,3,0) yields true, not null, because the third pair of elements are not considered.

This construct is similar to a <> row comparison, but it does not yield null for null inputs. Instead, any null value is considered unequal to (distinct from) any non-null value, and any two nulls are considered equal (not distinct). Thus the result will either be true or false, never null.

This construct is similar to a = row comparison, but it does not yield null for null inputs. Instead, any null value is considered unequal to (distinct from) any non-null value, and any two nulls are considered equal (not distinct). Thus the result will always be either true or false, never null.

The SQL specification requires row-wise comparison to return NULL if the result depends on comparing two NULL values or a NULL and a non-NULL. PostgreSQL does this only when comparing the results of two row constructors (as in Section 9.25.5) or comparing a row constructor to the output of a subquery (as in Section 9.24). In other contexts where two composite-type values are compared, two NULL field values are considered equal, and a NULL is considered larger than a non-NULL. This is necessary in order to have consistent sorting and indexing behavior for composite types.

Each side is evaluated and they are compared row-wise. Composite type comparisons are allowed when the operator is =, <>, <, <=, > or >=, or has semantics similar to one of these. (To be specific, an operator can be a row comparison operator if it is a member of a B-tree operator class, or is the negator of the = member of a B-tree operator class.) The default behavior of the above operators is the same as for IS [ NOT ] DISTINCT FROM for row constructors (see Section 9.25.5).

To support matching of rows which include elements without a default B-tree operator class, the following operators are defined for composite type comparison: *=, *<>, *<, *<=, *>, and *>=. These operators compare the internal binary representation of the two rows. Two rows might have a different binary representation even though comparisons of the two rows with the equality operator is true. The ordering of rows under these comparison operators is deterministic but not otherwise meaningful. These operators are used internally for materialized views and might be useful for other specialized purposes such as replication and B-Tree deduplication (see Section 65.1.4.3). They are not intended to be generally useful for writing queries, though.

**Examples:**

Example 1 (unknown):
```unknown
NOT (x IN y)
```

Example 2 (unknown):
```unknown
array expression
```

Example 3 (unknown):
```unknown
array expression
```

Example 4 (unknown):
```unknown
array expression
```

---


---

## 9.29. Trigger Functions #


**URL:** https://www.postgresql.org/docs/18/functions-trigger.html

**Contents:**
- 9.29. Trigger Functions #

While many uses of triggers involve user-written trigger functions, PostgreSQL provides a few built-in trigger functions that can be used directly in user-defined triggers. These are summarized in Table 9.110. (Additional built-in trigger functions exist, which implement foreign key constraints and deferred index constraints. Those are not documented here since users need not use them directly.)

For more information about creating triggers, see CREATE TRIGGER.

Table 9.110. Built-In Trigger Functions

suppress_redundant_updates_trigger ( ) → trigger

Suppresses do-nothing update operations. See below for details.

CREATE TRIGGER ... suppress_redundant_updates_trigger()

tsvector_update_trigger ( ) → trigger

Automatically updates a tsvector column from associated plain-text document column(s). The text search configuration to use is specified by name as a trigger argument. See Section 12.4.3 for details.

CREATE TRIGGER ... tsvector_update_trigger(tsvcol, 'pg_catalog.swedish', title, body)

tsvector_update_trigger_column ( ) → trigger

Automatically updates a tsvector column from associated plain-text document column(s). The text search configuration to use is taken from a regconfig column of the table. See Section 12.4.3 for details.

CREATE TRIGGER ... tsvector_update_trigger_column(tsvcol, tsconfigcol, title, body)

The suppress_redundant_updates_trigger function, when applied as a row-level BEFORE UPDATE trigger, will prevent any update that does not actually change the data in the row from taking place. This overrides the normal behavior which always performs a physical row update regardless of whether or not the data has changed. (This normal behavior makes updates run faster, since no checking is required, and is also useful in certain cases.)

Ideally, you should avoid running updates that don't actually change the data in the record. Redundant updates can cost considerable unnecessary time, especially if there are lots of indexes to alter, and space in dead rows that will eventually have to be vacuumed. However, detecting such situations in client code is not always easy, or even possible, and writing expressions to detect them can be error-prone. An alternative is to use suppress_redundant_updates_trigger, which will skip updates that don't change the data. You should use this with care, however. The trigger takes a small but non-trivial time for each record, so if most of the records affected by updates do actually change, use of this trigger will make updates run slower on average.

The suppress_redundant_updates_trigger function can be added to a table like this:

In most cases, you need to fire this trigger last for each row, so that it does not override other triggers that might wish to alter the row. Bearing in mind that triggers fire in name order, you would therefore choose a trigger name that comes after the name of any other trigger you might have on the table. (Hence the “z” prefix in the example.)

**Examples:**

Example 1 (unknown):
```unknown
suppress_redundant_updates_trigger
```

Example 2 (unknown):
```unknown
CREATE TRIGGER ... suppress_redundant_updates_trigger()
```

Example 3 (unknown):
```unknown
tsvector_update_trigger
```

Example 4 (unknown):
```unknown
CREATE TRIGGER ... tsvector_update_trigger(tsvcol, 'pg_catalog.swedish', title, body)
```

---


---

## 9.26. Set Returning Functions #


**URL:** https://www.postgresql.org/docs/18/functions-srf.html

**Contents:**
- 9.26. Set Returning Functions #

This section describes functions that possibly return more than one row. The most widely used functions in this class are series generating functions, as detailed in Table 9.69 and Table 9.70. Other, more specialized set-returning functions are described elsewhere in this manual. See Section 7.2.1.4 for ways to combine multiple set-returning functions.

Table 9.69. Series Generating Functions

generate_series ( start integer, stop integer [, step integer ] ) → setof integer

generate_series ( start bigint, stop bigint [, step bigint ] ) → setof bigint

generate_series ( start numeric, stop numeric [, step numeric ] ) → setof numeric

Generates a series of values from start to stop, with a step size of step. step defaults to 1.

generate_series ( start timestamp, stop timestamp, step interval ) → setof timestamp

generate_series ( start timestamp with time zone, stop timestamp with time zone, step interval [, timezone text ] ) → setof timestamp with time zone

Generates a series of values from start to stop, with a step size of step. In the timezone-aware form, times of day and daylight-savings adjustments are computed according to the time zone named by the timezone argument, or the current TimeZone setting if that is omitted.

When step is positive, zero rows are returned if start is greater than stop. Conversely, when step is negative, zero rows are returned if start is less than stop. Zero rows are also returned if any input is NULL. It is an error for step to be zero. Some examples follow:

Table 9.70. Subscript Generating Functions

generate_subscripts ( array anyarray, dim integer ) → setof integer

Generates a series comprising the valid subscripts of the dim'th dimension of the given array.

generate_subscripts ( array anyarray, dim integer, reverse boolean ) → setof integer

Generates a series comprising the valid subscripts of the dim'th dimension of the given array. When reverse is true, returns the series in reverse order.

generate_subscripts is a convenience function that generates the set of valid subscripts for the specified dimension of the given array. Zero rows are returned for arrays that do not have the requested dimension, or if any input is NULL. Some examples follow:

When a function in the FROM clause is suffixed by WITH ORDINALITY, a bigint column is appended to the function's output column(s), which starts from 1 and increments by 1 for each row of the function's output. This is most useful in the case of set returning functions such as unnest().

**Examples:**

Example 1 (unknown):
```unknown
generate_series
```

Example 2 (unknown):
```unknown
setof integer
```

Example 3 (unknown):
```unknown
generate_series
```

Example 4 (unknown):
```unknown
setof bigint
```

---


---

