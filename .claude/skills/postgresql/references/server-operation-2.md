# PostgreSQL - Server Operation (Part 2)

## 18.8. Encryption Options #


**URL:** https://www.postgresql.org/docs/18/encryption-options.html

**Contents:**
- 18.8. Encryption Options #
  - Warning

PostgreSQL offers encryption at several levels, and provides flexibility in protecting data from disclosure due to database server theft, unscrupulous administrators, and insecure networks. Encryption might also be required to secure sensitive data such as medical records or financial transactions.

Database user passwords are stored as hashes (determined by the setting password_encryption), so the administrator cannot determine the actual password assigned to the user. If SCRAM or MD5 encryption is used for client authentication, the unencrypted password is never even temporarily present on the server because the client encrypts it before being sent across the network. SCRAM is preferred, because it is an Internet standard and is more secure than the PostgreSQL-specific MD5 authentication protocol.

Support for MD5-encrypted passwords is deprecated and will be removed in a future release of PostgreSQL. Refer to Section 20.5 for details about migrating to another password type.

The pgcrypto module allows certain fields to be stored encrypted. This is useful if only some of the data is sensitive. The client supplies the decryption key and the data is decrypted on the server and then sent to the client.

The decrypted data and the decryption key are present on the server for a brief time while it is being decrypted and communicated between the client and server. This presents a brief moment where the data and keys can be intercepted by someone with complete access to the database server, such as the system administrator.

Storage encryption can be performed at the file system level or the block level. Linux file system encryption options include eCryptfs and EncFS, while FreeBSD uses PEFS. Block level or full disk encryption options include dm-crypt + LUKS on Linux and GEOM modules geli and gbde on FreeBSD. Many other operating systems support this functionality, including Windows.

This mechanism prevents unencrypted data from being read from the drives if the drives or the entire computer is stolen. This does not protect against attacks while the file system is mounted, because when mounted, the operating system provides an unencrypted view of the data. However, to mount the file system, you need some way for the encryption key to be passed to the operating system, and sometimes the key is stored somewhere on the host that mounts the disk.

SSL connections encrypt all data sent across the network: the password, the queries, and the data returned. The pg_hba.conf file allows administrators to specify which hosts can use non-encrypted connections (host) and which require SSL-encrypted connections (hostssl). Also, clients can specify that they connect to servers only via SSL.

GSSAPI-encrypted connections encrypt all data sent across the network, including queries and data returned. (No password is sent across the network.) The pg_hba.conf file allows administrators to specify which hosts can use non-encrypted connections (host) and which require GSSAPI-encrypted connections (hostgssenc). Also, clients can specify that they connect to servers only on GSSAPI-encrypted connections (gssencmode=require).

Stunnel or SSH can also be used to encrypt transmissions.

It is possible for both the client and server to provide SSL certificates to each other. It takes some extra configuration on each side, but this provides stronger verification of identity than the mere use of passwords. It prevents a computer from pretending to be the server just long enough to read the password sent by the client. It also helps prevent “man in the middle” attacks where a computer between the client and server pretends to be the server and reads and passes all data between the client and server.

If the system administrator for the server's machine cannot be trusted, it is necessary for the client to encrypt the data; this way, unencrypted data never appears on the database server. Data is encrypted on the client before being sent to the server, and database results have to be decrypted on the client before being used.

**Examples:**

Example 1 (unknown):
```unknown
pg_hba.conf
```

Example 2 (unknown):
```unknown
pg_hba.conf
```

Example 3 (unknown):
```unknown
gssencmode=require
```

---


---

## 18.10. Secure TCP/IP Connections with GSSAPI Encryption #


**URL:** https://www.postgresql.org/docs/18/gssapi-enc.html

**Contents:**
- 18.10. Secure TCP/IP Connections with GSSAPI Encryption #
  - 18.10.1. Basic Setup #

PostgreSQL also has native support for using GSSAPI to encrypt client/server communications for increased security. Support requires that a GSSAPI implementation (such as MIT Kerberos) is installed on both client and server systems, and that support in PostgreSQL is enabled at build time (see Chapter 17).

The PostgreSQL server will listen for both normal and GSSAPI-encrypted connections on the same TCP port, and will negotiate with any connecting client whether to use GSSAPI for encryption (and for authentication). By default, this decision is up to the client (which means it can be downgraded by an attacker); see Section 20.1 about setting up the server to require the use of GSSAPI for some or all connections.

When using GSSAPI for encryption, it is common to use GSSAPI for authentication as well, since the underlying mechanism will determine both client and server identities (according to the GSSAPI implementation) in any case. But this is not required; another PostgreSQL authentication method can be chosen to perform additional verification.

Other than configuration of the negotiation behavior, GSSAPI encryption requires no setup beyond that which is necessary for GSSAPI authentication. (For more information on configuring that, see Section 20.6.)

---


---

## 18.9. Secure TCP/IP Connections with SSL #


**URL:** https://www.postgresql.org/docs/18/ssl-tcp.html

