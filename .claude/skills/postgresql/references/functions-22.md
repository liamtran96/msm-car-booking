# PostgreSQL - Functions (Part 22)

## 9.27. System Information Functions and Operators # (continued)
pg_get_ruledef ( rule oid [, pretty boolean ] ) → text

Reconstructs the creating command for a rule. (This is a decompiled reconstruction, not the original text of the command.)

pg_get_serial_sequence ( table text, column text ) → text

Returns the name of the sequence associated with a column, or NULL if no sequence is associated with the column. If the column is an identity column, the associated sequence is the sequence internally created for that column. For columns created using one of the serial types (serial, smallserial, bigserial), it is the sequence created for that serial column definition. In the latter case, the association can be modified or removed with ALTER SEQUENCE OWNED BY. (This function probably should have been called pg_get_owned_sequence; its current name reflects the fact that it has historically been used with serial-type columns.) The first parameter is a table name with optional schema, and the second parameter is a column name. Because the first parameter potentially contains both schema and table names, it is parsed per usual SQL rules, meaning it is lower-cased by default. The second parameter, being just a column name, is treated literally and so has its case preserved. The result is suitably formatted for passing to the sequence functions (see Section 9.17).

A typical use is in reading the current value of the sequence for an identity or serial column, for example:

pg_get_statisticsobjdef ( statobj oid ) → text

Reconstructs the creating command for an extended statistics object. (This is a decompiled reconstruction, not the original text of the command.)

pg_get_triggerdef ( trigger oid [, pretty boolean ] ) → text

Reconstructs the creating command for a trigger. (This is a decompiled reconstruction, not the original text of the command.)

pg_get_userbyid ( role oid ) → name

Returns a role's name given its OID.

pg_get_viewdef ( view oid [, pretty boolean ] ) → text

Reconstructs the underlying SELECT command for a view or materialized view. (This is a decompiled reconstruction, not the original text of the command.)

pg_get_viewdef ( view oid, wrap_column integer ) → text

Reconstructs the underlying SELECT command for a view or materialized view. (This is a decompiled reconstruction, not the original text of the command.) In this form of the function, pretty-printing is always enabled, and long lines are wrapped to try to keep them shorter than the specified number of columns.

pg_get_viewdef ( view text [, pretty boolean ] ) → text

Reconstructs the underlying SELECT command for a view or materialized view, working from a textual name for the view rather than its OID. (This is deprecated; use the OID variant instead.)

pg_index_column_has_property ( index regclass, column integer, property text ) → boolean

Tests whether an index column has the named property. Common index column properties are listed in Table 9.77. (Note that extension access methods can define additional property names for their indexes.) NULL is returned if the property name is not known or does not apply to the particular object, or if the OID or column number does not identify a valid object.

pg_index_has_property ( index regclass, property text ) → boolean

Tests whether an index has the named property. Common index properties are listed in Table 9.78. (Note that extension access methods can define additional property names for their indexes.) NULL is returned if the property name is not known or does not apply to the particular object, or if the OID does not identify a valid object.

pg_indexam_has_property ( am oid, property text ) → boolean

Tests whether an index access method has the named property. Access method properties are listed in Table 9.79. NULL is returned if the property name is not known or does not apply to the particular object, or if the OID does not identify a valid object.

pg_options_to_table ( options_array text[] ) → setof record ( option_name text, option_value text )

Returns the set of storage options represented by a value from pg_class.reloptions or pg_attribute.attoptions.

pg_settings_get_flags ( guc text ) → text[]

Returns an array of the flags associated with the given GUC, or NULL if it does not exist. The result is an empty array if the GUC exists but there are no flags to show. Only the most useful flags listed in Table 9.80 are exposed.

pg_tablespace_databases ( tablespace oid ) → setof oid

Returns the set of OIDs of databases that have objects stored in the specified tablespace. If this function returns any rows, the tablespace is not empty and cannot be dropped. To identify the specific objects populating the tablespace, you will need to connect to the database(s) identified by pg_tablespace_databases and query their pg_class catalogs.

pg_tablespace_location ( tablespace oid ) → text

Returns the file system path that this tablespace is located in.

pg_typeof ( "any" ) → regtype

