# PostgreSQL - Functions (Part 21)

## 9.27. System Information Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-info.html

**Contents:**
- 9.27. System Information Functions and Operators #
  - 9.27.1. Session Information Functions #
  - Note
  - 9.27.2. Access Privilege Inquiry Functions #
  - 9.27.3. Schema Visibility Inquiry Functions #
  - 9.27.4. System Catalog Information Functions #
  - 9.27.5. Object Information and Addressing Functions #
  - 9.27.6. Comment Information Functions #
  - 9.27.7. Data Validity Checking Functions #
  - 9.27.8. Transaction ID and Snapshot Information Functions #

The functions described in this section are used to obtain various information about a PostgreSQL installation.

Table 9.71 shows several functions that extract session and system information.

In addition to the functions listed in this section, there are a number of functions related to the statistics system that also provide system information. See Section 27.2.26 for more information.

Table 9.71. Session Information Functions

current_catalog → name

current_database () → name

Returns the name of the current database. (Databases are called “catalogs” in the SQL standard, so current_catalog is the standard's spelling.)

current_query () → text

Returns the text of the currently executing query, as submitted by the client (which might contain more than one statement).

This is equivalent to current_user.

current_schema → name

current_schema () → name

Returns the name of the schema that is first in the search path (or a null value if the search path is empty). This is the schema that will be used for any tables or other named objects that are created without specifying a target schema.

current_schemas ( include_implicit boolean ) → name[]

Returns an array of the names of all schemas presently in the effective search path, in their priority order. (Items in the current search_path setting that do not correspond to existing, searchable schemas are omitted.) If the Boolean argument is true, then implicitly-searched system schemas such as pg_catalog are included in the result.

Returns the user name of the current execution context.

inet_client_addr () → inet

Returns the IP address of the current client, or NULL if the current connection is via a Unix-domain socket.

inet_client_port () → integer

Returns the IP port number of the current client, or NULL if the current connection is via a Unix-domain socket.

inet_server_addr () → inet

Returns the IP address on which the server accepted the current connection, or NULL if the current connection is via a Unix-domain socket.

inet_server_port () → integer

Returns the IP port number on which the server accepted the current connection, or NULL if the current connection is via a Unix-domain socket.

pg_backend_pid () → integer

Returns the process ID of the server process attached to the current session.

pg_blocking_pids ( integer ) → integer[]

Returns an array of the process ID(s) of the sessions that are blocking the server process with the specified process ID from acquiring a lock, or an empty array if there is no such server process or it is not blocked.

One server process blocks another if it either holds a lock that conflicts with the blocked process's lock request (hard block), or is waiting for a lock that would conflict with the blocked process's lock request and is ahead of it in the wait queue (soft block). When using parallel queries the result always lists client-visible process IDs (that is, pg_backend_pid results) even if the actual lock is held or awaited by a child worker process. As a result of that, there may be duplicated PIDs in the result. Also note that when a prepared transaction holds a conflicting lock, it will be represented by a zero process ID.

Frequent calls to this function could have some impact on database performance, because it needs exclusive access to the lock manager's shared state for a short time.

pg_conf_load_time () → timestamp with time zone

Returns the time when the server configuration files were last loaded. If the current session was alive at the time, this will be the time when the session itself re-read the configuration files (so the reading will vary a little in different sessions). Otherwise it is the time when the postmaster process re-read the configuration files.

pg_current_logfile ( [ text ] ) → text

Returns the path name of the log file currently in use by the logging collector. The path includes the log_directory directory and the individual log file name. The result is NULL if the logging collector is disabled. When multiple log files exist, each in a different format, pg_current_logfile without an argument returns the path of the file having the first format found in the ordered list: stderr, csvlog, jsonlog. NULL is returned if no log file has any of these formats. To request information about a specific log file format, supply either csvlog, jsonlog or stderr as the value of the optional parameter. The result is NULL if the log format requested is not configured in log_destination. The result reflects the contents of the current_logfiles file.

This function is restricted to superusers and roles with privileges of the pg_monitor role by default, but other users can be granted EXECUTE to run the function.

pg_get_loaded_modules () → setof record ( module_name text, version text, file_name text )

Returns a list of the loadable modules that are loaded into the current server session. The module_name and version fields are NULL unless the module author supplied values for them using the PG_MODULE_MAGIC_EXT macro. The file_name field gives the file name of the module (shared library).

pg_my_temp_schema () → oid

Returns the OID of the current session's temporary schema, or zero if it has none (because it has not created any temporary tables).

pg_is_other_temp_schema ( oid ) → boolean

Returns true if the given OID is the OID of another session's temporary schema. (This can be useful, for example, to exclude other sessions' temporary tables from a catalog display.)

