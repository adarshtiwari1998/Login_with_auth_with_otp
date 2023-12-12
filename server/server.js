import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connect from './database/conn.js';
import router from './router/route.js';

const app = express();

/** middlewares */
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.disable('x-powered-by'); // less hackers know about our stack

/** CORS Configuration */
const corsOptions = {
    origin: 'https://teal-crisp-c122c1.netlify.app',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/** HTTP GET Request */
app.get('/', (req, res) => {
    res.status(201).json("Home GET Request");
});

/** API Routes */
app.use('/api', router);

/** Start server only when we have a valid connection */
connect()
    .then(() => {
        const port = process.env.PORT || 8080;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch(error => {
        console.log("Invalid database connection...!");
    });
