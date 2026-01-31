# PostgreSQL - System Views (Part 2)

## 53.24. pg_sequences #


**URL:** https://www.postgresql.org/docs/18/view-pg-sequences.html

**Contents:**
- 53.24. pg_sequences #

The view pg_sequences provides access to useful information about each sequence in the database.

Table 53.24. pg_sequences Columns

schemaname name (references pg_namespace.nspname)

Name of schema containing sequence

sequencename name (references pg_class.relname)

sequenceowner name (references pg_authid.rolname)

Name of sequence's owner

data_type regtype (references pg_type.oid)

Data type of the sequence

Start value of the sequence

Minimum value of the sequence

Maximum value of the sequence

Increment value of the sequence

Whether the sequence cycles

Cache size of the sequence

The last sequence value written to disk. If caching is used, this value can be greater than the last value handed out from the sequence.

The last_value column will read as null if any of the following are true:

The sequence has not been read from yet.

The current user does not have USAGE or SELECT privilege on the sequence.

The sequence is unlogged and the server is a standby.

**Examples:**

Example 1 (unknown):
```unknown
pg_sequences
```

Example 2 (unknown):
```unknown
pg_sequences
```

Example 3 (unknown):
```unknown
pg_sequences
```

Example 4 (unknown):
```unknown
pg_sequences
```

---


---

## 53.33. pg_timezone_abbrevs #


**URL:** https://www.postgresql.org/docs/18/view-pg-timezone-abbrevs.html

**Contents:**
- 53.33. pg_timezone_abbrevs #

The view pg_timezone_abbrevs provides a list of time zone abbreviations that are currently recognized by the datetime input routines. The contents of this view change when the TimeZone or timezone_abbreviations run-time parameters are modified.

Table 53.33. pg_timezone_abbrevs Columns

Time zone abbreviation

Offset from UTC (positive means east of Greenwich)

True if this is a daylight-savings abbreviation

While most timezone abbreviations represent fixed offsets from UTC, there are some that have historically varied in value (see Section B.4 for more information). In such cases this view presents their current meaning.

**Examples:**

Example 1 (unknown):
```unknown
pg_timezone_abbrevs
```

Example 2 (unknown):
```unknown
pg_timezone_abbrevs
```

Example 3 (unknown):
```unknown
pg_timezone_abbrevs
```

Example 4 (unknown):
```unknown
pg_timezone_abbrevs
```

---


---

## 53.4. pg_available_extension_versions #


**URL:** https://www.postgresql.org/docs/18/view-pg-available-extension-versions.html

**Contents:**
- 53.4. pg_available_extension_versions #

The pg_available_extension_versions view lists the specific extension versions that are available for installation. See also the pg_extension catalog, which shows the extensions currently installed.

Table 53.4. pg_available_extension_versions Columns

True if this version of this extension is currently installed

True if only superusers are allowed to install this extension (but see trusted)

True if the extension can be installed by non-superusers with appropriate privileges

True if extension can be relocated to another schema

Name of the schema that the extension must be installed into, or NULL if partially or fully relocatable

Names of prerequisite extensions, or NULL if none

Comment string from the extension's control file

The pg_available_extension_versions view is read-only.

**Examples:**

Example 1 (unknown):
```unknown
pg_available_extension_versions
```

Example 2 (unknown):
```unknown
pg_available_extension_versions
```

Example 3 (unknown):
```unknown
pg_available_extension_versions
```

Example 4 (unknown):
```unknown
pg_extension
```

---


---

## 53.9. pg_group #


**URL:** https://www.postgresql.org/docs/18/view-pg-group.html

**Contents:**
- 53.9. pg_group #

The view pg_group exists for backwards compatibility: it emulates a catalog that existed in PostgreSQL before version 8.1. It shows the names and members of all roles that are marked as not rolcanlogin, which is an approximation to the set of roles that are being used as groups.

Table 53.9. pg_group Columns

groname name (references pg_authid.rolname)

grosysid oid (references pg_authid.oid)

grolist oid[] (references pg_authid.oid)

An array containing the IDs of the roles in this group

**Examples:**

Example 1 (unknown):
```unknown
rolcanlogin
```

Example 2 (unknown):
```unknown
pg_file_settings
```

Example 3 (unknown):
```unknown
pg_hba_file_rules
```

---


---

## 53.1. Overview #


**URL:** https://www.postgresql.org/docs/18/views-overview.html

**Contents:**
- 53.1. Overview #

Table 53.1 lists the system views. More detailed documentation of each catalog follows below. Except where noted, all the views described here are read-only.

Table 53.1. System Views

**Examples:**

Example 1 (unknown):
```unknown
pg_available_extensions
```

Example 2 (unknown):
```unknown
pg_available_extension_versions
```

Example 3 (unknown):
```unknown
pg_backend_memory_contexts
```

Example 4 (unknown):
```unknown
pg_file_settings
```

---


---

## 53.34. pg_timezone_names #


**URL:** https://www.postgresql.org/docs/18/view-pg-timezone-names.html

**Contents:**
- 53.34. pg_timezone_names #

The view pg_timezone_names provides a list of time zone names that are recognized by SET TIMEZONE, along with their associated abbreviations, UTC offsets, and daylight-savings status. (Technically, PostgreSQL does not use UTC because leap seconds are not handled.) Unlike the abbreviations shown in pg_timezone_abbrevs, many of these names imply a set of daylight-savings transition date rules. Therefore, the associated information changes across local DST boundaries. The displayed information is computed based on the current value of CURRENT_TIMESTAMP.

Table 53.34. pg_timezone_names Columns

Time zone abbreviation

Offset from UTC (positive means east of Greenwich)

True if currently observing daylight savings

**Examples:**

Example 1 (unknown):
```unknown
pg_timezone_names
```

Example 2 (unknown):
```unknown
pg_timezone_names
```

Example 3 (unknown):
```unknown
pg_timezone_names
```

Example 4 (unknown):
```unknown
SET TIMEZONE
```

---


---

## 53.28. pg_shmem_allocations_numa #


**URL:** https://www.postgresql.org/docs/18/view-pg-shmem-allocations-numa.html

**Contents:**
- 53.28. pg_shmem_allocations_numa #
  - Warning

The pg_shmem_allocations_numa shows how shared memory allocations in the server's main shared memory segment are distributed across NUMA nodes. This includes both memory allocated by PostgreSQL itself and memory allocated by extensions using the mechanisms detailed in Section 36.10.11. This view will output multiple rows for each of the shared memory segments provided that they are spread across multiple NUMA nodes. This view should not be queried by monitoring systems as it is very slow and may end up allocating shared memory in case it was not used earlier. Current limitation for this view is that won't show anonymous shared memory allocations.

Note that this view does not include memory allocated using the dynamic shared memory infrastructure.

When determining the NUMA node, the view touches all memory pages for the shared memory segment. This will force allocation of the shared memory, if it wasn't allocated already, and the memory may get allocated in a single NUMA node (depending on system configuration).

Table 53.28. pg_shmem_allocations_numa Columns

The name of the shared memory allocation.

Size of the allocation on this particular NUMA memory node in bytes

By default, the pg_shmem_allocations_numa view can be read only by superusers or roles with privileges of the pg_read_all_stats role.

**Examples:**

Example 1 (unknown):
```unknown
pg_shmem_allocations_numa
```

Example 2 (unknown):
```unknown
pg_shmem_allocations_numa
```

Example 3 (unknown):
```unknown
pg_shmem_allocations_numa
```

Example 4 (unknown):
```unknown
pg_shmem_allocations_numa
```

---


---

