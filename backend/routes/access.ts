import { Router } from "express";
import { createInvoice, getAccess } from "../controllers/access.js";
import { authenticate } from "../middleware.js";

const app = Router();

app.post("/access", getAccess);
app.post("/invoice", authenticate, createInvoice);

export default app;