**Contents:**
- 18.9. Secure TCP/IP Connections with SSL #
  - 18.9.1. Basic Setup #
  - 18.9.2. OpenSSL Configuration #
  - Note
  - 18.9.3. Using Client Certificates #
  - 18.9.4. SSL Server File Usage #
  - 18.9.5. Creating Certificates #

PostgreSQL has native support for using SSL connections to encrypt client/server communications for increased security. This requires that OpenSSL is installed on both client and server systems and that support in PostgreSQL is enabled at build time (see Chapter 17).

The terms SSL and TLS are often used interchangeably to mean a secure encrypted connection using a TLS protocol. SSL protocols are the precursors to TLS protocols, and the term SSL is still used for encrypted connections even though SSL protocols are no longer supported. SSL is used interchangeably with TLS in PostgreSQL.

With SSL support compiled in, the PostgreSQL server can be started with support for encrypted connections using TLS protocols enabled by setting the parameter ssl to on in postgresql.conf. The server will listen for both normal and SSL connections on the same TCP port, and will negotiate with any connecting client on whether to use SSL. By default, this is at the client's option; see Section 20.1 about how to set up the server to require use of SSL for some or all connections.

To start in SSL mode, files containing the server certificate and private key must exist. By default, these files are expected to be named server.crt and server.key, respectively, in the server's data directory, but other names and locations can be specified using the configuration parameters ssl_cert_file and ssl_key_file.

On Unix systems, the permissions on server.key must disallow any access to world or group; achieve this by the command chmod 0600 server.key. Alternatively, the file can be owned by root and have group read access (that is, 0640 permissions). That setup is intended for installations where certificate and key files are managed by the operating system. The user under which the PostgreSQL server runs should then be made a member of the group that has access to those certificate and key files.

If the data directory allows group read access then certificate files may need to be located outside of the data directory in order to conform to the security requirements outlined above. Generally, group access is enabled to allow an unprivileged user to backup the database, and in that case the backup software will not be able to read the certificate files and will likely error.

If the private key is protected with a passphrase, the server will prompt for the passphrase and will not start until it has been entered. Using a passphrase by default disables the ability to change the server's SSL configuration without a server restart, but see ssl_passphrase_command_supports_reload. Furthermore, passphrase-protected private keys cannot be used at all on Windows.

