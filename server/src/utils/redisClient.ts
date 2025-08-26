import { createClient } from 'redis';

export const redis = createClient({
    username: 'default',
    password: `${process.env.REDIS_PASSWORD}`,
    socket: {
        host: `${process.env.REDIS_HOST}`,
        port: 19440
    }
});

redis.on('error', (err: any) => console.log('Redis Client Error', err));

await redis.connect();

await redis.set('foo', 'bar');
const result = await redis.get('foo');
console.log(result)  // >>> bar

