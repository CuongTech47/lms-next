import { redis } from "../configs/redis.conf";
import userModel from "../models/user.model";
import { Response } from "express";


export const getUserById = async (id:string , res : Response) => {
    const userJson = await redis.get(id);

    if(userJson){
        const user = JSON.parse(userJson );
        res.status(200).json({
            success:true,
            user
        });
    }
    
}

