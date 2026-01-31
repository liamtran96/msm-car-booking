# PostgreSQL - Roles (Part 2)

## 22.2. Creating a Database #


**URL:** https://www.postgresql.org/docs/18/manage-ag-createdb.html

**Contents:**
- 22.2. Creating a Database #
  - Note

In order to create a database, the PostgreSQL server must be up and running (see Section 18.3).

Databases are created with the SQL command CREATE DATABASE:

where name follows the usual rules for SQL identifiers. The current role automatically becomes the owner of the new database. It is the privilege of the owner of a database to remove it later (which also removes all the objects in it, even if they have a different owner).

The creation of databases is a restricted operation. See Section 21.2 for how to grant permission.

Since you need to be connected to the database server in order to execute the CREATE DATABASE command, the question remains how the first database at any given site can be created. The first database is always created by the initdb command when the data storage area is initialized. (See Section 18.2.) This database is called postgres. So to create the first “ordinary” database you can connect to postgres.

Two additional databases, template1 and template0, are also created during database cluster initialization. Whenever a new database is created within the cluster, template1 is essentially cloned. This means that any changes you make in template1 are propagated to all subsequently created databases. Because of this, avoid creating objects in template1 unless you want them propagated to every newly created database. template0 is meant as a pristine copy of the original contents of template1. It can be cloned instead of template1 when it is important to make a database without any such site-local additions. More details appear in Section 22.3.

As a convenience, there is a program you can execute from the shell to create new databases, createdb.

createdb does no magic. It connects to the postgres database and issues the CREATE DATABASE command, exactly as described above. The createdb reference page contains the invocation details. Note that createdb without any arguments will create a database with the current user name.

Chapter 20 contains information about how to restrict who can connect to a given database.

Sometimes you want to create a database for someone else, and have them become the owner of the new database, so they can configure and manage it themselves. To achieve that, use one of the following commands:

from the SQL environment, or:

from the shell. Only the superuser is allowed to create a database for someone else (that is, for a role you are not a member of).

**Examples:**

Example 1 (unknown):
```unknown
CREATE DATABASE
```

Example 2 (unknown):
```unknown
CREATE DATABASE
```

Example 3 (unknown):
```unknown
CREATE DATABASE dbname OWNER rolename;
```

Example 4 (unknown):
```unknown
createdb -O rolename dbname
```

---


---

## 21.5. Predefined Roles #


**URL:** https://www.postgresql.org/docs/18/predefined-roles.html

**Contents:**
- 21.5. Predefined Roles #
  - Warning

PostgreSQL provides a set of predefined roles that provide access to certain, commonly needed, privileged capabilities and information. Administrators (including roles that have the CREATEROLE privilege) can GRANT these roles to users and/or other roles in their environment, providing those users with access to the specified capabilities and information. For example:

Care should be taken when granting these roles to ensure they are only used where needed and with the understanding that these roles grant access to privileged information.

The predefined roles are described below. Note that the specific permissions for each of the roles may change in the future as additional capabilities are added. Administrators should monitor the release notes for changes.

pg_checkpoint allows executing the CHECKPOINT command.

pg_create_subscription allows users with CREATE permission on the database to issue CREATE SUBSCRIPTION.

pg_database_owner always has exactly one implicit member: the current database owner. It cannot be granted membership in any role, and no role can be granted membership in pg_database_owner. However, like any other role, it can own objects and receive grants of access privileges. Consequently, once pg_database_owner has rights within a template database, each owner of a database instantiated from that template will possess those rights. Initially, this role owns the public schema, so each database owner governs local use of that schema.

pg_maintain allows executing VACUUM, ANALYZE, CLUSTER, REFRESH MATERIALIZED VIEW, REINDEX, and LOCK TABLE on all relations, as if having MAINTAIN rights on those objects.

These roles are intended to allow administrators to easily configure a role for the purpose of monitoring the database server. They grant a set of common privileges allowing the role to read various useful configuration settings, statistics, and other system information normally restricted to superusers.

