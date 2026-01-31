# PostgreSQL - Contrib Modules (Part 14)

## F.40. sepgsql — SELinux-, label-based mandatory access control (MAC) security module #


**URL:** https://www.postgresql.org/docs/18/sepgsql.html

**Contents:**
- F.40. sepgsql — SELinux-, label-based mandatory access control (MAC) security module #
  - Warning
  - F.40.1. Overview #
  - F.40.2. Installation #
  - F.40.3. Regression Tests #
  - F.40.4. GUC Parameters #
  - F.40.5. Features #
    - F.40.5.1. Controlled Object Classes #
    - F.40.5.2. DML Permissions #
    - F.40.5.3. DDL Permissions #

sepgsql is a loadable module that supports label-based mandatory access control (MAC) based on SELinux security policy.

The current implementation has significant limitations, and does not enforce mandatory access control for all actions. See Section F.40.7.

This module integrates with SELinux to provide an additional layer of security checking above and beyond what is normally provided by PostgreSQL. From the perspective of SELinux, this module allows PostgreSQL to function as a user-space object manager. Each table or function access initiated by a DML query will be checked against the system security policy. This check is in addition to the usual SQL permissions checking performed by PostgreSQL.

SELinux access control decisions are made using security labels, which are represented by strings such as system_u:object_r:sepgsql_table_t:s0. Each access control decision involves two labels: the label of the subject attempting to perform the action, and the label of the object on which the operation is to be performed. Since these labels can be applied to any sort of object, access control decisions for objects stored within the database can be (and, with this module, are) subjected to the same general criteria used for objects of any other type, such as files. This design is intended to allow a centralized security policy to protect information assets independent of the particulars of how those assets are stored.

The SECURITY LABEL statement allows assignment of a security label to a database object.

sepgsql can only be used on Linux 2.6.28 or higher with SELinux enabled. It is not available on any other platform. You will also need libselinux 2.1.10 or higher and selinux-policy 3.9.13 or higher (although some distributions may backport the necessary rules into older policy versions).

The sestatus command allows you to check the status of SELinux. A typical display is:

If SELinux is disabled or not installed, you must set that product up first before installing this module.

To build this module, specify --with-selinux (when using make and autoconf ) or -Dselinux={ auto | enabled | disabled } (when using meson). Be sure that the libselinux-devel RPM is installed at build time.

To use this module, you must include sepgsql in the shared_preload_libraries parameter in postgresql.conf. The module will not function correctly if loaded in any other manner. Once the module is loaded, you should execute sepgsql.sql in each database. This will install functions needed for security label management, and assign initial security labels.

Here is an example showing how to initialize a fresh database cluster with sepgsql functions and security labels installed. Adjust the paths shown as appropriate for your installation:

Please note that you may see some or all of the following notifications depending on the particular versions you have of libselinux and selinux-policy:

These messages are harmless and should be ignored.

If the installation process completes without error, you can now start the server normally.

The sepgsql test suite is run if PG_TEST_EXTRA contains sepgsql (see Section 31.1.3). This method is suitable during development of PostgreSQL. Alternatively, there is a way to run the tests to checks whether a database instance has been set up properly for sepgsql.

Due to the nature of SELinux, running the regression tests for sepgsql requires several extra configuration steps, some of which must be done as root.

The manual tests must be run in the contrib/sepgsql directory of a configured PostgreSQL build tree. Although they require a build tree, the tests are designed to be executed against an installed server, that is they are comparable to make installcheck not make check.

First, set up sepgsql in a working database according to the instructions in Section F.40.2. Note that the current operating system user must be able to connect to the database as superuser without password authentication.

Second, build and install the policy package for the regression test. The sepgsql-regtest policy is a special purpose policy package which provides a set of rules to be allowed during the regression tests. It should be built from the policy source file sepgsql-regtest.te, which is done using make with a Makefile supplied by SELinux. You will need to locate the appropriate Makefile on your system; the path shown below is only an example. (This Makefile is usually supplied by the selinux-policy-devel or selinux-policy RPM.) Once built, install this policy package using the semodule command, which loads supplied policy packages into the kernel. If the package is correctly installed, semodule -l should list sepgsql-regtest as an available policy package:

