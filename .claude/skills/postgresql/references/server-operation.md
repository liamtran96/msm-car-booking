# PostgreSQL - Server Operation

## 18.1. The PostgreSQL User Account #


**URL:** https://www.postgresql.org/docs/18/postgres-user.html

**Contents:**
- 18.1. The PostgreSQL User Account #

As with any server daemon that is accessible to the outside world, it is advisable to run PostgreSQL under a separate user account. This user account should only own the data that is managed by the server, and should not be shared with other daemons. (For example, using the user nobody is a bad idea.) In particular, it is advisable that this user account not own the PostgreSQL executable files, to ensure that a compromised server process could not modify those executables.

Pre-packaged versions of PostgreSQL will typically create a suitable user account automatically during package installation.

To add a Unix user account to your system, look for a command useradd or adduser. The user name postgres is often used, and is assumed throughout this book, but you can use another name if you like.

---


---

## 18.6. Upgrading a PostgreSQL Cluster #


**URL:** https://www.postgresql.org/docs/18/upgrading.html

**Contents:**
- 18.6. Upgrading a PostgreSQL Cluster #
  - 18.6.1. Upgrading Data via pg_dumpall #
  - 18.6.2. Upgrading Data via pg_upgrade #
  - 18.6.3. Upgrading Data via Replication #

This section discusses how to upgrade your database data from one PostgreSQL release to a newer one.

Current PostgreSQL version numbers consist of a major and a minor version number. For example, in the version number 10.1, the 10 is the major version number and the 1 is the minor version number, meaning this would be the first minor release of the major release 10. For releases before PostgreSQL version 10.0, version numbers consist of three numbers, for example, 9.5.3. In those cases, the major version consists of the first two digit groups of the version number, e.g., 9.5, and the minor version is the third number, e.g., 3, meaning this would be the third minor release of the major release 9.5.

Minor releases never change the internal storage format and are always compatible with earlier and later minor releases of the same major version number. For example, version 10.1 is compatible with version 10.0 and version 10.6. Similarly, for example, 9.5.3 is compatible with 9.5.0, 9.5.1, and 9.5.6. To update between compatible versions, you simply replace the executables while the server is down and restart the server. The data directory remains unchanged — minor upgrades are that simple.

For major releases of PostgreSQL, the internal data storage format is subject to change, thus complicating upgrades. The traditional method for moving data to a new major version is to dump and restore the database, though this can be slow. A faster method is pg_upgrade. Replication methods are also available, as discussed below. (If you are using a pre-packaged version of PostgreSQL, it may provide scripts to assist with major version upgrades. Consult the package-level documentation for details.)

New major versions also typically introduce some user-visible incompatibilities, so application programming changes might be required. All user-visible changes are listed in the release notes (Appendix E); pay particular attention to the section labeled "Migration". Though you can upgrade from one major version to another without upgrading to intervening versions, you should read the major release notes of all intervening versions.

Cautious users will want to test their client applications on the new version before switching over fully; therefore, it's often a good idea to set up concurrent installations of old and new versions. When testing a PostgreSQL major upgrade, consider the following categories of possible changes:

The capabilities available for administrators to monitor and control the server often change and improve in each major release.

Typically this includes new SQL command capabilities and not changes in behavior, unless specifically mentioned in the release notes.

Typically libraries like libpq only add new functionality, again unless mentioned in the release notes.

System catalog changes usually only affect database management tools.

This involves changes in the backend function API, which is written in the C programming language. Such changes affect code that references backend functions deep inside the server.

One upgrade method is to dump data from one major version of PostgreSQL and restore it in another — to do this, you must use a logical backup tool like pg_dumpall; file system level backup methods will not work. (There are checks in place that prevent you from using a data directory with an incompatible version of PostgreSQL, so no great harm can be done by trying to start the wrong server version on a data directory.)

It is recommended that you use the pg_dump and pg_dumpall programs from the newer version of PostgreSQL, to take advantage of enhancements that might have been made in these programs. Current releases of the dump programs can read data from any server version back to 9.2.

