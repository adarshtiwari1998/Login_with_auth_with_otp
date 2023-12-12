import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import avatar from '../assets/profile.png';
import toast, { Toaster } from 'react-hot-toast';
import { useFormik } from 'formik';
import { registerValidation } from '../helper/validate';
import convertToBase64 from '../helper/convert';
import { registerUser, sendOtpVerificationEmail, verifyOTPRegistrationEmail } from '../helper/helper';

import styles from '../styles/Username.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [file, setFile] = useState();
  const [showOTPField, setShowOTPField] = useState(false); // State to manage the visibility of the OTP field

  const formik = useFormik({
    initialValues: {
      email: 'doyol56239@cnogs.com',
      username: 'example123',
      password: 'admin@123',
      otp: '',
    },
    validate: registerValidation,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values) => {
      values = await Object.assign(values, { profile: file || '' });

      // Check if the OTP field is visible before sending OTP
      if (showOTPField) {
        try {
          let { status } = await verifyOTPRegistrationEmail({ username: values.username, code: values.otp });
          if (status === 201) {
            let registerPromise = registerUser(values);
            toast.promise(registerPromise, {
              loading: 'Creating...',
              success: <b>Registered Successfully...!</b>,
              error: <b>Could not Register.</b>,
            });
            registerPromise.then(function () {
              navigate('/');
            });
          }
        } catch (error) {
          return toast.error('Wrong OTP! Check email again!');
        }
      } else {
        // If OTP field is not visible, initiate OTP sending
        let otpSent = await sendOtpVerificationEmail(values.username);
        if (otpSent) {
          toast.success('OTP has been sent to your email!');
          console.log('OTP Sent:', otpSent); // Log the OTP sent
          setShowOTPField(true); // Show the OTP field after OTP is sent
        } else {
          toast.error('Problem while generating OTP!');
        }
      }
    },
  });

  const onUpload = async (e) => {
    const base64 = await convertToBase64(e.target.files[0]);
    setFile(base64);
  };
  
  return (
    <div className="container mx-auto">

      <Toaster position='top-center' reverseOrder={false}></Toaster>

      <div className='flex justify-center items-center h-screen'>
        <div className={styles.glass} style={{ width: "45%", paddingTop: '3em'}}>

          <div className="title flex flex-col items-center">
            <h4 className='text-2xl font-bold'> Register Here For Custom SUT Catelogue</h4>
            <span className='py-4 text-xl w-2/3 text-center text-gray-500'>
                Happy to join you!
            </span>
          </div>

          <form className='py-1' onSubmit={formik.handleSubmit}>
              <div className='profile flex justify-center py-4'>
                  <label htmlFor="profile">
                    <img src={file || avatar} className={styles.profile_img} alt="avatar" />
                  </label>
                  
                  <input onChange={onUpload} type="file" id='profile' name='profile' />
              </div>

              <div className="textbox flex flex-col items-center gap-6">
                  <input {...formik.getFieldProps('email')} className={styles.textbox} type="text" placeholder='Email*' />
                  <input {...formik.getFieldProps('username')} className={styles.textbox} type="text" placeholder='Username*' />
                  <input {...formik.getFieldProps('password')} className={styles.textbox} type="text" placeholder='Password*' />
                  {showOTPField && (
                <input
                  {...formik.getFieldProps('otp')}
                  className={styles.textbox}
                  type="text"
                  placeholder="Enter OTP*"
                />
              )}

              <button className={styles.btn} type="submit">
                {showOTPField ? 'Register' : 'Get OTP'}
              </button>
              </div>

              <div className="text-center py-4">
                <span className='text-gray-500'>Already Register? <Link className='text-red-500' to="/">Login Now</Link></span>
              </div>

          </form>

        </div>
      </div>
    </div>
  )
}

