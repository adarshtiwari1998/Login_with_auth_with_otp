// UserOtpVerification.js (or your file)
import mongoose from 'mongoose';

const userOtpVerificationSchema = new mongoose.Schema({
    otp: String,
    createdAt: Date,
    expiresAt: Date,
});

const UserOtpVerification = mongoose.model('UserOtpVerification', userOtpVerificationSchema);

export default UserOtpVerification;
