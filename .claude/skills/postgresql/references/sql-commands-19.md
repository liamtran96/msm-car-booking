# PostgreSQL - Sql Commands (Part 19)

## SQL Commands


**URL:** https://www.postgresql.org/docs/18/sql-commands.html

**Contents:**
- SQL Commands

This part contains reference information for the SQL commands supported by PostgreSQL. By “SQL” the language in general is meant; information about the standards conformance and compatibility of each command can be found on the respective reference page.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtsdictionary.html

**Contents:**
- CREATE TEXT SEARCH DICTIONARY
- Synopsis
- Description
- Parameters
- Examples
- Compatibility
- See Also

CREATE TEXT SEARCH DICTIONARY — define a new text search dictionary

CREATE TEXT SEARCH DICTIONARY creates a new text search dictionary. A text search dictionary specifies a way of recognizing interesting or uninteresting words for searching. A dictionary depends on a text search template, which specifies the functions that actually perform the work. Typically the dictionary provides some options that control the detailed behavior of the template's functions.

If a schema name is given then the text search dictionary is created in the specified schema. Otherwise it is created in the current schema.

The user who defines a text search dictionary becomes its owner.

Refer to Chapter 12 for further information.

The name of the text search dictionary to be created. The name can be schema-qualified.

The name of the text search template that will define the basic behavior of this dictionary.

The name of a template-specific option to be set for this dictionary.

The value to use for a template-specific option. If the value is not a simple identifier or number, it must be quoted (but you can always quote it, if you wish).

The options can appear in any order.

The following example command creates a Snowball-based dictionary with a nonstandard list of stop words.

There is no CREATE TEXT SEARCH DICTIONARY statement in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
CREATE TEXT SEARCH DICTIONARY
```

Example 2 (unknown):
```unknown
CREATE TEXT SEARCH DICTIONARY my_russian (
    template = snowball,
    language = russian,
    stopwords = myrussian
);
```

Example 3 (unknown):
```unknown
CREATE TEXT SEARCH DICTIONARY
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-dropsubscription.html

**Contents:**
- DROP SUBSCRIPTION
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

DROP SUBSCRIPTION — remove a subscription

DROP SUBSCRIPTION removes a subscription from the database cluster.

To execute this command the user must be the owner of the subscription.

DROP SUBSCRIPTION cannot be executed inside a transaction block if the subscription is associated with a replication slot. (You can use ALTER SUBSCRIPTION to unset the slot.)

The name of a subscription to be dropped.

These key words do not have any effect, since there are no dependencies on subscriptions.

When dropping a subscription that is associated with a replication slot on the remote host (the normal state), DROP SUBSCRIPTION will connect to the remote host and try to drop the replication slot (and any remaining table synchronization slots) as part of its operation. This is necessary so that the resources allocated for the subscription on the remote host are released. If this fails, either because the remote host is not reachable or because the remote replication slot cannot be dropped or does not exist or never existed, the DROP SUBSCRIPTION command will fail. To proceed in this situation, first disable the subscription by executing ALTER SUBSCRIPTION ... DISABLE, and then disassociate it from the replication slot by executing ALTER SUBSCRIPTION ... SET (slot_name = NONE). After that, DROP SUBSCRIPTION will no longer attempt any actions on a remote host. Note that if the remote replication slot still exists, it (and any related table synchronization slots) should then be dropped manually; otherwise it/they will continue to reserve WAL and might eventually cause the disk to fill up. See also Section 29.2.1.

If a subscription is associated with a replication slot, then DROP SUBSCRIPTION cannot be executed inside a transaction block.

DROP SUBSCRIPTION is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
DROP SUBSCRIPTION
```

Example 2 (unknown):
```unknown
DROP SUBSCRIPTION
```

Example 3 (unknown):
```unknown
ALTER SUBSCRIPTION
```

Example 4 (unknown):
```unknown
DROP SUBSCRIPTION
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createtablespace.html

**Contents:**
- CREATE TABLESPACE
- Synopsis
- Description
  - Warning
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE TABLESPACE — define a new tablespace

CREATE TABLESPACE registers a new cluster-wide tablespace. The tablespace name must be distinct from the name of any existing tablespace in the database cluster.

A tablespace allows superusers to define an alternative location on the file system where the data files containing database objects (such as tables and indexes) can reside.

A user with appropriate privileges can pass tablespace_name to CREATE DATABASE, CREATE TABLE, CREATE INDEX or ADD CONSTRAINT to have the data files for these objects stored within the specified tablespace.

A tablespace cannot be used independently of the cluster in which it is defined; see Section 22.6.

The name of a tablespace to be created. The name cannot begin with pg_, as such names are reserved for system tablespaces.

The name of the user who will own the tablespace. If omitted, defaults to the user executing the command. Only superusers can create tablespaces, but they can assign ownership of tablespaces to non-superusers.

The directory that will be used for the tablespace. The directory must exist (CREATE TABLESPACE will not create it), should be empty, and must be owned by the PostgreSQL system user. The directory must be specified by an absolute path name.

A tablespace parameter to be set or reset. Currently, the only available parameters are seq_page_cost, random_page_cost, effective_io_concurrency and maintenance_io_concurrency. Setting these values for a particular tablespace will override the planner's usual estimate of the cost of reading pages from tables in that tablespace, and how many concurrent I/Os are issued, as established by the configuration parameters of the same name (see seq_page_cost, random_page_cost, effective_io_concurrency, maintenance_io_concurrency). This may be useful if one tablespace is located on a disk which is faster or slower than the remainder of the I/O subsystem.

