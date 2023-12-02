require("dotenv").config();

import mongoose , {Document, Schema , Model} from "mongoose";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    },
    role: string;
    isVerified: boolean;
    courses: Array<{ courseId: string }>;
    comparePassword: (password: string) => Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
}


const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: {
            validator: function (val: string) {
                return emailRegex.test(val);
            },
            message: "Please enter a valid email",
        }
    },
    password: {
        type: String,
       
        minlength: [6, "Password must be longer than 6 characters"],
        select: false,
    
    },
    avatar: {
        public_id: String,
        url: String,
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    courses:[
        {
            courseId: String
        }
    ]
},{
    timestamps: true,
});


// HASH PASSWORD BEFORE SAVING USER

userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    this.password = await bcrypt.hash(this.password, 10);
})

// sign access token
userSchema.methods.SignAccessToken = function (): string {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: "5m" });
}

// sign refresh token
userSchema.methods.SignRefreshToken = function (): string {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: "3d" });
}


// compare user password

userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
}


const userModel: Model<IUser> = mongoose.model("User", userSchema);


export default userModel;