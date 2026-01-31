# PostgreSQL - Libpq (Part 6)

## 32.1. Database Connection Control Functions # (continued)
When using sslrootcert=system, the default sslmode is changed to verify-full, and any weaker setting will result in an error. In most cases it is trivial for anyone to obtain a certificate trusted by the system for a hostname they control, rendering verify-ca and all weaker modes useless.

The magic system value will take precedence over a local certificate file with the same name. If for some reason you find yourself in this situation, use an alternative path like sslrootcert=./system instead.

This parameter specifies the file name of the SSL server certificate revocation list (CRL). Certificates listed in this file, if it exists, will be rejected while attempting to authenticate the server's certificate. If neither sslcrl nor sslcrldir is set, this setting is taken as ~/.postgresql/root.crl.

This parameter specifies the directory name of the SSL server certificate revocation list (CRL). Certificates listed in the files in this directory, if it exists, will be rejected while attempting to authenticate the server's certificate.

The directory needs to be prepared with the OpenSSL command openssl rehash or c_rehash. See its documentation for details.

Both sslcrl and sslcrldir can be specified together.

If set to 1 (default), libpq sets the TLS extension “Server Name Indication” (SNI) on SSL-enabled connections. By setting this parameter to 0, this is turned off.

The Server Name Indication can be used by SSL-aware proxies to route connections without having to decrypt the SSL stream. (Note that unless the proxy is aware of the PostgreSQL protocol handshake this would require setting sslnegotiation to direct.) However, SNI makes the destination host name appear in cleartext in the network traffic, so it might be undesirable in some cases.

This parameter specifies the operating-system user name of the server, for example requirepeer=postgres. When making a Unix-domain socket connection, if this parameter is set, the client checks at the beginning of the connection that the server process is running under the specified user name; if it is not, the connection is aborted with an error. This parameter can be used to provide server authentication similar to that available with SSL certificates on TCP/IP connections. (Note that if the Unix-domain socket is in /tmp or another publicly writable location, any user could start a server listening there. Use this parameter to ensure that you are connected to a server run by a trusted user.) This option is only supported on platforms for which the peer authentication method is implemented; see Section 20.9.

This parameter specifies the minimum SSL/TLS protocol version to allow for the connection. Valid values are TLSv1, TLSv1.1, TLSv1.2 and TLSv1.3. The supported protocols depend on the version of OpenSSL used, older versions not supporting the most modern protocol versions. If not specified, the default is TLSv1.2, which satisfies industry best practices as of this writing.

This parameter specifies the maximum SSL/TLS protocol version to allow for the connection. Valid values are TLSv1, TLSv1.1, TLSv1.2 and TLSv1.3. The supported protocols depend on the version of OpenSSL used, older versions not supporting the most modern protocol versions. If not set, this parameter is ignored and the connection will use the maximum bound defined by the backend, if set. Setting the maximum protocol version is mainly useful for testing or if some component has issues working with a newer protocol.

Specifies the minimum protocol version to allow for the connection. The default is to allow any version of the PostgreSQL protocol supported by libpq, which currently means 3.0. If the server does not support at least this protocol version the connection will be closed.

The current supported values are 3.0, 3.2, and latest. The latest value is equivalent to the latest protocol version supported by the libpq version being used, which is currently 3.2.

Specifies the protocol version to request from the server. The default is to use version 3.0 of the PostgreSQL protocol, unless the connection string specifies a feature that relies on a higher protocol version, in which case the latest version supported by libpq is used. If the server does not support the protocol version requested by the client, the connection is automatically downgraded to a lower minor protocol version that the server supports. After the connection attempt has completed you can use PQfullProtocolVersion to find out which exact protocol version was negotiated.

The current supported values are 3.0, 3.2, and latest. The latest value is equivalent to the latest protocol version supported by the libpq version being used, which is currently 3.2.

Kerberos service name to use when authenticating with GSSAPI. This must match the service name specified in the server configuration for Kerberos authentication to succeed. (See also Section 20.6.) The default value is normally postgres, but that can be changed when building PostgreSQL via the --with-krb-srvnam option of configure. In most environments, this parameter never needs to be changed. Some Kerberos implementations might require a different service name, such as Microsoft Active Directory which requires the service name to be in upper case (POSTGRES).

GSS library to use for GSSAPI authentication. Currently this is disregarded except on Windows builds that include both GSSAPI and SSPI support. In that case, set this to gssapi to cause libpq to use the GSSAPI library for authentication instead of the default SSPI.

