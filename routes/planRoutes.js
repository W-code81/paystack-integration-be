const express = require('express');
const planRouter = express.Router();
const { createPlan, getPlans } = require("../controllers/planController")

planRouter.get("/getPlans", getPlans);
planRouter.post("/createPlan", createPlan);

module.exports = planRouter