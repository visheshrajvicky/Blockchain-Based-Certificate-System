import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PinataSDK } from 'pinata';
import { PageContentHeader } from '@/components/page-content-header';
import { useGetStudentsQuery } from '@/domains/student/api';
import {
  useGetCertificateTypesQuery,
  useIssueCertificateMutation,
  useUpdateCertificateBlockchainDataMutation
} from '../api/certificate-api';
import { useWeb3 } from '@/contexts/Web3Context';
import { getContractInstance } from '@/utils/web3/contract';

export const IssueCertificate = () => {
  const navigate = useNavigate();
  const { account, isConnected, isCorrectNetwork, connectWallet, switchToCorrectNetwork, signer } = useWeb3();
  
  const [formData, setFormData] = useState({
    studentId: '',
    certificateTypeId: '',
    courseName: '',
    grade: '',
    description: ''
  });

  const { data: studentsData, isLoading: studentsLoading } = useGetStudentsQuery({});
  const { data: typesData, isLoading: typesLoading } = useGetCertificateTypesQuery();
  const [issueCertificate, { isLoading: issuing }] = useIssueCertificateMutation();
  const [updateBlockchainData] = useUpdateCertificateBlockchainDataMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network');
      return;
    }

    try {
      // Step 1: Create certificate in database and get metadata
      toast.info('Creating certificate record...');
      const result = await issueCertificate({
        ...formData,
        studentId: Number(formData.studentId),
        certificateTypeId: Number(formData.certificateTypeId)
      }).unwrap();

      toast.success(result.message);

      // Step 2: Upload metadata to Pinata IPFS
      toast.info('Uploading metadata to IPFS...');
      let ipfsHash = '';
      let ipfsMetadataUrl = '';
      
      try {
        const pinata = new PinataSDK({
          pinataJwt: import.meta.env.VITE_PINATA_JWT,
          pinataGateway: import.meta.env.VITE_PINATA_GATEWAY
        });

        // Use metadata from backend response
        const metadata = result.metadata;

        // Convert metadata to JSON file
        // const metadataBlob = new Blob([JSON.stringify(metadata)], { 
        //   type: 'application/json' 
        // });
        // const metadataFile = new File(
        //   [metadataBlob], 
        //   `certificate-${result.certificateNumber}.json`,
        //   { type: 'application/json' }
        // );

        // Upload to Pinata
        const upload = await pinata.upload.public.json(metadata);

        if (upload.cid) {
          ipfsHash = upload.cid;
          ipfsMetadataUrl = `${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${upload.cid}`;
          toast.success('Metadata uploaded to IPFS!');
        } else {
          throw new Error('Failed to get IPFS hash');
        }
      } catch (ipfsError: any) {
        console.error('IPFS upload error:', ipfsError);
        toast.error('Failed to upload to IPFS: ' + ipfsError.message);
        return;
      }

      // Step 3: Issue certificate on blockchain
      toast.info('Preparing blockchain transaction...');
      if (signer) {
        const contract = getContractInstance(signer);
        const student = studentsData?.students.find(s => s.id === Number(formData.studentId));
        
        if (student) {
          // For demo purposes, we'll use a mock student address
          // In production, students would have their wallet addresses stored
          const studentAddress = account; // Replace with actual student wallet address
          const studentId = student.id.toString();
          const studentName = student.name;
          const certType = typesData?.types.find(t => t.id === Number(formData.certificateTypeId))?.name || '';
          
          console.log('Blockchain transaction params:', {
            studentAddress,
            studentId,
            studentName,
            certType,
            courseName: formData.courseName,
            grade: formData.grade,
            ipfsHash
          });
          
          // Check if the account has ISSUER_ROLE
          toast.info('Checking permissions...');
          const ISSUER_ROLE = await contract.ISSUER_ROLE();
          const hasIssuerRole = await contract.hasRole(ISSUER_ROLE, account);
          
          if (!hasIssuerRole) {
            toast.error('Your wallet does not have ISSUER_ROLE. Please contact an administrator to grant you issuer permissions.');
            throw new Error(`Wallet ${account} does not have ISSUER_ROLE. Run the grant-issuer-role script to grant permissions.`);
          }
          
          console.log('✅ Wallet has ISSUER_ROLE');
          
          toast.info('Sending blockchain transaction...');
          const tx = await contract.issueCertificate(
            studentAddress,
            studentId,
            studentName,
            certType,
            formData.courseName,
            formData.grade,
            ipfsHash
          );

          toast.info('Waiting for confirmation...');
          const receipt = await tx.wait();

          console.log('Transaction receipt:', receipt);
          console.log('Receipt logs count:', receipt.logs?.length);

          // Extract blockchain ID from event
          let blockchainId: number | undefined;
          
          // Approach 1: Use contract event filtering
          try {
            const filter = contract.filters.CertificateIssued();
            const events = await contract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
            console.log('Filtered events:', events);
            
            if (events.length > 0) {
              const event = events[events.length - 1]; // Get the last event (most recent)
              // Type guard to check if it's an EventLog
              if ('args' in event) {
                blockchainId = Number(event.args.certificateId);
                console.log('Certificate issued with blockchain ID from filter:', blockchainId);
              }
            }
          } catch (error) {
            console.error('Error filtering events:', error);
          }

          // Approach 2: Parse logs manually if filtering failed
          if (!blockchainId && receipt.logs) {
            for (const log of receipt.logs) {
              try {
                const parsed = contract.interface.parseLog({
                  topics: log.topics as string[],
                  data: log.data
                });
                
                console.log('Parsed log:', parsed?.name, parsed?.args);
                
                if (parsed && parsed.name === 'CertificateIssued') {
                  blockchainId = Number(parsed.args.certificateId || parsed.args[0]);
                  console.log('Certificate issued with blockchain ID from logs:', blockchainId);
                  break;
                }
              } catch (error) {
                console.log('Failed to parse log:', error);
                continue;
              }
            }
          }

          if (!blockchainId) {
            console.error('Could not find CertificateIssued event. Receipt:', JSON.stringify(receipt, null, 2));
            throw new Error('Failed to extract blockchain ID from transaction receipt. Please check console logs.');
          }

          toast.success('Certificate issued on blockchain!');
          
          // Step 4: Update database with blockchain and IPFS data
          toast.info('Updating certificate record...');
          await updateBlockchainData({
            id: result.certificateId,
            data: {
              blockchainId: blockchainId,
              transactionHash: receipt.hash,
              ipfsHash: ipfsHash,
              ipfsMetadataUrl: ipfsMetadataUrl
            }
          }).unwrap();

          toast.success('Certificate fully registered!');
          
          navigate('/app/certificates');
        }
      }
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to issue certificate');
    }
  };

  return (
    <>
      <PageContentHeader heading="Issue New Certificate" />

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You need to connect your wallet to issue certificates.
          <Button onClick={connectWallet} sx={{ ml: 2 }}>
            Connect Wallet
          </Button>
        </Alert>
      )}

      {isConnected && !isCorrectNetwork && (
        <Alert severity="error" sx={{ mb: 2 }}>
          You are on the wrong network. Please switch to the correct network.
          <Button onClick={switchToCorrectNetwork} sx={{ ml: 2 }}>
            Switch Network
          </Button>
        </Alert>
      )}

      {isConnected && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Connected Wallet
            </Typography>
            <Chip label={account} color="success" size="small" />
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
          <TextField
            select
            fullWidth
            label="Student"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            required
            disabled={studentsLoading}
            sx={{ mb: 3 }}
          >
            {studentsData?.students.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.name} ({student.email})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Certificate Type"
            name="certificateTypeId"
            value={formData.certificateTypeId}
            onChange={handleChange}
            required
            disabled={typesLoading}
            sx={{ mb: 3 }}
          >
            {typesData?.types.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Course Name"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            required
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            required
            placeholder="e.g., A+, B, 95%"
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={!isConnected || !isCorrectNetwork || issuing}
              startIcon={issuing && <CircularProgress size={20} />}
            >
              {issuing ? 'Issuing...' : 'Issue Certificate'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/app/certificates')}
              disabled={issuing}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </>
  );
};
