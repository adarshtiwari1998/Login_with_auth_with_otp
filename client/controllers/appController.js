
import UserModel from '../model/User.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from '../config.js';
import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: ENV.EMAIL,
        pass: ENV.PASSWORD,
    },
});



/** middleware for verify user */
export async function verifyUser(req, res, next){
    try {
        
        const { username } = req.method == "GET" ? req.query : req.body;

        // check the user existance
        let exist = await UserModel.findOne({ username });
        if(!exist) return res.status(404).send({ error : "Can't find User!"});
        next();

    } catch (error) {
        return res.status(404).send({ error: "Authentication Error"});
    }
}


/** POST: http://localhost:8080/api/register 
 * @param : {
  "username" : "example123",
  "password" : "admin123",
  "email": "example@gmail.com",
  "firstName" : "bill",
  "lastName": "william",
  "mobile": 8009860560,
  "address" : "Apt. 556, Kulas Light, Gwenborough",
  "profile": ""
}
*/
export async function register(req, res) {
    try {
        const { username, password, profile, email } = req.body;

        const existUsername = UserModel.findOne({ username });
        const existEmail = UserModel.findOne({ email });

        Promise.all([existUsername, existEmail])
            .then(([existingUsername, existingEmail]) => {
                if (existingUsername) {
                    return res.status(400).send({ error: "Please use a unique username." });
                }
                if (existingEmail) {
                    return res.status(400).send({ error: "Please use a unique email." });
                }

                if (password) {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            const user = new UserModel({
                                username,
                                password: hashedPassword,
                                profile: profile || '',
                                email,
                                verified: false
                            });

                            user.save()
                              .then((result) => {
                                UserOtpVerification(result, res);
                              })
                                // .then(result => res.status(201).send({ msg: "User registered successfully" }))
                                .catch(saveError => res.status(500).send({ error: saveError }));
                        })
                        .catch(hashError => res.status(500).send({ error: "Unable to hash password" }));
                }
            })
            .catch(error => {
                console.error("Error during registration:", error);
                return res.status(500).send({ error: "Internal Server Error" });
            });
    } catch (error) {
        console.error("Error in try-catch block:", error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}


/** POST: http://localhost:8080/api/login 
 * @param: {
  "username" : "example123",
  "password" : "admin123"
}
*/

export async function login(req,res){
   
    const { username, password } = req.body;

    try {
        
        UserModel.findOne({ username })
            .then(user => {
                bcrypt.compare(password, user.password)
                    .then(passwordCheck => {

                        if(!passwordCheck) return res.status(400).send({ error: "Don't have Password"});

                        // create jwt token
                        const token = jwt.sign({
                                        userId: user._id,
                                        username : user.username
                                    }, ENV.JWT_SECRET , { expiresIn : "24h"});

                        return res.status(200).send({
                            msg: "Login Successful...!",
                            username: user.username,
                            token
                        });                                    

                    })
                    .catch(error =>{
                        return res.status(400).send({ error: "Password does not Match"})
                    })
            })
            .catch( error => {
                return res.status(404).send({ error : "Username not Found"});
            })

    } catch (error) {
        return res.status(500).send({ error});
    }
}


/** GET: http://localhost:8080/api/user/example123 */
export async function getUser(req, res) {
    const { username } = req.params;

    try {
        console.log("Requested Username:", username); // Log the username received in the request

        if (!username) {
            console.log("Invalid Username:", username);
            return res.status(400).send({ error: "Invalid Username" });
        }

        const user = await UserModel.findOne({ username });

        if (!user) {
            console.log("User not found for username:", username);
            return res.status(404).send({ error: "Couldn't find the user" });
        }

        /** remove password from user */
       // mongoose return unnecessary data with object so convert it into json

        const { password, ...rest } = Object.assign({}, user.toJSON()) // Convert Mongoose object to plain JS object

        return res.status(200).send(rest);
    } catch (error) {
        console.error("Error in getUser:", error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}


/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
  "header" : "<token>"
}
body: {
    firstName: '',
    address : '',
    profile : ''
}
*/
export async function updateUser(req, res) {
    try {
        const { userId } = req.user; // Extracting user ID from query parameter

        if (userId) {
            const body = req.body;

            // update the data
            const updatedUser = await UserModel.updateOne({ _id: userId }, body);

            if (updatedUser.nModified === 0) {
                return res.status(404).send({ error: "User not found or no changes applied" });
            }

            return res.status(200).send({ msg: "Record Updated" });
        } else {
            return res.status(400).send({ error: "User ID not provided" });
        }
    } catch (error) {
        console.error("Error in updateUser:", error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}


 /** GET: http://localhost:8080/api/generateOTP */
 export async function generateOTP(req,res){
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
    res.status(201).send({ code: req.app.locals.OTP })
}


/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req,res){
    const { code } = req.query;
    if(parseInt(req.app.locals.OTP) === parseInt(code)){
        req.app.locals.OTP = null; // reset the OTP value
        req.app.locals.resetSession = true; // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!'})
    }
    return res.status(400).send({ error: "Invalid OTP"});
}

 
// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req,res){
    if(req.app.locals.resetSession){
         return res.status(201).send({ flag : req.app.locals.resetSession})
    }
    return res.status(440).send({error : "Session expired!"})
 }

export async function resetPassword(req, res) {
    try {
        const { username, password } = req.body;

        if (req.app.locals.resetSession && username && password) {
            UserModel.findOne({ username })
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModel.updateOne({ username: user.username }, { password: hashedPassword })
                                .then(() => {
                                    // Password updated successfully
                                    req.app.locals.resetSession = false; // Reset the session flag
                                    return res.status(201).send({ msg: "Password Updated Successfully!" });
                                })
                                .catch(updateError => {
                                    return res.status(500).send({ error: "Error updating password" });
                                });
                        })
                        .catch(hashError => {
                            return res.status(500).send({ error: "Unable to hash password" });
                        });
                })
                .catch(error => {
                    return res.status(404).send({ error: "Username not Found" });
                });
        } else {
            return res.status(400).send({ error: "Invalid request or session expired!" });
        }

    } catch (error) {
        return res.status(500).send({ error: "Internal Server Error" });
    }
}



// res.status(201).send({ code: req.app.locals.OTP });
 
export async function sendOtpVerificationEmail ( req, res, { email, username}) {
  try {
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
    const otp =  res.status(201).send({ code: req.app.locals.OTP });
 
    
 const mailOptions = {
     from: ENV.EMAIL, // Sender email
     to: email, // Receiver email
     subject: 'OTP Verification',
     html: `OTP Is ${otp} `
 };
 
     const saltRounds = 10;
 
     const hashedOTP = await bcrypt.hash(otp, saltRounds);
     const newOtpVerification = await new UserOtpVerification({
         userId: _id,
         otp: hashedOTP,
         createdAt: Date.now(),
         expiresAt: Date.now() + 3600000
     });
 
     await newOtpVerification.save();
     await transporter.sendMail(mailOptions);
     res.json({
         status: "Pending",
         message: "Verification OTP Email Sent",
         data: {
             username,
             email,
         }
     });
  } catch (error) {

  }
  }
  
  export async function verifyOTPRegistrationEmail(req, res) {
    try {
      const { username, code } = req.query;
      if (parseInt(req.app.locals.OTP) === parseInt(code)) {
        req.app.locals.OTP = null;
        return res.status(201).send({ msg: 'Verify Successfully!' });
      }
      return res.status(400).send({ error: 'Invalid OTP' });
    } catch (error) {
      return res.status(500).send({ error: 'Failed to verify OTP' });
    }
  }