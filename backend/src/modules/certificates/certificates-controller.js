const asyncHandler = require("express-async-handler");
const {
    getAllCertificates,
    getCertificateById,
    verifyCertificate,
    issueCertificate,
    updateCertificateBlockchainData,
    revokeCertificateById,
    getCertificateTypes
} = require("./certificates-service");

const handleGetAllCertificates = asyncHandler(async (req, res) => {
    const { studentId, certificateTypeId, isRevoked } = req.query;
    const certificates = await getAllCertificates({ studentId, certificateTypeId, isRevoked });
    res.json({ certificates });
});

const handleGetCertificateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const certificate = await getCertificateById(id);
    res.json({ certificate });
});

const handleVerifyCertificate = asyncHandler(async (req, res) => {
    const { certificateNumber } = req.params;
    const verifiedBy = req.ip || 'unknown';
    const result = await verifyCertificate(certificateNumber, verifiedBy);
    res.json(result);
});

const handleIssueCertificate = asyncHandler(async (req, res) => {
    const payload = req.body;
    const { id: issuerId } = req.user;
    
    const result = await issueCertificate({
        ...payload,
        issuerId
    });
    
    res.json(result);
});

const handleUpdateBlockchainData = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const blockchainData = req.body;
    console.debug('Updating blockchain data for certificate:', id, blockchainData);
    const result = await updateCertificateBlockchainData(id, blockchainData);
    res.json(result);
});

const handleRevokeCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const { id: revokedBy } = req.user;
    
    const result = await revokeCertificateById(id, revokedBy, reason);
    res.json(result);
});

const handleGetCertificateTypes = asyncHandler(async (req, res) => {
    const types = await getCertificateTypes();
    res.json({ types });
});

module.exports = {
    handleGetAllCertificates,
    handleGetCertificateById,
    handleVerifyCertificate,
    handleIssueCertificate,
    handleUpdateBlockchainData,
    handleRevokeCertificate,
    handleGetCertificateTypes
};
