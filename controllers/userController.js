const mongoose = require("mongoose")
const User = require("../models/user")
const paystack = require("paystack-api")(process.env.API_KEY)
const bcrypt = require("bcrypt")

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

            if (!fullname) return res.status(400).json({ message: "Full name is required" });
            if (!email) return res.status(400).json({ message: "Email is required" });
            if (!password) return res.status(400).json({ message: "Password is required" });

            const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

            const user = await User.create({ fullname, email, password: hashedPassword }); // Create a new user with the hashed password

            res.status(201).send({
                data: user, // Include the created user data in the response
                message: "User created successfully",
                status: 0, // You can use a status code to indicate success or failure (0 for success, 1 for failure)
            });
        } catch (error) {

            console.log("Error code : ", error.code);
            console.log("Error message : ", error.message);

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

        //hash the password if it's being updated
        const updateData = { fullname, email };
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
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
    const { id } = req.params;
    const { email, plan } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!plan) return res.status(400).json({ message: "Plan is required" });

    // validate plan on backend — never trust frontend amount
    const plansResponse = await paystack.plan.list();
    const validPlan = plansResponse.data.find(p => p.plan_code === plan);

    if (!validPlan) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const verifiedAmount = validPlan.amount; // use Paystack's amount, not frontend's

    const response = await paystack.transaction.initialize({
      email,
      amount: verifiedAmount,
      plan,
      callback_url: `${process.env.LOCAL_URL}/paystack/payment/callback`, //local can be changed to your host url
    });

    await User.findByIdAndUpdate(id, {
      paystack_ref: response.data.reference,
    });

    res.status(200).json({
      data: response.data,
      message: response.message,
      status: response.status,
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyTrans = async (req, res) => {
    try {
        let { id } = req.params;

        const user = await User.findById(id);

        if (!user) return res.status(404).json({ message: "User not found" });

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