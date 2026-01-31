# PostgreSQL - Server Operation (Part 3)

## 18.4. Managing Kernel Resources #


**URL:** https://www.postgresql.org/docs/18/kernel-resources.html

**Contents:**
- 18.4. Managing Kernel Resources #
  - 18.4.1. Shared Memory and Semaphores #
  - 18.4.2. systemd RemoveIPC #
  - Caution
  - 18.4.3. Resource Limits #
  - 18.4.4. Linux Memory Overcommit #
  - 18.4.5. Linux Huge Pages #

PostgreSQL can sometimes exhaust various operating system resource limits, especially when multiple copies of the server are running on the same system, or in very large installations. This section explains the kernel resources used by PostgreSQL and the steps you can take to resolve problems related to kernel resource consumption.

PostgreSQL requires the operating system to provide inter-process communication (IPC) features, specifically shared memory and semaphores. Unix-derived systems typically provide “System V” IPC, “POSIX” IPC, or both. Windows has its own implementation of these features and is not discussed here.

By default, PostgreSQL allocates a very small amount of System V shared memory, as well as a much larger amount of anonymous mmap shared memory. Alternatively, a single large System V shared memory region can be used (see shared_memory_type). In addition a significant number of semaphores, which can be either System V or POSIX style, are created at server startup. Currently, POSIX semaphores are used on Linux and FreeBSD systems while other platforms use System V semaphores.

System V IPC features are typically constrained by system-wide allocation limits. When PostgreSQL exceeds one of these limits, the server will refuse to start and should leave an instructive error message describing the problem and what to do about it. (See also Section 18.3.1.) The relevant kernel parameters are named consistently across different systems; Table 18.1 gives an overview. The methods to set them, however, vary. Suggestions for some platforms are given below.

Table 18.1. System V IPC Parameters

PostgreSQL requires a few bytes of System V shared memory (typically 48 bytes, on 64-bit platforms) for each copy of the server. On most modern operating systems, this amount can easily be allocated. However, if you are running many copies of the server or you explicitly configure the server to use large amounts of System V shared memory (see shared_memory_type and dynamic_shared_memory_type), it may be necessary to increase SHMALL, which is the total amount of System V shared memory system-wide. Note that SHMALL is measured in pages rather than bytes on many systems.

Less likely to cause problems is the minimum size for shared memory segments (SHMMIN), which should be at most approximately 32 bytes for PostgreSQL (it is usually just 1). The maximum number of segments system-wide (SHMMNI) or per-process (SHMSEG) are unlikely to cause a problem unless your system has them set to zero.

When using System V semaphores, PostgreSQL uses one semaphore per allowed connection (max_connections), allowed autovacuum worker process (autovacuum_worker_slots), allowed WAL sender process (max_wal_senders), allowed background process (max_worker_processes), etc., in sets of 16. The runtime-computed parameter num_os_semaphores reports the number of semaphores required. This parameter can be viewed before starting the server with a postgres command like:

Each set of 16 semaphores will also contain a 17th semaphore which contains a “magic number”, to detect collision with semaphore sets used by other applications. The maximum number of semaphores in the system is set by SEMMNS, which consequently must be at least as high as num_os_semaphores plus one extra for each set of 16 required semaphores (see the formula in Table 18.1). The parameter SEMMNI determines the limit on the number of semaphore sets that can exist on the system at one time. Hence this parameter must be at least ceil(num_os_semaphores / 16). Lowering the number of allowed connections is a temporary workaround for failures, which are usually confusingly worded “No space left on device”, from the function semget.

In some cases it might also be necessary to increase SEMMAP to be at least on the order of SEMMNS. If the system has this parameter (many do not), it defines the size of the semaphore resource map, in which each contiguous block of available semaphores needs an entry. When a semaphore set is freed it is either added to an existing entry that is adjacent to the freed block or it is registered under a new map entry. If the map is full, the freed semaphores get lost (until reboot). Fragmentation of the semaphore space could over time lead to fewer available semaphores than there should be.

Various other settings related to “semaphore undo”, such as SEMMNU and SEMUME, do not affect PostgreSQL.

When using POSIX semaphores, the number of semaphores needed is the same as for System V, that is one semaphore per allowed connection (max_connections), allowed autovacuum worker process (autovacuum_worker_slots), allowed WAL sender process (max_wal_senders), allowed background process (max_worker_processes), etc. On the platforms where this option is preferred, there is no specific kernel limit on the number of POSIX semaphores.

The default shared memory settings are usually good enough, unless you have set shared_memory_type to sysv. System V semaphores are not used on this platform.

