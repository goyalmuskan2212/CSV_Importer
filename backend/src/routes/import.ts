import { Router } from "express";
import { csvUpload } from "../middleware/upload";
import { handleCsvImport } from "../controllers/importController";

const router = Router();

// POST /api/import  (multipart/form-data, field name: "file")
router.post("/import", csvUpload.single("file"), handleCsvImport);

export default router;