pg_jit_available () → boolean

Returns true if a JIT compiler extension is available (see Chapter 30) and the jit configuration parameter is set to on.

pg_numa_available () → boolean

Returns true if the server has been compiled with NUMA support.

pg_listening_channels () → setof text

Returns the set of names of asynchronous notification channels that the current session is listening to.

pg_notification_queue_usage () → double precision

Returns the fraction (0–1) of the asynchronous notification queue's maximum size that is currently occupied by notifications that are waiting to be processed. See LISTEN and NOTIFY for more information.

pg_postmaster_start_time () → timestamp with time zone

Returns the time when the server started.

pg_safe_snapshot_blocking_pids ( integer ) → integer[]

Returns an array of the process ID(s) of the sessions that are blocking the server process with the specified process ID from acquiring a safe snapshot, or an empty array if there is no such server process or it is not blocked.

A session running a SERIALIZABLE transaction blocks a SERIALIZABLE READ ONLY DEFERRABLE transaction from acquiring a snapshot until the latter determines that it is safe to avoid taking any predicate locks. See Section 13.2.3 for more information about serializable and deferrable transactions.

Frequent calls to this function could have some impact on database performance, because it needs access to the predicate lock manager's shared state for a short time.

pg_trigger_depth () → integer

Returns the current nesting level of PostgreSQL triggers (0 if not called, directly or indirectly, from inside a trigger).

Returns the session user's name.

Returns the authentication method and the identity (if any) that the user presented during the authentication cycle before they were assigned a database role. It is represented as auth_method:identity or NULL if the user has not been authenticated (for example if Trust authentication has been used).

This is equivalent to current_user.

current_catalog, current_role, current_schema, current_user, session_user, and user have special syntactic status in SQL: they must be called without trailing parentheses. In PostgreSQL, parentheses can optionally be used with current_schema, but not with the others.

The session_user is normally the user who initiated the current database connection; but superusers can change this setting with SET SESSION AUTHORIZATION. The current_user is the user identifier that is applicable for permission checking. Normally it is equal to the session user, but it can be changed with SET ROLE. It also changes during the execution of functions with the attribute SECURITY DEFINER. In Unix parlance, the session user is the “real user” and the current user is the “effective user”. current_role and user are synonyms for current_user. (The SQL standard draws a distinction between current_role and current_user, but PostgreSQL does not, since it unifies users and roles into a single kind of entity.)

Table 9.72 lists functions that allow querying object access privileges programmatically. (See Section 5.8 for more information about privileges.) In these functions, the user whose privileges are being inquired about can be specified by name or by OID (pg_authid.oid), or if the name is given as public then the privileges of the PUBLIC pseudo-role are checked. Also, the user argument can be omitted entirely, in which case the current_user is assumed. The object that is being inquired about can be specified either by name or by OID, too. When specifying by name, a schema name can be included if relevant. The access privilege of interest is specified by a text string, which must evaluate to one of the appropriate privilege keywords for the object's type (e.g., SELECT). Optionally, WITH GRANT OPTION can be added to a privilege type to test whether the privilege is held with grant option. Also, multiple privilege types can be listed separated by commas, in which case the result will be true if any of the listed privileges is held. (Case of the privilege string is not significant, and extra whitespace is allowed between but not within privilege names.) Some examples:

Table 9.72. Access Privilege Inquiry Functions

has_any_column_privilege ( [ user name or oid, ] table text or oid, privilege text ) → boolean

Does user have privilege for any column of table? This succeeds either if the privilege is held for the whole table, or if there is a column-level grant of the privilege for at least one column. Allowable privilege types are SELECT, INSERT, UPDATE, and REFERENCES.

