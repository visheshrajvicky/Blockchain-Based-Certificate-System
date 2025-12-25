const express = require("express");
const router = express.Router();
const certificateController = require("./certificates-controller");
const { authenticateToken, csrfProtection, checkApiAccess } = require("../../middlewares");

// Public route - verify certificate (no authentication required)
router.get("/verify/:certificateNumber", certificateController.handleVerifyCertificate);

// Protected routes - require authentication
router.get("/", authenticateToken, csrfProtection, checkApiAccess, certificateController.handleGetAllCertificates);
router.get("/types", authenticateToken, csrfProtection, checkApiAccess, certificateController.handleGetCertificateTypes);
router.get("/:id", authenticateToken, csrfProtection, checkApiAccess, certificateController.handleGetCertificateById);
router.post("/", authenticateToken, csrfProtection, checkApiAccess, certificateController.handleIssueCertificate);
router.put("/:id/blockchain", authenticateToken, csrfProtection, checkApiAccess, certificateController.handleUpdateBlockchainData);
router.post("/:id/revoke", authenticateToken, csrfProtection, checkApiAccess, certificateController.handleRevokeCertificate);

module.exports = { certificatesRoutes: router };
