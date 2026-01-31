# PostgreSQL - Server Config (Part 9)

## 19.10. Vacuuming #


**URL:** https://www.postgresql.org/docs/18/runtime-config-vacuum.html

**Contents:**
- 19.10. Vacuuming #
  - 19.10.1. Automatic Vacuuming #
  - 19.10.2. Cost-based Vacuum Delay #
  - Note
  - 19.10.3. Default Behavior #
  - 19.10.4. Freezing #

These parameters control vacuuming behavior. For more information on the purpose and responsibilities of vacuum, see Section 24.1.

These settings control the behavior of the autovacuum feature. Refer to Section 24.1.6 for more information. Note that many of these settings can be overridden on a per-table basis; see Storage Parameters.

Controls whether the server should run the autovacuum launcher daemon. This is on by default; however, track_counts must also be enabled for autovacuum to work. This parameter can only be set in the postgresql.conf file or on the server command line; however, autovacuuming can be disabled for individual tables by changing table storage parameters.

Note that even when this parameter is disabled, the system will launch autovacuum processes if necessary to prevent transaction ID wraparound. See Section 24.1.5 for more information.

Specifies the number of backend slots to reserve for autovacuum worker processes. The default is typically 16 slots, but might be less if your kernel settings will not support it (as determined during initdb). This parameter can only be set at server start.

When changing this value, consider also adjusting autovacuum_max_workers.

Specifies the maximum number of autovacuum processes (other than the autovacuum launcher) that may be running at any one time. The default is 3. This parameter can only be set in the postgresql.conf file or on the server command line.

Note that a setting for this value which is higher than autovacuum_worker_slots will have no effect, since autovacuum workers are taken from the pool of slots established by that setting.

Specifies the minimum delay between autovacuum runs on any given database. In each round the daemon examines the database and issues VACUUM and ANALYZE commands as needed for tables in that database. If this value is specified without units, it is taken as seconds. The default is one minute (1min). This parameter can only be set in the postgresql.conf file or on the server command line.

Specifies the minimum number of updated or deleted tuples needed to trigger a VACUUM in any one table. The default is 50 tuples. This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies the number of inserted tuples needed to trigger a VACUUM in any one table. The default is 1000 tuples. If -1 is specified, autovacuum will not trigger a VACUUM operation on any tables based on the number of inserts. This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies the minimum number of inserted, updated or deleted tuples needed to trigger an ANALYZE in any one table. The default is 50 tuples. This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies a fraction of the table size to add to autovacuum_vacuum_threshold when deciding whether to trigger a VACUUM. The default is 0.2 (20% of table size). This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies a fraction of the unfrozen pages in the table to add to autovacuum_vacuum_insert_threshold when deciding whether to trigger a VACUUM. The default is 0.2 (20% of unfrozen pages in table). This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies a fraction of the table size to add to autovacuum_analyze_threshold when deciding whether to trigger an ANALYZE. The default is 0.1 (10% of table size). This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies the maximum number of updated or deleted tuples needed to trigger a VACUUM in any one table, i.e., a limit on the value calculated with autovacuum_vacuum_threshold and autovacuum_vacuum_scale_factor. The default is 100,000,000 tuples. If -1 is specified, autovacuum will not enforce a maximum number of updated or deleted tuples that will trigger a VACUUM operation. This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing storage parameters.

Specifies the maximum age (in transactions) that a table's pg_class.relfrozenxid field can attain before a VACUUM operation is forced to prevent transaction ID wraparound within the table. Note that the system will launch autovacuum processes to prevent wraparound even when autovacuum is otherwise disabled.

Vacuum also allows removal of old files from the pg_xact subdirectory, which is why the default is a relatively low 200 million transactions. This parameter can only be set at server start, but the setting can be reduced for individual tables by changing table storage parameters. For more information see Section 24.1.5.

Specifies the maximum age (in multixacts) that a table's pg_class.relminmxid field can attain before a VACUUM operation is forced to prevent multixact ID wraparound within the table. Note that the system will launch autovacuum processes to prevent wraparound even when autovacuum is otherwise disabled.

Vacuuming multixacts also allows removal of old files from the pg_multixact/members and pg_multixact/offsets subdirectories, which is why the default is a relatively low 400 million multixacts. This parameter can only be set at server start, but the setting can be reduced for individual tables by changing table storage parameters. For more information see Section 24.1.5.1.

Specifies the cost delay value that will be used in automatic VACUUM operations. If -1 is specified, the regular vacuum_cost_delay value will be used. If this value is specified without units, it is taken as milliseconds. The default value is 2 milliseconds. This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

Specifies the cost limit value that will be used in automatic VACUUM operations. If -1 is specified (which is the default), the regular vacuum_cost_limit value will be used. Note that the value is distributed proportionally among the running autovacuum workers, if there is more than one, so that the sum of the limits for each worker does not exceed the value of this variable. This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing table storage parameters.