These instructions assume that your existing installation is under the /usr/local/pgsql directory, and that the data area is in /usr/local/pgsql/data. Substitute your paths appropriately.

If making a backup, make sure that your database is not being updated. This does not affect the integrity of the backup, but the changed data would of course not be included. If necessary, edit the permissions in the file /usr/local/pgsql/data/pg_hba.conf (or equivalent) to disallow access from everyone except you. See Chapter 20 for additional information on access control.

To back up your database installation, type:

To make the backup, you can use the pg_dumpall command from the version you are currently running; see Section 25.1.2 for more details. For best results, however, try to use the pg_dumpall command from PostgreSQL 18.1, since this version contains bug fixes and improvements over older versions. While this advice might seem idiosyncratic since you haven't installed the new version yet, it is advisable to follow it if you plan to install the new version in parallel with the old version. In that case you can complete the installation normally and transfer the data later. This will also decrease the downtime.

Shut down the old server:

On systems that have PostgreSQL started at boot time, there is probably a start-up file that will accomplish the same thing. For example, on a Red Hat Linux system one might find that this works:

See Chapter 18 for details about starting and stopping the server.

If restoring from backup, rename or delete the old installation directory if it is not version-specific. It is a good idea to rename the directory, rather than delete it, in case you have trouble and need to revert to it. Keep in mind the directory might consume significant disk space. To rename the directory, use a command like this:

(Be sure to move the directory as a single unit so relative paths remain unchanged.)

Install the new version of PostgreSQL as outlined in Chapter 17.

Create a new database cluster if needed. Remember that you must execute these commands while logged in to the special database user account (which you already have if you are upgrading).

Restore your previous pg_hba.conf and any postgresql.conf modifications.

Start the database server, again using the special database user account:

Finally, restore your data from backup with:

The least downtime can be achieved by installing the new server in a different directory and running both the old and the new servers in parallel, on different ports. Then you can use something like:

to transfer your data.

The pg_upgrade module allows an installation to be migrated in-place from one major PostgreSQL version to another. Upgrades can be performed in minutes, particularly with --link mode. It requires steps similar to pg_dumpall above, e.g., starting/stopping the server, running initdb. The pg_upgrade documentation outlines the necessary steps.

It is also possible to use logical replication methods to create a standby server with the updated version of PostgreSQL. This is possible because logical replication supports replication between different major versions of PostgreSQL. The standby can be on the same computer or a different computer. Once it has synced up with the primary server (running the older version of PostgreSQL), you can switch primaries and make the standby the primary and shut down the older database instance. Such a switch-over results in only several seconds of downtime for an upgrade.

This method of upgrading can be performed using the built-in logical replication facilities as well as using external logical replication systems such as pglogical, Slony, Londiste, and Bucardo.

**Examples:**

Example 1 (unknown):
```unknown
/usr/local/pgsql
```

Example 2 (unknown):
```unknown
/usr/local/pgsql/data
```

Example 3 (unknown):
```unknown
/usr/local/pgsql/data/pg_hba.conf
```

Example 4 (unknown):
```unknown
pg_dumpall > outputfile
```

---


---

## 18.12. Registering Event Log on Windows #


**URL:** https://www.postgresql.org/docs/18/event-log-registration.html

**Contents:**
- 18.12. Registering Event Log on Windows #
  - Note

To register a Windows event log library with the operating system, issue this command:

This creates registry entries used by the event viewer, under the default event source named PostgreSQL.

To specify a different event source name (see event_source), use the /n and /i options:

To unregister the event log library from the operating system, issue this command:

To enable event logging in the database server, modify log_destination to include eventlog in postgresql.conf.

**Examples:**

Example 1 (unknown):
```unknown
regsvr32 pgsql_library_directory/pgevent.dll
```

Example 2 (unknown):
```unknown
regsvr32 pgsql_library_directory/pgevent.dll
```

Example 3 (unknown):
```unknown
pgsql_library_directory
```

Example 4 (unknown):
```unknown
regsvr32 /n /i:event_source_name pgsql_library_directory/pgevent.dll
```

---


---

## 18.7. Preventing Server Spoofing #


