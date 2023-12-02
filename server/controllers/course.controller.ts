import { Request , Response , NextFunction } from "express";

import courseModel from "../models/course.model";


import { catchAsync } from "../middlewares/catchAsyncErrors";

import  ErrorHandler  from "../helpers/errorHandler";

import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";





// upload course 


export const uploadCourse = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body
       
        const thumbnail = data.thumbnail
       
        
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            })
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

       
        
        createCourse(data,res,next)
    } catch (err: any) {
        return next(new ErrorHandler(400, err.message));
      }
})

