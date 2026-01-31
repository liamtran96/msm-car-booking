# PostgreSQL - Roles

## 22.3. Template Databases #


**URL:** https://www.postgresql.org/docs/18/manage-ag-templatedbs.html

**Contents:**
- 22.3. Template Databases #
  - Note

CREATE DATABASE actually works by copying an existing database. By default, it copies the standard system database named template1. Thus that database is the “template” from which new databases are made. If you add objects to template1, these objects will be copied into subsequently created user databases. This behavior allows site-local modifications to the standard set of objects in databases. For example, if you install the procedural language PL/Perl in template1, it will automatically be available in user databases without any extra action being taken when those databases are created.

However, CREATE DATABASE does not copy database-level GRANT permissions attached to the source database. The new database has default database-level permissions.

There is a second standard system database named template0. This database contains the same data as the initial contents of template1, that is, only the standard objects predefined by your version of PostgreSQL. template0 should never be changed after the database cluster has been initialized. By instructing CREATE DATABASE to copy template0 instead of template1, you can create a “pristine” user database (one where no user-defined objects exist and where the system objects have not been altered) that contains none of the site-local additions in template1. This is particularly handy when restoring a pg_dump dump: the dump script should be restored in a pristine database to ensure that one recreates the correct contents of the dumped database, without conflicting with objects that might have been added to template1 later on.

Another common reason for copying template0 instead of template1 is that new encoding and locale settings can be specified when copying template0, whereas a copy of template1 must use the same settings it does. This is because template1 might contain encoding-specific or locale-specific data, while template0 is known not to.

To create a database by copying template0, use:

from the SQL environment, or:

It is possible to create additional template databases, and indeed one can copy any database in a cluster by specifying its name as the template for CREATE DATABASE. It is important to understand, however, that this is not (yet) intended as a general-purpose “COPY DATABASE” facility. The principal limitation is that no other sessions can be connected to the source database while it is being copied. CREATE DATABASE will fail if any other connection exists when it starts; during the copy operation, new connections to the source database are prevented.

Two useful flags exist in pg_database for each database: the columns datistemplate and datallowconn. datistemplate can be set to indicate that a database is intended as a template for CREATE DATABASE. If this flag is set, the database can be cloned by any user with CREATEDB privileges; if it is not set, only superusers and the owner of the database can clone it. If datallowconn is false, then no new connections to that database will be allowed (but existing sessions are not terminated simply by setting the flag false). The template0 database is normally marked datallowconn = false to prevent its modification. Both template0 and template1 should always be marked with datistemplate = true.

template1 and template0 do not have any special status beyond the fact that the name template1 is the default source database name for CREATE DATABASE. For example, one could drop template1 and recreate it from template0 without any ill effects. This course of action might be advisable if one has carelessly added a bunch of junk in template1. (To delete template1, it must have pg_database.datistemplate = false.)

