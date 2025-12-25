const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateVerification", function () {
  let certificateContract;
  let owner, issuer, student, otherAccount;

  beforeEach(async function () {
    [owner, issuer, student, otherAccount] = await ethers.getSigners();

    const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
    certificateContract = await CertificateVerification.deploy();
    await certificateContract.waitForDeployment();

    // Grant issuer role
    const ISSUER_ROLE = await certificateContract.ISSUER_ROLE();
    await certificateContract.grantRole(ISSUER_ROLE, issuer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const DEFAULT_ADMIN_ROLE = await certificateContract.DEFAULT_ADMIN_ROLE();
      expect(await certificateContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should grant admin and issuer roles to deployer", async function () {
      const ADMIN_ROLE = await certificateContract.ADMIN_ROLE();
      const ISSUER_ROLE = await certificateContract.ISSUER_ROLE();
      
      expect(await certificateContract.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await certificateContract.hasRole(ISSUER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Certificate Issuance", function () {
    it("Should issue a certificate successfully", async function () {
      const tx = await certificateContract.connect(issuer).issueCertificate(
        student.address,
        "STU001",
        "John Doe",
        "Completion",
        "Computer Science 101",
        "A+",
        "QmTest123456"
      );

      await expect(tx)
        .to.emit(certificateContract, "CertificateIssued")
        .withArgs(1, student.address, "STU001", "Completion", "QmTest123456", issuer.address);

      const certificate = await certificateContract.getCertificate(1);
      expect(certificate.studentAddress).to.equal(student.address);
      expect(certificate.studentId).to.equal("STU001");
      expect(certificate.certificateType).to.equal("Completion");
    });

    it("Should fail if non-issuer tries to issue certificate", async function () {
      await expect(
        certificateContract.connect(otherAccount).issueCertificate(
          student.address,
          "STU001",
          "John Doe",
          "Completion",
          "Computer Science 101",
          "A+",
          "QmTest123456"
        )
      ).to.be.reverted;
    });

    it("Should fail with invalid student address", async function () {
      await expect(
        certificateContract.connect(issuer).issueCertificate(
          ethers.ZeroAddress,
          "STU001",
          "John Doe",
          "Completion",
          "Computer Science 101",
          "A+",
          "QmTest123456"
        )
      ).to.be.revertedWith("Invalid student address");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await certificateContract.connect(issuer).issueCertificate(
        student.address,
        "STU001",
        "John Doe",
        "Completion",
        "Computer Science 101",
        "A+",
        "QmTest123456"
      );
    });

    it("Should verify a valid certificate", async function () {
      const [isValid, certificate] = await certificateContract.verifyCertificate(1);
      expect(isValid).to.be.true;
      expect(certificate.revoked).to.be.false;
    });

    it("Should return false for revoked certificate", async function () {
      await certificateContract.revokeCertificate(1, "Test revocation");
      const [isValid] = await certificateContract.verifyCertificate(1);
      expect(isValid).to.be.false;
    });
  });

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await certificateContract.connect(issuer).issueCertificate(
        student.address,
        "STU001",
        "John Doe",
        "Completion",
        "Computer Science 101",
        "A+",
        "QmTest123456"
      );
    });

    it("Should revoke a certificate", async function () {
      await expect(certificateContract.revokeCertificate(1, "Fraudulent claim"))
        .to.emit(certificateContract, "CertificateRevoked")
        .withArgs(1, owner.address, "Fraudulent claim");

      const certificate = await certificateContract.getCertificate(1);
      expect(certificate.revoked).to.be.true;
      expect(certificate.revokedReason).to.equal("Fraudulent claim");
    });

    it("Should fail if non-admin tries to revoke", async function () {
      await expect(
        certificateContract.connect(otherAccount).revokeCertificate(1, "Test")
      ).to.be.reverted;
    });
  });

  describe("Student Certificates", function () {
    it("Should return all certificates for a student", async function () {
      await certificateContract.connect(issuer).issueCertificate(
        student.address,
        "STU001",
        "John Doe",
        "Completion",
        "Course 1",
        "A",
        "QmTest1"
      );

      await certificateContract.connect(issuer).issueCertificate(
        student.address,
        "STU001",
        "John Doe",
        "Achievement",
        "Course 2",
        "A+",
        "QmTest2"
      );

      const certificates = await certificateContract.getStudentCertificates(student.address);
      expect(certificates.length).to.equal(2);
    });
  });
});
