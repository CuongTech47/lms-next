require("dotenv").config();

import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../helpers/errorHandler";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import { catchAsync } from "../middlewares/catchAsyncErrors";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../configs/redis.conf";
import { getUserById } from "../services/user.service";
import cloudinary from "cloudinary";
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

// registrationUser
export const registrationUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body;
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler(400, "Email already exist !!!"));
      }
      const user: IRegistrationBody = {
        email,
        name,
        password,
      };
      const activationToken = await createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };

      const html = await ejs.renderFile(
        path.join(__dirname, "../templates/mails/activation-mail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Active your account",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          sucsses: true,
          message: "Plesase check your email to activate your account",
          activationToken: activationToken.token,
        });
      } catch (err: any) {
        return next(new ErrorHandler(400, err.message));
      }
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_TOKEN_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// active user

interface IActiveUserRequest {
  activation_code: string;
  activation_token: string;
}

export const activeUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_code, activation_token } =
        req.body as IActiveUserRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET as string
      ) as { user: IUser; activationCode: string };
      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler(400, "Incorrect activation code"));
      }
      const { name, email, password, avatar } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler(400, "Email already exist"));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
      });
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

// login user

interface ILoginUserRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginUserRequest;
      if (!email || !password) {
        return next(new ErrorHandler(400, "Please enter email & password"));
      }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler(400, "Incorrect email or password"));
      }

      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return next(new ErrorHandler(400, "Incorrect email or password"));
      }

      sendToken(user, 200, res);
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

// logout user

export const logoutUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", {
        maxAge: 1,
      });

      res.cookie("refresh_token", "", {
        maxAge: 1,
      });

      const userId = req.user?._id || "";

      redis.del(userId);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(400, err.message));
    }
  }
);

// update access token

export const updateAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload;

      const message = "Invalid refresh token";
      if (!decoded) {
        return next(new ErrorHandler(400, message));
      }

      const session = await redis.get(decoded.id);
      if (!session) {
        return next(new ErrorHandler(400, message));
      }

      const user = JSON.parse(session);
      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: "5m" }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: "3d" }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// get user profile

export const getUserInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// social login

interface ISocialLoginRequest {
  name: string;
  email: string;
  avatar: string;
}

export const socialLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, avatar } = req.body as ISocialLoginRequest;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// update user profile

interface IUpdateUserProfileRequest {
  name: string;
  email: string;
}

export const updateUserProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserProfileRequest;

      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (email && user) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler(400, "Email already exist !!!"));
        }
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();
      await redis.set(userId.toString(), JSON.stringify(user) as any);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);


// update user password

interface IUpdateUserPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const updateUserPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => { 
  try {
    const { currentPassword, newPassword } = req.body as IUpdateUserPasswordRequest;

    if(!currentPassword || !newPassword) {
      return next(new ErrorHandler(400, "Please enter current password and new password"));
    }

    const user = await userModel.findById(req.user?._id).select("+password");

    

    if(user?.password === undefined) {
      return next(new ErrorHandler(400, "Please login to change password"));
    }


    const isMatch = await user?.comparePassword(currentPassword);

    
    if (!isMatch) {
      return next(new ErrorHandler(400, "Incorrect old password"));
    }

    user.password = newPassword;
    await user.save();
    await redis.set(user?._id.toString(), JSON.stringify(user) as any);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return next(new ErrorHandler(400, error.message));
  }
});


// update profile picture

interface IUpdateProfilePictureRequest {
  avatar: string;
}

export const updateProfilePicture = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {avatar} = req.body as IUpdateProfilePictureRequest;
    const userId = req.user?._id;

    const user = await userModel.findById(userId);

    if(avatar && user) {
      // if we have old avatar
      if(user?.avatar?.public_id) {
        // first delete old avatar
        await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
  
      }else {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
          width: 150,
        });
        user.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }
    }
    await user?.save();
    await redis.set(user?._id.toString(), JSON.stringify(user) as any);

    res.status(200).json({
      sucess: true,
      user
    });
    
  } catch (error: any) {
    return next(new ErrorHandler(400, error.message));
  }
});