**URL:** https://www.postgresql.org/docs/18/preventing-server-spoofing.html

**Contents:**
- 18.7. Preventing Server Spoofing #

While the server is running, it is not possible for a malicious user to take the place of the normal database server. However, when the server is down, it is possible for a local user to spoof the normal server by starting their own server. The spoof server could read passwords and queries sent by clients, but could not return any data because the PGDATA directory would still be secure because of directory permissions. Spoofing is possible because any user can start a database server; a client cannot identify an invalid server unless it is specially configured.

One way to prevent spoofing of local connections is to use a Unix domain socket directory (unix_socket_directories) that has write permission only for a trusted local user. This prevents a malicious user from creating their own socket file in that directory. If you are concerned that some applications might still reference /tmp for the socket file and hence be vulnerable to spoofing, during operating system startup create a symbolic link /tmp/.s.PGSQL.5432 that points to the relocated socket file. You also might need to modify your /tmp cleanup script to prevent removal of the symbolic link.

Another option for local connections is for clients to use requirepeer to specify the required owner of the server process connected to the socket.

To prevent spoofing on TCP connections, either use SSL certificates and make sure that clients check the server's certificate, or use GSSAPI encryption (or both, if they're on separate connections).

To prevent spoofing with SSL, the server must be configured to accept only hostssl connections (Section 20.1) and have SSL key and certificate files (Section 18.9). The TCP client must connect using sslmode=verify-ca or verify-full and have the appropriate root certificate file installed (Section 32.19.1). Alternatively the system CA pool, as defined by the SSL implementation, can be used using sslrootcert=system; in this case, sslmode=verify-full is forced for safety, since it is generally trivial to obtain certificates which are signed by a public CA.

To prevent server spoofing from occurring when using scram-sha-256 password authentication over a network, you should ensure that you connect to the server using SSL and with one of the anti-spoofing methods described in the previous paragraph. Additionally, the SCRAM implementation in libpq cannot protect the entire authentication exchange, but using the channel_binding=require connection parameter provides a mitigation against server spoofing. An attacker that uses a rogue server to intercept a SCRAM exchange can use offline analysis to potentially determine the hashed password from the client.

To prevent spoofing with GSSAPI, the server must be configured to accept only hostgssenc connections (Section 20.1) and use gss authentication with them. The TCP client must connect using gssencmode=require.

**Examples:**

Example 1 (unknown):
```unknown
/tmp/.s.PGSQL.5432
```

Example 2 (unknown):
```unknown
requirepeer
```

Example 3 (unknown):
```unknown
sslmode=verify-ca
```

Example 4 (unknown):
```unknown
verify-full
```

---


---

## 18.11. Secure TCP/IP Connections with SSH Tunnels #


**URL:** https://www.postgresql.org/docs/18/ssh-tunnels.html

**Contents:**
- 18.11. Secure TCP/IP Connections with SSH Tunnels #
  - Tip

It is possible to use SSH to encrypt the network connection between clients and a PostgreSQL server. Done properly, this provides an adequately secure network connection, even for non-SSL-capable clients.

First make sure that an SSH server is running properly on the same machine as the PostgreSQL server and that you can log in using ssh as some user; you then can establish a secure tunnel to the remote server. A secure tunnel listens on a local port and forwards all traffic to a port on the remote machine. Traffic sent to the remote port can arrive on its localhost address, or different bind address if desired; it does not appear as coming from your local machine. This command creates a secure tunnel from the client machine to the remote machine foo.com:

The first number in the -L argument, 63333, is the local port number of the tunnel; it can be any unused port. (IANA reserves ports 49152 through 65535 for private use.) The name or IP address after this is the remote bind address you are connecting to, i.e., localhost, which is the default. The second number, 5432, is the remote end of the tunnel, e.g., the port number your database server is using. In order to connect to the database server using this tunnel, you connect to port 63333 on the local machine:

To the database server it will then look as though you are user joe on host foo.com connecting to the localhost bind address, and it will use whatever authentication procedure was configured for connections by that user to that bind address. Note that the server will not think the connection is SSL-encrypted, since in fact it is not encrypted between the SSH server and the PostgreSQL server. This should not pose any extra security risk because they are on the same machine.