Forward (delegate) GSS credentials to the server. The default is 0 which means credentials will not be forwarded to the server. Set this to 1 to have credentials forwarded when possible.

The base64-encoded SCRAM client key. This can be used by foreign-data wrappers or similar middleware to enable pass-through SCRAM authentication. See Section F.38.1.10 for one such implementation. It is not meant to be specified directly by users or client applications.

The base64-encoded SCRAM server key. This can be used by foreign-data wrappers or similar middleware to enable pass-through SCRAM authentication. See Section F.38.1.10 for one such implementation. It is not meant to be specified directly by users or client applications.

Service name to use for additional parameters. It specifies a service name in pg_service.conf that holds additional connection parameters. This allows applications to specify only a service name so connection parameters can be centrally maintained. See Section 32.17.

This option determines whether the session must have certain properties to be acceptable. It's typically used in combination with multiple host names to select the first acceptable alternative among several hosts. There are six modes:

any successful connection is acceptable

session must accept read-write transactions by default (that is, the server must not be in hot standby mode and the default_transaction_read_only parameter must be off)

session must not accept read-write transactions by default (the converse)

server must not be in hot standby mode

server must be in hot standby mode

first try to find a standby server, but if none of the listed hosts is a standby server, try again in any mode

Controls the order in which the client tries to connect to the available hosts and addresses. Once a connection attempt is successful no other hosts and addresses will be tried. This parameter is typically used in combination with multiple host names or a DNS record that returns multiple IPs. This parameter can be used in combination with target_session_attrs to, for example, load balance over standby servers only. Once successfully connected, subsequent queries on the returned connection will all be sent to the same server. There are currently two modes:

No load balancing across hosts is performed. Hosts are tried in the order in which they are provided and addresses are tried in the order they are received from DNS or a hosts file.

Hosts and addresses are tried in random order. This value is mostly useful when opening multiple connections at the same time, possibly from different machines. This way connections can be load balanced across multiple PostgreSQL servers.

While random load balancing, due to its random nature, will almost never result in a completely uniform distribution, it statistically gets quite close. One important aspect here is that this algorithm uses two levels of random choices: First the hosts will be resolved in random order. Then secondly, before resolving the next host, all resolved addresses for the current host will be tried in random order. This behaviour can skew the amount of connections each node gets greatly in certain cases, for instance when some hosts resolve to more addresses than others. But such a skew can also be used on purpose, e.g. to increase the number of connections a larger server gets by providing its hostname multiple times in the host string.

When using this value it's recommended to also configure a reasonable value for connect_timeout. Because then, if one of the nodes that are used for load balancing is not responding, a new node will be tried.

The HTTPS URL of a trusted issuer to contact if the server requests an OAuth token for the connection. This parameter is required for all OAuth connections; it should exactly match the issuer setting in the server's HBA configuration.

As part of the standard authentication handshake, libpq will ask the server for a discovery document: a URL providing a set of OAuth configuration parameters. The server must provide a URL that is directly constructed from the components of the oauth_issuer, and this value must exactly match the issuer identifier that is declared in the discovery document itself, or the connection will fail. This is required to prevent a class of "mix-up attacks" on OAuth clients.

You may also explicitly set oauth_issuer to the /.well-known/ URI used for OAuth discovery. In this case, if the server asks for a different URL, the connection will fail, but a custom OAuth flow may be able to speed up the standard handshake by using previously cached tokens. (In this case, it is recommended that oauth_scope be set as well, since the client will not have a chance to ask the server for a correct scope setting, and the default scopes for a token may not be sufficient to connect.) libpq currently supports the following well-known endpoints:

/.well-known/openid-configuration

/.well-known/oauth-authorization-server

Issuers are highly privileged during the OAuth connection handshake. As a rule of thumb, if you would not trust the operator of a URL to handle access to your servers, or to impersonate you directly, that URL should not be trusted as an oauth_issuer.

An OAuth 2.0 client identifier, as issued by the authorization server. If the PostgreSQL server requests an OAuth token for the connection (and if no custom OAuth hook is installed to provide one), then this parameter must be set; otherwise, the connection will fail.

The client password, if any, to use when contacting the OAuth authorization server. Whether this parameter is required or not is determined by the OAuth provider; "public" clients generally do not use a secret, whereas "confidential" clients generally do.

The scope of the access request sent to the authorization server, specified as a (possibly empty) space-separated list of OAuth scope identifiers. This parameter is optional and intended for advanced usage.

