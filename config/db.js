const mongoose = require('mongoose');

const connectDB = async () =>{
    try {
        mongoose.connect(process.env.MONGOOSE_LOCAL_URL);
        console.log("Connected to MongoDB successfully");
    } catch (err) {
         console.error("Failed to connect to MongoDB", err);
         process.exit(1); //stop the app if DB connection fails
    }
}

module.exports = connectDB