The postgres database is also created when a database cluster is initialized. This database is meant as a default database for users and applications to connect to. It is simply a copy of template1 and can be dropped and recreated if necessary.

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
CREATE DATABASE
```

Example 4 (unknown):
```unknown
CREATE DATABASE dbname TEMPLATE template0;
```

---


---

## 21.3. Role Membership #


**URL:** https://www.postgresql.org/docs/18/role-membership.html

**Contents:**
- 21.3. Role Membership #
  - Note
  - Note

It is frequently convenient to group users together to ease management of privileges: that way, privileges can be granted to, or revoked from, a group as a whole. In PostgreSQL this is done by creating a role that represents the group, and then granting membership in the group role to individual user roles.

To set up a group role, first create the role:

Typically a role being used as a group would not have the LOGIN attribute, though you can set it if you wish.

Once the group role exists, you can add and remove members using the GRANT and REVOKE commands:

You can grant membership to other group roles, too (since there isn't really any distinction between group roles and non-group roles). The database will not let you set up circular membership loops. Also, it is not permitted to grant membership in a role to PUBLIC.

The members of a group role can use the privileges of the role in two ways. First, member roles that have been granted membership with the SET option can do SET ROLE to temporarily “become” the group role. In this state, the database session has access to the privileges of the group role rather than the original login role, and any database objects created are considered owned by the group role, not the login role. Second, member roles that have been granted membership with the INHERIT option automatically have use of the privileges of those directly or indirectly a member of, though the chain stops at memberships lacking the inherit option. As an example, suppose we have done:

Immediately after connecting as role joe, a database session will have use of privileges granted directly to joe plus any privileges granted to admin and island, because joe “inherits” those privileges. However, privileges granted to wheel are not available, because even though joe is indirectly a member of wheel, the membership is via admin which was granted using WITH INHERIT FALSE. After:

the session would have use of only those privileges granted to admin, and not those granted to joe or island. After:

the session would have use of only those privileges granted to wheel, and not those granted to either joe or admin. The original privilege state can be restored with any of:

The SET ROLE command always allows selecting any role that the original login role is directly or indirectly a member of, provided that there is a chain of membership grants each of which has SET TRUE (which is the default). Thus, in the above example, it is not necessary to become admin before becoming wheel. On the other hand, it is not possible to become island at all; joe can only access those privileges via inheritance.

In the SQL standard, there is a clear distinction between users and roles, and users do not automatically inherit privileges while roles do. This behavior can be obtained in PostgreSQL by giving roles being used as SQL roles the INHERIT attribute, while giving roles being used as SQL users the NOINHERIT attribute. However, PostgreSQL defaults to giving all roles the INHERIT attribute, for backward compatibility with pre-8.1 releases in which users always had use of permissions granted to groups they were members of.

The role attributes LOGIN, SUPERUSER, CREATEDB, and CREATEROLE can be thought of as special privileges, but they are never inherited as ordinary privileges on database objects are. You must actually SET ROLE to a specific role having one of these attributes in order to make use of the attribute. Continuing the above example, we might choose to grant CREATEDB and CREATEROLE to the admin role. Then a session connecting as role joe would not have these privileges immediately, only after doing SET ROLE admin.

To destroy a group role, use DROP ROLE:

Any memberships in the group role are automatically revoked (but the member roles are not otherwise affected).

**Examples:**

Example 1 (unknown):
```unknown
CREATE ROLE joe LOGIN;
CREATE ROLE admin;
CREATE ROLE wheel;
CREATE ROLE island;
GRANT admin TO joe WITH INHERIT TRUE;
GRANT wheel TO admin WITH INHERIT FALSE;
GRANT island TO joe WITH INHERIT TRUE, SET FALSE;
```

Example 2 (unknown):
```unknown
WITH INHERIT FALSE
```

Example 3 (unknown):
```unknown
SET ROLE admin;
```

Example 4 (unknown):
```unknown
SET ROLE wheel;
```

---


---

## 22.1. Overview #


**URL:** https://www.postgresql.org/docs/18/manage-ag-overview.html

**Contents:**
- 22.1. Overview #
  - Note

A small number of objects, like role, database, and tablespace names, are defined at the cluster level and stored in the pg_global tablespace. Inside the cluster are multiple databases, which are isolated from each other but can access cluster-level objects. Inside each database are multiple schemas, which contain objects like tables and functions. So the full hierarchy is: cluster, database, schema, table (or some other kind of object, such as a function).

When connecting to the database server, a client must specify the database name in its connection request. It is not possible to access more than one database per connection. However, clients can open multiple connections to the same database, or different databases. Database-level security has two components: access control (see Section 20.1), managed at the connection level, and authorization control (see Section 5.8), managed via the grant system. Foreign data wrappers (see postgres_fdw) allow for objects within one database to act as proxies for objects in other database or clusters. The older dblink module (see dblink) provides a similar capability. By default, all users can connect to all databases using all connection methods.

If one PostgreSQL server cluster is planned to contain unrelated projects or users that should be, for the most part, unaware of each other, it is recommended to put them into separate databases and adjust authorizations and access controls accordingly. If the projects or users are interrelated, and thus should be able to use each other's resources, they should be put in the same database but probably into separate schemas; this provides a modular structure with namespace isolation and authorization control. More information about managing schemas is in Section 5.10.

While multiple databases can be created within a single cluster, it is advised to consider carefully whether the benefits outweigh the risks and limitations. In particular, the impact that having a shared WAL (see Chapter 28) has on backup and recovery options. While individual databases in the cluster are isolated when considered from the user's perspective, they are closely bound from the database administrator's point-of-view.

Databases are created with the CREATE DATABASE command (see Section 22.2) and destroyed with the DROP DATABASE command (see Section 22.5). To determine the set of existing databases, examine the pg_database system catalog, for example

The psql program's \l meta-command and -l command-line option are also useful for listing the existing databases.

The SQL standard calls databases “catalogs”, but there is no difference in practice.

**Examples:**

Example 1 (unknown):
```unknown
CREATE DATABASE
```

Example 2 (unknown):
```unknown
DROP DATABASE
```

Example 3 (unknown):
```unknown
pg_database
```

---


---

## 22.6. Tablespaces #


**URL:** https://www.postgresql.org/docs/18/manage-ag-tablespaces.html

**Contents:**
- 22.6. Tablespaces #
  - Warning
  - Note

Tablespaces in PostgreSQL allow database administrators to define locations in the file system where the files representing database objects can be stored. Once created, a tablespace can be referred to by name when creating database objects.

By using tablespaces, an administrator can control the disk layout of a PostgreSQL installation. This is useful in at least two ways. First, if the partition or volume on which the cluster was initialized runs out of space and cannot be extended, a tablespace can be created on a different partition and used until the system can be reconfigured.

Second, tablespaces allow an administrator to use knowledge of the usage pattern of database objects to optimize performance. For example, an index which is very heavily used can be placed on a very fast, highly available disk, such as an expensive solid state device. At the same time a table storing archived data which is rarely used or not performance critical could be stored on a less expensive, slower disk system.

Even though located outside the main PostgreSQL data directory, tablespaces are an integral part of the database cluster and cannot be treated as an autonomous collection of data files. They are dependent on metadata contained in the main data directory, and therefore cannot be attached to a different database cluster or backed up individually. Similarly, if you lose a tablespace (file deletion, disk failure, etc.), the database cluster might become unreadable or unable to start. Placing a tablespace on a temporary file system like a RAM disk risks the reliability of the entire cluster.

To define a tablespace, use the CREATE TABLESPACE command, for example::

The location must be an existing, empty directory that is owned by the PostgreSQL operating system user. All objects subsequently created within the tablespace will be stored in files underneath this directory. The location must not be on removable or transient storage, as the cluster might fail to function if the tablespace is missing or lost.

There is usually not much point in making more than one tablespace per logical file system, since you cannot control the location of individual files within a logical file system. However, PostgreSQL does not enforce any such limitation, and indeed it is not directly aware of the file system boundaries on your system. It just stores files in the directories you tell it to use.

Creation of the tablespace itself must be done as a database superuser, but after that you can allow ordinary database users to use it. To do that, grant them the CREATE privilege on it.

Tables, indexes, and entire databases can be assigned to particular tablespaces. To do so, a user with the CREATE privilege on a given tablespace must pass the tablespace name as a parameter to the relevant command. For example, the following creates a table in the tablespace space1:

Alternatively, use the default_tablespace parameter:

When default_tablespace is set to anything but an empty string, it supplies an implicit TABLESPACE clause for CREATE TABLE and CREATE INDEX commands that do not have an explicit one.

There is also a temp_tablespaces parameter, which determines the placement of temporary tables and indexes, as well as temporary files that are used for purposes such as sorting large data sets. This can be a list of tablespace names, rather than only one, so that the load associated with temporary objects can be spread over multiple tablespaces. A random member of the list is picked each time a temporary object is to be created.

The tablespace associated with a database is used to store the system catalogs of that database. Furthermore, it is the default tablespace used for tables, indexes, and temporary files created within the database, if no TABLESPACE clause is given and no other selection is specified by default_tablespace or temp_tablespaces (as appropriate). If a database is created without specifying a tablespace for it, it uses the same tablespace as the template database it is copied from.

Two tablespaces are automatically created when the database cluster is initialized. The pg_global tablespace is used only for shared system catalogs. The pg_default tablespace is the default tablespace of the template1 and template0 databases (and, therefore, will be the default tablespace for other databases as well, unless overridden by a TABLESPACE clause in CREATE DATABASE).

Once created, a tablespace can be used from any database, provided the requesting user has sufficient privilege. This means that a tablespace cannot be dropped until all objects in all databases using the tablespace have been removed.

To remove an empty tablespace, use the DROP TABLESPACE command.

To determine the set of existing tablespaces, examine the pg_tablespace system catalog, for example

It is possible to find which databases use which tablespaces; see Table 9.76. The psql program's \db meta-command is also useful for listing the existing tablespaces.

The directory $PGDATA/pg_tblspc contains symbolic links that point to each of the non-built-in tablespaces defined in the cluster. Although not recommended, it is possible to adjust the tablespace layout by hand by redefining these links. Under no circumstances perform this operation while the server is running.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLESPACE fastspace LOCATION '/ssd1/postgresql/data';
```

