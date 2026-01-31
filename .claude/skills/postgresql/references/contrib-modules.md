# PostgreSQL - Contrib Modules

## F.14. earthdistance — calculate great-circle distances #


**URL:** https://www.postgresql.org/docs/18/earthdistance.html

**Contents:**
- F.14. earthdistance — calculate great-circle distances #
  - Caution
  - F.14.1. Cube-Based Earth Distances #
  - F.14.2. Point-Based Earth Distances #

The earthdistance module provides two different approaches to calculating great circle distances on the surface of the Earth. The one described first depends on the cube module. The second one is based on the built-in point data type, using longitude and latitude for the coordinates.

In this module, the Earth is assumed to be perfectly spherical. (If that's too inaccurate for you, you might want to look at the PostGIS project.)

The cube module must be installed before earthdistance can be installed (although you can use the CASCADE option of CREATE EXTENSION to install both in one command).

It is strongly recommended that earthdistance and cube be installed in the same schema, and that that schema be one for which CREATE privilege has not been and will not be granted to any untrusted users. Otherwise there are installation-time security hazards if earthdistance's schema contains objects defined by a hostile user. Furthermore, when using earthdistance's functions after installation, the entire search path should contain only trusted schemas.

Data is stored in cubes that are points (both corners are the same) using 3 coordinates representing the x, y, and z distance from the center of the Earth. A domain earth over type cube is provided, which includes constraint checks that the value meets these restrictions and is reasonably close to the actual surface of the Earth.

The radius of the Earth is obtained from the earth() function. It is given in meters. But by changing this one function you can change the module to use some other units, or to use a different value of the radius that you feel is more appropriate.

This package has applications to astronomical databases as well. Astronomers will probably want to change earth() to return a radius of 180/pi() so that distances are in degrees.

Functions are provided to support input in latitude and longitude (in degrees), to support output of latitude and longitude, to calculate the great circle distance between two points and to easily specify a bounding box usable for index searches.

The provided functions are shown in Table F.4.

Table F.4. Cube-Based Earthdistance Functions

Returns the assumed radius of the Earth.

sec_to_gc ( float8 ) → float8

Converts the normal straight line (secant) distance between two points on the surface of the Earth to the great circle distance between them.

gc_to_sec ( float8 ) → float8

Converts the great circle distance between two points on the surface of the Earth to the normal straight line (secant) distance between them.

ll_to_earth ( float8, float8 ) → earth

Returns the location of a point on the surface of the Earth given its latitude (argument 1) and longitude (argument 2) in degrees.

latitude ( earth ) → float8

Returns the latitude in degrees of a point on the surface of the Earth.

longitude ( earth ) → float8

Returns the longitude in degrees of a point on the surface of the Earth.

earth_distance ( earth, earth ) → float8

Returns the great circle distance between two points on the surface of the Earth.

earth_box ( earth, float8 ) → cube

Returns a box suitable for an indexed search using the cube @> operator for points within a given great circle distance of a location. Some points in this box are further than the specified great circle distance from the location, so a second check using earth_distance should be included in the query.

The second part of the module relies on representing Earth locations as values of type point, in which the first component is taken to represent longitude in degrees, and the second component is taken to represent latitude in degrees. Points are taken as (longitude, latitude) and not vice versa because longitude is closer to the intuitive idea of x-axis and latitude to y-axis.

A single operator is provided, shown in Table F.5.

Table F.5. Point-Based Earthdistance Operators

point <@> point → float8

Computes the distance in statute miles between two points on the Earth's surface.

Note that unlike the cube-based part of the module, units are hardwired here: changing the earth() function will not affect the results of this operator.

One disadvantage of the longitude/latitude representation is that you need to be careful about the edge conditions near the poles and near +/- 180 degrees of longitude. The cube-based representation avoids these discontinuities.

**Examples:**

Example 1 (unknown):
```unknown
earthdistance
```

Example 2 (unknown):
```unknown
earthdistance
```

Example 3 (unknown):
```unknown
CREATE EXTENSION
```

Example 4 (unknown):
```unknown
earthdistance
```

---


---

## F.47. tsm_system_time — the SYSTEM_TIME sampling method for TABLESAMPLE #


**URL:** https://www.postgresql.org/docs/18/tsm-system-time.html

**Contents:**
- F.47. tsm_system_time — the SYSTEM_TIME sampling method for TABLESAMPLE #
  - F.47.1. Examples #

The tsm_system_time module provides the table sampling method SYSTEM_TIME, which can be used in the TABLESAMPLE clause of a SELECT command.

This table sampling method accepts a single floating-point argument that is the maximum number of milliseconds to spend reading the table. This gives you direct control over how long the query takes, at the price that the size of the sample becomes hard to predict. The resulting sample will contain as many rows as could be read in the specified time, unless the whole table has been read first.

Like the built-in SYSTEM sampling method, SYSTEM_TIME performs block-level sampling, so that the sample is not completely random but may be subject to clustering effects, especially if only a small number of rows are selected.

SYSTEM_TIME does not support the REPEATABLE clause.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Here is an example of selecting a sample of a table with SYSTEM_TIME. First install the extension:

Then you can use it in a SELECT command, for instance:

This command will return as large a sample of my_table as it can read in 1 second (1000 milliseconds). Of course, if the whole table can be read in under 1 second, all its rows will be returned.

**Examples:**

Example 1 (unknown):
```unknown
SYSTEM_TIME
```

Example 2 (unknown):
```unknown
TABLESAMPLE
```

Example 3 (unknown):
```unknown
SYSTEM_TIME
```

Example 4 (unknown):
```unknown
TABLESAMPLE
```

---


---

## F.7. btree_gin — GIN operator classes with B-tree behavior #


**URL:** https://www.postgresql.org/docs/18/btree-gin.html

**Contents:**
- F.7. btree_gin — GIN operator classes with B-tree behavior #
  - F.7.1. Example Usage #
  - F.7.2. Authors #

btree_gin provides GIN operator classes that implement B-tree equivalent behavior for the data types int2, int4, int8, float4, float8, timestamp with time zone, timestamp without time zone, time with time zone, time without time zone, date, interval, oid, money, "char", varchar, text, bytea, bit, varbit, macaddr, macaddr8, inet, cidr, uuid, name, bool, bpchar, and all enum types.

In general, these operator classes will not outperform the equivalent standard B-tree index methods, and they lack one major feature of the standard B-tree code: the ability to enforce uniqueness. However, they are useful for GIN testing and as a base for developing other GIN operator classes. Also, for queries that test both a GIN-indexable column and a B-tree-indexable column, it might be more efficient to create a multicolumn GIN index that uses one of these operator classes than to create two separate indexes that would have to be combined via bitmap ANDing.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Teodor Sigaev (<teodor@stack.net>) and Oleg Bartunov (<oleg@sai.msu.su>). See http://www.sai.msu.su/~megera/oddmuse/index.cgi/Gin for additional information.

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

## F.30. pg_prewarm — preload relation data into buffer caches #


**URL:** https://www.postgresql.org/docs/18/pgprewarm.html

**Contents:**
- F.30. pg_prewarm — preload relation data into buffer caches #
  - F.30.1. Functions #
  - F.30.2. Configuration Parameters #
  - F.30.3. Author #

The pg_prewarm module provides a convenient way to load relation data into either the operating system buffer cache or the PostgreSQL buffer cache. Prewarming can be performed manually using the pg_prewarm function, or can be performed automatically by including pg_prewarm in shared_preload_libraries. In the latter case, the system will run a background worker which periodically records the contents of shared buffers in a file called autoprewarm.blocks and will, using 2 background workers, reload those same blocks after a restart.

The first argument is the relation to be prewarmed. The second argument is the prewarming method to be used, as further discussed below; the third is the relation fork to be prewarmed, usually main. The fourth argument is the first block number to prewarm (NULL is accepted as a synonym for zero). The fifth argument is the last block number to prewarm (NULL means prewarm through the last block in the relation). The return value is the number of blocks prewarmed.

There are three available prewarming methods. prefetch issues asynchronous prefetch requests to the operating system, if this is supported, or throws an error otherwise. read reads the requested range of blocks; unlike prefetch, this is synchronous and supported on all platforms and builds, but may be slower. buffer reads the requested range of blocks into the database buffer cache.

Note that with any of these methods, attempting to prewarm more blocks than can be cached — by the OS when using prefetch or read, or by PostgreSQL when using buffer — will likely result in lower-numbered blocks being evicted as higher numbered blocks are read in. Prewarmed data also enjoys no special protection from cache evictions, so it is possible that other system activity may evict the newly prewarmed blocks shortly after they are read; conversely, prewarming may also evict other data from cache. For these reasons, prewarming is typically most useful at startup, when caches are largely empty.

Launch the main autoprewarm worker. This will normally happen automatically, but is useful if automatic prewarm was not configured at server startup time and you wish to start up the worker at a later time.

Update autoprewarm.blocks immediately. This may be useful if the autoprewarm worker is not running but you anticipate running it after the next restart. The return value is the number of records written to autoprewarm.blocks.

Controls whether the server should run the autoprewarm worker. This is on by default. This parameter can only be set at server start.

This is the interval between updates to autoprewarm.blocks. The default is 300 seconds. If set to 0, the file will not be dumped at regular intervals, but only when the server is shut down.

These parameters must be set in postgresql.conf. Typical usage might be:

Robert Haas <rhaas@postgresql.org>

**Examples:**

Example 1 (unknown):
```unknown
autoprewarm.blocks
```

Example 2 (unknown):
```unknown
autoprewarm.blocks
```

Example 3 (unknown):
```unknown
autoprewarm.blocks
```

Example 4 (unknown):
```unknown
pg_prewarm.autoprewarm
```

---


---

## Appendix F. Additional Supplied Modules and Extensions


**URL:** https://www.postgresql.org/docs/18/contrib.html

**Contents:**
- Appendix F. Additional Supplied Modules and Extensions

This appendix and the next one contain information on the optional components found in the contrib directory of the PostgreSQL distribution. These include porting tools, analysis utilities, and plug-in features that are not part of the core PostgreSQL system. They are separate mainly because they address a limited audience or are too experimental to be part of the main source tree. This does not preclude their usefulness.

This appendix covers extensions and other server plug-in module libraries found in contrib. Appendix G covers utility programs.

When building from the source distribution, these optional components are not built automatically, unless you build the "world" target (see Step 2). You can build and install all of them by running:

in the contrib directory of a configured source tree; or to build and install just one selected module, do the same in that module's subdirectory. Many of the modules have regression tests, which can be executed by running:

before installation or

once you have a PostgreSQL server running.

If you are using a pre-packaged version of PostgreSQL, these components are typically made available as a separate subpackage, such as postgresql-contrib.

Many components supply new user-defined functions, operators, or types, packaged as extensions. To make use of one of these extensions, after you have installed the code you need to register the new SQL objects in the database system. This is done by executing a CREATE EXTENSION command. In a fresh database, you can simply do

This command registers the new SQL objects in the current database only, so you need to run it in every database in which you want the extension's facilities to be available. Alternatively, run it in database template1 so that the extension will be copied into subsequently-created databases by default.

For all extensions, the CREATE EXTENSION command must be run by a database superuser, unless the extension is considered “trusted”. Trusted extensions can be run by any user who has CREATE privilege on the current database. Extensions that are trusted are identified as such in the sections that follow. Generally, trusted extensions are ones that cannot provide access to outside-the-database functionality.

The following extensions are trusted in a default installation:

Many extensions allow you to install their objects in a schema of your choice. To do that, add SCHEMA schema_name to the CREATE EXTENSION command. By default, the objects will be placed in your current creation target schema, which in turn defaults to public.

Note, however, that some of these components are not “extensions” in this sense, but are loaded into the server in some other way, for instance by way of shared_preload_libraries. See the documentation of each component for details.

**Examples:**

Example 1 (unknown):
```unknown
heapallindexed
```

Example 2 (unknown):
```unknown
pg_buffercache
```

Example 3 (unknown):
```unknown
pg_buffercache_numa
```

Example 4 (unknown):
```unknown
pg_buffercache_summary()
```

---


---

