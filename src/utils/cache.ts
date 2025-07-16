import NodeCache from 'node-cache';

const cache = new NodeCache({
    stdTTL: 60, // cache TTL in seconds (e.g., 60s)
    checkperiod: 120, // how often to check for expired keys
});

export default cache;
