require('dotenv').config()
require('express-async-errors')

// security packages
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')

// swagger
const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./swagger.yaml')


const express = require('express')
const app = express()

const connectDB = require('./db/connect')
const authenticateUser = require('./middleware/auth')
const port = process.env.PORT || 8080

const errorHandlerMiddleware = require('./middleware/error-handler')
const notFoundMiddleware = require('./middleware/not-found')

const authRouter = require('./routes/auth')
const jobsRouter = require('./routes/jobs')

// app.set('trust proxy', 1)
app.use(rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}))

app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(xss())


app.get("/", (req, res) => {
    res.status(200).send("<h1>Jobs API</h1><a href='/api-docs'>API Documentation</a>")
})
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/jobs', authenticateUser, jobsRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const start = async () => {
    try{
        await connectDB(process.env.MONGO_URI)
        app.listen(port,()=>{
            console.log(`App listening on ${port}`);
        })
    }catch(e){
        console.log(e);
    }
}

start()