Usually the client will obtain appropriate scope settings from the PostgreSQL server. If this parameter is used, the server's requested scope list will be ignored. This can prevent a less-trusted server from requesting inappropriate access scopes from the end user. However, if the client's scope setting does not contain the server's required scopes, the server is likely to reject the issued token, and the connection will fail.

The meaning of an empty scope list is provider-dependent. An OAuth authorization server may choose to issue a token with "default scope", whatever that happens to be, or it may reject the token request entirely.

**Examples:**

Example 1 (unknown):
```unknown
PQconnectdb
```

Example 2 (unknown):
```unknown
PQconnectdbParams
```

Example 3 (unknown):
```unknown
PQsetdbLogin
```

Example 4 (unknown):
```unknown
search_path
```

---


---

## 32.9. Asynchronous Notification #


**URL:** https://www.postgresql.org/docs/18/libpq-notify.html

**Contents:**
- 32.9. Asynchronous Notification #

PostgreSQL offers asynchronous notification via the LISTEN and NOTIFY commands. A client session registers its interest in a particular notification channel with the LISTEN command (and can stop listening with the UNLISTEN command). All sessions listening on a particular channel will be notified asynchronously when a NOTIFY command with that channel name is executed by any session. A “payload” string can be passed to communicate additional data to the listeners.

libpq applications submit LISTEN, UNLISTEN, and NOTIFY commands as ordinary SQL commands. The arrival of NOTIFY messages can subsequently be detected by calling PQnotifies.

The function PQnotifies returns the next notification from a list of unhandled notification messages received from the server. It returns a null pointer if there are no pending notifications. Once a notification is returned from PQnotifies, it is considered handled and will be removed from the list of notifications.

After processing a PGnotify object returned by PQnotifies, be sure to free it with PQfreemem. It is sufficient to free the PGnotify pointer; the relname and extra fields do not represent separate allocations. (The names of these fields are historical; in particular, channel names need not have anything to do with relation names.)

Example 32.2 gives a sample program that illustrates the use of asynchronous notification.

PQnotifies does not actually read data from the server; it just returns messages previously absorbed by another libpq function. In ancient releases of libpq, the only way to ensure timely receipt of NOTIFY messages was to constantly submit commands, even empty ones, and then check PQnotifies after each PQexec. While this still works, it is deprecated as a waste of processing power.

A better way to check for NOTIFY messages when you have no useful commands to execute is to call PQconsumeInput , then check PQnotifies. You can use select() to wait for data to arrive from the server, thereby using no CPU power unless there is something to do. (See PQsocket to obtain the file descriptor number to use with select().) Note that this will work OK whether you submit commands with PQsendQuery/PQgetResult or simply use PQexec. You should, however, remember to check PQnotifies after each PQgetResult or PQexec, to see if any notifications came in during the processing of the command.

**Examples:**

Example 1 (unknown):
```unknown
PQconsumeInput
```

Example 2 (unknown):
```unknown
PQsendQuery
```

Example 3 (unknown):
```unknown
PQgetResult
```

Example 4 (unknown):
```unknown
PQgetResult
```

---


---

## 32.16. The Password File #


**URL:** https://www.postgresql.org/docs/18/libpq-pgpass.html

**Contents:**
- 32.16. The Password File #

The file .pgpass in a user's home directory can contain passwords to be used if the connection requires a password (and no password has been specified otherwise). On Unix systems, the directory can be specified by the HOME environment variable, or if undefined, the home directory of the effective user. On Microsoft Windows the file is named %APPDATA%\postgresql\pgpass.conf (where %APPDATA% refers to the Application Data subdirectory in the user's profile). Alternatively, the password file to use can be specified using the connection parameter passfile or the environment variable PGPASSFILE.

This file should contain lines of the following format:

