# PostgreSQL - Replication

## 29.3. Logical Replication Failover #


**URL:** https://www.postgresql.org/docs/18/logical-replication-failover.html

**Contents:**
- 29.3. Logical Replication Failover #

To allow subscriber nodes to continue replicating data from the publisher node even when the publisher node goes down, there must be a physical standby corresponding to the publisher node. The logical slots on the primary server corresponding to the subscriptions can be synchronized to the standby server by specifying failover = true when creating subscriptions. See Section 47.2.3 for details. Enabling the failover parameter ensures a seamless transition of those subscriptions after the standby is promoted. They can continue subscribing to publications on the new primary server.

Because the slot synchronization logic copies asynchronously, it is necessary to confirm that replication slots have been synced to the standby server before the failover happens. To ensure a successful failover, the standby server must be ahead of the subscriber. This can be achieved by configuring synchronized_standby_slots.

To confirm that the standby server is indeed ready for failover for a given subscriber, follow these steps to verify that all the logical replication slots required by that subscriber have been synchronized to the standby server:

On the subscriber node, use the following SQL to identify which replication slots should be synced to the standby that we plan to promote. This query will return the relevant replication slots associated with the failover-enabled subscriptions.

On the subscriber node, use the following SQL to identify which table synchronization slots should be synced to the standby that we plan to promote. This query needs to be run on each database that includes the failover-enabled subscription(s). Note that the table sync slot should be synced to the standby server only if the table copy is finished (See Section 52.55). We don't need to ensure that the table sync slots are synced in other scenarios as they will either be dropped or re-created on the new primary server in those cases.

Check that the logical replication slots identified above exist on the standby server and are ready for failover.

If all the slots are present on the standby server and the result (failover_ready) of the above SQL query is true, then existing subscriptions can continue subscribing to publications on the new primary server.

The first two steps in the above procedure are meant for a PostgreSQL subscriber. It is recommended to run these steps on each subscriber node, that will be served by the designated standby after failover, to obtain the complete list of replication slots. This list can then be verified in Step 3 to ensure failover readiness. Non-PostgreSQL subscribers, on the other hand, may use their own methods to identify the replication slots used by their respective subscriptions.

In some cases, such as during a planned failover, it is necessary to confirm that all subscribers, whether PostgreSQL or non-PostgreSQL, will be able to continue replication after failover to a given standby server. In such cases, use the following SQL, instead of performing the first two steps above, to identify which replication slots on the primary need to be synced to the standby that is intended for promotion. This query returns the relevant replication slots associated with all the failover-enabled subscriptions.

**Examples:**

Example 1 (unknown):
```unknown
failover = true
```

Example 2 (unknown):
```unknown
synchronized_standby_slots
```

Example 3 (sql):
```sql
/* sub # */ SELECT
               array_agg(quote_literal(s.subslotname)) AS slots
           FROM  pg_subscription s
           WHERE s.subfailover AND
                 s.subslotname IS NOT NULL;
 slots
-------
 {'sub1','sub2','sub3'}
(1 row)
```

Example 4 (sql):
```sql
/* sub # */ SELECT
               array_agg(quote_literal(slot_name)) AS slots
           FROM
           (
               SELECT CONCAT('pg_', srsubid, '_sync_', srrelid, '_', ctl.system_identifier) AS slot_name
               FROM pg_control_system() ctl, pg_subscription_rel r, pg_subscription s
               WHERE r.srsubstate = 'f' AND s.oid = r.srsubid AND s.subfailover
           );
 slots
-------
 {'pg_16394_sync_16385_7394666715149055164'}
(1 row)
```

---


---

## 29.4. Row Filters #


**URL:** https://www.postgresql.org/docs/18/logical-replication-row-filter.html

**Contents:**
- 29.4. Row Filters #
  - 29.4.1. Row Filter Rules #
  - 29.4.2. Expression Restrictions #
  - 29.4.3. UPDATE Transformations #
  - 29.4.4. Partitioned Tables #
  - 29.4.5. Initial Data Synchronization #
  - Warning
  - Note
  - 29.4.6. Combining Multiple Row Filters #
  - 29.4.7. Examples #

By default, all data from all published tables will be replicated to the appropriate subscribers. The replicated data can be reduced by using a row filter. A user might choose to use row filters for behavioral, security or performance reasons. If a published table sets a row filter, a row is replicated only if its data satisfies the row filter expression. This allows a set of tables to be partially replicated. The row filter is defined per table. Use a WHERE clause after the table name for each published table that requires data to be filtered out. The WHERE clause must be enclosed by parentheses. See CREATE PUBLICATION for details.

