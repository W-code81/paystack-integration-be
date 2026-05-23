const paystack = require("paystack-api")(process.env.API_KEY)
const { cancelSubscription, planChargeSuccess, chargeSuccess } = require("../helpers/webhookHelper")

const createPlan = async (req, res) => {
    try {
        const { interval, name, amount } = req.body;

        const trimmmingName = name.trim();
        const trimmingInterval = interval.trim().toLowerCase();
        const trimmingAmount = amount.trim();

        if (!trimmingInterval || !trimmmingName || !trimmingAmount) {
            return res.status(400).send({ data: {}, error: "Please provide all required fields (interval, name, amount)", status: 1 });
        }

        const response = await paystack.plan.create({
            name: trimmmingName,
            amount: trimmingAmount,
            interval: trimmingInterval, // Specify the billing interval (e.g., "monthly", "yearly")
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


// our webhook function for event listening
const addWebhook = async (req, res) => {
    try {
        let data = req.body;
        console.log('Webhook data: ', data);

        switch (data.event) {
            case "invoice.payment_failed": // if a subscription charge fails, cancel the subscription and notify the user
                await cancelSubscription(data);
                console.log("Invoice Failed");
                break;
            case "invoice.create": // when an invoice is created, you can notify the user that they will be charged soon
                console.log("invoice created");
                break;
            case "invoice.update": // when an invoice is updated, you can check if the payment was successful and update the user's subscription status accordingly
                data.data.status == "success" ?
                    await planChargeSuccess(data) :
                    console.log("Update Failed");
                break;
            case "subscription.not_renew": // when a subscription is not renewed, you can notify the user and cancel their subscription
                console.log("unrenewed");
                break;
            case "subscription.disable": // when a subscription is disabled, you can notify the user and cancel their subscription
                console.log("disabled");
                break;
            case "transfer.success": // when a transfer is successful, you can update the user's account balance or notify them of the successful transfer
                console.log("transfer successful");
                break;
            case "transfer.failed": // 
                console.log("transfer failed");
                break;
            case "transfer.reversed": // when a transfer is reversed, you can update the user's account balance or notify them of the reversal
                console.log("transfer reversed");
                break;
            case "subscription.disable": // when a subscription is disabled, you can notify the user and cancel their subscription
                console.log("disabled");
                break;

            default:
                // successful charge
                const obj = data.data.plan;
                console.log("Implementing charges logic...");
                // object comparison verifying if its a normal payment or a plan
                // charges for subscription and card
                Object.keys(obj).length === 0 && obj.constructor === Object ?
                    await chargeSuccess(data) :
                    // charge sub
                    await planChargeSuccess(data);
                console.log("Successful");
                break;
        }

    } catch (error) {
        res.status(400).send({ data: {}, error: `${error.message}`, status: 1 });
    }
};


module.exports = {
    createPlan,
    getPlans,
    addWebhook
};