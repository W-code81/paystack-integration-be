const User = require("../models/user")
const paystack = require("paystack-api")(process.env.API_KEY);

const chargeSuccess = async (data) => {
    try {
        const output = data.data;
        const reference = output.reference;

        const user = await User.findOne({ paystack_ref: reference });
        if (!user) return console.log("User not found for reference:", reference); // null check

        const userId = user._id;
        console.log("Updating charge status");

        if (user.paystack_ref == "success")
            return console.log("Transaction already verified");

        const response = await paystack.transaction.verify({
            reference: user.paystack_ref
        });

        if (response.data.status == "success") {
            const updateData = { // renamed from data
                paystack_ref: response.data.status,
                amountDonated: output.amount,
            };
            await User.findByIdAndUpdate(userId, updateData);
            console.log("Charge Successful");
        } else {
            console.log("Charge Unsuccessful");
        }

    } catch (error) {
        console.log({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const planChargeSuccess = async (data) => {
    try {
        const output = data.data;
        const reference = output.reference;

        const user = await User.findOne({ paystack_ref: reference });
        if (!user) return console.log("User not found for reference:", reference); // null check

        const userId = user._id;
        console.log("Updating charge status");

        if (user.paystack_ref == "success")
            return console.log("Transaction already verified");

        const response = await paystack.transaction.verify({
            reference: user.paystack_ref
        });

        if (response.data.status == "success") {
            await User.findByIdAndUpdate(userId, {
                isSubscribed: true,
                paystack_ref: response.data.status,
                planName: output.plan.name,
                timeSubscribed: response.data.paid_at,
            });
            console.log("Charge Successful");
        } else {
            console.log("Charge Unsuccessful");
        }

    } catch (error) {
        console.log({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const cancelSubscription = async (data) => {
    try {
        const output = data.data;
        const reference = output.reference;

        const user = await User.findOne({ paystack_ref: reference });
        if (!user) return console.log("User not found for reference:", reference); // null check

        const userId = user._id;
        console.log("Cancelling subscription...");

        await User.findByIdAndUpdate(userId, {
            isSubscribed: false,
            paystack_ref: "cancelled", 
            planName: "cancelled",
        });
        console.log("User Subscription Cancelled");

    } catch (error) {
        console.log({ data: {}, error: `${error.message}`, status: 1 });
    }
};

module.exports = {
    planChargeSuccess,
    chargeSuccess,
    cancelSubscription,
};