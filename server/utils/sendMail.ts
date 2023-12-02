import nodemailer, {Transporter} from 'nodemailer'
require("dotenv").config();
import ejs from "ejs";

import path from "path";

interface IEmailData {
  email: string;
  subject: string;
  template: string;
  data: {[key: string]:any};
  
}

const sendMail = async (emailData: IEmailData):Promise<void> => {
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        service: process.env.SMTP_SERVICE,
        auth : {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }

    })

    const {email, subject, template, data} = emailData

    const templatePath = path.join(__dirname,"../templates/mails",template)

    const html = await ejs.renderFile(templatePath, data)

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject,
        html
    }

    await transporter.sendMail(mailOptions)

}

export default sendMail