In order for the tunnel setup to succeed you must be allowed to connect via ssh as joe@foo.com, just as if you had attempted to use ssh to create a terminal session.

You could also have set up port forwarding as

but then the database server will see the connection as coming in on its foo.com bind address, which is not opened by the default setting listen_addresses = 'localhost'. This is usually not what you want.

If you have to “hop” to the database server via some login host, one possible setup could look like this:

Note that this way the connection from shell.foo.com to db.foo.com will not be encrypted by the SSH tunnel. SSH offers quite a few configuration possibilities when the network is restricted in various ways. Please refer to the SSH documentation for details.

Several other applications exist that can provide secure tunnels using a procedure similar in concept to the one just described.

**Examples:**

Example 1 (python):
```python
ssh -L 63333:localhost:5432 joe@foo.com
```

Example 2 (unknown):
```unknown
psql -h localhost -p 63333 postgres
```

Example 3 (python):
```python
joe@foo.com
```

Example 4 (python):
```python
ssh -L 63333:foo.com:5432 joe@foo.com
```

---


---

## 18.2. Creating a Database Cluster #


**URL:** https://www.postgresql.org/docs/18/creating-cluster.html

**Contents:**
- 18.2. Creating a Database Cluster #
  - Tip
  - 18.2.1. Use of Secondary File Systems #
  - 18.2.2. File Systems #
    - 18.2.2.1. NFS #

Before you can do anything, you must initialize a database storage area on disk. We call this a database cluster. (The SQL standard uses the term catalog cluster.) A database cluster is a collection of databases that is managed by a single instance of a running database server. After initialization, a database cluster will contain a database named postgres, which is meant as a default database for use by utilities, users and third party applications. The database server itself does not require the postgres database to exist, but many external utility programs assume it exists. There are two more databases created within each cluster during initialization, named template1 and template0. As the names suggest, these will be used as templates for subsequently-created databases; they should not be used for actual work. (See Chapter 22 for information about creating new databases within a cluster.)

In file system terms, a database cluster is a single directory under which all data will be stored. We call this the data directory or data area. It is completely up to you where you choose to store your data. There is no default, although locations such as /usr/local/pgsql/data or /var/lib/pgsql/data are popular. The data directory must be initialized before being used, using the program initdb which is installed with PostgreSQL.

If you are using a pre-packaged version of PostgreSQL, it may well have a specific convention for where to place the data directory, and it may also provide a script for creating the data directory. In that case you should use that script in preference to running initdb directly. Consult the package-level documentation for details.

To initialize a database cluster manually, run initdb and specify the desired file system location of the database cluster with the -D option, for example:

Note that you must execute this command while logged into the PostgreSQL user account, which is described in the previous section.

As an alternative to the -D option, you can set the environment variable PGDATA.

Alternatively, you can run initdb via the pg_ctl program like so:

This may be more intuitive if you are using pg_ctl for starting and stopping the server (see Section 18.3), so that pg_ctl would be the sole command you use for managing the database server instance.

initdb will attempt to create the directory you specify if it does not already exist. Of course, this will fail if initdb does not have permissions to write in the parent directory. It's generally recommendable that the PostgreSQL user own not just the data directory but its parent directory as well, so that this should not be a problem. If the desired parent directory doesn't exist either, you will need to create it first, using root privileges if the grandparent directory isn't writable. So the process might look like this:

initdb will refuse to run if the data directory exists and already contains files; this is to prevent accidentally overwriting an existing installation.

Because the data directory contains all the data stored in the database, it is essential that it be secured from unauthorized access. initdb therefore revokes access permissions from everyone but the PostgreSQL user, and optionally, group. Group access, when enabled, is read-only. This allows an unprivileged user in the same group as the cluster owner to take a backup of the cluster data or perform other operations that only require read access.

Note that enabling or disabling group access on an existing cluster requires the cluster to be shut down and the appropriate mode to be set on all directories and files before restarting PostgreSQL. Otherwise, a mix of modes might exist in the data directory. For clusters that allow access only by the owner, the appropriate modes are 0700 for directories and 0600 for files. For clusters that also allow reads by the group, the appropriate modes are 0750 for directories and 0640 for files.