Example 2 (sql):
```sql
CREATE TABLE foo(i int) TABLESPACE space1;
```

Example 3 (sql):
```sql
SET default_tablespace = space1;
CREATE TABLE foo(i int);
```

Example 4 (unknown):
```unknown
default_tablespace
```

---


---

## 21.2. Role Attributes #


**URL:** https://www.postgresql.org/docs/18/role-attributes.html

**Contents:**
- 21.2. Role Attributes #

A database role can have a number of attributes that define its privileges and interact with the client authentication system.

Only roles that have the LOGIN attribute can be used as the initial role name for a database connection. A role with the LOGIN attribute can be considered the same as a “database user”. To create a role with login privilege, use either:

(CREATE USER is equivalent to CREATE ROLE except that CREATE USER includes LOGIN by default, while CREATE ROLE does not.)

A database superuser bypasses all permission checks, except the right to log in. This is a dangerous privilege and should not be used carelessly; it is best to do most of your work as a role that is not a superuser. To create a new database superuser, use CREATE ROLE name SUPERUSER. You must do this as a role that is already a superuser.

A role must be explicitly given permission to create databases (except for superusers, since those bypass all permission checks). To create such a role, use CREATE ROLE name CREATEDB.

A role must be explicitly given permission to create more roles (except for superusers, since those bypass all permission checks). To create such a role, use CREATE ROLE name CREATEROLE. A role with CREATEROLE privilege can alter and drop roles which have been granted to the CREATEROLE user with the ADMIN option. Such a grant occurs automatically when a CREATEROLE user that is not a superuser creates a new role, so that by default, a CREATEROLE user can alter and drop the roles which they have created. Altering a role includes most changes that can be made using ALTER ROLE, including, for example, changing passwords. It also includes modifications to a role that can be made using the COMMENT and SECURITY LABEL commands.

