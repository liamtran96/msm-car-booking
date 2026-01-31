# PostgreSQL - Functions (Part 23)

## 9.27. System Information Functions and Operators # (continued)
```

Example 3 (unknown):
```unknown
current_catalog
```

Example 4 (unknown):
```unknown
current_query
```

---


---

## Chapter 9. Functions and Operators


**URL:** https://www.postgresql.org/docs/18/functions.html

**Contents:**
- Chapter 9. Functions and Operators

PostgreSQL provides a large number of functions and operators for the built-in data types. This chapter describes most of them, although additional special-purpose functions appear in relevant sections of the manual. Users can also define their own functions and operators, as described in Part V. The psql commands \df and \do can be used to list all available functions and operators, respectively.

The notation used throughout this chapter to describe the argument and result data types of a function or operator is like this:

which says that the function repeat takes one text and one integer argument and returns a result of type text. The right arrow is also used to indicate the result of an example, thus:

If you are concerned about portability then note that most of the functions and operators described in this chapter, with the exception of the most trivial arithmetic and comparison operators and some explicitly marked functions, are not specified by the SQL standard. Some of this extended functionality is present in other SQL database management systems, and in many cases this functionality is compatible and consistent between the various implementations.

**Examples:**

Example 1 (unknown):
```unknown
AT TIME ZONE
```

Example 2 (unknown):
```unknown
repeat('Pg', 4) → PgPgPgPg
```

---


---

## 9.17. Sequence Manipulation Functions #


**URL:** https://www.postgresql.org/docs/18/functions-sequence.html

**Contents:**
- 9.17. Sequence Manipulation Functions #
  - Caution

This section describes functions for operating on sequence objects, also called sequence generators or just sequences. Sequence objects are special single-row tables created with CREATE SEQUENCE. Sequence objects are commonly used to generate unique identifiers for rows of a table. The sequence functions, listed in Table 9.55, provide simple, multiuser-safe methods for obtaining successive sequence values from sequence objects.

Table 9.55. Sequence Functions

nextval ( regclass ) → bigint

Advances the sequence object to its next value and returns that value. This is done atomically: even if multiple sessions execute nextval concurrently, each will safely receive a distinct sequence value. If the sequence object has been created with default parameters, successive nextval calls will return successive values beginning with 1. Other behaviors can be obtained by using appropriate parameters in the CREATE SEQUENCE command.

This function requires USAGE or UPDATE privilege on the sequence.

setval ( regclass, bigint [, boolean ] ) → bigint

Sets the sequence object's current value, and optionally its is_called flag. The two-parameter form sets the sequence's last_value field to the specified value and sets its is_called field to true, meaning that the next nextval will advance the sequence before returning a value. The value that will be reported by currval is also set to the specified value. In the three-parameter form, is_called can be set to either true or false. true has the same effect as the two-parameter form. If it is set to false, the next nextval will return exactly the specified value, and sequence advancement commences with the following nextval. Furthermore, the value reported by currval is not changed in this case. For example,

The result returned by setval is just the value of its second argument.

This function requires UPDATE privilege on the sequence.

currval ( regclass ) → bigint

Returns the value most recently obtained by nextval for this sequence in the current session. (An error is reported if nextval has never been called for this sequence in this session.) Because this is returning a session-local value, it gives a predictable answer whether or not other sessions have executed nextval since the current session did.

This function requires USAGE or SELECT privilege on the sequence.

Returns the value most recently returned by nextval in the current session. This function is identical to currval, except that instead of taking the sequence name as an argument it refers to whichever sequence nextval was most recently applied to in the current session. It is an error to call lastval if nextval has not yet been called in the current session.

This function requires USAGE or SELECT privilege on the last used sequence.

To avoid blocking concurrent transactions that obtain numbers from the same sequence, the value obtained by nextval is not reclaimed for re-use if the calling transaction later aborts. This means that transaction aborts or database crashes can result in gaps in the sequence of assigned values. That can happen without a transaction abort, too. For example an INSERT with an ON CONFLICT clause will compute the to-be-inserted tuple, including doing any required nextval calls, before detecting any conflict that would cause it to follow the ON CONFLICT rule instead. Thus, PostgreSQL sequence objects cannot be used to obtain “gapless” sequences.

Likewise, sequence state changes made by setval are immediately visible to other transactions, and are not undone if the calling transaction rolls back.

If the database cluster crashes before committing a transaction containing a nextval or setval call, the sequence state change might not have made its way to persistent storage, so that it is uncertain whether the sequence will have its original or updated state after the cluster restarts. This is harmless for usage of the sequence within the database, since other effects of uncommitted transactions will not be visible either. However, if you wish to use a sequence value for persistent outside-the-database purposes, make sure that the nextval call has been committed before doing so.

The sequence to be operated on by a sequence function is specified by a regclass argument, which is simply the OID of the sequence in the pg_class system catalog. You do not have to look up the OID by hand, however, since the regclass data type's input converter will do the work for you. See Section 8.19 for details.

**Examples:**

Example 1 (sql):
```sql
SELECT setval('myseq', 42);           Next nextval will return 43
SELECT setval('myseq', 42, true);     Same as above
SELECT setval('myseq', 42, false);    Next nextval will return 42
```

Example 2 (unknown):
```unknown
ON CONFLICT
```

Example 3 (unknown):
```unknown
ON CONFLICT
```

---


---