During the execution of VACUUM and ANALYZE commands, the system maintains an internal counter that keeps track of the estimated cost of the various I/O operations that are performed. When the accumulated cost reaches a limit (specified by vacuum_cost_limit), the process performing the operation will sleep for a short period of time, as specified by vacuum_cost_delay. Then it will reset the counter and continue execution.

The intent of this feature is to allow administrators to reduce the I/O impact of these commands on concurrent database activity. There are many situations where it is not important that maintenance commands like VACUUM and ANALYZE finish quickly; however, it is usually very important that these commands do not significantly interfere with the ability of the system to perform other database operations. Cost-based vacuum delay provides a way for administrators to achieve this.

This feature is disabled by default for manually issued VACUUM commands. To enable it, set the vacuum_cost_delay variable to a nonzero value.

The amount of time that the process will sleep when the cost limit has been exceeded. If this value is specified without units, it is taken as milliseconds. The default value is 0, which disables the cost-based vacuum delay feature. Positive values enable cost-based vacuuming.

When using cost-based vacuuming, appropriate values for vacuum_cost_delay are usually quite small, perhaps less than 1 millisecond. While vacuum_cost_delay can be set to fractional-millisecond values, such delays may not be measured accurately on older platforms. On such platforms, increasing VACUUM's throttled resource consumption above what you get at 1ms will require changing the other vacuum cost parameters. You should, nonetheless, keep vacuum_cost_delay as small as your platform will consistently measure; large delays are not helpful.

The estimated cost for vacuuming a buffer found in the shared buffer cache. It represents the cost to lock the buffer pool, lookup the shared hash table and scan the content of the page. The default value is 1.

The estimated cost for vacuuming a buffer that has to be read from disk. This represents the effort to lock the buffer pool, lookup the shared hash table, read the desired block in from the disk and scan its content. The default value is 2.

The estimated cost charged when vacuum modifies a block that was previously clean. It represents the extra I/O required to flush the dirty block out to disk again. The default value is 20.

This is the accumulated cost that will cause the vacuuming process to sleep for vacuum_cost_delay. The default is 200.

There are certain operations that hold critical locks and should therefore complete as quickly as possible. Cost-based vacuum delays do not occur during such operations. Therefore it is possible that the cost accumulates far higher than the specified limit. To avoid uselessly long delays in such cases, the actual delay is calculated as vacuum_cost_delay * accumulated_balance / vacuum_cost_limit with a maximum of vacuum_cost_delay * 4.

Enables or disables vacuum to try to truncate off any empty pages at the end of the table. The default value is true. If true, VACUUM and autovacuum do the truncation and the disk space for the truncated pages is returned to the operating system. Note that the truncation requires an ACCESS EXCLUSIVE lock on the table. The TRUNCATE parameter of VACUUM, if specified, overrides the value of this parameter. The setting can also be overridden for individual tables by changing table storage parameters.

To maintain correctness even after transaction IDs wrap around, PostgreSQL marks rows that are sufficiently old as frozen. These rows are visible to everyone; other transactions do not need to examine their inserting XID to determine visibility. VACUUM is responsible for marking rows as frozen. The following settings control VACUUM's freezing behavior and should be tuned based on the XID consumption rate of the system and data access patterns of the dominant workloads. See Section 24.1.5 for more information on transaction ID wraparound and tuning these parameters.

VACUUM performs an aggressive scan if the table's pg_class.relfrozenxid field has reached the age specified by this setting. An aggressive scan differs from a regular VACUUM in that it visits every page that might contain unfrozen XIDs or MXIDs, not just those that might contain dead tuples. The default is 150 million transactions. Although users can set this value anywhere from zero to two billion, VACUUM will silently limit the effective value to 95% of autovacuum_freeze_max_age, so that a periodic manual VACUUM has a chance to run before an anti-wraparound autovacuum is launched for the table. For more information see Section 24.1.5.

Specifies the cutoff age (in transactions) that VACUUM should use to decide whether to trigger freezing of pages that have an older XID. The default is 50 million transactions. Although users can set this value anywhere from zero to one billion, VACUUM will silently limit the effective value to half the value of autovacuum_freeze_max_age, so that there is not an unreasonably short time between forced autovacuums. For more information see Section 24.1.5.

Specifies the maximum age (in transactions) that a table's pg_class.relfrozenxid field can attain before VACUUM takes extraordinary measures to avoid system-wide transaction ID wraparound failure. This is VACUUM's strategy of last resort. The failsafe typically triggers when an autovacuum to prevent transaction ID wraparound has already been running for some time, though it's possible for the failsafe to trigger during any VACUUM.

When the failsafe is triggered, any cost-based delay that is in effect will no longer be applied, further non-essential maintenance tasks (such as index vacuuming) are bypassed, and any Buffer Access Strategy in use will be disabled resulting in VACUUM being free to make use of all of shared buffers.

