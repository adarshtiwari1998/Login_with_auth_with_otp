import { Router } from "express";
const router = Router();


/** import all controllers */
import * as controller from '../controllers/appController.js';
import Auth, { localVariables } from '../middleware/auth.js';
import { registerMail } from '../controllers/mailer.js';


const productionBaseURL = 'https://teal-crisp-c122c1.netlify.app/api';

/** POST Methods */
router.route(`${productionBaseURL}/register`).post(controller.register);
router.route(`${productionBaseURL}/registerMail`).post(registerMail);
router.route(`${productionBaseURL}/authenticate`).post(controller.verifyUser, (req, res) => res.end());
router.route(`${productionBaseURL}/login`).post(controller.verifyUser, controller.login);

/** GET Methods */
router.route(`${productionBaseURL}/user/:username`).get(controller.getUser);
router.route(`${productionBaseURL}/generateOTP`).get(controller.verifyUser, localVariables, controller.generateOTP);
router.route(`${productionBaseURL}/verifyOTP`).get(controller.verifyUser, controller.verifyOTP);
router.route(`${productionBaseURL}/createResetSession`).get(controller.createResetSession);

router.route(`${productionBaseURL}/sendOtpVerificationEmail`).get(controller.sendOtpVerificationEmail);
router.route(`${productionBaseURL}/verifyOTPRegistrationEmail`).get(controller.verifyOTPRegistrationEmail);

/** PUT Methods */
router.route(`${productionBaseURL}/updateuser`).put(Auth, controller.updateUser);
router.route(`${productionBaseURL}/resetPassword`).put(controller.verifyUser, controller.resetPassword);

export default router;