Row filters are applied before publishing the changes. If the row filter evaluates to false or NULL then the row is not replicated. The WHERE clause expression is evaluated with the same role used for the replication connection (i.e. the role specified in the CONNECTION clause of the CREATE SUBSCRIPTION). Row filters have no effect for TRUNCATE command.

The WHERE clause allows only simple expressions. It cannot contain user-defined functions, operators, types, and collations, system column references or non-immutable built-in functions.

If a publication publishes UPDATE or DELETE operations, the row filter WHERE clause must contain only columns that are covered by the replica identity (see REPLICA IDENTITY). If a publication publishes only INSERT operations, the row filter WHERE clause can use any column.

Whenever an UPDATE is processed, the row filter expression is evaluated for both the old and new row (i.e. using the data before and after the update). If both evaluations are true, it replicates the UPDATE change. If both evaluations are false, it doesn't replicate the change. If only one of the old/new rows matches the row filter expression, the UPDATE is transformed to INSERT or DELETE, to avoid any data inconsistency. The row on the subscriber should reflect what is defined by the row filter expression on the publisher.

If the old row satisfies the row filter expression (it was sent to the subscriber) but the new row doesn't, then, from a data consistency perspective the old row should be removed from the subscriber. So the UPDATE is transformed into a DELETE.

If the old row doesn't satisfy the row filter expression (it wasn't sent to the subscriber) but the new row does, then, from a data consistency perspective the new row should be added to the subscriber. So the UPDATE is transformed into an INSERT.

Table 29.1 summarizes the applied transformations.

Table 29.1. UPDATE Transformation Summary

If the publication contains a partitioned table, the publication parameter publish_via_partition_root determines which row filter is used. If publish_via_partition_root is true, the root partitioned table's row filter is used. Otherwise, if publish_via_partition_root is false (default), each partition's row filter is used.

If the subscription requires copying pre-existing table data and a publication contains WHERE clauses, only data that satisfies the row filter expressions is copied to the subscriber.

If the subscription has several publications in which a table has been published with different WHERE clauses, rows that satisfy any of the expressions will be copied. See Section 29.4.6 for details.

Because initial data synchronization does not take into account the publish parameter when copying existing table data, some rows may be copied that would not be replicated using DML. Refer to Section 29.9.1, and see Section 29.2.2 for examples.

If the subscriber is in a release prior to 15, copy pre-existing data doesn't use row filters even if they are defined in the publication. This is because old releases can only copy the entire table data.

If the subscription has several publications in which the same table has been published with different row filters (for the same publish operation), those expressions get ORed together, so that rows satisfying any of the expressions will be replicated. This means all the other row filters for the same table become redundant if:

One of the publications has no row filter.

One of the publications was created using FOR ALL TABLES. This clause does not allow row filters.

One of the publications was created using FOR TABLES IN SCHEMA and the table belongs to the referred schema. This clause does not allow row filters.

Create some tables to be used in the following examples.

Create some publications. Publication p1 has one table (t1) and that table has a row filter. Publication p2 has two tables. Table t1 has no row filter, and table t2 has a row filter. Publication p3 has two tables, and both of them have a row filter.

psql can be used to show the row filter expressions (if defined) for each publication.

psql can be used to show the row filter expressions (if defined) for each table. See that table t1 is a member of two publications, but has a row filter only in p1. See that table t2 is a member of two publications, and has a different row filter in each of them.

On the subscriber node, create a table t1 with the same definition as the one on the publisher, and also create the subscription s1 that subscribes to the publication p1.

Insert some rows. Only the rows satisfying the t1 WHERE clause of publication p1 are replicated.

Update some data, where the old and new row values both satisfy the t1 WHERE clause of publication p1. The UPDATE replicates the change as normal.

Update some data, where the old row values did not satisfy the t1 WHERE clause of publication p1, but the new row values do satisfy it. The UPDATE is transformed into an INSERT and the change is replicated. See the new row on the subscriber.

Update some data, where the old row values satisfied the t1 WHERE clause of publication p1, but the new row values do not satisfy it. The UPDATE is transformed into a DELETE and the change is replicated. See that the row is removed from the subscriber.

The following examples show how the publication parameter publish_via_partition_root determines whether the row filter of the parent or child table will be used in the case of partitioned tables.

Create a partitioned table on the publisher.

Create the same tables on the subscriber.

Create a publication p4, and then subscribe to it. The publication parameter publish_via_partition_root is set as true. There are row filters defined on both the partitioned table (parent), and on the partition (child).

Insert some values directly into the parent and child tables. They replicate using the row filter of parent (because publish_via_partition_root is true).

Repeat the same test, but with a different value for publish_via_partition_root. The publication parameter publish_via_partition_root is set as false. A row filter is defined on the partition (child).

