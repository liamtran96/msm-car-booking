# PostgreSQL - Sql Commands (Part 20)

## 


**URL:** https://www.postgresql.org/docs/18/sql-comment.html

**Contents:**
- COMMENT
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility

COMMENT — define or change the comment of an object

COMMENT stores a comment about a database object.

Only one comment string is stored for each object, so to modify a comment, issue a new COMMENT command for the same object. To remove a comment, write NULL in place of the text string. Comments are automatically dropped when their object is dropped.

A SHARE UPDATE EXCLUSIVE lock is acquired on the object to be commented.

For most kinds of object, only the object's owner can set the comment. Roles don't have owners, so the rule for COMMENT ON ROLE is that you must be superuser to comment on a superuser role, or have the CREATEROLE privilege and have been granted ADMIN OPTION on the target role. Likewise, access methods don't have owners either; you must be superuser to comment on an access method. Of course, a superuser can comment on anything.

Comments can be viewed using psql's \d family of commands. Other user interfaces to retrieve comments can be built atop the same built-in functions that psql uses, namely obj_description, col_description, and shobj_description (see Table 9.82).

The name of the object to be commented. Names of objects that reside in schemas (tables, functions, etc.) can be schema-qualified. When commenting on a column, relation_name must refer to a table, view, composite type, or foreign table.

When creating a comment on a constraint, a trigger, a rule or a policy these parameters specify the name of the table or domain on which that object is defined.

The name of the source data type of the cast.

The name of the target data type of the cast.

The mode of a function, procedure, or aggregate argument: IN, OUT, INOUT, or VARIADIC. If omitted, the default is IN. Note that COMMENT does not actually pay any attention to OUT arguments, since only the input arguments are needed to determine the function's identity. So it is sufficient to list the IN, INOUT, and VARIADIC arguments.

The name of a function, procedure, or aggregate argument. Note that COMMENT does not actually pay any attention to argument names, since only the argument data types are needed to determine the function's identity.

The data type of a function, procedure, or aggregate argument.

The OID of the large object.

The data type(s) of the operator's arguments (optionally schema-qualified). Write NONE for the missing argument of a prefix operator.

This is a noise word.

The name of the data type of the transform.

The name of the language of the transform.

The new comment contents, written as a string literal.

Write NULL to drop the comment.

There is presently no security mechanism for viewing comments: any user connected to a database can see all the comments for objects in that database. For shared objects such as databases, roles, and tablespaces, comments are stored globally so any user connected to any database in the cluster can see all the comments for shared objects. Therefore, don't put security-critical information in comments.

Attach a comment to the table mytable:

There is no COMMENT command in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
object_name
```

Example 2 (unknown):
```unknown
aggregate_name
```

Example 3 (unknown):
```unknown
aggregate_signature
```

Example 4 (unknown):
```unknown
source_type
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-alteraggregate.html

**Contents:**
- ALTER AGGREGATE
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

ALTER AGGREGATE — change the definition of an aggregate function

ALTER AGGREGATE changes the definition of an aggregate function.

You must own the aggregate function to use ALTER AGGREGATE. To change the schema of an aggregate function, you must also have CREATE privilege on the new schema. To alter the owner, you must be able to SET ROLE to the new owning role, and that role must have CREATE privilege on the aggregate function's schema. (These restrictions enforce that altering the owner doesn't do anything you couldn't do by dropping and recreating the aggregate function. However, a superuser can alter ownership of any aggregate function anyway.)

The name (optionally schema-qualified) of an existing aggregate function.

The mode of an argument: IN or VARIADIC. If omitted, the default is IN.

The name of an argument. Note that ALTER AGGREGATE does not actually pay any attention to argument names, since only the argument data types are needed to determine the aggregate function's identity.

An input data type on which the aggregate function operates. To reference a zero-argument aggregate function, write * in place of the list of argument specifications. To reference an ordered-set aggregate function, write ORDER BY between the direct and aggregated argument specifications.

The new name of the aggregate function.

The new owner of the aggregate function.

The new schema for the aggregate function.

The recommended syntax for referencing an ordered-set aggregate is to write ORDER BY between the direct and aggregated argument specifications, in the same style as in CREATE AGGREGATE. However, it will also work to omit ORDER BY and just run the direct and aggregated argument specifications into a single list. In this abbreviated form, if VARIADIC "any" was used in both the direct and aggregated argument lists, write VARIADIC "any" only once.

To rename the aggregate function myavg for type integer to my_average:

To change the owner of the aggregate function myavg for type integer to joe:

To move the ordered-set aggregate mypercentile with direct argument of type float8 and aggregated argument of type integer into schema myschema:

There is no ALTER AGGREGATE statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
aggregate_signature
```

Example 2 (unknown):
```unknown
aggregate_signature
```

Example 3 (unknown):
```unknown
aggregate_signature
```

Example 4 (unknown):
```unknown
aggregate_signature
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-altertsdictionary.html

**Contents:**
- ALTER TEXT SEARCH DICTIONARY
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

ALTER TEXT SEARCH DICTIONARY — change the definition of a text search dictionary

ALTER TEXT SEARCH DICTIONARY changes the definition of a text search dictionary. You can change the dictionary's template-specific options, or change the dictionary's name or owner.

You must be the owner of the dictionary to use ALTER TEXT SEARCH DICTIONARY.

The name (optionally schema-qualified) of an existing text search dictionary.

The name of a template-specific option to be set for this dictionary.

The new value to use for a template-specific option. If the equal sign and value are omitted, then any previous setting for the option is removed from the dictionary, allowing the default to be used.

The new name of the text search dictionary.

The new owner of the text search dictionary.

The new schema for the text search dictionary.

Template-specific options can appear in any order.

The following example command changes the stopword list for a Snowball-based dictionary. Other parameters remain unchanged.

The following example command changes the language option to dutch, and removes the stopword option entirely.

The following example command “updates” the dictionary's definition without actually changing anything.

(The reason this works is that the option removal code doesn't complain if there is no such option.) This trick is useful when changing configuration files for the dictionary: the ALTER will force existing database sessions to re-read the configuration files, which otherwise they would never do if they had read them earlier.

There is no ALTER TEXT SEARCH DICTIONARY statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
ALTER TEXT SEARCH DICTIONARY
```

Example 2 (unknown):
```unknown
ALTER TEXT SEARCH DICTIONARY
```

Example 3 (unknown):
```unknown
ALTER TEXT SEARCH DICTIONARY my_dict ( StopWords = newrussian );
```

Example 4 (unknown):
```unknown
ALTER TEXT SEARCH DICTIONARY my_dict ( language = dutch, StopWords );
```

---


---

