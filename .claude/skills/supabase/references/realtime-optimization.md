# Realtime Optimization Guide

## Performance Targets

| Metric | Target |
|--------|--------|
| Connection Latency | < 100ms |
| Message Latency | < 50ms |
| Throughput | 1000+ msg/sec |
| Stability | 99.9% uptime |
| Payload Size | < 1KB average |
| Memory per Subscription | < 10MB |

## Subscription Patterns

### Optimized Subscription
```typescript
const subscription = supabase
  .channel('optimized-channel')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'messages',
    filter: 'room_id=eq.123'  // Always filter when possible
  }, handleUpdate)
  .subscribe();
```

### Channel Management
```typescript
// Clean up subscriptions
useEffect(() => {
  const channel = supabase.channel('my-channel');

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Batch Updates
```typescript
// Instead of multiple subscriptions
const channels = ['table1', 'table2', 'table3'];

// Use single channel with multiple listeners
const channel = supabase.channel('combined');
channels.forEach(table => {
  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table
  }, handleChange);
});
channel.subscribe();
```

## Connection Management

### Retry Strategy
```typescript
const subscription = supabase
  .channel('my-channel', {
    config: {
      broadcast: { self: true },
      presence: { key: '' },
    },
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected');
    }
    if (status === 'CHANNEL_ERROR') {
      // Implement exponential backoff
      setTimeout(() => subscription.subscribe(), retryDelay);
    }
  });
```

### Connection Health
```typescript
// Monitor connection state
supabase.realtime.setAuth(token);

// Check connection status
const isConnected = supabase.realtime.isConnected();
```

## Performance Optimization

### Filter at Database Level
```sql
-- Enable realtime only for needed tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Use RLS to filter - reduces transmitted data
CREATE POLICY "messages_realtime" ON public.messages
FOR SELECT TO authenticated
USING (room_id IN (
  SELECT room_id FROM public.room_members
  WHERE user_id = (SELECT auth.uid())
));
```

### Reduce Payload Size
```typescript
// Select only needed columns in your queries
// Realtime sends full row by default

// For large tables, consider using triggers
// to emit only changed fields
```

### Debounce Rapid Updates
```typescript
import { debounce } from 'lodash';

const handleUpdate = debounce((payload) => {
  // Process update
}, 100);
```

## Debugging

### Connection Issues
1. Check WebSocket connection in DevTools
2. Verify JWT token is valid
3. Check RLS policies allow subscription
4. Test with different networks

### Performance Issues
1. Profile message processing time
2. Check subscription count
3. Monitor memory usage
4. Analyze payload sizes

### Common Problems

| Problem | Solution |
|---------|----------|
| Frequent disconnects | Implement retry with backoff |
| High latency | Filter subscriptions, reduce payload |
| Memory leaks | Clean up subscriptions on unmount |
| Missing updates | Check RLS policies, verify filter |

## Monitoring

### Key Metrics
- Active connections count
- Messages per second
- Average latency
- Error rate
- Subscription count per user

### Logging
```typescript
supabase.realtime.onMessage((msg) => {
  console.log('Realtime message:', msg);
});

supabase.realtime.onError((error) => {
  console.error('Realtime error:', error);
});
```
