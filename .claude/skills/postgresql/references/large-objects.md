# PostgreSQL - Large Objects

## 33.4. Server-Side Functions #


**URL:** https://www.postgresql.org/docs/18/lo-funcs.html

**Contents:**
- 33.4. Server-Side Functions #
  - Caution

Server-side functions tailored for manipulating large objects from SQL are listed in Table 33.1.

Table 33.1. SQL-Oriented Large Object Functions

lo_from_bytea ( loid oid, data bytea ) → oid

Creates a large object and stores data in it. If loid is zero then the system will choose a free OID, otherwise that OID is used (with an error if some large object already has that OID). On success, the large object's OID is returned.

lo_from_bytea(0, '\xffffff00') → 24528

lo_put ( loid oid, offset bigint, data bytea ) → void

Writes data starting at the given offset within the large object; the large object is enlarged if necessary.

lo_put(24528, 1, '\xaa') →

lo_get ( loid oid [, offset bigint, length integer ] ) → bytea

Extracts the large object's contents, or a substring thereof.

lo_get(24528, 0, 3) → \xffaaff

There are additional server-side functions corresponding to each of the client-side functions described earlier; indeed, for the most part the client-side functions are simply interfaces to the equivalent server-side functions. The ones just as convenient to call via SQL commands are lo_creat, lo_create, lo_unlink, lo_import, and lo_export. Here are examples of their use:

The server-side lo_import and lo_export functions behave considerably differently from their client-side analogs. These two functions read and write files in the server's file system, using the permissions of the database's owning user. Therefore, by default their use is restricted to superusers. In contrast, the client-side import and export functions read and write files in the client's file system, using the permissions of the client program. The client-side functions do not require any database privileges, except the privilege to read or write the large object in question.

It is possible to GRANT use of the server-side lo_import and lo_export functions to non-superusers, but careful consideration of the security implications is required. A malicious user of such privileges could easily parlay them into becoming superuser (for example by rewriting server configuration files), or could attack the rest of the server's file system without bothering to obtain database superuser privileges as such. Access to roles having such privilege must therefore be guarded just as carefully as access to superuser roles. Nonetheless, if use of server-side lo_import or lo_export is needed for some routine task, it's safer to use a role with such privileges than one with full superuser privileges, as that helps to reduce the risk of damage from accidental errors.

The functionality of lo_read and lo_write is also available via server-side calls, but the names of the server-side functions differ from the client side interfaces in that they do not contain underscores. You must call these functions as loread and lowrite.

**Examples:**

Example 1 (unknown):
```unknown
lo_from_bytea
```

Example 2 (unknown):
```unknown
lo_from_bytea(0, '\xffffff00')
```

Example 3 (unknown):
```unknown
lo_put(24528, 1, '\xaa')
```

Example 4 (unknown):
```unknown
lo_get(24528, 0, 3)
```

---


---

## Chapter 33. Large Objects


**URL:** https://www.postgresql.org/docs/18/largeobjects.html

**Contents:**
- Chapter 33. Large Objects

PostgreSQL has a large object facility, which provides stream-style access to user data that is stored in a special large-object structure. Streaming access is useful when working with data values that are too large to manipulate conveniently as a whole.

This chapter describes the implementation and the programming and query language interfaces to PostgreSQL large object data. We use the libpq C library for the examples in this chapter, but most programming interfaces native to PostgreSQL support equivalent functionality. Other interfaces might use the large object interface internally to provide generic support for large values. This is not described here.

---


---

## 33.2. Implementation Features #


**URL:** https://www.postgresql.org/docs/18/lo-implementation.html

**Contents:**
- 33.2. Implementation Features #

The large object implementation breaks large objects up into “chunks” and stores the chunks in rows in the database. A B-tree index guarantees fast searches for the correct chunk number when doing random access reads and writes.

The chunks stored for a large object do not have to be contiguous. For example, if an application opens a new large object, seeks to offset 1000000, and writes a few bytes there, this does not result in allocation of 1000000 bytes worth of storage; only of chunks covering the range of data bytes actually written. A read operation will, however, read out zeroes for any unallocated locations preceding the last existing chunk. This corresponds to the common behavior of “sparsely allocated” files in Unix file systems.

As of PostgreSQL 9.0, large objects have an owner and a set of access permissions, which can be managed using GRANT and REVOKE. SELECT privileges are required to read a large object, and UPDATE privileges are required to write or truncate it. Only the large object's owner (or a database superuser) can delete, comment on, or change the owner of a large object. To adjust this behavior for compatibility with prior releases, see the lo_compat_privileges run-time parameter.

---


---