has_column_privilege ( [ user name or oid, ] table text or oid, column text or smallint, privilege text ) → boolean

Does user have privilege for the specified table column? This succeeds either if the privilege is held for the whole table, or if there is a column-level grant of the privilege for the column. The column can be specified by name or by attribute number (pg_attribute.attnum). Allowable privilege types are SELECT, INSERT, UPDATE, and REFERENCES.

has_database_privilege ( [ user name or oid, ] database text or oid, privilege text ) → boolean

Does user have privilege for database? Allowable privilege types are CREATE, CONNECT, TEMPORARY, and TEMP (which is equivalent to TEMPORARY).

has_foreign_data_wrapper_privilege ( [ user name or oid, ] fdw text or oid, privilege text ) → boolean

Does user have privilege for foreign-data wrapper? The only allowable privilege type is USAGE.

has_function_privilege ( [ user name or oid, ] function text or oid, privilege text ) → boolean

Does user have privilege for function? The only allowable privilege type is EXECUTE.

When specifying a function by name rather than by OID, the allowed input is the same as for the regprocedure data type (see Section 8.19). An example is:

has_language_privilege ( [ user name or oid, ] language text or oid, privilege text ) → boolean

Does user have privilege for language? The only allowable privilege type is USAGE.

has_largeobject_privilege ( [ user name or oid, ] largeobject oid, privilege text ) → boolean

Does user have privilege for large object? Allowable privilege types are SELECT and UPDATE.

has_parameter_privilege ( [ user name or oid, ] parameter text, privilege text ) → boolean

Does user have privilege for configuration parameter? The parameter name is case-insensitive. Allowable privilege types are SET and ALTER SYSTEM.

has_schema_privilege ( [ user name or oid, ] schema text or oid, privilege text ) → boolean

Does user have privilege for schema? Allowable privilege types are CREATE and USAGE.

has_sequence_privilege ( [ user name or oid, ] sequence text or oid, privilege text ) → boolean

Does user have privilege for sequence? Allowable privilege types are USAGE, SELECT, and UPDATE.

has_server_privilege ( [ user name or oid, ] server text or oid, privilege text ) → boolean

Does user have privilege for foreign server? The only allowable privilege type is USAGE.

has_table_privilege ( [ user name or oid, ] table text or oid, privilege text ) → boolean

Does user have privilege for table? Allowable privilege types are SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN.

has_tablespace_privilege ( [ user name or oid, ] tablespace text or oid, privilege text ) → boolean

Does user have privilege for tablespace? The only allowable privilege type is CREATE.

has_type_privilege ( [ user name or oid, ] type text or oid, privilege text ) → boolean

Does user have privilege for data type? The only allowable privilege type is USAGE. When specifying a type by name rather than by OID, the allowed input is the same as for the regtype data type (see Section 8.19).

pg_has_role ( [ user name or oid, ] role text or oid, privilege text ) → boolean

Does user have privilege for role? Allowable privilege types are MEMBER, USAGE, and SET. MEMBER denotes direct or indirect membership in the role without regard to what specific privileges may be conferred. USAGE denotes whether the privileges of the role are immediately available without doing SET ROLE, while SET denotes whether it is possible to change to the role using the SET ROLE command. WITH ADMIN OPTION or WITH GRANT OPTION can be added to any of these privilege types to test whether the ADMIN privilege is held (all six spellings test the same thing). This function does not allow the special case of setting user to public, because the PUBLIC pseudo-role can never be a member of real roles.

row_security_active ( table text or oid ) → boolean

Is row-level security active for the specified table in the context of the current user and current environment?

Table 9.73 shows the operators available for the aclitem type, which is the catalog representation of access privileges. See Section 5.8 for information about how to read access privilege values.

Table 9.73. aclitem Operators

aclitem = aclitem → boolean

Are aclitems equal? (Notice that type aclitem lacks the usual set of comparison operators; it has only equality. In turn, aclitem arrays can only be compared for equality.)

'calvin=r*w/hobbes'::aclitem = 'calvin=r*w*/hobbes'::aclitem → f

aclitem[] @> aclitem → boolean