Third, turn on sepgsql_regression_test_mode. For security reasons, the rules in sepgsql-regtest are not enabled by default; the sepgsql_regression_test_mode parameter enables the rules needed to launch the regression tests. It can be turned on using the setsebool command:

Fourth, verify your shell is operating in the unconfined_t domain:

See Section F.40.8 for details on adjusting your working domain, if necessary.

Finally, run the regression test script:

This script will attempt to verify that you have done all the configuration steps correctly, and then it will run the regression tests for the sepgsql module.

After completing the tests, it's recommended you disable the sepgsql_regression_test_mode parameter:

You might prefer to remove the sepgsql-regtest policy entirely:

This parameter enables sepgsql to function in permissive mode, regardless of the system setting. The default is off. This parameter can only be set in the postgresql.conf file or on the server command line.

When this parameter is on, sepgsql functions in permissive mode, even if SELinux in general is working in enforcing mode. This parameter is primarily useful for testing purposes.

This parameter enables the printing of audit messages regardless of the system policy settings. The default is off, which means that messages will be printed according to the system settings.

The security policy of SELinux also has rules to control whether or not particular accesses are logged. By default, access violations are logged, but allowed accesses are not.

This parameter forces all possible logging to be turned on, regardless of the system policy.

The security model of SELinux describes all the access control rules as relationships between a subject entity (typically, a client of the database) and an object entity (such as a database object), each of which is identified by a security label. If access to an unlabeled object is attempted, the object is treated as if it were assigned the label unlabeled_t.

Currently, sepgsql allows security labels to be assigned to schemas, tables, columns, sequences, views, and functions. When sepgsql is in use, security labels are automatically assigned to supported database objects at creation time. This label is called a default security label, and is decided according to the system security policy, which takes as input the creator's label, the label assigned to the new object's parent object and optionally name of the constructed object.

A new database object basically inherits the security label of the parent object, except when the security policy has special rules known as type-transition rules, in which case a different label may be applied. For schemas, the parent object is the current database; for tables, sequences, views, and functions, it is the containing schema; for columns, it is the containing table.

For tables, db_table:select, db_table:insert, db_table:update or db_table:delete are checked for all the referenced target tables depending on the kind of statement; in addition, db_table:select is also checked for all the tables that contain columns referenced in the WHERE or RETURNING clause, as a data source for UPDATE, and so on.

Column-level permissions will also be checked for each referenced column. db_column:select is checked on not only the columns being read using SELECT, but those being referenced in other DML statements; db_column:update or db_column:insert will also be checked for columns being modified by UPDATE or INSERT.

For example, consider:

Here, db_column:update will be checked for t1.x, since it is being updated, db_column:{select update} will be checked for t1.y, since it is both updated and referenced, and db_column:select will be checked for t1.z, since it is only referenced. db_table:{select update} will also be checked at the table level.

For sequences, db_sequence:get_value is checked when we reference a sequence object using SELECT; however, note that we do not currently check permissions on execution of corresponding functions such as lastval().

For views, db_view:expand will be checked, then any other required permissions will be checked on the objects being expanded from the view, individually.

For functions, db_procedure:{execute} will be checked when user tries to execute a function as a part of query, or using fast-path invocation. If this function is a trusted procedure, it also checks db_procedure:{entrypoint} permission to check whether it can perform as entry point of trusted procedure.

In order to access any schema object, db_schema:search permission is required on the containing schema. When an object is referenced without schema qualification, schemas on which this permission is not present will not be searched (just as if the user did not have USAGE privilege on the schema). If an explicit schema qualification is present, an error will occur if the user does not have the requisite permission on the named schema.

The client must be allowed to access all referenced tables and columns, even if they originated from views which were then expanded, so that we apply consistent access control rules independent of the manner in which the table contents are referenced.

The default database privilege system allows database superusers to modify system catalogs using DML commands, and reference or modify toast tables. These operations are prohibited when sepgsql is enabled.

SELinux defines several permissions to control common operations for each object type; such as creation, alter, drop and relabel of security label. In addition, several object types have special permissions to control their characteristic operations; such as addition or deletion of name entries within a particular schema.

Creating a new database object requires create permission. SELinux will grant or deny this permission based on the client's security label and the proposed security label for the new object. In some cases, additional privileges are required:

CREATE DATABASE additionally requires getattr permission for the source or template database.

Creating a schema object additionally requires add_name permission on the parent schema.