(You can add a reminder comment to the file by copying the line above and preceding it with #.) Each of the first four fields can be a literal value, or *, which matches anything. The password field from the first line that matches the current connection parameters will be used. (Therefore, put more-specific entries first when you are using wildcards.) If an entry needs to contain : or \, escape this character with \. The host name field is matched to the host connection parameter if that is specified, otherwise to the hostaddr parameter if that is specified; if neither are given then the host name localhost is searched for. The host name localhost is also searched for when the connection is a Unix-domain socket connection and the host parameter matches libpq's default socket directory path. In a standby server, a database field of replication matches streaming replication connections made to the primary server. The database field is of limited usefulness otherwise, because users have the same password for all databases in the same cluster.

On Unix systems, the permissions on a password file must disallow any access to world or group; achieve this by a command such as chmod 0600 ~/.pgpass. If the permissions are less strict than this, the file will be ignored. On Microsoft Windows, it is assumed that the file is stored in a directory that is secure, so no special permissions check is made.

**Examples:**

Example 1 (unknown):
```unknown
%APPDATA%\postgresql\pgpass.conf
```

Example 2 (unknown):
```unknown
replication
```

Example 3 (unknown):
```unknown
chmod 0600 ~/.pgpass
```

---


---

## 32.11. Control Functions #


**URL:** https://www.postgresql.org/docs/18/libpq-control.html

**Contents:**
- 32.11. Control Functions #
  - Note

These functions control miscellaneous details of libpq's behavior.

Returns the client encoding.

Note that it returns the encoding ID, not a symbolic string such as EUC_JP. If unsuccessful, it returns -1. To convert an encoding ID to an encoding name, you can use:

Sets the client encoding.

conn is a connection to the server, and encoding is the encoding you want to use. If the function successfully sets the encoding, it returns 0, otherwise -1. The current encoding for this connection can be determined by using PQclientEncoding.

Determines the verbosity of messages returned by PQerrorMessage and PQresultErrorMessage.

PQsetErrorVerbosity sets the verbosity mode, returning the connection's previous setting. In TERSE mode, returned messages include severity, primary text, and position only; this will normally fit on a single line. The DEFAULT mode produces messages that include the above plus any detail, hint, or context fields (these might span multiple lines). The VERBOSE mode includes all available fields. The SQLSTATE mode includes only the error severity and the SQLSTATE error code, if one is available (if not, the output is like TERSE mode).

Changing the verbosity setting does not affect the messages available from already-existing PGresult objects, only subsequently-created ones. (But see PQresultVerboseErrorMessage if you want to print a previous error with a different verbosity.)

Determines the handling of CONTEXT fields in messages returned by PQerrorMessage and PQresultErrorMessage.

PQsetErrorContextVisibility sets the context display mode, returning the connection's previous setting. This mode controls whether the CONTEXT field is included in messages. The NEVER mode never includes CONTEXT, while ALWAYS always includes it if available. In ERRORS mode (the default), CONTEXT fields are included only in error messages, not in notices and warnings. (However, if the verbosity setting is TERSE or SQLSTATE, CONTEXT fields are omitted regardless of the context display mode.)

Changing this mode does not affect the messages available from already-existing PGresult objects, only subsequently-created ones. (But see PQresultVerboseErrorMessage if you want to print a previous error with a different display mode.)

Enables tracing of the client/server communication to a debugging file stream.

Each line consists of: an optional timestamp, a direction indicator (F for messages from client to server or B for messages from server to client), message length, message type, and message contents. Non-message contents fields (timestamp, direction, length and message type) are separated by a tab. Message contents are separated by a space. Protocol strings are enclosed in double quotes, while strings used as data values are enclosed in single quotes. Non-printable chars are printed as hexadecimal escapes. Further message-type-specific detail can be found in Section 54.7.

On Windows, if the libpq library and an application are compiled with different flags, this function call will crash the application because the internal representation of the FILE pointers differ. Specifically, multithreaded/single-threaded, release/debug, and static/dynamic flags should be the same for the library and all applications using that library.

Controls the tracing behavior of client/server communication.

flags contains flag bits describing the operating mode of tracing. If flags contains PQTRACE_SUPPRESS_TIMESTAMPS, then the timestamp is not included when printing each message. If flags contains PQTRACE_REGRESS_MODE, then some fields are redacted when printing each message, such as object OIDs, to make the output more convenient to use in testing frameworks. This function must be called after calling PQtrace.

Disables tracing started by PQtrace.

**Examples:**

Example 1 (unknown):
```unknown
PQclientEncoding
```

Example 2 (unknown):
```unknown
encoding_id
```

Example 3 (unknown):
```unknown
PQsetClientEncoding
```

Example 4 (unknown):
```unknown
PQclientEncoding
```

---


---

## 32.19. SSL Support #


**URL:** https://www.postgresql.org/docs/18/libpq-ssl.html

**Contents:**
- 32.19. SSL Support #
  - 32.19.1. Client Verification of Server Certificates #
  - Note
  - Note
  - 32.19.2. Client Certificates #
  - 32.19.3. Protection Provided in Different Modes #
  - 32.19.4. SSL Client File Usage #
  - 32.19.5. SSL Library Initialization #

PostgreSQL has native support for using SSL connections to encrypt client/server communications using TLS protocols for increased security. See Section 18.9 for details about the server-side SSL functionality.

libpq reads the system-wide OpenSSL configuration file. By default, this file is named openssl.cnf and is located in the directory reported by openssl version -d. This default can be overridden by setting environment variable OPENSSL_CONF to the name of the desired configuration file.

By default, PostgreSQL will not perform any verification of the server certificate. This means that it is possible to spoof the server identity (for example by modifying a DNS record or by taking over the server IP address) without the client knowing. In order to prevent spoofing, the client must be able to verify the server's identity via a chain of trust. A chain of trust is established by placing a root (self-signed) certificate authority (CA) certificate on one computer and a leaf certificate signed by the root certificate on another computer. It is also possible to use an “intermediate” certificate which is signed by the root certificate and signs leaf certificates.

To allow the client to verify the identity of the server, place a root certificate on the client and a leaf certificate signed by the root certificate on the server. To allow the server to verify the identity of the client, place a root certificate on the server and a leaf certificate signed by the root certificate on the client. One or more intermediate certificates (usually stored with the leaf certificate) can also be used to link the leaf certificate to the root certificate.

Once a chain of trust has been established, there are two ways for the client to validate the leaf certificate sent by the server. If the parameter sslmode is set to verify-ca, libpq will verify that the server is trustworthy by checking the certificate chain up to the root certificate stored on the client. If sslmode is set to verify-full, libpq will also verify that the server host name matches the name stored in the server certificate. The SSL connection will fail if the server certificate cannot be verified. verify-full is recommended in most security-sensitive environments.

In verify-full mode, the host name is matched against the certificate's Subject Alternative Name attribute(s) (SAN), or against the Common Name attribute if no SAN of type dNSName is present. If the certificate's name attribute starts with an asterisk (*), the asterisk will be treated as a wildcard, which will match all characters except a dot (.). This means the certificate will not match subdomains. If the connection is made using an IP address instead of a host name, the IP address will be matched (without doing any DNS lookups) against SANs of type iPAddress or dNSName. If no iPAddress SAN is present and no matching dNSName SAN is present, the host IP address is matched against the Common Name attribute.

For backward compatibility with earlier versions of PostgreSQL, the host IP address is verified in a manner different from RFC 6125. The host IP address is always matched against dNSName SANs as well as iPAddress SANs, and can be matched against the Common Name attribute if no relevant SANs exist.

To allow server certificate verification, one or more root certificates must be placed in the file ~/.postgresql/root.crt in the user's home directory. (On Microsoft Windows the file is named %APPDATA%\postgresql\root.crt.) Intermediate certificates should also be added to the file if they are needed to link the certificate chain sent by the server to the root certificates stored on the client.

Certificate Revocation List (CRL) entries are also checked if the file ~/.postgresql/root.crl exists (%APPDATA%\postgresql\root.crl on Microsoft Windows).

The location of the root certificate file and the CRL can be changed by setting the connection parameters sslrootcert and sslcrl or the environment variables PGSSLROOTCERT and PGSSLCRL. sslcrldir or the environment variable PGSSLCRLDIR can also be used to specify a directory containing CRL files.

For backwards compatibility with earlier versions of PostgreSQL, if a root CA file exists, the behavior of sslmode=require will be the same as that of verify-ca, meaning the server certificate is validated against the CA. Relying on this behavior is discouraged, and applications that need certificate validation should always use verify-ca or verify-full.

If the server attempts to verify the identity of the client by requesting the client's leaf certificate, libpq will send the certificate(s) stored in file ~/.postgresql/postgresql.crt in the user's home directory. The certificates must chain to the root certificate trusted by the server. A matching private key file ~/.postgresql/postgresql.key must also be present. On Microsoft Windows these files are named %APPDATA%\postgresql\postgresql.crt and %APPDATA%\postgresql\postgresql.key. The location of the certificate and key files can be overridden by the connection parameters sslcert and sslkey, or by the environment variables PGSSLCERT and PGSSLKEY.

On Unix systems, the permissions on the private key file must disallow any access to world or group; achieve this by a command such as chmod 0600 ~/.postgresql/postgresql.key. Alternatively, the file can be owned by root and have group read access (that is, 0640 permissions). That setup is intended for installations where certificate and key files are managed by the operating system. The user of libpq should then be made a member of the group that has access to those certificate and key files. (On Microsoft Windows, there is no file permissions check, since the %APPDATA%\postgresql directory is presumed secure.)

The first certificate in postgresql.crt must be the client's certificate because it must match the client's private key. “Intermediate” certificates can be optionally appended to the file — doing so avoids requiring storage of intermediate certificates on the server (ssl_ca_file).

The certificate and key may be in PEM or ASN.1 DER format.

The key may be stored in cleartext or encrypted with a passphrase using any algorithm supported by OpenSSL, like AES-128. If the key is stored encrypted, then the passphrase may be provided in the sslpassword connection option. If an encrypted key is supplied and the sslpassword option is absent or blank, a password will be prompted for interactively by OpenSSL with a Enter PEM pass phrase: prompt if a TTY is available. Applications can override the client certificate prompt and the handling of the sslpassword parameter by supplying their own key password callback; see PQsetSSLKeyPassHook_OpenSSL.

For instructions on creating certificates, see Section 18.9.5.

The different values for the sslmode parameter provide different levels of protection. SSL can provide protection against three types of attacks:

If a third party can examine the network traffic between the client and the server, it can read both connection information (including the user name and password) and the data that is passed. SSL uses encryption to prevent this.

If a third party can modify the data while passing between the client and server, it can pretend to be the server and therefore see and modify data even if it is encrypted. The third party can then forward the connection information and data to the original server, making it impossible to detect this attack. Common vectors to do this include DNS poisoning and address hijacking, whereby the client is directed to a different server than intended. There are also several other attack methods that can accomplish this. SSL uses certificate verification to prevent this, by authenticating the server to the client.

If a third party can pretend to be an authorized client, it can simply access data it should not have access to. Typically this can happen through insecure password management. SSL uses client certificates to prevent this, by making sure that only holders of valid certificates can access the server.

For a connection to be known SSL-secured, SSL usage must be configured on both the client and the server before the connection is made. If it is only configured on the server, the client may end up sending sensitive information (e.g., passwords) before it knows that the server requires high security. In libpq, secure connections can be ensured by setting the sslmode parameter to verify-full or verify-ca, and providing the system with a root certificate to verify against. This is analogous to using an https URL for encrypted web browsing.

Once the server has been authenticated, the client can pass sensitive data. This means that up until this point, the client does not need to know if certificates will be used for authentication, making it safe to specify that only in the server configuration.

All SSL options carry overhead in the form of encryption and key-exchange, so there is a trade-off that has to be made between performance and security. Table 32.1 illustrates the risks the different sslmode values protect against, and what statement they make about security and overhead.

Table 32.1. SSL Mode Descriptions

The difference between verify-ca and verify-full depends on the policy of the root CA. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA. In this case, verify-full should always be used. If a local CA is used, or even a self-signed certificate, using verify-ca often provides enough protection.

The default value for sslmode is prefer. As is shown in the table, this makes no sense from a security point of view, and it only promises performance overhead if possible. It is only provided as the default for backward compatibility, and is not recommended in secure deployments.

Table 32.2 summarizes the files that are relevant to the SSL setup on the client.

Table 32.2. Libpq/Client SSL File Usage

Applications which need to be compatible with older versions of PostgreSQL, using OpenSSL version 1.0.2 or older, need to initialize the SSL library before using it. Applications which initialize libssl and/or libcrypto libraries should call PQinitOpenSSL to tell libpq that the libssl and/or libcrypto libraries have been initialized by your application, so that libpq will not also initialize those libraries. However, this is unnecessary when using OpenSSL version 1.1.0 or later, as duplicate initializations are no longer problematic.

Refer to the documentation for the version of PostgreSQL that you are targeting for details on their use.

Allows applications to select which security libraries to initialize.

This function is deprecated and only present for backwards compatibility, it does nothing.

Allows applications to select which security libraries to initialize.

This function is equivalent to PQinitOpenSSL(do_ssl, do_ssl). This function is deprecated and only present for backwards compatibility, it does nothing.

PQinitSSL and PQinitOpenSSL are maintained for backwards compatibility, but are no longer required since PostgreSQL 18. PQinitSSL has been present since PostgreSQL 8.0, while PQinitOpenSSL was added in PostgreSQL 8.4, so PQinitSSL might be preferable for applications that need to work with older versions of libpq.

**Examples:**

Example 1 (unknown):
```unknown
openssl.cnf
```

Example 2 (unknown):
```unknown
openssl version -d
```

Example 3 (unknown):
```unknown
OPENSSL_CONF
```

Example 4 (unknown):
```unknown
verify-full
```

---


---