However, CREATEROLE does not convey the ability to create SUPERUSER roles, nor does it convey any power over SUPERUSER roles that already exist. Furthermore, CREATEROLE does not convey the power to create REPLICATION users, nor the ability to grant or revoke the REPLICATION privilege, nor the ability to modify the role properties of such users. However, it does allow ALTER ROLE ... SET and ALTER ROLE ... RENAME to be used on REPLICATION roles, as well as the use of COMMENT ON ROLE, SECURITY LABEL ON ROLE, and DROP ROLE. Finally, CREATEROLE does not confer the ability to grant or revoke the BYPASSRLS privilege.

A role must explicitly be given permission to initiate streaming replication (except for superusers, since those bypass all permission checks). A role used for streaming replication must have LOGIN permission as well. To create such a role, use CREATE ROLE name REPLICATION LOGIN.

A password is only significant if the client authentication method requires the user to supply a password when connecting to the database. The password and md5 authentication methods make use of passwords. Database passwords are separate from operating system passwords. Specify a password upon role creation with CREATE ROLE name PASSWORD 'string'.

A role inherits the privileges of roles it is a member of, by default. However, to create a role which does not inherit privileges by default, use CREATE ROLE name NOINHERIT. Alternatively, inheritance can be overridden for individual grants by using WITH INHERIT TRUE or WITH INHERIT FALSE.

A role must be explicitly given permission to bypass every row-level security (RLS) policy (except for superusers, since those bypass all permission checks). To create such a role, use CREATE ROLE name BYPASSRLS as a superuser.

Connection limit can specify how many concurrent connections a role can make. -1 (the default) means no limit. Specify connection limit upon role creation with CREATE ROLE name CONNECTION LIMIT 'integer'.

A role's attributes can be modified after creation with ALTER ROLE. See the reference pages for the CREATE ROLE and ALTER ROLE commands for details.

A role can also have role-specific defaults for many of the run-time configuration settings described in Chapter 19. For example, if for some reason you want to disable index scans (hint: not a good idea) anytime you connect, you can use:

This will save the setting (but not set it immediately). In subsequent connections by this role it will appear as though SET enable_indexscan TO off had been executed just before the session started. You can still alter this setting during the session; it will only be the default. To remove a role-specific default setting, use ALTER ROLE rolename RESET varname. Note that role-specific defaults attached to roles without LOGIN privilege are fairly useless, since they will never be invoked.