Returns the OID of the data type of the value that is passed to it. This can be helpful for troubleshooting or dynamically constructing SQL queries. The function is declared as returning regtype, which is an OID alias type (see Section 8.19); this means that it is the same as an OID for comparison purposes but displays as a type name.

pg_typeof(33) → integer

COLLATION FOR ( "any" ) → text

Returns the name of the collation of the value that is passed to it. The value is quoted and schema-qualified if necessary. If no collation was derived for the argument expression, then NULL is returned. If the argument is not of a collatable data type, then an error is raised.

collation for ('foo'::text) → "default"

collation for ('foo' COLLATE "de_DE") → "de_DE"

to_regclass ( text ) → regclass

Translates a textual relation name to its OID. A similar result is obtained by casting the string to type regclass (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found.

to_regcollation ( text ) → regcollation

Translates a textual collation name to its OID. A similar result is obtained by casting the string to type regcollation (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found.

to_regnamespace ( text ) → regnamespace

Translates a textual schema name to its OID. A similar result is obtained by casting the string to type regnamespace (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found.

to_regoper ( text ) → regoper

Translates a textual operator name to its OID. A similar result is obtained by casting the string to type regoper (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found or is ambiguous.

to_regoperator ( text ) → regoperator

Translates a textual operator name (with parameter types) to its OID. A similar result is obtained by casting the string to type regoperator (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found.

to_regproc ( text ) → regproc

Translates a textual function or procedure name to its OID. A similar result is obtained by casting the string to type regproc (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found or is ambiguous.

to_regprocedure ( text ) → regprocedure

Translates a textual function or procedure name (with argument types) to its OID. A similar result is obtained by casting the string to type regprocedure (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found.

to_regrole ( text ) → regrole

Translates a textual role name to its OID. A similar result is obtained by casting the string to type regrole (see Section 8.19); however, this function will return NULL rather than throwing an error if the name is not found.

to_regtype ( text ) → regtype

Parses a string of text, extracts a potential type name from it, and translates that name into a type OID. A syntax error in the string will result in an error; but if the string is a syntactically valid type name that happens not to be found in the catalogs, the result is NULL. A similar result is obtained by casting the string to type regtype (see Section 8.19), except that that will throw error for name not found.

to_regtypemod ( text ) → integer

Parses a string of text, extracts a potential type name from it, and translates its type modifier, if any. A syntax error in the string will result in an error; but if the string is a syntactically valid type name that happens not to be found in the catalogs, the result is NULL. The result is -1 if no type modifier is present.

to_regtypemod can be combined with to_regtype to produce appropriate inputs for format_type, allowing a string representing a type name to be canonicalized.

format_type(to_regtype('varchar(32)'), to_regtypemod('varchar(32)')) → character varying(32)

Most of the functions that reconstruct (decompile) database objects have an optional pretty flag, which if true causes the result to be “pretty-printed”. Pretty-printing suppresses unnecessary parentheses and adds whitespace for legibility. The pretty-printed format is more readable, but the default format is more likely to be interpreted the same way by future versions of PostgreSQL; so avoid using pretty-printed output for dump purposes. Passing false for the pretty parameter yields the same result as omitting the parameter.

Table 9.77. Index Column Properties

Table 9.78. Index Properties

Table 9.79. Index Access Method Properties

Table 9.80. GUC Flags

Table 9.81 lists functions related to database object identification and addressing.

Table 9.81. Object Information and Addressing Functions

pg_get_acl ( classid oid, objid oid, objsubid integer ) → aclitem[]

Returns the ACL for a database object, specified by catalog OID, object OID and sub-object ID. This function returns NULL values for undefined objects.

pg_describe_object ( classid oid, objid oid, objsubid integer ) → text

Returns a textual description of a database object identified by catalog OID, object OID, and sub-object ID (such as a column number within a table; the sub-object ID is zero when referring to a whole object). This description is intended to be human-readable, and might be translated, depending on server configuration. This is especially useful to determine the identity of an object referenced in the pg_depend catalog. This function returns NULL values for undefined objects.

pg_identify_object ( classid oid, objid oid, objsubid integer ) → record ( type text, schema text, name text, identity text )

Returns a row containing enough information to uniquely identify the database object specified by catalog OID, object OID and sub-object ID. This information is intended to be machine-readable, and is never translated. type identifies the type of database object; schema is the schema name that the object belongs in, or NULL for object types that do not belong to schemas; name is the name of the object, quoted if necessary, if the name (along with schema name, if pertinent) is sufficient to uniquely identify the object, otherwise NULL; identity is the complete object identity, with the precise format depending on object type, and each name within the format being schema-qualified and quoted as necessary. Undefined objects are identified with NULL values.

pg_identify_object_as_address ( classid oid, objid oid, objsubid integer ) → record ( type text, object_names text[], object_args text[] )

Returns a row containing enough information to uniquely identify the database object specified by catalog OID, object OID and sub-object ID. The returned information is independent of the current server, that is, it could be used to identify an identically named object in another server. type identifies the type of database object; object_names and object_args are text arrays that together form a reference to the object. These three values can be passed to pg_get_object_address to obtain the internal address of the object.

pg_get_object_address ( type text, object_names text[], object_args text[] ) → record ( classid oid, objid oid, objsubid integer )

Returns a row containing enough information to uniquely identify the database object specified by a type code and object name and argument arrays. The returned values are the ones that would be used in system catalogs such as pg_depend; they can be passed to other system functions such as pg_describe_object or pg_identify_object. classid is the OID of the system catalog containing the object; objid is the OID of the object itself, and objsubid is the sub-object ID, or zero if none. This function is the inverse of pg_identify_object_as_address. Undefined objects are identified with NULL values.

pg_get_acl is useful for retrieving and inspecting the privileges associated with database objects without looking at specific catalogs. For example, to retrieve all the granted privileges on objects in the current database:

The functions shown in Table 9.82 extract comments previously stored with the COMMENT command. A null value is returned if no comment could be found for the specified parameters.

Table 9.82. Comment Information Functions

col_description ( table oid, column integer ) → text

Returns the comment for a table column, which is specified by the OID of its table and its column number. (obj_description cannot be used for table columns, since columns do not have OIDs of their own.)

obj_description ( object oid, catalog name ) → text

Returns the comment for a database object specified by its OID and the name of the containing system catalog. For example, obj_description(123456, 'pg_class') would retrieve the comment for the table with OID 123456.

obj_description ( object oid ) → text

Returns the comment for a database object specified by its OID alone. This is deprecated since there is no guarantee that OIDs are unique across different system catalogs; therefore, the wrong comment might be returned.

shobj_description ( object oid, catalog name ) → text

Returns the comment for a shared database object specified by its OID and the name of the containing system catalog. This is just like obj_description except that it is used for retrieving comments on shared objects (that is, databases, roles, and tablespaces). Some system catalogs are global to all databases within each cluster, and the descriptions for objects in them are stored globally as well.

The functions shown in Table 9.83 can be helpful for checking validity of proposed input data.

Table 9.83. Data Validity Checking Functions

pg_input_is_valid ( string text, type text ) → boolean

Tests whether the given string is valid input for the specified data type, returning true or false.

This function will only work as desired if the data type's input function has been updated to report invalid input as a “soft” error. Otherwise, invalid input will abort the transaction, just as if the string had been cast to the type directly.

pg_input_is_valid('42', 'integer') → t

pg_input_is_valid('42000000000', 'integer') → f

pg_input_is_valid('1234.567', 'numeric(7,4)') → f

pg_input_error_info ( string text, type text ) → record ( message text, detail text, hint text, sql_error_code text )

Tests whether the given string is valid input for the specified data type; if not, return the details of the error that would have been thrown. If the input is valid, the results are NULL. The inputs are the same as for pg_input_is_valid.

This function will only work as desired if the data type's input function has been updated to report invalid input as a “soft” error. Otherwise, invalid input will abort the transaction, just as if the string had been cast to the type directly.

SELECT * FROM pg_input_error_info('42000000000', 'integer') →

The functions shown in Table 9.84 provide server transaction information in an exportable form. The main use of these functions is to determine which transactions were committed between two snapshots.

Table 9.84. Transaction ID and Snapshot Information Functions

age ( xid ) → integer

Returns the number of transactions between the supplied transaction id and the current transaction counter.

mxid_age ( xid ) → integer

Returns the number of multixacts IDs between the supplied multixact ID and the current multixacts counter.

pg_current_xact_id () → xid8

Returns the current transaction's ID. It will assign a new one if the current transaction does not have one already (because it has not performed any database updates); see Section 67.1 for details. If executed in a subtransaction, this will return the top-level transaction ID; see Section 67.3 for details.

pg_current_xact_id_if_assigned () → xid8

Returns the current transaction's ID, or NULL if no ID is assigned yet. (It's best to use this variant if the transaction might otherwise be read-only, to avoid unnecessary consumption of an XID.) If executed in a subtransaction, this will return the top-level transaction ID.

pg_xact_status ( xid8 ) → text

Reports the commit status of a recent transaction. The result is one of in progress, committed, or aborted, provided that the transaction is recent enough that the system retains the commit status of that transaction. If it is old enough that no references to the transaction survive in the system and the commit status information has been discarded, the result is NULL. Applications might use this function, for example, to determine whether their transaction committed or aborted after the application and database server become disconnected while a COMMIT is in progress. Note that prepared transactions are reported as in progress; applications must check pg_prepared_xacts if they need to determine whether a transaction ID belongs to a prepared transaction.

pg_current_snapshot () → pg_snapshot

Returns a current snapshot, a data structure showing which transaction IDs are now in-progress. Only top-level transaction IDs are included in the snapshot; subtransaction IDs are not shown; see Section 67.3 for details.

pg_snapshot_xip ( pg_snapshot ) → setof xid8

Returns the set of in-progress transaction IDs contained in a snapshot.

pg_snapshot_xmax ( pg_snapshot ) → xid8

Returns the xmax of a snapshot.

pg_snapshot_xmin ( pg_snapshot ) → xid8

Returns the xmin of a snapshot.

pg_visible_in_snapshot ( xid8, pg_snapshot ) → boolean

Is the given transaction ID visible according to this snapshot (that is, was it completed before the snapshot was taken)? Note that this function will not give the correct answer for a subtransaction ID (subxid); see Section 67.3 for details.

pg_get_multixact_members ( multixid xid ) → setof record ( xid xid, mode text )

Returns the transaction ID and lock mode for each member of the specified multixact ID. The lock modes forupd, fornokeyupd, sh, and keysh correspond to the row-level locks FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE, and FOR KEY SHARE, respectively, as described in Section 13.3.2. Two additional modes are specific to multixacts: nokeyupd, used by updates that do not modify key columns, and upd, used by updates or deletes that modify key columns.

The internal transaction ID type xid is 32 bits wide and wraps around every 4 billion transactions. However, the functions shown in Table 9.84, except age, mxid_age, and pg_get_multixact_members, use a 64-bit type xid8 that does not wrap around during the life of an installation and can be converted to xid by casting if required; see Section 67.1 for details. The data type pg_snapshot stores information about transaction ID visibility at a particular moment in time. Its components are described in Table 9.85. pg_snapshot's textual representation is xmin:xmax:xip_list. For example 10:20:10,14,15 means xmin=10, xmax=20, xip_list=10, 14, 15.

Table 9.85. Snapshot Components

In releases of PostgreSQL before 13 there was no xid8 type, so variants of these functions were provided that used bigint to represent a 64-bit XID, with a correspondingly distinct snapshot data type txid_snapshot. These older functions have txid in their names. They are still supported for backward compatibility, but may be removed from a future release. See Table 9.86.

Table 9.86. Deprecated Transaction ID and Snapshot Information Functions

txid_current () → bigint

See pg_current_xact_id().

txid_current_if_assigned () → bigint

See pg_current_xact_id_if_assigned().

txid_current_snapshot () → txid_snapshot

See pg_current_snapshot().

txid_snapshot_xip ( txid_snapshot ) → setof bigint

See pg_snapshot_xip().

txid_snapshot_xmax ( txid_snapshot ) → bigint

See pg_snapshot_xmax().

txid_snapshot_xmin ( txid_snapshot ) → bigint

See pg_snapshot_xmin().

txid_visible_in_snapshot ( bigint, txid_snapshot ) → boolean

See pg_visible_in_snapshot().

txid_status ( bigint ) → text

See pg_xact_status().

The functions shown in Table 9.87 provide information about when past transactions were committed. They only provide useful data when the track_commit_timestamp configuration option is enabled, and only for transactions that were committed after it was enabled. Commit timestamp information is routinely removed during vacuum.

Table 9.87. Committed Transaction Information Functions

pg_xact_commit_timestamp ( xid ) → timestamp with time zone

Returns the commit timestamp of a transaction.

pg_xact_commit_timestamp_origin ( xid ) → record ( timestamp timestamp with time zone, roident oid)

Returns the commit timestamp and replication origin of a transaction.

pg_last_committed_xact () → record ( xid xid, timestamp timestamp with time zone, roident oid )

Returns the transaction ID, commit timestamp and replication origin of the latest committed transaction.

The functions shown in Table 9.88 print information initialized during initdb, such as the catalog version. They also show information about write-ahead logging and checkpoint processing. This information is cluster-wide, not specific to any one database. These functions provide most of the same information, from the same source, as the pg_controldata application.

Table 9.88. Control Data Functions

pg_control_checkpoint () → record

Returns information about current checkpoint state, as shown in Table 9.89.

pg_control_system () → record

Returns information about current control file state, as shown in Table 9.90.

pg_control_init () → record

Returns information about cluster initialization state, as shown in Table 9.91.

pg_control_recovery () → record

Returns information about recovery state, as shown in Table 9.92.

Table 9.89. pg_control_checkpoint Output Columns

Table 9.90. pg_control_system Output Columns

Table 9.91. pg_control_init Output Columns

Table 9.92. pg_control_recovery Output Columns

The functions shown in Table 9.93 print version information.

Table 9.93. Version Information Functions

Returns a string describing the PostgreSQL server's version. You can also get this information from server_version, or for a machine-readable version use server_version_num. Software developers should use server_version_num (available since 8.2) or PQserverVersion instead of parsing the text version.

unicode_version () → text

Returns a string representing the version of Unicode used by PostgreSQL.

icu_unicode_version () → text

Returns a string representing the version of Unicode used by ICU, if the server was built with ICU support; otherwise returns NULL

The functions shown in Table 9.94 print information about the status of WAL summarization. See summarize_wal.

Table 9.94. WAL Summarization Information Functions

pg_available_wal_summaries () → setof record ( tli bigint, start_lsn pg_lsn, end_lsn pg_lsn )

Returns information about the WAL summary files present in the data directory, under pg_wal/summaries. One row will be returned per WAL summary file. Each file summarizes WAL on the indicated TLI within the indicated LSN range. This function might be useful to determine whether enough WAL summaries are present on the server to take an incremental backup based on some prior backup whose start LSN is known.

pg_wal_summary_contents ( tli bigint, start_lsn pg_lsn, end_lsn pg_lsn ) → setof record ( relfilenode oid, reltablespace oid, reldatabase oid, relforknumber smallint, relblocknumber bigint, is_limit_block boolean )

Returns one information about the contents of a single WAL summary file identified by TLI and starting and ending LSNs. Each row with is_limit_block false indicates that the block identified by the remaining output columns was modified by at least one WAL record within the range of records summarized by this file. Each row with is_limit_block true indicates either that (a) the relation fork was truncated to the length given by relblocknumber within the relevant range of WAL records or (b) that the relation fork was created or dropped within the relevant range of WAL records; in such cases, relblocknumber will be zero.

pg_get_wal_summarizer_state () → record ( summarized_tli bigint, summarized_lsn pg_lsn, pending_lsn pg_lsn, summarizer_pid int )

Returns information about the progress of the WAL summarizer. If the WAL summarizer has never run since the instance was started, then summarized_tli and summarized_lsn will be 0 and 0/0 respectively; otherwise, they will be the TLI and ending LSN of the last WAL summary file written to disk. If the WAL summarizer is currently running, pending_lsn will be the ending LSN of the last record that it has consumed, which must always be greater than or equal to summarized_lsn; if the WAL summarizer is not running, it will be equal to summarized_lsn. summarizer_pid is the PID of the WAL summarizer process, if it is running, and otherwise NULL.

As a special exception, the WAL summarizer will refuse to generate WAL summary files if run on WAL generated under wal_level=minimal, since such summaries would be unsafe to use as the basis for an incremental backup. In this case, the fields above will continue to advance as if summaries were being generated, but nothing will be written to disk. Once the summarizer reaches WAL generated while wal_level was set to replica or higher, it will resume writing summaries to disk.

**Examples:**

Example 1 (unknown):
```unknown
current_catalog
```

Example 2 (unknown):
```unknown
current_database

*(continued...)*
---