Creating a table additionally requires permission to create each individual table column, just as if each table column were a separate top-level object.

Creating a function marked as LEAKPROOF additionally requires install permission. (This permission is also checked when LEAKPROOF is set for an existing function.)

When DROP command is executed, drop will be checked on the object being removed. Permissions will be also checked for objects dropped indirectly via CASCADE. Deletion of objects contained within a particular schema (tables, views, sequences and procedures) additionally requires remove_name on the schema.

When ALTER command is executed, setattr will be checked on the object being modified for each object types, except for subsidiary objects such as the indexes or triggers of a table, where permissions are instead checked on the parent object. In some cases, additional permissions are required:

Moving an object to a new schema additionally requires remove_name permission on the old schema and add_name permission on the new one.

Setting the LEAKPROOF attribute on a function requires install permission.

Using SECURITY LABEL on an object additionally requires relabelfrom permission for the object in conjunction with its old security label and relabelto permission for the object in conjunction with its new security label. (In cases where multiple label providers are installed and the user tries to set a security label, but it is not managed by SELinux, only setattr should be checked here. This is currently not done due to implementation restrictions.)

Trusted procedures are similar to security definer functions or setuid commands. SELinux provides a feature to allow trusted code to run using a security label different from that of the client, generally for the purpose of providing highly controlled access to sensitive data (e.g., rows might be omitted, or the precision of stored values might be reduced). Whether or not a function acts as a trusted procedure is controlled by its security label and the operating system security policy. For example:

The above operations should be performed by an administrative user.

In this case, a regular user cannot reference customer.credit directly, but a trusted procedure show_credit allows the user to print the credit card numbers of customers with some of the digits masked out.

It is possible to use SELinux's dynamic domain transition feature to switch the security label of the client process, the client domain, to a new context, if that is allowed by the security policy. The client domain needs the setcurrent permission and also dyntransition from the old to the new domain.

Dynamic domain transitions should be considered carefully, because they allow users to switch their label, and therefore their privileges, at their option, rather than (as in the case of a trusted procedure) as mandated by the system. Thus, the dyntransition permission is only considered safe when used to switch to a domain with a smaller set of privileges than the original one. For example:

In this example above we were allowed to switch from the larger MCS range c1.c1023 to the smaller range c1.c4, but switching back was denied.

A combination of dynamic domain transition and trusted procedure enables an interesting use case that fits the typical process life-cycle of connection pooling software. Even if your connection pooling software is not allowed to run most of SQL commands, you can allow it to switch the security label of the client using the sepgsql_setcon() function from within a trusted procedure; that should take some credential to authorize the request to switch the client label. After that, this session will have the privileges of the target user, rather than the connection pooler. The connection pooler can later revert the security label change by again using sepgsql_setcon() with NULL argument, again invoked from within a trusted procedure with appropriate permissions checks. The point here is that only the trusted procedure actually has permission to change the effective security label, and only does so when given proper credentials. Of course, for secure operation, the credential store (table, procedure definition, or whatever) must be protected from unauthorized access.

We reject the LOAD command across the board, because any module loaded could easily circumvent security policy enforcement.

Table F.32 shows the available functions.

Table F.32. Sepgsql Functions

sepgsql_getcon () → text

Returns the client domain, the current security label of the client.

sepgsql_setcon ( text ) → boolean

Switches the client domain of the current session to the new domain, if allowed by the security policy. It also accepts NULL input as a request to transition to the client's original domain.

sepgsql_mcstrans_in ( text ) → text

Translates the given qualified MLS/MCS range into raw format if the mcstrans daemon is running.

sepgsql_mcstrans_out ( text ) → text

Translates the given raw MLS/MCS range into qualified format if the mcstrans daemon is running.

sepgsql_restorecon ( text ) → boolean

Sets up initial security labels for all objects within the current database. The argument may be NULL, or the name of a specfile to be used as alternative of the system default.

Due to implementation restrictions, some DDL operations do not check permissions.

Due to implementation restrictions, DCL operations do not check permissions.

PostgreSQL supports row-level access, but sepgsql does not.

sepgsql does not try to hide the existence of a certain object, even if the user is not allowed to reference it. For example, we can infer the existence of an invisible object as a result of primary key conflicts, foreign key violations, and so on, even if we cannot obtain the contents of the object. The existence of a top secret table cannot be hidden; we only hope to conceal its contents.

