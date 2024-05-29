import Redis from "ioredis";
import env from "./env";

const redis = new Redis({
  host: env.REDIS_IP,
  family: 6,
  // password: env.REDIS_PWD,
});

redis.on("error", (err) => {
  console.log("Redis error", err);
});

export default redis;
