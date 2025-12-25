// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CertificateVerification
 * @dev Smart contract for issuing and verifying student certificates
 * @notice This contract allows authorized issuers to create certificates and anyone to verify them
 */
contract CertificateVerification is AccessControl, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 private _certificateIdCounter;
    
    struct Certificate {
        uint256 id;
        address studentAddress;
        string studentId;
        string studentName;
        string certificateType;
        string courseName;
        string grade;
        uint256 issueDate;
        address issuer;
        string ipfsHash;
        bool revoked;
        uint256 revokedDate;
        string revokedReason;
    }
    
    // Mapping from certificate ID to Certificate
    mapping(uint256 => Certificate) private certificates;
    
    // Mapping from student address to array of certificate IDs
    mapping(address => uint256[]) private studentCertificates;
    
    // Mapping from certificate hash to certificate ID (for verification)
    mapping(bytes32 => uint256) private certificateHashToId;
    
    // Events
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed studentAddress,
        string studentId,
        string certificateType,
        string ipfsHash,
        address issuer
    );
    
    event CertificateRevoked(
        uint256 indexed certificateId,
        address revokedBy,
        string reason
    );
    
    event IssuerAdded(address indexed issuer, address addedBy);
    event IssuerRemoved(address indexed issuer, address removedBy);
    
    /**
     * @dev Constructor that sets up roles
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
    }
    
    /**
     * @dev Issue a new certificate
     * @param studentAddress Wallet address of the student
     * @param studentId Student ID from the school system
     * @param studentName Name of the student
     * @param certificateType Type of certificate (e.g., "Completion", "Achievement", "Merit")
     * @param courseName Name of the course/program
     * @param grade Grade achieved
     * @param ipfsHash IPFS hash containing certificate metadata and image
     */
    function issueCertificate(
        address studentAddress,
        string memory studentId,
        string memory studentName,
        string memory certificateType,
        string memory courseName,
        string memory grade,
        string memory ipfsHash
    ) public onlyRole(ISSUER_ROLE) nonReentrant returns (uint256) {
        require(studentAddress != address(0), "Invalid student address");
        require(bytes(studentId).length > 0, "Student ID required");
        require(bytes(studentName).length > 0, "Student name required");
        require(bytes(certificateType).length > 0, "Certificate type required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        
        _certificateIdCounter++;
        uint256 newCertificateId = _certificateIdCounter;
        
        // Create certificate hash for verification
        bytes32 certHash = keccak256(
            abi.encodePacked(
                studentAddress,
                studentId,
                certificateType,
                courseName,
                ipfsHash
            )
        );
        
        require(certificateHashToId[certHash] == 0, "Certificate already exists");
        
        Certificate memory newCertificate = Certificate({
            id: newCertificateId,
            studentAddress: studentAddress,
            studentId: studentId,
            studentName: studentName,
            certificateType: certificateType,
            courseName: courseName,
            grade: grade,
            issueDate: block.timestamp,
            issuer: msg.sender,
            ipfsHash: ipfsHash,
            revoked: false,
            revokedDate: 0,
            revokedReason: ""
        });
        
        certificates[newCertificateId] = newCertificate;
        studentCertificates[studentAddress].push(newCertificateId);
        certificateHashToId[certHash] = newCertificateId;
        
        emit CertificateIssued(
            newCertificateId,
            studentAddress,
            studentId,
            certificateType,
            ipfsHash,
            msg.sender
        );
        
        return newCertificateId;
    }
    
    /**
     * @dev Revoke a certificate
     * @param certificateId ID of the certificate to revoke
     * @param reason Reason for revocation
     */
    function revokeCertificate(
        uint256 certificateId,
        string memory reason
    ) public onlyRole(ADMIN_ROLE) {
        require(certificateId > 0 && certificateId <= _certificateIdCounter, "Invalid certificate ID");
        require(!certificates[certificateId].revoked, "Certificate already revoked");
        require(bytes(reason).length > 0, "Revocation reason required");
        
        certificates[certificateId].revoked = true;
        certificates[certificateId].revokedDate = block.timestamp;
        certificates[certificateId].revokedReason = reason;
        
        emit CertificateRevoked(certificateId, msg.sender, reason);
    }
    
    /**
     * @dev Verify if a certificate is valid
     * @param certificateId ID of the certificate
     * @return isValid Whether the certificate is valid
     * @return certificate The certificate details
     */
    function verifyCertificate(uint256 certificateId) 
        public 
        view 
        returns (bool isValid, Certificate memory certificate) 
    {
        require(certificateId > 0 && certificateId <= _certificateIdCounter, "Invalid certificate ID");
        
        certificate = certificates[certificateId];
        isValid = !certificate.revoked;
        
        return (isValid, certificate);
    }
    
    /**
     * @dev Get certificate by ID
     * @param certificateId ID of the certificate
     */
    function getCertificate(uint256 certificateId) 
        public 
        view 
        returns (Certificate memory) 
    {
        require(certificateId > 0 && certificateId <= _certificateIdCounter, "Invalid certificate ID");
        return certificates[certificateId];
    }
    
    /**
     * @dev Get all certificates for a student
     * @param studentAddress Address of the student
     */
    function getStudentCertificates(address studentAddress) 
        public 
        view 
        returns (Certificate[] memory) 
    {
        uint256[] memory certIds = studentCertificates[studentAddress];
        Certificate[] memory studentCerts = new Certificate[](certIds.length);
        
        for (uint256 i = 0; i < certIds.length; i++) {
            studentCerts[i] = certificates[certIds[i]];
        }
        
        return studentCerts;
    }
    
    /**
     * @dev Get total number of certificates issued
     */
    function getTotalCertificates() public view returns (uint256) {
        return _certificateIdCounter;
    }
    
    /**
     * @dev Add a new issuer
     * @param issuer Address to grant issuer role
     */
    function addIssuer(address issuer) public onlyRole(ADMIN_ROLE) {
        require(issuer != address(0), "Invalid issuer address");
        grantRole(ISSUER_ROLE, issuer);
        emit IssuerAdded(issuer, msg.sender);
    }
    
    /**
     * @dev Remove an issuer
     * @param issuer Address to revoke issuer role
     */
    function removeIssuer(address issuer) public onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, issuer);
        emit IssuerRemoved(issuer, msg.sender);
    }
    
    /**
     * @dev Check if an address is an issuer
     * @param account Address to check
     */
    function isIssuer(address account) public view returns (bool) {
        return hasRole(ISSUER_ROLE, account);
    }
}