Does array contain the specified privileges? (This is true if there is an array entry that matches the aclitem's grantee and grantor, and has at least the specified set of privileges.)

'{calvin=r*w/hobbes,hobbes=r*w*/postgres}'::aclitem[] @> 'calvin=r*/hobbes'::aclitem → t

aclitem[] ~ aclitem → boolean

This is a deprecated alias for @>.

'{calvin=r*w/hobbes,hobbes=r*w*/postgres}'::aclitem[] ~ 'calvin=r*/hobbes'::aclitem → t

Table 9.74 shows some additional functions to manage the aclitem type.

Table 9.74. aclitem Functions

acldefault ( type "char", ownerId oid ) → aclitem[]

Constructs an aclitem array holding the default access privileges for an object of type type belonging to the role with OID ownerId. This represents the access privileges that will be assumed when an object's ACL entry is null. (The default access privileges are described in Section 5.8.) The type parameter must be one of 'c' for COLUMN, 'r' for TABLE and table-like objects, 's' for SEQUENCE, 'd' for DATABASE, 'f' for FUNCTION or PROCEDURE, 'l' for LANGUAGE, 'L' for LARGE OBJECT, 'n' for SCHEMA, 'p' for PARAMETER, 't' for TABLESPACE, 'F' for FOREIGN DATA WRAPPER, 'S' for FOREIGN SERVER, or 'T' for TYPE or DOMAIN.

aclexplode ( aclitem[] ) → setof record ( grantor oid, grantee oid, privilege_type text, is_grantable boolean )

Returns the aclitem array as a set of rows. If the grantee is the pseudo-role PUBLIC, it is represented by zero in the grantee column. Each granted privilege is represented as SELECT, INSERT, etc (see Table 5.1 for a full list). Note that each privilege is broken out as a separate row, so only one keyword appears in the privilege_type column.

makeaclitem ( grantee oid, grantor oid, privileges text, is_grantable boolean ) → aclitem

Constructs an aclitem with the given properties. privileges is a comma-separated list of privilege names such as SELECT, INSERT, etc, all of which are set in the result. (Case of the privilege string is not significant, and extra whitespace is allowed between but not within privilege names.)

Table 9.75 shows functions that determine whether a certain object is visible in the current schema search path. For example, a table is said to be visible if its containing schema is in the search path and no table of the same name appears earlier in the search path. This is equivalent to the statement that the table can be referenced by name without explicit schema qualification. Thus, to list the names of all visible tables:

For functions and operators, an object in the search path is said to be visible if there is no object of the same name and argument data type(s) earlier in the path. For operator classes and families, both the name and the associated index access method are considered.

Table 9.75. Schema Visibility Inquiry Functions

pg_collation_is_visible ( collation oid ) → boolean

Is collation visible in search path?

pg_conversion_is_visible ( conversion oid ) → boolean

Is conversion visible in search path?

pg_function_is_visible ( function oid ) → boolean

Is function visible in search path? (This also works for procedures and aggregates.)

pg_opclass_is_visible ( opclass oid ) → boolean

Is operator class visible in search path?

pg_operator_is_visible ( operator oid ) → boolean

Is operator visible in search path?

pg_opfamily_is_visible ( opclass oid ) → boolean

Is operator family visible in search path?

pg_statistics_obj_is_visible ( stat oid ) → boolean

Is statistics object visible in search path?

pg_table_is_visible ( table oid ) → boolean

Is table visible in search path? (This works for all types of relations, including views, materialized views, indexes, sequences and foreign tables.)

pg_ts_config_is_visible ( config oid ) → boolean

Is text search configuration visible in search path?

pg_ts_dict_is_visible ( dict oid ) → boolean

Is text search dictionary visible in search path?

pg_ts_parser_is_visible ( parser oid ) → boolean

Is text search parser visible in search path?

pg_ts_template_is_visible ( template oid ) → boolean

Is text search template visible in search path?

pg_type_is_visible ( type oid ) → boolean

Is type (or domain) visible in search path?

All these functions require object OIDs to identify the object to be checked. If you want to test an object by name, it is convenient to use the OID alias types (regclass, regtype, regprocedure, regoperator, regconfig, or regdictionary), for example:

Note that it would not make much sense to test a non-schema-qualified type name in this way — if the name can be recognized at all, it must be visible.

Table 9.76 lists functions that extract information from the system catalogs.

Table 9.76. System Catalog Information Functions

format_type ( type oid, typemod integer ) → text

Returns the SQL name for a data type that is identified by its type OID and possibly a type modifier. Pass NULL for the type modifier if no specific modifier is known.

pg_basetype ( regtype ) → regtype

Returns the OID of the base type of a domain identified by its type OID. If the argument is the OID of a non-domain type, returns the argument as-is. Returns NULL if the argument is not a valid type OID. If there's a chain of domain dependencies, it will recurse until finding the base type.

Assuming CREATE DOMAIN mytext AS text:

pg_basetype('mytext'::regtype) → text

pg_char_to_encoding ( encoding name ) → integer

Converts the supplied encoding name into an integer representing the internal identifier used in some system catalog tables. Returns -1 if an unknown encoding name is provided.

pg_encoding_to_char ( encoding integer ) → name

Converts the integer used as the internal identifier of an encoding in some system catalog tables into a human-readable string. Returns an empty string if an invalid encoding number is provided.

pg_get_catalog_foreign_keys () → setof record ( fktable regclass, fkcols text[], pktable regclass, pkcols text[], is_array boolean, is_opt boolean )

Returns a set of records describing the foreign key relationships that exist within the PostgreSQL system catalogs. The fktable column contains the name of the referencing catalog, and the fkcols column contains the name(s) of the referencing column(s). Similarly, the pktable column contains the name of the referenced catalog, and the pkcols column contains the name(s) of the referenced column(s). If is_array is true, the last referencing column is an array, each of whose elements should match some entry in the referenced catalog. If is_opt is true, the referencing column(s) are allowed to contain zeroes instead of a valid reference.

pg_get_constraintdef ( constraint oid [, pretty boolean ] ) → text

Reconstructs the creating command for a constraint. (This is a decompiled reconstruction, not the original text of the command.)

pg_get_expr ( expr pg_node_tree, relation oid [, pretty boolean ] ) → text

Decompiles the internal form of an expression stored in the system catalogs, such as the default value for a column. If the expression might contain Vars, specify the OID of the relation they refer to as the second parameter; if no Vars are expected, passing zero is sufficient.

pg_get_functiondef ( func oid ) → text

Reconstructs the creating command for a function or procedure. (This is a decompiled reconstruction, not the original text of the command.) The result is a complete CREATE OR REPLACE FUNCTION or CREATE OR REPLACE PROCEDURE statement.

pg_get_function_arguments ( func oid ) → text

Reconstructs the argument list of a function or procedure, in the form it would need to appear in within CREATE FUNCTION (including default values).

pg_get_function_identity_arguments ( func oid ) → text

Reconstructs the argument list necessary to identify a function or procedure, in the form it would need to appear in within commands such as ALTER FUNCTION. This form omits default values.

pg_get_function_result ( func oid ) → text

Reconstructs the RETURNS clause of a function, in the form it would need to appear in within CREATE FUNCTION. Returns NULL for a procedure.

pg_get_indexdef ( index oid [, column integer, pretty boolean ] ) → text

Reconstructs the creating command for an index. (This is a decompiled reconstruction, not the original text of the command.) If column is supplied and is not zero, only the definition of that column is reconstructed.

pg_get_keywords () → setof record ( word text, catcode "char", barelabel boolean, catdesc text, baredesc text )

Returns a set of records describing the SQL keywords recognized by the server. The word column contains the keyword. The catcode column contains a category code: U for an unreserved keyword, C for a keyword that can be a column name, T for a keyword that can be a type or function name, or R for a fully reserved keyword. The barelabel column contains true if the keyword can be used as a “bare” column label in SELECT lists, or false if it can only be used after AS. The catdesc column contains a possibly-localized string describing the keyword's category. The baredesc column contains a possibly-localized string describing the keyword's column label status.

pg_get_partkeydef ( table oid ) → text

Reconstructs the definition of a partitioned table's partition key, in the form it would have in the PARTITION BY clause of CREATE TABLE. (This is a decompiled reconstruction, not the original text of the command.)


*(continued...)*
---

