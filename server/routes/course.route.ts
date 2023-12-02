import express from 'express';
import { uploadCourse } from '../controllers/course.controller';
import { authorizeRoles, isAutheticated } from '../middlewares/auth';
const courseRouter = express.Router();



// authentication
courseRouter.use(isAutheticated);
// check user role
// courseRouter.use(authorizeRoles('admin'));
courseRouter.post('/create-course', uploadCourse);

export default courseRouter;