However, while the directory contents are secure, the default client authentication setup allows any local user to connect to the database and even become the database superuser. If you do not trust other local users, we recommend you use one of initdb's -W, --pwprompt or --pwfile options to assign a password to the database superuser. Also, specify -A scram-sha-256 so that the default trust authentication mode is not used; or modify the generated pg_hba.conf file after running initdb, but before you start the server for the first time. (Other reasonable approaches include using peer authentication or file system permissions to restrict connections. See Chapter 20 for more information.)

initdb also initializes the default locale for the database cluster. Normally, it will just take the locale settings in the environment and apply them to the initialized database. It is possible to specify a different locale for the database; more information about that can be found in Section 23.1. The default sort order used within the particular database cluster is set by initdb, and while you can create new databases using different sort order, the order used in the template databases that initdb creates cannot be changed without dropping and recreating them. There is also a performance impact for using locales other than C or POSIX. Therefore, it is important to make this choice correctly the first time.

initdb also sets the default character set encoding for the database cluster. Normally this should be chosen to match the locale setting. For details see Section 23.3.

Non-C and non-POSIX locales rely on the operating system's collation library for character set ordering. This controls the ordering of keys stored in indexes. For this reason, a cluster cannot switch to an incompatible collation library version, either through snapshot restore, binary streaming replication, a different operating system, or an operating system upgrade.

Many installations create their database clusters on file systems (volumes) other than the machine's “root” volume. If you choose to do this, it is not advisable to try to use the secondary volume's topmost directory (mount point) as the data directory. Best practice is to create a directory within the mount-point directory that is owned by the PostgreSQL user, and then create the data directory within that. This avoids permissions problems, particularly for operations such as pg_upgrade, and it also ensures clean failures if the secondary volume is taken offline.

Generally, any file system with POSIX semantics can be used for PostgreSQL. Users prefer different file systems for a variety of reasons, including vendor support, performance, and familiarity. Experience suggests that, all other things being equal, one should not expect major performance or behavior changes merely from switching file systems or making minor file system configuration changes.

It is possible to use an NFS file system for storing the PostgreSQL data directory. PostgreSQL does nothing special for NFS file systems, meaning it assumes NFS behaves exactly like locally-connected drives. PostgreSQL does not use any functionality that is known to have nonstandard behavior on NFS, such as file locking.

The only firm requirement for using NFS with PostgreSQL is that the file system is mounted using the hard option. With the hard option, processes can “hang” indefinitely if there are network problems, so this configuration will require a careful monitoring setup. The soft option will interrupt system calls in case of network problems, but PostgreSQL will not repeat system calls interrupted in this way, so any such interruption will result in an I/O error being reported.

It is not necessary to use the sync mount option. The behavior of the async option is sufficient, since PostgreSQL issues fsync calls at appropriate times to flush the write caches. (This is analogous to how it works on a local file system.) However, it is strongly recommended to use the sync export option on the NFS server on systems where it exists (mainly Linux). Otherwise, an fsync or equivalent on the NFS client is not actually guaranteed to reach permanent storage on the server, which could cause corruption similar to running with the parameter fsync off. The defaults of these mount and export options differ between vendors and versions, so it is recommended to check and perhaps specify them explicitly in any case to avoid any ambiguity.

In some cases, an external storage product can be accessed either via NFS or a lower-level protocol such as iSCSI. In the latter case, the storage appears as a block device and any available file system can be created on it. That approach might relieve the DBA from having to deal with some of the idiosyncrasies of NFS, but of course the complexity of managing remote storage then happens at other levels.

**Examples:**

Example 1 (unknown):
```unknown
/usr/local/pgsql/data
```

Example 2 (unknown):
```unknown
/var/lib/pgsql/data
```

Example 3 (unknown):
```unknown
$ initdb -D /usr/local/pgsql/data
```

Example 4 (unknown):
```unknown
initdb -D /usr/local/pgsql/data
```

---


---

