import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connect from './database/conn.js';
import router from './router/route.js';

const app = express();

/** middlewares */
app.use(express.json());

// Updated CORS configuration for Netlify frontend
app.use(cors({
    origin: 'https://teal-crisp-c122c1.netlify.app', // Replace with your Netlify frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));

  
  app.use(morgan('tiny'));
  app.disable('x-powered-by');


const port = 8080;

/** HTTP GET Request */
app.get('/', (req, res) => {
    res.status(201).json("Home GET Request");
});


/** api routes */
app.use('/api', router);
// app.use('/api', router)

/** start server only when we have valid connection */
connect().then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server connected to port ${port}`);
      });
    } catch (error) {
      console.log('Cannot connect to the server');
    }
  }).catch(error => {
    console.log("Invalid database connection...!");
  });


// app.listen(port, () => {
//  console.log(`Server connected to http://localhost:${port}`);
//   })

