import { NextFunction, Request, Response } from "express";
import { catchAsync } from "./catchAsyncErrors";
import ErrorHandler from "../helpers/errorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../configs/redis.conf";
require("dotenv").config();

// autheticated user
export const isAutheticated = catchAsync(async(req: Request , res: Response , next:NextFunction) => {
   const access_token = req.cookies.access_token;

   if(!access_token){
       return next(new ErrorHandler(400,'Please login to access this resource'));
   }

   const decoded = jwt.verify(access_token,process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;

   if(!decoded){
       return next(new ErrorHandler(400,'Invalid access token'));
   }

   const user = await redis.get(decoded.id);

   if(!user){
       return next(new ErrorHandler(400,'User not found'));
   }

   req.user = JSON.parse(user);

    next();

})


// valid user role

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(400, `Role (${req.user?.role}) is not allowed to access this resource`));
        }
        next();
    }
}