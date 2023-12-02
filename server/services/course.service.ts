import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../helpers/errorHandler";
import courseModel from "../models/course.model";
import { catchAsync } from "../middlewares/catchAsyncErrors";

export const createCourse = catchAsync(
  async (data: any, res: Response, next: NextFunction) => {
    
    const course = await courseModel.create(data);
    res.status(201).json({
      success: true,
      course,
    });
  }
);
