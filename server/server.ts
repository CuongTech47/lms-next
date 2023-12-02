import { app } from "./app";
import cloudinaryConfig from "./configs/cloudinary.conf"


require("dotenv").config();

//cloudinary config
cloudinaryConfig()


          

//create server

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
