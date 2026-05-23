const mongoose = require("mongoose")
const User = require("../models/user")
const paystack = require("paystack-api")(process.env.API_KEY)

const getUser = async (req, res) => {
        try {
            let {id} = req.params;
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({ data: user, message: "User found", status: 0 });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

const createUser = async (req, res) => {
        try {
            const { fullname, email, password } = req.body;

            if (!fullname || !email || !password) {
                return res.status(400).json({ message: "User creation failed" });
            }

            const user = await User.create({ fullname, email, password });

            // user.userID = user._id.toString(); Set userID to the string representation of _id
            // await user.save(); Save the updated user document


            res.status(201).send({
                data: user, // Include the created user data in the response
                message: "User created successfully",
                status: 0, // You can use a status code to indicate success or failure (0 for success, 1 for failure)
            });
        } catch (error) {

            if (error.code === 11000 //duplicate key error code for MongoDB
                || error.message.includes("already exists")
                || error.message.includes("duplicate key") 
                || error.message.includes("already registered")) {
                res.status(400).json({ message: "Email already exists" });
            }
                else {
                res.status(500).json({ message: error.message });
            }
        }
    };

const updateUser = async (req, res) => {
        try {
            let { id } = req.params;
            const { fullname, email, password } = req.body;
            const user = await User.findByIdAndUpdate(id, { fullname, email, password }, { new: true }); //new: true option returns the updated document

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({ data: user, message: "User updated successfully", status: 0 });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

const deleteUser = async (req, res) => {
        try {
            let { id } = req.params;
            const user = await User.findByIdAndDelete(id);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({ data: user, message: "User deleted successfully", status: 0 });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

// initialize transaction
const initializeTrans = async (req, res) => {
    try {
        let { id } = req.params;
        const { email, amount, plan, } = req.body;

        const response = await paystack.transaction.initialize({ // Initialize a transaction
            email,
            amount,
            plan, //for subscriptions
        });
 
        const data = { // Update the user document with the transaction reference
            paystack_ref: response.data.reference, // Store the Paystack transaction reference in the user document
        };

        await User.findByIdAndUpdate(id, data); // Update the user document with the transaction reference

        res.status(200).send({
            data: response.data,
            message: response.message,
            status: response.status,
        });

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const verifyTrans = async (req, res) => {
    try {
        let { id } = req.params;

        const user = await User.findById(id);

        if (user.paystack_ref == "success") // If the transaction has already been verified, return a success response without making another API call to Paystack
            return res.status(200).send({
                data: {},
                message: "Transaction has been verified",
                status: 1,
            });

        const response = await paystack.transaction.verify({ // Verify the transaction using the stored Paystack transaction
            reference: user.paystack_ref
        });

        if (response.data.status == "success") { // If the transaction is successful, update the user document with the transaction status and amount donated
            const data = {
                paystack_ref: response.data.status,
                amountDonated: response.data.amount,
            };
            
            await User.findByIdAndUpdate(id, data);

            return res
                .status(200)
                .send({
                    data: response.data,
                    message: response.message,
                    status: response.status,
                });
        } else {
            return res
                .status(400)
                .send({
                    data: response.data,
                    message: response.message,
                    status: response.status,
                });
        }

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};


module.exports = {
    getUser,
    createUser,
    updateUser,
    deleteUser,
    initializeTrans,
    verifyTrans
};