The default IPC settings can be changed using the sysctl or loader interfaces. The following parameters can be set using sysctl:

To make these settings persist over reboots, modify /etc/sysctl.conf.

If you have set shared_memory_type to sysv, you might also want to configure your kernel to lock System V shared memory into RAM and prevent it from being paged out to swap. This can be accomplished using the sysctl setting kern.ipc.shm_use_phys.

If running in a FreeBSD jail, you should set its sysvshm parameter to new, so that it has its own separate System V shared memory namespace. (Before FreeBSD 11.0, it was necessary to enable shared access to the host's IPC namespace from jails, and take measures to avoid collisions.)

The default shared memory settings are usually good enough, unless you have set shared_memory_type to sysv. However, you will need to increase kern.ipc.semmni and kern.ipc.semmns, as NetBSD's default settings for these are unworkably small.

IPC parameters can be adjusted using sysctl, for example:

To make these settings persist over reboots, modify /etc/sysctl.conf.

If you have set shared_memory_type to sysv, you might also want to configure your kernel to lock System V shared memory into RAM and prevent it from being paged out to swap. This can be accomplished using the sysctl setting kern.ipc.shm_use_phys.

The default shared memory settings are usually good enough, unless you have set shared_memory_type to sysv. However, you will need to increase kern.seminfo.semmni and kern.seminfo.semmns, as OpenBSD's default settings for these are unworkably small.

IPC parameters can be adjusted using sysctl, for example:

To make these settings persist over reboots, modify /etc/sysctl.conf.

The default shared memory settings are usually good enough, unless you have set shared_memory_type to sysv, and even then only on older kernel versions that shipped with low defaults. System V semaphores are not used on this platform.

The shared memory size settings can be changed via the sysctl interface. For example, to allow 16 GB:

To make these settings persist over reboots, see /etc/sysctl.conf.

The default shared memory and semaphore settings are usually good enough, unless you have set shared_memory_type to sysv.

The recommended method for configuring shared memory in macOS is to create a file named /etc/sysctl.conf, containing variable assignments such as:

Note that in some macOS versions, all five shared-memory parameters must be set in /etc/sysctl.conf, else the values will be ignored.

SHMMAX can only be set to a multiple of 4096.

SHMALL is measured in 4 kB pages on this platform.

It is possible to change all but SHMMNI on the fly, using sysctl. But it's still best to set up your preferred values via /etc/sysctl.conf, so that the values will be kept across reboots.

The default shared memory and semaphore settings are usually good enough for most PostgreSQL applications. Solaris defaults to a SHMMAX of one-quarter of system RAM. To further adjust this setting, use a project setting associated with the postgres user. For example, run the following as root:

This command adds the user.postgres project and sets the shared memory maximum for the postgres user to 8GB, and takes effect the next time that user logs in, or when you restart PostgreSQL (not reload). The above assumes that PostgreSQL is run by the postgres user in the postgres group. No server reboot is required.

Other recommended kernel setting changes for database servers which will have a large number of connections are:

Additionally, if you are running PostgreSQL inside a zone, you may need to raise the zone resource usage limits as well. See "Chapter2: Projects and Tasks" in the System Administrator's Guide for more information on projects and prctl.

If systemd is in use, some care must be taken that IPC resources (including shared memory) are not prematurely removed by the operating system. This is especially of concern when installing PostgreSQL from source. Users of distribution packages of PostgreSQL are less likely to be affected, as the postgres user is then normally created as a system user.

The setting RemoveIPC in logind.conf controls whether IPC objects are removed when a user fully logs out. System users are exempt. This setting defaults to on in stock systemd, but some operating system distributions default it to off.

A typical observed effect when this setting is on is that shared memory objects used for parallel query execution are removed at apparently random times, leading to errors and warnings while attempting to open and remove them, like

Different types of IPC objects (shared memory vs. semaphores, System V vs. POSIX) are treated slightly differently by systemd, so one might observe that some IPC resources are not removed in the same way as others. But it is not advisable to rely on these subtle differences.

A “user logging out” might happen as part of a maintenance job or manually when an administrator logs in as the postgres user or something similar, so it is hard to prevent in general.

What is a “system user” is determined at systemd compile time from the SYS_UID_MAX setting in /etc/login.defs.

Packaging and deployment scripts should be careful to create the postgres user as a system user by using useradd -r, adduser --system, or equivalent.

Alternatively, if the user account was created incorrectly or cannot be changed, it is recommended to set

in /etc/systemd/logind.conf or another appropriate configuration file.

At least one of these two things has to be ensured, or the PostgreSQL server will be very unreliable.

Unix-like operating systems enforce various kinds of resource limits that might interfere with the operation of your PostgreSQL server. Of particular importance are limits on the number of processes per user, the number of open files per process, and the amount of memory available to each process. Each of these have a “hard” and a “soft” limit. The soft limit is what actually counts but it can be changed by the user up to the hard limit. The hard limit can only be changed by the root user. The system call setrlimit is responsible for setting these parameters. The shell's built-in command ulimit (Bourne shells) or limit (csh) is used to control the resource limits from the command line. On BSD-derived systems the file /etc/login.conf controls the various resource limits set during login. See the operating system documentation for details. The relevant parameters are maxproc, openfiles, and datasize. For example:

(-cur is the soft limit. Append -max to set the hard limit.)

Kernels can also have system-wide limits on some resources.

On Linux the kernel parameter fs.file-max determines the maximum number of open files that the kernel will support. It can be changed with sysctl -w fs.file-max=N. To make the setting persist across reboots, add an assignment in /etc/sysctl.conf. The maximum limit of files per process is fixed at the time the kernel is compiled; see /usr/src/linux/Documentation/proc.txt for more information.

The PostgreSQL server uses one process per connection so you should provide for at least as many processes as allowed connections, in addition to what you need for the rest of your system. This is usually not a problem but if you run several servers on one machine things might get tight.

The factory default limit on open files is often set to “socially friendly” values that allow many users to coexist on a machine without using an inappropriate fraction of the system resources. If you run many servers on a machine this is perhaps what you want, but on dedicated servers you might want to raise this limit.

On the other side of the coin, some systems allow individual processes to open large numbers of files; if more than a few processes do so then the system-wide limit can easily be exceeded. If you find this happening, and you do not want to alter the system-wide limit, you can set PostgreSQL's max_files_per_process configuration parameter to limit the consumption of open files.

Another kernel limit that may be of concern when supporting large numbers of client connections is the maximum socket connection queue length. If more than that many connection requests arrive within a very short period, some may get rejected before the PostgreSQL server can service the requests, with those clients receiving unhelpful connection failure errors such as “Resource temporarily unavailable” or “Connection refused”. The default queue length limit is 128 on many platforms. To raise it, adjust the appropriate kernel parameter via sysctl, then restart the PostgreSQL server. The parameter is variously named net.core.somaxconn on Linux, kern.ipc.soacceptqueue on newer FreeBSD, and kern.ipc.somaxconn on macOS and other BSD variants.

The default virtual memory behavior on Linux is not optimal for PostgreSQL. Because of the way that the kernel implements memory overcommit, the kernel might terminate the PostgreSQL postmaster (the supervisor server process) if the memory demands of either PostgreSQL or another process cause the system to run out of virtual memory.

If this happens, you will see a kernel message that looks like this (consult your system documentation and configuration on where to look for such a message):

This indicates that the postgres process has been terminated due to memory pressure. Although existing database connections will continue to function normally, no new connections will be accepted. To recover, PostgreSQL will need to be restarted.

One way to avoid this problem is to run PostgreSQL on a machine where you can be sure that other processes will not run the machine out of memory. If memory is tight, increasing the swap space of the operating system can help avoid the problem, because the out-of-memory (OOM) killer is invoked only when physical memory and swap space are exhausted.

If PostgreSQL itself is the cause of the system running out of memory, you can avoid the problem by changing your configuration. In some cases, it may help to lower memory-related configuration parameters, particularly shared_buffers, work_mem, and hash_mem_multiplier. In other cases, the problem may be caused by allowing too many connections to the database server itself. In many cases, it may be better to reduce max_connections and instead make use of external connection-pooling software.

It is possible to modify the kernel's behavior so that it will not “overcommit” memory. Although this setting will not prevent the OOM killer from being invoked altogether, it will lower the chances significantly and will therefore lead to more robust system behavior. This is done by selecting strict overcommit mode via sysctl:

or placing an equivalent entry in /etc/sysctl.conf. You might also wish to modify the related setting vm.overcommit_ratio. For details see the kernel documentation file https://www.kernel.org/doc/Documentation/vm/overcommit-accounting.

Another approach, which can be used with or without altering vm.overcommit_memory, is to set the process-specific OOM score adjustment value for the postmaster process to -1000, thereby guaranteeing it will not be targeted by the OOM killer. The simplest way to do this is to execute

in the PostgreSQL startup script just before invoking postgres. Note that this action must be done as root, or it will have no effect; so a root-owned startup script is the easiest place to do it. If you do this, you should also set these environment variables in the startup script before invoking postgres:

These settings will cause postmaster child processes to run with the normal OOM score adjustment of zero, so that the OOM killer can still target them at need. You could use some other value for PG_OOM_ADJUST_VALUE if you want the child processes to run with some other OOM score adjustment. (PG_OOM_ADJUST_VALUE can also be omitted, in which case it defaults to zero.) If you do not set PG_OOM_ADJUST_FILE, the child processes will run with the same OOM score adjustment as the postmaster, which is unwise since the whole point is to ensure that the postmaster has a preferential setting.

Using huge pages reduces overhead when using large contiguous chunks of memory, as PostgreSQL does, particularly when using large values of shared_buffers. To use this feature in PostgreSQL you need a kernel with CONFIG_HUGETLBFS=y and CONFIG_HUGETLB_PAGE=y. You will also have to configure the operating system to provide enough huge pages of the desired size. The runtime-computed parameter shared_memory_size_in_huge_pages reports the number of huge pages required. This parameter can be viewed before starting the server with a postgres command like:

In this example the default is 2MB, but you can also explicitly request either 2MB or 1GB with huge_page_size to adapt the number of pages calculated by shared_memory_size_in_huge_pages. While we need at least 3170 huge pages in this example, a larger setting would be appropriate if other programs on the machine also need huge pages. We can set this with:

Don't forget to add this setting to /etc/sysctl.conf so that it is reapplied after reboots. For non-default huge page sizes, we can instead use:

It is also possible to provide these settings at boot time using kernel parameters such as hugepagesz=2M hugepages=3170.

Sometimes the kernel is not able to allocate the desired number of huge pages immediately due to fragmentation, so it might be necessary to repeat the command or to reboot. (Immediately after a reboot, most of the machine's memory should be available to convert into huge pages.) To verify the huge page allocation situation for a given size, use:

It may also be necessary to give the database server's operating system user permission to use huge pages by setting vm.hugetlb_shm_group via sysctl, and/or give permission to lock memory with ulimit -l.

The default behavior for huge pages in PostgreSQL is to use them when possible, with the system's default huge page size, and to fall back to normal pages on failure. To enforce the use of huge pages, you can set huge_pages to on in postgresql.conf. Note that with this setting PostgreSQL will fail to start if not enough huge pages are available.

For a detailed description of the Linux huge pages feature have a look at https://www.kernel.org/doc/Documentation/vm/hugetlbpage.txt.

**Examples:**

Example 1 (unknown):
```unknown
ceil(SHMMAX/PAGE_SIZE)
```

Example 2 (unknown):
```unknown
ceil(num_os_semaphores / 16)
```

Example 3 (unknown):
```unknown
ceil(num_os_semaphores / 16) * 17
```

Example 4 (bash):
```bash
$ postgres -D $PGDATA -C num_os_semaphores
```

---


---

## Chapter 18. Server Setup and Operation


**URL:** https://www.postgresql.org/docs/18/runtime.html

**Contents:**
- Chapter 18. Server Setup and Operation

This chapter discusses how to set up and run the database server, and its interactions with the operating system.

The directions in this chapter assume that you are working with plain PostgreSQL without any additional infrastructure, for example a copy that you built from source according to the directions in the preceding chapters. If you are working with a pre-packaged or vendor-supplied version of PostgreSQL, it is likely that the packager has made special provisions for installing and starting the database server according to your system's conventions. Consult the package-level documentation for details.

---


---

## 18.3. Starting the Database Server #


**URL:** https://www.postgresql.org/docs/18/server-start.html

**Contents:**
- 18.3. Starting the Database Server #
  - 18.3.1. Server Start-up Failures #
  - 18.3.2. Client Connection Problems #

Before anyone can access the database, you must start the database server. The database server program is called postgres.

If you are using a pre-packaged version of PostgreSQL, it almost certainly includes provisions for running the server as a background task according to the conventions of your operating system. Using the package's infrastructure to start the server will be much less work than figuring out how to do this yourself. Consult the package-level documentation for details.

The bare-bones way to start the server manually is just to invoke postgres directly, specifying the location of the data directory with the -D option, for example:

which will leave the server running in the foreground. This must be done while logged into the PostgreSQL user account. Without -D, the server will try to use the data directory named by the environment variable PGDATA. If that variable is not provided either, it will fail.

Normally it is better to start postgres in the background. For this, use the usual Unix shell syntax:

It is important to store the server's stdout and stderr output somewhere, as shown above. It will help for auditing purposes and to diagnose problems. (See Section 24.3 for a more thorough discussion of log file handling.)

The postgres program also takes a number of other command-line options. For more information, see the postgres reference page and Chapter 19 below.

This shell syntax can get tedious quickly. Therefore the wrapper program pg_ctl is provided to simplify some tasks. For example:

will start the server in the background and put the output into the named log file. The -D option has the same meaning here as for postgres. pg_ctl is also capable of stopping the server.

Normally, you will want to start the database server when the computer boots. Autostart scripts are operating-system-specific. There are a few example scripts distributed with PostgreSQL in the contrib/start-scripts directory. Installing one will require root privileges.

Different systems have different conventions for starting up daemons at boot time. Many systems have a file /etc/rc.local or /etc/rc.d/rc.local. Others use init.d or rc.d directories. Whatever you do, the server must be run by the PostgreSQL user account and not by root or any other user. Therefore you probably should form your commands using su postgres -c '...'. For example:

Here are a few more operating-system-specific suggestions. (In each case be sure to use the proper installation directory and user name where we show generic values.)

For FreeBSD, look at the file contrib/start-scripts/freebsd in the PostgreSQL source distribution.

On OpenBSD, add the following lines to the file /etc/rc.local:

On Linux systems either add

to /etc/rc.d/rc.local or /etc/rc.local or look at the file contrib/start-scripts/linux in the PostgreSQL source distribution.

When using systemd, you can use the following service unit file (e.g., at /etc/systemd/system/postgresql.service):

Using Type=notify requires that the server binary was built with configure --with-systemd.

Consider carefully the timeout setting. systemd has a default timeout of 90 seconds as of this writing and will kill a process that does not report readiness within that time. But a PostgreSQL server that might have to perform crash recovery at startup could take much longer to become ready. The suggested value of infinity disables the timeout logic.

On NetBSD, use either the FreeBSD or Linux start scripts, depending on preference.

On Solaris, create a file called /etc/init.d/postgresql that contains the following line:

Then, create a symbolic link to it in /etc/rc3.d as S99postgresql.

While the server is running, its PID is stored in the file postmaster.pid in the data directory. This is used to prevent multiple server instances from running in the same data directory and can also be used for shutting down the server.

There are several common reasons the server might fail to start. Check the server's log file, or start it by hand (without redirecting standard output or standard error) and see what error messages appear. Below we explain some of the most common error messages in more detail.

This usually means just what it suggests: you tried to start another server on the same port where one is already running. However, if the kernel error message is not Address already in use or some variant of that, there might be a different problem. For example, trying to start a server on a reserved port number might draw something like:

probably means your kernel's limit on the size of shared memory is smaller than the work area PostgreSQL is trying to create (4011376640 bytes in this example). This is only likely to happen if you have set shared_memory_type to sysv. In that case, you can try starting the server with a smaller-than-normal number of buffers (shared_buffers), or reconfigure your kernel to increase the allowed shared memory size. You might also see this message when trying to start multiple servers on the same machine, if their total space requested exceeds the kernel limit.

does not mean you've run out of disk space. It means your kernel's limit on the number of System V semaphores is smaller than the number PostgreSQL wants to create. As above, you might be able to work around the problem by starting the server with a reduced number of allowed connections (max_connections), but you'll eventually want to increase the kernel limit.

Details about configuring System V IPC facilities are given in Section 18.4.1.

Although the error conditions possible on the client side are quite varied and application-dependent, a few of them might be directly related to how the server was started. Conditions other than those shown below should be documented with the respective client application.

This is the generic “I couldn't find a server to talk to” failure. It looks like the above when TCP/IP communication is attempted. A common mistake is to forget to configure listen_addresses so that the server accepts remote TCP connections.

Alternatively, you might get this when attempting Unix-domain socket communication to a local server:

If the server is indeed running, check that the client's idea of the socket path (here /tmp) agrees with the server's unix_socket_directories setting.

A connection failure message always shows the server address or socket path name, which is useful in verifying that the client is trying to connect to the right place. If there is in fact no server listening there, the kernel error message will typically be either Connection refused or No such file or directory, as illustrated. (It is important to realize that Connection refused in this context does not mean that the server got your connection request and rejected it. That case will produce a different message, as shown in Section 20.16.) Other error messages such as Connection timed out might indicate more fundamental problems, like lack of network connectivity, or a firewall blocking the connection.

**Examples:**

Example 1 (unknown):
```unknown
$ postgres -D /usr/local/pgsql/data
```

Example 2 (unknown):
```unknown
postgres -D /usr/local/pgsql/data
```

Example 3 (unknown):
```unknown
$ postgres -D /usr/local/pgsql/data >logfile 2>&1 &
```

Example 4 (unknown):
```unknown
postgres -D /usr/local/pgsql/data >logfile 2>&1 &
```

---


---

