import { Router } from "express";
import { createInvoice, getAccess } from "../controllers/access";
import { authenticate } from "../middleware";

const app = Router();

app.post("/access", getAccess);
app.post("/invoice", authenticate, createInvoice);

export default app;
