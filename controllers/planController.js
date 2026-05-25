const paystack = require("paystack-api")(process.env.API_KEY)
const { cancelSubscription, planChargeSuccess, chargeSuccess } = require("../helpers/webhookHelper")

const createPlan = async (req, res) => {
    try {
        const { interval, name, amount } = req.body;

        const trimmmingName = name.trim();
        const trimmingInterval = interval.trim().toLowerCase();
        const trimmingAmount = Number(amount.trim()); // convert to number

        if (!trimmingInterval || !trimmmingName || !trimmingAmount) {
            return res.status(400).send({ data: {}, error: "Please provide all required fields (interval, name, amount)", status: 1 });
        }

        if (isNaN(trimmingAmount)) { // validate it's actually a number
            return res.status(400).send({ data: {}, error: "Amount must be a number", status: 1 });
        }

        const response = await paystack.plan.create({
            name: trimmmingName,
            amount: trimmingAmount,
            interval: trimmingInterval,
        });

        res.status(200).send({
            data: response.data,
            message: response.message,
            status: response.status,
        });

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};

const getPlans = async (req, res) => {
    try {
        const response = await paystack.plan.list(); // List all plans

        res.status(200).send({
            data: response.data,
            message: response.message,
            status: response.status,
        });

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};


const addWebhook = async (req, res) => { // webhook function for event listening
    try {
        let data = req.body;
        console.log('Webhook data: ', data);

        switch (data.event) {
            case "invoice.payment_failed":
                await cancelSubscription(data);
                console.log("Invoice Failed");
                break;
            case "invoice.create":
                console.log("invoice created");
                break;
            case "invoice.update":
                data.data.status == "success" ?
                    await planChargeSuccess(data) :
                    console.log("Update Failed");
                break;
            case "subscription.not_renew":
                console.log("unrenewed");
                break;
            case "subscription.disable": 
                console.log("disabled");
                break;
            case "transfer.success":
                console.log("transfer successful");
                break;
            case "transfer.failed":
                console.log("transfer failed");
                break;
            case "transfer.reversed":
                console.log("transfer reversed");
                break;
            default:
                const obj = data.data.plan;
                console.log("Implementing charges logic...");
                Object.keys(obj).length === 0 && obj.constructor === Object ?
                    await chargeSuccess(data) :
                    await planChargeSuccess(data);
                console.log("Successful");
                break;
        }

        res.status(200).send({ message: "Webhook received", status: 0 }); //always respond to Paystack

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};


module.exports = {
    createPlan,
    getPlans,
    addWebhook
};