The first certificate in server.crt must be the server's certificate because it must match the server's private key. The certificates of “intermediate” certificate authorities can also be appended to the file. Doing this avoids the necessity of storing intermediate certificates on clients, assuming the root and intermediate certificates were created with v3_ca extensions. (This sets the certificate's basic constraint of CA to true.) This allows easier expiration of intermediate certificates.

It is not necessary to add the root certificate to server.crt. Instead, clients must have the root certificate of the server's certificate chain.

PostgreSQL reads the system-wide OpenSSL configuration file. By default, this file is named openssl.cnf and is located in the directory reported by openssl version -d. This default can be overridden by setting environment variable OPENSSL_CONF to the name of the desired configuration file.

OpenSSL supports a wide range of ciphers and authentication algorithms, of varying strength. While a list of ciphers can be specified in the OpenSSL configuration file, you can specify ciphers specifically for use by the database server by modifying ssl_ciphers in postgresql.conf.

It is possible to have authentication without encryption overhead by using NULL-SHA or NULL-MD5 ciphers. However, a man-in-the-middle could read and pass communications between client and server. Also, encryption overhead is minimal compared to the overhead of authentication. For these reasons NULL ciphers are not recommended.

To require the client to supply a trusted certificate, place certificates of the root certificate authorities (CAs) you trust in a file in the data directory, set the parameter ssl_ca_file in postgresql.conf to the new file name, and add the authentication option clientcert=verify-ca or clientcert=verify-full to the appropriate hostssl line(s) in pg_hba.conf. A certificate will then be requested from the client during SSL connection startup. (See Section 32.19 for a description of how to set up certificates on the client.)

For a hostssl entry with clientcert=verify-ca, the server will verify that the client's certificate is signed by one of the trusted certificate authorities. If clientcert=verify-full is specified, the server will not only verify the certificate chain, but it will also check whether the username or its mapping matches the cn (Common Name) of the provided certificate. Note that certificate chain validation is always ensured when the cert authentication method is used (see Section 20.12).

Intermediate certificates that chain up to existing root certificates can also appear in the ssl_ca_file file if you wish to avoid storing them on clients (assuming the root and intermediate certificates were created with v3_ca extensions). Certificate Revocation List (CRL) entries are also checked if the parameter ssl_crl_file or ssl_crl_dir is set.

The clientcert authentication option is available for all authentication methods, but only in pg_hba.conf lines specified as hostssl. When clientcert is not specified, the server verifies the client certificate against its CA file only if a client certificate is presented and the CA is configured.

There are two approaches to enforce that users provide a certificate during login.

The first approach makes use of the cert authentication method for hostssl entries in pg_hba.conf, such that the certificate itself is used for authentication while also providing ssl connection security. See Section 20.12 for details. (It is not necessary to specify any clientcert options explicitly when using the cert authentication method.) In this case, the cn (Common Name) provided in the certificate is checked against the user name or an applicable mapping.

The second approach combines any authentication method for hostssl entries with the verification of client certificates by setting the clientcert authentication option to verify-ca or verify-full. The former option only enforces that the certificate is valid, while the latter also ensures that the cn (Common Name) in the certificate matches the user name or an applicable mapping.

Table 18.2 summarizes the files that are relevant to the SSL setup on the server. (The shown file names are default names. The locally configured names could be different.)

Table 18.2. SSL Server File Usage

The server reads these files at server start and whenever the server configuration is reloaded. On Windows systems, they are also re-read whenever a new backend process is spawned for a new client connection.

If an error in these files is detected at server start, the server will refuse to start. But if an error is detected during a configuration reload, the files are ignored and the old SSL configuration continues to be used. On Windows systems, if an error in these files is detected at backend start, that backend will be unable to establish an SSL connection. In all these cases, the error condition is reported in the server log.

To create a simple self-signed certificate for the server, valid for 365 days, use the following OpenSSL command, replacing dbhost.yourdomain.com with the server's host name:

because the server will reject the file if its permissions are more liberal than this. For more details on how to create your server private key and certificate, refer to the OpenSSL documentation.

While a self-signed certificate can be used for testing, a certificate signed by a certificate authority (CA) (usually an enterprise-wide root CA) should be used in production.

To create a server certificate whose identity can be validated by clients, first create a certificate signing request (CSR) and a public/private key file:

Then, sign the request with the key to create a root certificate authority (using the default OpenSSL configuration file location on Linux):

Finally, create a server certificate signed by the new root certificate authority:

server.crt and server.key should be stored on the server, and root.crt should be stored on the client so the client can verify that the server's leaf certificate was signed by its trusted root certificate. root.key should be stored offline for use in creating future certificates.

It is also possible to create a chain of trust that includes intermediate certificates:

server.crt and intermediate.crt should be concatenated into a certificate file bundle and stored on the server. server.key should also be stored on the server. root.crt should be stored on the client so the client can verify that the server's leaf certificate was signed by a chain of certificates linked to its trusted root certificate. root.key and intermediate.key should be stored offline for use in creating future certificates.

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
chmod 0600 server.key
```

Example 3 (unknown):
```unknown
openssl.cnf
```

Example 4 (unknown):
```unknown
openssl version -d
```

---


---

## 18.5. Shutting Down the Server #


**URL:** https://www.postgresql.org/docs/18/server-shutdown.html

**Contents:**
- 18.5. Shutting Down the Server #
  - Important

There are several ways to shut down the database server. Under the hood, they all reduce to sending a signal to the supervisor postgres process.

If you are using a pre-packaged version of PostgreSQL, and you used its provisions for starting the server, then you should also use its provisions for stopping the server. Consult the package-level documentation for details.

When managing the server directly, you can control the type of shutdown by sending different signals to the postgres process:

This is the Smart Shutdown mode. After receiving SIGTERM, the server disallows new connections, but lets existing sessions end their work normally. It shuts down only after all of the sessions terminate. If the server is in recovery when a smart shutdown is requested, recovery and streaming replication will be stopped only after all regular sessions have terminated.

This is the Fast Shutdown mode. The server disallows new connections and sends all existing server processes SIGTERM, which will cause them to abort their current transactions and exit promptly. It then waits for all server processes to exit and finally shuts down.

This is the Immediate Shutdown mode. The server will send SIGQUIT to all child processes and wait for them to terminate. If any do not terminate within 5 seconds, they will be sent SIGKILL. The supervisor server process exits as soon as all child processes have exited, without doing normal database shutdown processing. This will lead to recovery (by replaying the WAL log) upon next start-up. This is recommended only in emergencies.

The pg_ctl program provides a convenient interface for sending these signals to shut down the server. Alternatively, you can send the signal directly using kill on non-Windows systems. The PID of the postgres process can be found using the ps program, or from the file postmaster.pid in the data directory. For example, to do a fast shutdown:

It is best not to use SIGKILL to shut down the server. Doing so will prevent the server from releasing shared memory and semaphores. Furthermore, SIGKILL kills the postgres process without letting it relay the signal to its subprocesses, so it might be necessary to kill the individual subprocesses by hand as well.

To terminate an individual session while allowing other sessions to continue, use pg_terminate_backend() (see Table 9.96) or send a SIGTERM signal to the child process associated with the session.

**Examples:**

Example 1 (unknown):
```unknown
postmaster.pid
```

Example 2 (unknown):
```unknown
$ kill -INT `head -1 /usr/local/pgsql/data/postmaster.pid`
```

Example 3 (unknown):
```unknown
kill -INT `head -1 /usr/local/pgsql/data/postmaster.pid`
```

Example 4 (unknown):
```unknown
pg_terminate_backend()
```

---


---

