const express = require('express');
const userRouter = express.Router();
const { createUser, getUser, initializeTrans, updateUser, deleteUser , verifyTrans } = require("../controllers/userController")


userRouter
    .route("/getUser/:id")
    .get(getUser)

userRouter
    .route("/create")
    .get((req, res) => {
        res.json({ message: "create a user" })
    })
    .post(createUser)

userRouter
    .route("/updateUser/:id")
    .put(updateUser)

userRouter
    .route("/deleteUser/:id")
    .delete(deleteUser)

userRouter.post("/initiate-transaction/:id", initializeTrans);

userRouter.get("/verify-transaction/:id", verifyTrans);

module.exports = userRouter