CREATE TABLESPACE cannot be executed inside a transaction block.

To create a tablespace dbspace at file system location /data/dbs, first create the directory using operating system facilities and set the correct ownership:

Then issue the tablespace creation command inside PostgreSQL:

To create a tablespace owned by a different database user, use a command like this:

CREATE TABLESPACE is a PostgreSQL extension.

**Examples:**

Example 1 (unknown):
```unknown
tablespace_name
```

Example 2 (unknown):
```unknown
tablespace_option
```

Example 3 (sql):
```sql
CREATE TABLESPACE
```

Example 4 (unknown):
```unknown
tablespace_name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/sql-createoperator.html

**Contents:**
- CREATE OPERATOR
- Synopsis
- Description
- Parameters
- Notes
- Examples
- Compatibility
- See Also

CREATE OPERATOR — define a new operator

CREATE OPERATOR defines a new operator, name. The user who defines an operator becomes its owner. If a schema name is given then the operator is created in the specified schema. Otherwise it is created in the current schema.

The operator name is a sequence of up to NAMEDATALEN-1 (63 by default) characters from the following list:

+ - * / < > = ~ ! @ # % ^ & | ` ?

There are a few restrictions on your choice of name:

-- and /* cannot appear anywhere in an operator name, since they will be taken as the start of a comment.

A multicharacter operator name cannot end in + or -, unless the name also contains at least one of these characters:

For example, @- is an allowed operator name, but *- is not. This restriction allows PostgreSQL to parse SQL-compliant commands without requiring spaces between tokens.

The symbol => is reserved by the SQL grammar, so it cannot be used as an operator name.

The operator != is mapped to <> on input, so these two names are always equivalent.

For binary operators, both LEFTARG and RIGHTARG must be defined. For prefix operators only RIGHTARG should be defined. The function_name function must have been previously defined using CREATE FUNCTION and must be defined to accept the correct number of arguments (either one or two) of the indicated types.

In the syntax of CREATE OPERATOR, the keywords FUNCTION and PROCEDURE are equivalent, but the referenced function must in any case be a function, not a procedure. The use of the keyword PROCEDURE here is historical and deprecated.

The other clauses specify optional operator optimization attributes. Their meaning is detailed in Section 36.15.

To be able to create an operator, you must have USAGE privilege on the argument types and the return type, as well as EXECUTE privilege on the underlying function. If a commutator or negator operator is specified, you must own those operators.

The name of the operator to be defined. See above for allowable characters. The name can be schema-qualified, for example CREATE OPERATOR myschema.+ (...). If not, then the operator is created in the current schema. Two operators in the same schema can have the same name if they operate on different data types. This is called overloading.

The function used to implement this operator.

The data type of the operator's left operand, if any. This option would be omitted for a prefix operator.

The data type of the operator's right operand.

The commutator of this operator.

The negator of this operator.

The restriction selectivity estimator function for this operator.

The join selectivity estimator function for this operator.

Indicates this operator can support a hash join.

Indicates this operator can support a merge join.

To give a schema-qualified operator name in com_op or the other optional arguments, use the OPERATOR() syntax, for example:

Refer to Section 36.14 and Section 36.15 for further information.

When you are defining a self-commutative operator, you just do it. When you are defining a pair of commutative operators, things are a little trickier: how can the first one to be defined refer to the other one, which you haven't defined yet? There are three solutions to this problem:

One way is to omit the COMMUTATOR clause in the first operator that you define, and then provide one in the second operator's definition. Since PostgreSQL knows that commutative operators come in pairs, when it sees the second definition it will automatically go back and fill in the missing COMMUTATOR clause in the first definition.

Another, more straightforward way is just to include COMMUTATOR clauses in both definitions. When PostgreSQL processes the first definition and realizes that COMMUTATOR refers to a nonexistent operator, the system will make a dummy entry for that operator in the system catalog. This dummy entry will have valid data only for the operator name, left and right operand types, and owner, since that's all that PostgreSQL can deduce at this point. The first operator's catalog entry will link to this dummy entry. Later, when you define the second operator, the system updates the dummy entry with the additional information from the second definition. If you try to use the dummy operator before it's been filled in, you'll just get an error message.

Alternatively, both operators can be defined without COMMUTATOR clauses and then ALTER OPERATOR can be used to set their commutator links. It's sufficient to ALTER either one of the pair.

In all three cases, you must own both operators in order to mark them as commutators.

Pairs of negator operators can be defined using the same methods as for commutator pairs.

It is not possible to specify an operator's lexical precedence in CREATE OPERATOR, because the parser's precedence behavior is hard-wired. See Section 4.1.6 for precedence details.

The obsolete options SORT1, SORT2, LTCMP, and GTCMP were formerly used to specify the names of sort operators associated with a merge-joinable operator. This is no longer necessary, since information about associated operators is found by looking at B-tree operator families instead. If one of these options is given, it is ignored except for implicitly setting MERGES true.

Use DROP OPERATOR to delete user-defined operators from a database. Use ALTER OPERATOR to modify operators in a database.

The following command defines a new operator, area-equality, for the data type box:

CREATE OPERATOR is a PostgreSQL extension. There are no provisions for user-defined operators in the SQL standard.

**Examples:**

Example 1 (unknown):
```unknown
function_name
```

Example 2 (unknown):
```unknown
CREATE OPERATOR
```

Example 3 (unknown):
```unknown
NAMEDATALEN
```

Example 4 (unknown):
```unknown
function_name
```

---


---

