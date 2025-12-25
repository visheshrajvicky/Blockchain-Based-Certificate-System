const { processDBRequest } = require("../../utils");

const findAllCertificates = async (payload) => {
    const { studentId, certificateTypeId, isRevoked } = payload;
    let query = `
        SELECT
            c.id,
            c.certificate_number AS "certificateNumber",
            c.course_name AS "courseName",
            c.grade,
            c.issue_date AS "issueDate",
            c.blockchain_id AS "blockchainId",
            c.transaction_hash AS "transactionHash",
            c.ipfs_hash AS "ipfsHash",
            c.is_revoked AS "isRevoked",
            c.revoked_date AS "revokedDate",
            c.revoked_reason AS "revokedReason",
            u.name AS "studentName",
            u.email AS "studentEmail",
            ct.name AS "certificateType",
            issuer.name AS "issuerName"
        FROM certificates c
        LEFT JOIN users u ON c.student_id = u.id
        LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.id
        LEFT JOIN users issuer ON c.issuer_id = issuer.id
        WHERE 1=1
    `;
    const queryParams = [];

    if (studentId) {
        query += ` AND c.student_id = $${queryParams.length + 1}`;
        queryParams.push(studentId);
    }

    if (certificateTypeId) {
        query += ` AND c.certificate_type_id = $${queryParams.length + 1}`;
        queryParams.push(certificateTypeId);
    }

    if (isRevoked !== undefined) {
        query += ` AND c.is_revoked = $${queryParams.length + 1}`;
        queryParams.push(isRevoked);
    }

    query += ' ORDER BY c.issue_date DESC';

    const { rows } = await processDBRequest({ query, queryParams });
    return rows;
};

const findCertificateById = async (id) => {
    const query = `
        SELECT
            c.*,
            u.name AS "studentName",
            u.email AS "studentEmail",
            ct.name AS "certificateType",
            ct.description AS "certificateTypeDescription",
            issuer.name AS "issuerName",
            revoker.name AS "revokedByName"
        FROM certificates c
        LEFT JOIN users u ON c.student_id = u.id
        LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.id
        LEFT JOIN users issuer ON c.issuer_id = issuer.id
        LEFT JOIN users revoker ON c.revoked_by = revoker.id
        WHERE c.id = $1
    `;
    const queryParams = [id];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
};

const findCertificateByCertificateNumber = async (certificateNumber) => {
    const query = `
        SELECT
            c.*,
            u.name AS "studentName",
            u.email AS "studentEmail",
            ct.name AS "certificateType",
            issuer.name AS "issuerName"
        FROM certificates c
        LEFT JOIN users u ON c.student_id = u.id
        LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.id
        LEFT JOIN users issuer ON c.issuer_id = issuer.id
        WHERE c.certificate_number = $1
    `;
    const queryParams = [certificateNumber];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
};

const createCertificate = async (payload) => {
    const {
        studentId,
        certificateTypeId,
        courseName,
        grade,
        issueDate,
        issuerId,
        blockchainId,
        transactionHash,
        contractAddress,
        network,
        ipfsHash,
        ipfsMetadataUrl,
        certificateNumber,
        description
    } = payload;

    const query = `
        INSERT INTO certificates (
            student_id, certificate_type_id, course_name, grade, issue_date,
            issuer_id, blockchain_id, transaction_hash, contract_address,
            network, ipfs_hash, ipfs_metadata_url, certificate_number, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
    `;
    const queryParams = [
        studentId, certificateTypeId, courseName, grade, issueDate,
        issuerId, blockchainId, transactionHash, contractAddress,
        network, ipfsHash, ipfsMetadataUrl, certificateNumber, description
    ];
    
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
};

const revokeCertificate = async (payload) => {
    const { certificateId, revokedBy, revokedReason } = payload;
    const now = new Date();
    
    const query = `
        UPDATE certificates
        SET is_revoked = true,
            revoked_date = $1,
            revoked_by = $2,
            revoked_reason = $3,
            updated_dt = $1
        WHERE id = $4
        RETURNING id
    `;
    const queryParams = [now, revokedBy, revokedReason, certificateId];
    const { rowCount } = await processDBRequest({ query, queryParams });
    return rowCount;
};

const logCertificateVerification = async (payload) => {
    const { certificateId, verifiedBy, verificationMethod, verificationResult } = payload;
    
    const query = `
        INSERT INTO certificate_verifications (
            certificate_id, verified_by, verification_method, verification_result
        ) VALUES ($1, $2, $3, $4)
    `;
    const queryParams = [certificateId, verifiedBy, verificationMethod, verificationResult];
    await processDBRequest({ query, queryParams });
};

// Certificate Types
const getAllCertificateTypes = async () => {
    const query = `SELECT * FROM certificate_types WHERE is_active = true ORDER BY name`;
    const { rows } = await processDBRequest({ query });
    return rows;
};

// Blockchain Config
const getBlockchainConfig = async (networkName) => {
    const query = `
        SELECT * FROM blockchain_config 
        WHERE network_name = $1 AND is_active = true
    `;
    const queryParams = [networkName];
    const { rows } = await processDBRequest({ query, queryParams });
    return rows[0];
};

const getActiveBlockchainConfig = async () => {
    const query = `
        SELECT * FROM blockchain_config 
        WHERE is_active = true 
        ORDER BY is_testnet DESC, id DESC 
        LIMIT 1
    `;
    const { rows } = await processDBRequest({ query });
    return rows[0];
};

module.exports = {
    findAllCertificates,
    findCertificateById,
    findCertificateByCertificateNumber,
    createCertificate,
    revokeCertificate,
    logCertificateVerification,
    getAllCertificateTypes,
    getBlockchainConfig,
    getActiveBlockchainConfig
};