pg_monitor allows reading/executing various monitoring views and functions. This role is a member of pg_read_all_settings, pg_read_all_stats and pg_stat_scan_tables.

pg_read_all_settings allows reading all configuration variables, even those normally visible only to superusers.

pg_read_all_stats allows reading all pg_stat_* views and use various statistics related extensions, even those normally visible only to superusers.

pg_stat_scan_tables allows executing monitoring functions that may take ACCESS SHARE locks on tables, potentially for a long time (e.g., pgrowlocks(text) in the pgrowlocks extension).

pg_read_all_data allows reading all data (tables, views, sequences), as if having SELECT rights on those objects and USAGE rights on all schemas. This role does not bypass row-level security (RLS) policies. If RLS is being used, an administrator may wish to set BYPASSRLS on roles which this role is granted to.

pg_write_all_data allows writing all data (tables, views, sequences), as if having INSERT, UPDATE, and DELETE rights on those objects and USAGE rights on all schemas. This role does not bypass row-level security (RLS) policies. If RLS is being used, an administrator may wish to set BYPASSRLS on roles which this role is granted to.

These roles are intended to allow administrators to have trusted, but non-superuser, roles which are able to access files and run programs on the database server as the user the database runs as. They bypass all database-level permission checks when accessing files directly and they could be used to gain superuser-level access. Therefore, great care should be taken when granting these roles to users.

pg_read_server_files allows reading files from any location the database can access on the server using COPY and other file-access functions.

pg_write_server_files allows writing to files in any location the database can access on the server using COPY and other file-access functions.

pg_execute_server_program allows executing programs on the database server as the user the database runs as using COPY and other functions which allow executing a server-side program.

pg_signal_autovacuum_worker allows signaling autovacuum workers to cancel the current table's vacuum or terminate its session. See Section 9.28.2.

pg_signal_backend allows signaling another backend to cancel a query or terminate its session. Note that this role does not permit signaling backends owned by a superuser. See Section 9.28.2.

pg_use_reserved_connections allows use of connection slots reserved via reserved_connections.

**Examples:**

Example 1 (unknown):
```unknown
GRANT pg_signal_backend TO admin_user;
```

Example 2 (unknown):
```unknown
pg_checkpoint
```

Example 3 (unknown):
```unknown
pg_checkpoint
```

Example 4 (unknown):
```unknown
pg_create_subscription
```

---


---

## 21.6. Function Security #


**URL:** https://www.postgresql.org/docs/18/perm-functions.html

**Contents:**
- 21.6. Function Security #

Functions, triggers and row-level security policies allow users to insert code into the backend server that other users might execute unintentionally. Hence, these mechanisms permit users to “Trojan horse” others with relative ease. The strongest protection is tight control over who can define objects. Where that is infeasible, write queries referring only to objects having trusted owners. Remove from search_path any schemas that permit untrusted users to create objects.

Functions run inside the backend server process with the operating system permissions of the database server daemon. If the programming language used for the function allows unchecked memory accesses, it is possible to change the server's internal data structures. Hence, among many other things, such functions can circumvent any system access controls. Function languages that allow such access are considered “untrusted”, and PostgreSQL allows only superusers to create functions written in those languages.

**Examples:**

Example 1 (unknown):
```unknown
search_path
```

---


---

## Chapter 21. Database Roles


**URL:** https://www.postgresql.org/docs/18/user-manag.html

**Contents:**
- Chapter 21. Database Roles

PostgreSQL manages database access permissions using the concept of roles. A role can be thought of as either a database user, or a group of database users, depending on how the role is set up. Roles can own database objects (for example, tables and functions) and can assign privileges on those objects to other roles to control who has access to which objects. Furthermore, it is possible to grant membership in a role to another role, thus allowing the member role to use privileges assigned to another role.