This wiki page provides a brief overview, security design, architecture, administration and upcoming features.

This document provides a wide spectrum of knowledge to administer SELinux on your systems. It focuses primarily on Red Hat operating systems, but is not limited to them.

This document answers frequently asked questions about SELinux. It focuses primarily on Fedora, but is not limited to Fedora.

KaiGai Kohei <kaigai@ak.jp.nec.com>

**Examples:**

Example 1 (yaml):
```yaml
system_u:object_r:sepgsql_table_t:s0
```

Example 2 (unknown):
```unknown
SECURITY LABEL
```

Example 3 (sql):
```sql
$ sestatus
SELinux status:                 enabled
SELinuxfs mount:                /selinux
Current mode:                   enforcing
Mode from config file:          enforcing
Policy version:                 24
Policy from config file:        targeted
```

Example 4 (unknown):
```unknown
--with-selinux
```

---


---

## F.11. dblink — connect to other PostgreSQL databases #


**URL:** https://www.postgresql.org/docs/18/dblink.html

**Contents:**
- F.11. dblink — connect to other PostgreSQL databases #

dblink is a module that supports connections to other PostgreSQL databases from within a database session.

dblink can report the following wait events under the wait event type Extension.

Waiting to establish a connection to a remote server.

Waiting to establish a connection to a remote server when it could not be found in the list of already-opened connections.

Waiting to receive the results of a query from a remote server.

See also postgres_fdw, which provides roughly the same functionality using a more modern and standards-compliant infrastructure.

**Examples:**

Example 1 (unknown):
```unknown
DblinkConnect
```

Example 2 (unknown):
```unknown
DblinkGetConnect
```

Example 3 (unknown):
```unknown
DblinkGetResult
```

---


---

## F.8. btree_gist — GiST operator classes with B-tree behavior #


**URL:** https://www.postgresql.org/docs/18/btree-gist.html

**Contents:**
- F.8. btree_gist — GiST operator classes with B-tree behavior #
  - F.8.1. Example Usage #
  - F.8.2. Authors #

btree_gist provides GiST index operator classes that implement B-tree equivalent behavior for the data types int2, int4, int8, float4, float8, numeric, timestamp with time zone, timestamp without time zone, time with time zone, time without time zone, date, interval, oid, money, char, varchar, text, bytea, bit, varbit, macaddr, macaddr8, inet, cidr, uuid, bool and all enum types.

In general, these operator classes will not outperform the equivalent standard B-tree index methods, and they lack one major feature of the standard B-tree code: the ability to enforce uniqueness. However, they provide some other features that are not available with a B-tree index, as described below. Also, these operator classes are useful when a multicolumn GiST index is needed, wherein some of the columns are of data types that are only indexable with GiST but other columns are just simple data types. Lastly, these operator classes are useful for GiST testing and as a base for developing other GiST operator classes.

In addition to the typical B-tree search operators, btree_gist also provides index support for <> (“not equals”). This may be useful in combination with an exclusion constraint, as described below.

Also, for data types for which there is a natural distance metric, btree_gist defines a distance operator <->, and provides GiST index support for nearest-neighbor searches using this operator. Distance operators are provided for int2, int4, int8, float4, float8, timestamp with time zone, timestamp without time zone, time without time zone, date, interval, oid, and money.

By default btree_gist builds GiST index with sortsupport in sorted mode. This usually results in much faster index built speed. It is still possible to revert to buffered built strategy by using the buffering parameter when creating the index.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Simple example using btree_gist instead of btree:

Use an exclusion constraint to enforce the rule that a cage at a zoo can contain only one kind of animal:

Teodor Sigaev (<teodor@stack.net>), Oleg Bartunov (<oleg@sai.msu.su>), Janko Richter (<jankorichter@yahoo.de>), and Paul Jungwirth (<pj@illuminatedcomputing.com>). See http://www.sai.msu.su/~megera/postgres/gist/ for additional information.

**Examples:**

Example 1 (unknown):
```unknown
timestamp with time zone
```

Example 2 (unknown):
```unknown
timestamp without time zone
```

Example 3 (unknown):
```unknown
time with time zone
```

Example 4 (unknown):
```unknown
time without time zone
```

---


---

