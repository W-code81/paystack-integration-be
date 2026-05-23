require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const cors = require("cors");
const connectDB = require("./config/db")
const User = require("./models/user")
const userRouter = require("./routes/userRoutes")
const planRouter = require("./routes/planRoutes")
const ngrok = require("@ngrok/ngrok");

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

connectDB() //db connection

app.use("/users", userRouter)
app.use("/plans", planRouter)

app.get("/", (req, res) =>{
    res.json({message: "Hello World!"});
})

if (process.env.NODE_ENV == "development") {
    (async function () {
        const url = await ngrok.connect({ addr: process.env.PORT, authtoken_from_env: true, authtoken: process.env.NGROK_AUTHTOKEN });
        console.log(`Ingress established at: ${url}`);
    })();
} 

app.listen(port ,()=>{
    console.log(`Server is running on port ${port}`);
})