The default is 1.6 billion transactions. Although users can set this value anywhere from zero to 2.1 billion, VACUUM will silently adjust the effective value to no less than 105% of autovacuum_freeze_max_age.

VACUUM performs an aggressive scan if the table's pg_class.relminmxid field has reached the age specified by this setting. An aggressive scan differs from a regular VACUUM in that it visits every page that might contain unfrozen XIDs or MXIDs, not just those that might contain dead tuples. The default is 150 million multixacts. Although users can set this value anywhere from zero to two billion, VACUUM will silently limit the effective value to 95% of autovacuum_multixact_freeze_max_age, so that a periodic manual VACUUM has a chance to run before an anti-wraparound is launched for the table. For more information see Section 24.1.5.1.

Specifies the cutoff age (in multixacts) that VACUUM should use to decide whether to trigger freezing of pages with an older multixact ID. The default is 5 million multixacts. Although users can set this value anywhere from zero to one billion, VACUUM will silently limit the effective value to half the value of autovacuum_multixact_freeze_max_age, so that there is not an unreasonably short time between forced autovacuums. For more information see Section 24.1.5.1.

Specifies the maximum age (in multixacts) that a table's pg_class.relminmxid field can attain before VACUUM takes extraordinary measures to avoid system-wide multixact ID wraparound failure. This is VACUUM's strategy of last resort. The failsafe typically triggers when an autovacuum to prevent transaction ID wraparound has already been running for some time, though it's possible for the failsafe to trigger during any VACUUM.

When the failsafe is triggered, any cost-based delay that is in effect will no longer be applied, and further non-essential maintenance tasks (such as index vacuuming) are bypassed.

The default is 1.6 billion multixacts. Although users can set this value anywhere from zero to 2.1 billion, VACUUM will silently adjust the effective value to no less than 105% of autovacuum_multixact_freeze_max_age.

Specifies the maximum number of pages (as a fraction of total pages in the relation) that VACUUM may scan and fail to set all-frozen in the visibility map before disabling eager scanning. A value of 0 disables eager scanning altogether. The default is 0.03 (3%).

Note that when eager scanning is enabled, only freeze failures count against the cap, not successful freezing. Successful page freezes are capped internally at 20% of the all-visible but not all-frozen pages in the relation. Capping successful page freezes helps amortize the overhead across multiple normal vacuums and limits the potential downside of wasted eager freezes of pages that are modified again before the next aggressive vacuum.

This parameter can only be set in the postgresql.conf file or on the server command line; but the setting can be overridden for individual tables by changing the corresponding table storage parameter. For more information on tuning vacuum's freezing behavior, see Section 24.1.5.

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
autovacuum_worker_slots
```

Example 3 (unknown):
```unknown
autovacuum_max_workers
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

## 19.2. File Locations #


**URL:** https://www.postgresql.org/docs/18/runtime-config-file-locations.html

**Contents:**
- 19.2. File Locations #

In addition to the postgresql.conf file already mentioned, PostgreSQL uses two other manually-edited configuration files, which control client authentication (their use is discussed in Chapter 20). By default, all three configuration files are stored in the database cluster's data directory. The parameters described in this section allow the configuration files to be placed elsewhere. (Doing so can ease administration. In particular it is often easier to ensure that the configuration files are properly backed-up when they are kept separate.)

Specifies the directory to use for data storage. This parameter can only be set at server start.

Specifies the main server configuration file (customarily called postgresql.conf). This parameter can only be set on the postgres command line.

Specifies the configuration file for host-based authentication (customarily called pg_hba.conf). This parameter can only be set at server start.

Specifies the configuration file for user name mapping (customarily called pg_ident.conf). This parameter can only be set at server start. See also Section 20.2.

Specifies the name of an additional process-ID (PID) file that the server should create for use by server administration programs. This parameter can only be set at server start.

In a default installation, none of the above parameters are set explicitly. Instead, the data directory is specified by the -D command-line option or the PGDATA environment variable, and the configuration files are all found within the data directory.

If you wish to keep the configuration files elsewhere than the data directory, the postgres -D command-line option or PGDATA environment variable must point to the directory containing the configuration files, and the data_directory parameter must be set in postgresql.conf (or on the command line) to show where the data directory is actually located. Notice that data_directory overrides -D and PGDATA for the location of the data directory, but not for the location of the configuration files.

If you wish, you can specify the configuration file names and locations individually using the parameters config_file, hba_file and/or ident_file. config_file can only be specified on the postgres command line, but the others can be set within the main configuration file. If all three parameters plus data_directory are explicitly set, then it is not necessary to specify -D or PGDATA.

When setting any of these parameters, a relative path will be interpreted with respect to the directory in which postgres is started.

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
data_directory
```

Example 3 (unknown):
```unknown
config_file
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