Do the inserts on the publisher same as before. They replicate using the row filter of child (because publish_via_partition_root is false).

**Examples:**

Example 1 (unknown):
```unknown
REPLICA IDENTITY
```

Example 2 (unknown):
```unknown
publish_via_partition_root
```

Example 3 (unknown):
```unknown
publish_via_partition_root
```

Example 4 (unknown):
```unknown
publish_via_partition_root
```

---


---

## 29.13. Upgrade #


**URL:** https://www.postgresql.org/docs/18/logical-replication-upgrade.html

**Contents:**
- 29.13. Upgrade #
  - 29.13.1. Prepare for Publisher Upgrades #
  - 29.13.2. Prepare for Subscriber Upgrades #
  - 29.13.3. Upgrading Logical Replication Clusters #
  - Note
  - Warning
    - 29.13.3.1. Steps to Upgrade a Two-node Logical Replication Cluster #
  - Note
    - 29.13.3.2. Steps to Upgrade a Cascaded Logical Replication Cluster #
    - 29.13.3.3. Steps to Upgrade a Two-node Circular Logical Replication Cluster #

Migration of logical replication clusters is possible only when all the members of the old logical replication clusters are version 17.0 or later.

pg_upgrade attempts to migrate logical slots. This helps avoid the need for manually defining the same logical slots on the new publisher. Migration of logical slots is only supported when the old cluster is version 17.0 or later. Logical slots on clusters before version 17.0 will silently be ignored.

Before you start upgrading the publisher cluster, ensure that the subscription is temporarily disabled, by executing ALTER SUBSCRIPTION ... DISABLE. Re-enable the subscription after the upgrade.

There are some prerequisites for pg_upgrade to be able to upgrade the logical slots. If these are not met an error will be reported.

The new cluster must have wal_level as logical.

The new cluster must have max_replication_slots configured to a value greater than or equal to the number of slots present in the old cluster.

The output plugins referenced by the slots on the old cluster must be installed in the new PostgreSQL executable directory.

The old cluster has replicated all the transactions and logical decoding messages to subscribers.

All slots on the old cluster must be usable, i.e., there are no slots whose pg_replication_slots.conflicting is not true.

The new cluster must not have permanent logical slots, i.e., there must be no slots where pg_replication_slots.temporary is false.

Setup the subscriber configurations in the new subscriber. pg_upgrade attempts to migrate subscription dependencies which includes the subscription's table information present in pg_subscription_rel system catalog and also the subscription's replication origin. This allows logical replication on the new subscriber to continue from where the old subscriber was up to. Migration of subscription dependencies is only supported when the old cluster is version 17.0 or later. Subscription dependencies on clusters before version 17.0 will silently be ignored.

There are some prerequisites for pg_upgrade to be able to upgrade the subscriptions. If these are not met an error will be reported.

All the subscription tables in the old subscriber should be in state i (initialize) or r (ready). This can be verified by checking pg_subscription_rel.srsubstate.

The replication origin entry corresponding to each of the subscriptions should exist in the old cluster. This can be found by checking pg_subscription and pg_replication_origin system tables.

The new cluster must have max_active_replication_origins configured to a value greater than or equal to the number of subscriptions present in the old cluster.

While upgrading a subscriber, write operations can be performed in the publisher. These changes will be replicated to the subscriber once the subscriber upgrade is completed.

The logical replication restrictions apply to logical replication cluster upgrades also. See Section 29.8 for details.

The prerequisites of publisher upgrade apply to logical replication cluster upgrades also. See Section 29.13.1 for details.

The prerequisites of subscriber upgrade apply to logical replication cluster upgrades also. See Section 29.13.2 for details.

Upgrading logical replication cluster requires multiple steps to be performed on various nodes. Because not all operations are transactional, the user is advised to take backups as described in Section 25.3.2.

The steps to upgrade the following logical replication clusters are detailed below:

Follow the steps specified in Section 29.13.3.1 to upgrade a two-node logical replication cluster.

Follow the steps specified in Section 29.13.3.2 to upgrade a cascaded logical replication cluster.

Follow the steps specified in Section 29.13.3.3 to upgrade a two-node circular logical replication cluster.

Let's say publisher is in node1 and subscriber is in node2. The subscriber node2 has a subscription sub1_node1_node2 which is subscribing the changes from node1.

Disable all the subscriptions on node2 that are subscribing the changes from node1 by using ALTER SUBSCRIPTION ... DISABLE, e.g.:

Stop the publisher server in node1, e.g.:

Initialize data1_upgraded instance by using the required newer version.

Upgrade the publisher node1's server to the required newer version, e.g.:

Start the upgraded publisher server in node1, e.g.:

Stop the subscriber server in node2, e.g.:

