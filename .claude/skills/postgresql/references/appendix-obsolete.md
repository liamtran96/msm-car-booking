# PostgreSQL - Appendix Obsolete

## O.1. recovery.conf file merged into postgresql.conf #


**URL:** https://www.postgresql.org/docs/18/recovery-config.html

**Contents:**
- O.1. recovery.conf file merged into postgresql.conf #

PostgreSQL 11 and below used a configuration file named recovery.conf to manage replicas and standbys. Support for this file was removed in PostgreSQL 12. See the release notes for PostgreSQL 12 for details on this change.

On PostgreSQL 12 and above, archive recovery, streaming replication, and PITR are configured using normal server configuration parameters. These are set in postgresql.conf or via ALTER SYSTEM like any other parameter.

The server will not start if a recovery.conf exists.

PostgreSQL 15 and below had a setting promote_trigger_file, or trigger_file before 12. Use pg_ctl promote or call pg_promote() to promote a standby instead.

The standby_mode setting has been removed. A standby.signal file in the data directory is used instead. See Standby Server Operation for details.

**Examples:**

Example 1 (unknown):
```unknown
recovery.conf
```

Example 2 (unknown):
```unknown
postgresql.conf
```

Example 3 (unknown):
```unknown
recovery.conf
```

Example 4 (unknown):
```unknown
postgresql.conf
```

---


---

## Appendix O. Obsolete or Renamed Features


**URL:** https://www.postgresql.org/docs/18/appendix-obsolete.html

**Contents:**
- Appendix O. Obsolete or Renamed Features

Functionality is sometimes removed from PostgreSQL, feature, setting and file names sometimes change, or documentation moves to different places. This section directs users coming from old versions of the documentation or from external links to the appropriate new location for the information they need.

**Examples:**

Example 1 (unknown):
```unknown
recovery.conf
```

Example 2 (unknown):
```unknown
postgresql.conf
```

Example 3 (unknown):
```unknown
pg_xlogdump
```

Example 4 (unknown):
```unknown
pg_resetxlog
```

---


---

## O.4. pg_resetxlog renamed to pg_resetwal #


**URL:** https://www.postgresql.org/docs/18/app-pgresetxlog.html

**Contents:**
- O.4. pg_resetxlog renamed to pg_resetwal #

PostgreSQL 9.6 and below provided a command named pg_resetxlog to reset the write-ahead-log (WAL) files. This command was renamed to pg_resetwal, see pg_resetwal for documentation of pg_resetwal and see the release notes for PostgreSQL 10 for details on this change.

**Examples:**

Example 1 (unknown):
```unknown
pg_resetxlog
```

Example 2 (unknown):
```unknown
pg_resetwal
```

Example 3 (unknown):
```unknown
pg_resetxlog
```

Example 4 (unknown):
```unknown
pg_resetwal
```

---


---

## O.3. pg_xlogdump renamed to pg_waldump #


**URL:** https://www.postgresql.org/docs/18/pgxlogdump.html

**Contents:**
- O.3. pg_xlogdump renamed to pg_waldump #

PostgreSQL 9.6 and below provided a command named pg_xlogdump to read write-ahead-log (WAL) files. This command was renamed to pg_waldump, see pg_waldump for documentation of pg_waldump and see the release notes for PostgreSQL 10 for details on this change.

**Examples:**

Example 1 (unknown):
```unknown
pg_xlogdump
```

Example 2 (unknown):
```unknown
pg_xlogdump
```

Example 3 (unknown):
```unknown
pg_xlogdump
```

Example 4 (unknown):
```unknown
pg_resetxlog
```

---


---

## O.5. pg_receivexlog renamed to pg_receivewal #


**URL:** https://www.postgresql.org/docs/18/app-pgreceivexlog.html

**Contents:**
- O.5. pg_receivexlog renamed to pg_receivewal #

PostgreSQL 9.6 and below provided a command named pg_receivexlog to fetch write-ahead-log (WAL) files. This command was renamed to pg_receivewal, see pg_receivewal for documentation of pg_receivewal and see the release notes for PostgreSQL 10 for details on this change.

**Examples:**

Example 1 (unknown):
```unknown
pg_receivexlog
```

Example 2 (unknown):
```unknown
pg_receivewal
```

Example 3 (unknown):
```unknown
pg_receivexlog
```

Example 4 (unknown):
```unknown
pg_receivewal
```

---


---

## O.2. Default Roles Renamed to Predefined Roles #


**URL:** https://www.postgresql.org/docs/18/default-roles.html

**Contents:**
- O.2. Default Roles Renamed to Predefined Roles #

PostgreSQL 13 and below used the term “Default Roles”. However, as these roles are not able to actually be changed and are installed as part of the system at initialization time, the more appropriate term to use is “Predefined Roles”. See Section 21.5 for current documentation regarding Predefined Roles, and the release notes for PostgreSQL 14 for details on this change.

**Examples:**

Example 1 (unknown):
```unknown
recovery.conf
```

Example 2 (unknown):
```unknown
postgresql.conf
```

Example 3 (unknown):
```unknown
pg_xlogdump
```

---


---

