import { Router } from "express";
import { createInvoice, getAccess } from "../controllers/access";

const app = Router();

app.post("/access", getAccess);
app.post("/invoice", createInvoice);

export default app;