Initialize data2_upgraded instance by using the required newer version.

Upgrade the subscriber node2's server to the required new version, e.g.:

Start the upgraded subscriber server in node2, e.g.:

On node2, create any tables that were created in the upgraded publisher node1 server between Step 1 and now, e.g.:

Enable all the subscriptions on node2 that are subscribing the changes from node1 by using ALTER SUBSCRIPTION ... ENABLE, e.g.:

Refresh the node2 subscription's publications using ALTER SUBSCRIPTION ... REFRESH PUBLICATION, e.g.:

In the steps described above, the publisher is upgraded first, followed by the subscriber. Alternatively, the user can use similar steps to upgrade the subscriber first, followed by the publisher.

Let's say we have a cascaded logical replication setup node1->node2->node3. Here node2 is subscribing the changes from node1 and node3 is subscribing the changes from node2. The node2 has a subscription sub1_node1_node2 which is subscribing the changes from node1. The node3 has a subscription sub1_node2_node3 which is subscribing the changes from node2.

Disable all the subscriptions on node2 that are subscribing the changes from node1 by using ALTER SUBSCRIPTION ... DISABLE, e.g.:

Stop the server in node1, e.g.:

Initialize data1_upgraded instance by using the required newer version.

Upgrade the node1's server to the required newer version, e.g.:

Start the upgraded server in node1, e.g.:

Disable all the subscriptions on node3 that are subscribing the changes from node2 by using ALTER SUBSCRIPTION ... DISABLE, e.g.:

Stop the server in node2, e.g.:

Initialize data2_upgraded instance by using the required newer version.

Upgrade the node2's server to the required new version, e.g.:

Start the upgraded server in node2, e.g.:

On node2, create any tables that were created in the upgraded publisher node1 server between Step 1 and now, e.g.:

Enable all the subscriptions on node2 that are subscribing the changes from node1 by using ALTER SUBSCRIPTION ... ENABLE, e.g.:

Refresh the node2 subscription's publications using ALTER SUBSCRIPTION ... REFRESH PUBLICATION, e.g.:

Stop the server in node3, e.g.:

Initialize data3_upgraded instance by using the required newer version.

Upgrade the node3's server to the required new version, e.g.:

Start the upgraded server in node3, e.g.:

On node3, create any tables that were created in the upgraded node2 between Step 6 and now, e.g.:

Enable all the subscriptions on node3 that are subscribing the changes from node2 by using ALTER SUBSCRIPTION ... ENABLE, e.g.:

Refresh the node3 subscription's publications using ALTER SUBSCRIPTION ... REFRESH PUBLICATION, e.g.:

Let's say we have a circular logical replication setup node1->node2 and node2->node1. Here node2 is subscribing the changes from node1 and node1 is subscribing the changes from node2. The node1 has a subscription sub1_node2_node1 which is subscribing the changes from node2. The node2 has a subscription sub1_node1_node2 which is subscribing the changes from node1.

Disable all the subscriptions on node2 that are subscribing the changes from node1 by using ALTER SUBSCRIPTION ... DISABLE, e.g.:

Stop the server in node1, e.g.:

Initialize data1_upgraded instance by using the required newer version.

Upgrade the node1's server to the required newer version, e.g.:

Start the upgraded server in node1, e.g.:

Enable all the subscriptions on node2 that are subscribing the changes from node1 by using ALTER SUBSCRIPTION ... ENABLE, e.g.:

On node1, create any tables that were created in node2 between Step 1 and now, e.g.:

Refresh the node1 subscription's publications to copy initial table data from node2 using ALTER SUBSCRIPTION ... REFRESH PUBLICATION, e.g.:

Disable all the subscriptions on node1 that are subscribing the changes from node2 by using ALTER SUBSCRIPTION ... DISABLE, e.g.:

Stop the server in node2, e.g.:

Initialize data2_upgraded instance by using the required newer version.

Upgrade the node2's server to the required new version, e.g.:

Start the upgraded server in node2, e.g.:

Enable all the subscriptions on node1 that are subscribing the changes from node2 by using ALTER SUBSCRIPTION ... ENABLE, e.g.:

On node2, create any tables that were created in the upgraded node1 between Step 9 and now, e.g.:

Refresh the node2 subscription's publications to copy initial table data from node1 using ALTER SUBSCRIPTION ... REFRESH PUBLICATION, e.g.:

**Examples:**

Example 1 (unknown):
```unknown
ALTER SUBSCRIPTION ... DISABLE
```

Example 2 (unknown):
```unknown
max_replication_slots
```

Example 3 (unknown):
```unknown
conflicting
```

Example 4 (unknown):
```unknown
max_active_replication_origins
```

---


---

