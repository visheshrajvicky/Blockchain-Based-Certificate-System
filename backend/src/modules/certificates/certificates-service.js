const { ApiError } = require("../../utils");
const {
    findAllCertificates,
    findCertificateById,
    findCertificateByCertificateNumber,
    createCertificate,
    revokeCertificate,
    logCertificateVerification,
    getAllCertificateTypes,
    getActiveBlockchainConfig,
    getBlockchainConfig
} = require("./certificates-repository");
const { findUserById } = require("../../shared/repository");
const crypto = require("crypto");
const { env } = require("../../config");

const getAllCertificates = async (payload) => {
    const certificates = await findAllCertificates(payload);
    return certificates;
};

const getCertificateById = async (id) => {
    const certificate = await findCertificateById(id);
    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }
    return certificate;
};

const verifyCertificate = async (certificateNumber, verifiedBy) => {
    const certificate = await findCertificateByCertificateNumber(certificateNumber);
    
    if (!certificate) {
        await logCertificateVerification({
            certificateId: null,
            verifiedBy,
            verificationMethod: 'certificate_number',
            verificationResult: false
        });
        throw new ApiError(404, "Certificate not found");
    }

    await logCertificateVerification({
        certificateId: certificate.id,
        verifiedBy,
        verificationMethod: 'certificate_number',
        verificationResult: true
    });

    return {
        isValid: !certificate.is_revoked,
        certificate: {
            certificateNumber: certificate.certificate_number,
            studentName: certificate.studentName,
            courseName: certificate.course_name,
            grade: certificate.grade,
            issueDate: certificate.issue_date,
            certificateType: certificate.certificateType,
            issuerName: certificate.issuerName,
            isRevoked: certificate.is_revoked,
            revokedDate: certificate.revoked_date,
            revokedReason: certificate.revoked_reason,
            blockchainId: certificate.blockchain_id,
            transactionHash: certificate.transaction_hash,
            ipfsHash: certificate.ipfs_hash
        }
    };
};

const issueCertificate = async (payload) => {
    const { studentId, certificateTypeId, courseName, grade, issuerId } = payload;

    // Validate student exists
    const student = await findUserById(studentId);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    // Validate issuer exists
    const issuer = await findUserById(issuerId);
    if (!issuer) {
        throw new ApiError(404, "Issuer not found");
    }

    // Generate unique certificate number
    const certificateNumber = generateCertificateNumber();

    // Get blockchain config based on environment
    const networkName = env.BLOCKCHAIN_NETWORK || 'localhost';
    const networkNameFormatted = networkName.charAt(0).toUpperCase() + networkName.slice(1);
    const blockchainConfig = await getBlockchainConfig(networkNameFormatted);
    
    if (!blockchainConfig) {
        throw new ApiError(500, `Blockchain configuration not found for network: ${networkNameFormatted}`);
    }

    console.debug('Issuing certificate on network:', blockchainConfig.network_name);

    // Prepare metadata that frontend will use for IPFS upload
    const metadata = {
        certificateNumber,
        studentId,
        studentName: student.name,
        studentEmail: student.email,
        certificateTypeId,
        courseName,
        grade,
        issueDate: new Date().toISOString(),
        issuerId,
        issuerName: issuer.name,
        description: payload.description || '',
        network: blockchainConfig.network_name,
        contractAddress: blockchainConfig.contract_address
    };

    const certificateData = {
        studentId,
        certificateTypeId,
        courseName,
        grade,
        issueDate: new Date(),
        issuerId,
        certificateNumber,
        description: payload.description || '',
        // Blockchain data will be updated after blockchain transaction
        blockchainId: null,
        transactionHash: null,
        contractAddress: blockchainConfig.contract_address,
        network: blockchainConfig.network_name,
        // IPFS data will be updated from frontend after upload
        ipfsHash: null,
        ipfsMetadataUrl: null
    };

    const result = await createCertificate(certificateData);

    return {
        message: "Certificate issued successfully",
        certificateId: result.id,
        certificateNumber: certificateNumber,
        metadata: metadata, // Return metadata for frontend to upload to IPFS
        blockchainConfig: {
            contractAddress: blockchainConfig.contract_address,
            network: blockchainConfig.network_name,
            chainId: blockchainConfig.chain_id,
            rpcUrl: blockchainConfig.rpc_url
        }
    };
};

const updateCertificateBlockchainData = async (certificateId, blockchainData) => {
    const { blockchainId, transactionHash, ipfsHash, ipfsMetadataUrl } = blockchainData;
    
    console.debug('Updating blockchain data for certificate:', certificateId, blockchainData);
    const { processDBRequest } = require("../../utils");
    const query = `
        UPDATE certificates
        SET blockchain_id = $1,
            transaction_hash = $2,
            ipfs_hash = $3,
            ipfs_metadata_url = $4,
            updated_dt = NOW()
        WHERE id = $5
        RETURNING id
    `;
    const queryParams = [blockchainId, transactionHash, ipfsHash, ipfsMetadataUrl, certificateId];
    const { rows } = await processDBRequest({ query, queryParams });
    
    if (rows.length === 0) {
        throw new ApiError(404, "Certificate not found");
    }
    
    return { message: "Certificate blockchain data updated successfully" };
};

const revokeCertificateById = async (certificateId, revokedBy, revokedReason) => {
    const certificate = await findCertificateById(certificateId);
    if (!certificate) {
        throw new ApiError(404, "Certificate not found");
    }

    if (certificate.is_revoked) {
        throw new ApiError(400, "Certificate is already revoked");
    }

    const affectedRows = await revokeCertificate({
        certificateId,
        revokedBy,
        revokedReason
    });

    if (affectedRows === 0) {
        throw new ApiError(500, "Failed to revoke certificate");
    }

    return { message: "Certificate revoked successfully" };
};

const getCertificateTypes = async () => {
    const types = await getAllCertificateTypes();
    return types;
};

// Helper function to generate unique certificate number
function generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `CERT-${timestamp}-${randomStr}`;
}

module.exports = {
    getAllCertificates,
    getCertificateById,
    verifyCertificate,
    issueCertificate,
    updateCertificateBlockchainData,
    revokeCertificateById,
    getCertificateTypes
};