When a non-superuser creates a role using the CREATEROLE privilege, the created role is automatically granted back to the creating user, just as if the bootstrap superuser had executed the command GRANT created_user TO creating_user WITH ADMIN TRUE, SET FALSE, INHERIT FALSE. Since a CREATEROLE user can only exercise special privileges with regard to an existing role if they have ADMIN OPTION on it, this grant is just sufficient to allow a CREATEROLE user to administer the roles they created. However, because it is created with INHERIT FALSE, SET FALSE, the CREATEROLE user doesn't inherit the privileges of the created role, nor can it access the privileges of that role using SET ROLE. However, since any user who has ADMIN OPTION on a role can grant membership in that role to any other user, the CREATEROLE user can gain access to the created role by simply granting that role back to themselves with the INHERIT and/or SET options. Thus, the fact that privileges are not inherited by default nor is SET ROLE granted by default is a safeguard against accidents, not a security feature. Also note that, because this automatic grant is granted by the bootstrap superuser, it cannot be removed or changed by the CREATEROLE user; however, any superuser could revoke it, modify it, and/or issue additional such grants to other CREATEROLE users. Whichever CREATEROLE users have ADMIN OPTION on a role at any given time can administer it.

**Examples:**

Example 1 (unknown):
```unknown
CREATE ROLE name LOGIN;
CREATE USER name;
```

Example 2 (unknown):
```unknown
CREATE USER
```

Example 3 (unknown):
```unknown
CREATE ROLE
```

Example 4 (unknown):
```unknown
CREATE USER
```

---


---

## 21.1. Database Roles #


**URL:** https://www.postgresql.org/docs/18/database-roles.html

**Contents:**
- 21.1. Database Roles #

Database roles are conceptually completely separate from operating system users. In practice it might be convenient to maintain a correspondence, but this is not required. Database roles are global across a database cluster installation (and not per individual database). To create a role use the CREATE ROLE SQL command:

name follows the rules for SQL identifiers: either unadorned without special characters, or double-quoted. (In practice, you will usually want to add additional options, such as LOGIN, to the command. More details appear below.) To remove an existing role, use the analogous DROP ROLE command:

For convenience, the programs createuser and dropuser are provided as wrappers around these SQL commands that can be called from the shell command line:

To determine the set of existing roles, examine the pg_roles system catalog, for example:

or to see just those capable of logging in:

The psql program's \du meta-command is also useful for listing the existing roles.

In order to bootstrap the database system, a freshly initialized system always contains one predefined login-capable role. This role is always a “superuser”, and it will have the same name as the operating system user that initialized the database cluster with initdb unless a different name is specified. This role is often named postgres. In order to create more roles you first have to connect as this initial role.

Every connection to the database server is made using the name of some particular role, and this role determines the initial access privileges for commands issued in that connection. The role name to use for a particular database connection is indicated by the client that is initiating the connection request in an application-specific fashion. For example, the psql program uses the -U command line option to indicate the role to connect as. Many applications assume the name of the current operating system user by default (including createuser and psql). Therefore it is often convenient to maintain a naming correspondence between roles and operating system users.

The set of database roles a given client connection can connect as is determined by the client authentication setup, as explained in Chapter 20. (Thus, a client is not limited to connect as the role matching its operating system user, just as a person's login name need not match his or her real name.) Since the role identity determines the set of privileges available to a connected client, it is important to carefully configure privileges when setting up a multiuser environment.

**Examples:**

Example 1 (unknown):
```unknown
CREATE ROLE
```

---


---

## 22.5. Destroying a Database #


**URL:** https://www.postgresql.org/docs/18/manage-ag-dropdb.html

**Contents:**
- 22.5. Destroying a Database #

Databases are destroyed with the command DROP DATABASE:

Only the owner of the database, or a superuser, can drop a database. Dropping a database removes all objects that were contained within the database. The destruction of a database cannot be undone.

You cannot execute the DROP DATABASE command while connected to the victim database. You can, however, be connected to any other database, including the template1 database. template1 would be the only option for dropping the last user database of a given cluster.

For convenience, there is also a shell program to drop databases, dropdb:

(Unlike createdb, it is not the default action to drop the database with the current user name.)

**Examples:**

Example 1 (unknown):
```unknown
DROP DATABASE
```

---


---

