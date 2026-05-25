const express = require('express');
const planRouter = express.Router();
const { createPlan, getPlans, addWebhook } = require("../controllers/planController")

planRouter.get("/getPlans", getPlans);
planRouter.post("/createPlan", createPlan);
planRouter.post("/webhook", addWebhook);

module.exports = planRouter