The concept of roles subsumes the concepts of “users” and “groups”. In PostgreSQL versions before 8.1, users and groups were distinct kinds of entities, but now there are only roles. Any role can act as a user, a group, or both.

This chapter describes how to create and manage roles. More information about the effects of role privileges on various database objects can be found in Section 5.8.

---


---

## Chapter 22. Managing Databases


**URL:** https://www.postgresql.org/docs/18/managing-databases.html

**Contents:**
- Chapter 22. Managing Databases

Every instance of a running PostgreSQL server manages one or more databases. Databases are therefore the topmost hierarchical level for organizing SQL objects (“database objects”). This chapter describes the properties of databases, and how to create, manage, and destroy them.

---


---

## 22.4. Database Configuration #


**URL:** https://www.postgresql.org/docs/18/manage-ag-config.html

**Contents:**
- 22.4. Database Configuration #

Recall from Chapter 19 that the PostgreSQL server provides a large number of run-time configuration variables. You can set database-specific default values for many of these settings.

For example, if for some reason you want to disable the GEQO optimizer for a given database, you'd ordinarily have to either disable it for all databases or make sure that every connecting client is careful to issue SET geqo TO off. To make this setting the default within a particular database, you can execute the command:

This will save the setting (but not set it immediately). In subsequent connections to this database it will appear as though SET geqo TO off; had been executed just before the session started. Note that users can still alter this setting during their sessions; it will only be the default. To undo any such setting, use ALTER DATABASE dbname RESET varname.

**Examples:**

Example 1 (unknown):
```unknown
SET geqo TO off
```

Example 2 (unknown):
```unknown
ALTER DATABASE mydb SET geqo TO off;
```

Example 3 (unknown):
```unknown
SET geqo TO off;
```

Example 4 (unknown):
```unknown
ALTER DATABASE dbname RESET varname
```

---


---

## 21.4. Dropping Roles #


**URL:** https://www.postgresql.org/docs/18/role-removal.html

**Contents:**
- 21.4. Dropping Roles #

Because roles can own database objects and can hold privileges to access other objects, dropping a role is often not just a matter of a quick DROP ROLE. Any objects owned by the role must first be dropped or reassigned to other owners; and any permissions granted to the role must be revoked.

Ownership of objects can be transferred one at a time using ALTER commands, for example:

Alternatively, the REASSIGN OWNED command can be used to reassign ownership of all objects owned by the role-to-be-dropped to a single other role. Because REASSIGN OWNED cannot access objects in other databases, it is necessary to run it in each database that contains objects owned by the role. (Note that the first such REASSIGN OWNED will change the ownership of any shared-across-databases objects, that is databases or tablespaces, that are owned by the role-to-be-dropped.)

Once any valuable objects have been transferred to new owners, any remaining objects owned by the role-to-be-dropped can be dropped with the DROP OWNED command. Again, this command cannot access objects in other databases, so it is necessary to run it in each database that contains objects owned by the role. Also, DROP OWNED will not drop entire databases or tablespaces, so it is necessary to do that manually if the role owns any databases or tablespaces that have not been transferred to new owners.

DROP OWNED also takes care of removing any privileges granted to the target role for objects that do not belong to it. Because REASSIGN OWNED does not touch such objects, it's typically necessary to run both REASSIGN OWNED and DROP OWNED (in that order!) to fully remove the dependencies of a role to be dropped.

In short then, the most general recipe for removing a role that has been used to own objects is:

When not all owned objects are to be transferred to the same successor owner, it's best to handle the exceptions manually and then perform the above steps to mop up.

If DROP ROLE is attempted while dependent objects still remain, it will issue messages identifying which objects need to be reassigned or dropped.

**Examples:**

Example 1 (unknown):
```unknown
ALTER TABLE bobs_table OWNER TO alice;
```

Example 2 (unknown):
```unknown
REASSIGN OWNED
```

Example 3 (unknown):
```unknown
REASSIGN OWNED
```

Example 4 (unknown):
```unknown
REASSIGN OWNED
```

---


---

