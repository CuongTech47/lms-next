import { Redis } from "ioredis";

require("dotenv").config();

const redisClient = () => {
    if(process.env.REDIS_URL) {
        console.log("Redis connected", process.env.REDIS_URL)
        return new Redis(process.env.REDIS_URL)
    }
    throw new Error("Redis url not found")
}

export const redis = new Redis(redisClient() as any);