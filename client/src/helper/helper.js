import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import using named export

axios.defaults.baseURL = process.env.REACT_APP_SERVER_DOMAIN;

/** Make API Requests */

/** To get username from Token */

export async function getUsername() {
    const token = localStorage.getItem('token');
    if (!token) return Promise.reject("Cannot find Token");
    let decode = jwtDecode(token); // Use jwtDecode instead of jwt_decode
    // console.log(decode);
    return decode;
}


/** authenticate function */
export async function authenticate(username){
    try {
        return await axios.post('/api/authenticate', { username })
    } catch (error) {
        return { error : "Username doesn't exist...!"}
    }
}

/** get User details */
export async function getUser({ username }){
    try {
        const { data } = await axios.get(`/api/user/${username}`);
        return { data };
    } catch (error) {
        return { error : "Password doesn't Match...!"}
    }
}

/** register user function */
export async function registerUser(credentials){
    try {
        const { data : { msg }, status } = await axios.post(`/api/register`, credentials);

        let { username, email } = credentials;

        /** send email */
        if(status === 201){
            await axios.post('/api/registerMail', { username, userEmail : email, text : msg})
        }

        return Promise.resolve(msg)
    } catch (error) {
        return Promise.reject({ error })
    }
}

/** login function */
export async function verifyPassword({ username, password }){
    try {
        if(username){
            const { data } = await axios.post('/api/login', { username, password })
            return Promise.resolve({ data });
        }
    } catch (error) {
        return Promise.reject({ error : "Password doesn't Match...!"})
    }
}

/** update user profile function */
export async function updateUser(response){
    try {
        
        const token = await localStorage.getItem('token');
        const data = await axios.put('/api/updateuser', response, { headers : { "Authorization" : `Bearer ${token}`}});

        return Promise.resolve({ data })
    } catch (error) {
        return Promise.reject({ error : "Couldn't Update Profile...!"})
    }
}


/** generate OTP */
export async function generateOTP(username){
    try {
        const {data : { code }, status } = await axios.get('/api/generateOTP', { params : { username }});

        // send mail with the OTP
        if(status === 201){
            let { data : { email }} = await getUser({ username });
            let text = `Your FoxxBioProcess Password Recovery OTP is ${code}. Verify and recover your password.`;
            await axios.post('/api/registerMail', { username, userEmail: email, text, subject : "Password Recovery OTP"})
        }
        return Promise.resolve(code);
    } catch (error) {
        return Promise.reject({ error });
    }
}

/** verify OTP */
export async function verifyOTP({ username, code }){
    try {
       const { data, status } = await axios.get('/api/verifyOTP', { params : { username, code }})
       if (status === 201) {
        // Fetch user details including email
        let { data : { email }} = await getUser({ username });
        const resetTimestamp = new Date().toLocaleString(); // Local timestamp for reset

        const ipAddress = await getIPAddress(); // Await the IP address resolution

        const emailContent = {
            body: {
                name: username,
                intro: `
                    <div style="font-family: Arial, sans-serif;">
                        <strong>Your OTP is Verified Successfully</strong><br/><br/>
                        <strong>Username:</strong> ${username}<br/>
                        <strong>Email:</strong> ${email}<br/>
                        <strong>IP Address:</strong> ${ipAddress}<br/>
                        <strong>Verification Timestamp:</strong> ${resetTimestamp}<br/><br/>
                    </div>
                `,
                // Excluding outro here specifically for this email type
            },
        };
        
        const subject = `Your OTP Verified - ${username}`; // Subject including username
        
        // Sending the confirmation email
        await axios.post('/api/registerMail', { username, userEmail: email, text: emailContent.body.intro, subject });
    }
    
    return Promise.resolve({ data, status });
    } catch (error) {
        return Promise.reject(error);
    }
}


function getIPAddress() {
    // This is a simplified example; actual IP retrieval might involve backend or more sophisticated methods
    // Here, assuming you're fetching the IP address from an API that returns the user's IP
    return fetch('https://api.ipify.org?format=json')
        .then((response) => response.json())
        .then((data) => data.ip)
        .catch((error) => {
            console.error('Error retrieving IP:', error);
            return 'Unknown'; // Return a default or placeholder value if unable to fetch IP
        });
}

/** reset password */
export async function resetPassword({ username, password }) {
    try {
        const { data, status } = await axios.put('/api/resetPassword', { username, password });
        
        if (status === 201) {
            // Fetch user details including email
            let { data : { email }} = await getUser({ username });
            const resetTimestamp = new Date().toLocaleString(); // Local timestamp for reset

            const ipAddress = await getIPAddress(); // Await the IP address resolution

            const emailContent = {
                body: {
                    name: username,
                    intro: `
                        <div style="font-family: Arial, sans-serif;">
                            <strong>Password Reset Confirmation</strong><br/><br/>
                            Your password was successfully reset.<br/><br/>
                            <strong>Username:</strong> ${username}<br/>
                            <strong>Email:</strong> ${email}<br/>
                            <strong>IP Address:</strong> ${ipAddress}<br/>
                            <strong>Reset Timestamp:</strong> ${resetTimestamp}<br/><br/>
                        </div>
                    `,
                    // Excluding outro here specifically for this email type
                },
            };
            
            const subject = `Password Reset Confirmation - ${username}`; // Subject including username
            
            // Sending the confirmation email
            await axios.post('/api/registerMail', { username, userEmail: email, text: emailContent.body.intro, subject });
        }
        
        return Promise.resolve({ data, status });
    } catch (error) {
        return Promise.reject({ error });
    }
}



/** generate OTP */
// Modify the OTP generation function to trigger email sending
export async function sendOtpVerificationEmail(username) {
    try {
      const { data: { code }, status } = await axios.get('/api/sendOtpVerificationEmail', { params: { username } });
      if (status === 201) {
        return code;
      }
      throw new Error('Problem while generating OTP!');
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  
  export async function verifyOTPRegistrationEmail({ username, code }) {
    try {
      const { data, status } = await axios.get('/api/verifyOTPRegistrationEmail', { params: { username, code } });
      return { data, status };
    } catch (error) {
      return Promise.reject(error);
    }
  }