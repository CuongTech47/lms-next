import express from 'express';

import { activeUser, getUserInfo, loginUser, logoutUser, registrationUser , socialLogin, updateAccessToken, updateProfilePicture, updateUserPassword, updateUserProfile } from '../controllers/user.controller';

const userRouter = express.Router();

import { isAutheticated , authorizeRoles } from '../middlewares/auth';


userRouter.post('/register', registrationUser);

userRouter.post('/activate-user',activeUser);

userRouter.post('/login-user',loginUser);
userRouter.post('/social-login',socialLogin);


// authentication

userRouter.use(isAutheticated);

// check user role

// userRouter.use(authorizeRoles('admin'));

userRouter.get('/logout-user',logoutUser);
userRouter.get('/refresh-token',updateAccessToken);
userRouter.get('/me',getUserInfo);

userRouter.put('/update-user-info',updateUserProfile);
userRouter.put('/update-user-password',updateUserPassword);
userRouter.put('/update-user-avatar',updateProfilePicture);
export default userRouter;