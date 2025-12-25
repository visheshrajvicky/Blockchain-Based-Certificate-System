import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Link as MuiLink
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Search,
  OpenInNew
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { PageContentHeader } from '@/components/page-content-header';
import { useLazyVerifyCertificateQuery } from '../api/certificate-api';
import { getFormattedDate, DATE_TIME_24_HR_FORMAT } from '@/utils/helpers/date';
import { getBlockExplorerUrl } from '@/utils/web3/contract';

export const VerifyCertificate = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [verifyCertificate, { data, isLoading, isError, error }] = useLazyVerifyCertificateQuery();

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      toast.error('Please enter a certificate number');
      return;
    }

    try {
      await verifyCertificate(certificateNumber.trim()).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Certificate verification failed');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const certificate = data?.certificate;
  const isValid = certificate && !certificate.isRevoked;

  return (
    <>
      <PageContentHeader heading="Certificate Verification" />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Enter Certificate Number
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the unique certificate number to verify its authenticity on the blockchain.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Certificate Number"
              placeholder="e.g., CERT-2024-001"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button
              variant="contained"
              onClick={handleVerify}
              disabled={isLoading || !certificateNumber.trim()}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </Box>

          {isError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {(error as any)?.data?.message || 'Certificate not found or verification failed'}
            </Alert>
          )}

          {certificate && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Verification Result
                  </Typography>
                  {isValid ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Valid Certificate"
                      color="success"
                      size="medium"
                    />
                  ) : (
                    <Chip
                      icon={<Cancel />}
                      label="Revoked"
                      color="error"
                      size="medium"
                    />
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {!isValid && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      This certificate has been revoked
                    </Typography>
                    {certificate.revokedDate && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Revoked on:</strong> {getFormattedDate(certificate.revokedDate, DATE_TIME_24_HR_FORMAT)}
                      </Typography>
                    )}
                    {certificate.revokedReason && (
                      <Typography variant="body2">
                        <strong>Reason:</strong> {certificate.revokedReason}
                      </Typography>
                    )}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Certificate Information
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Certificate Number
                    </Typography>
                    <Typography variant="body1">
                      {certificate.certificateNumber}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Certificate Type
                    </Typography>
                    <Typography variant="body1">
                      {certificate.certificateType}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Student Name
                    </Typography>
                    <Typography variant="body1">
                      {certificate.studentName}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Issue Date
                    </Typography>
                    <Typography variant="body1">
                      {getFormattedDate(certificate.issueDate, DATE_TIME_24_HR_FORMAT)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Course Name
                    </Typography>
                    <Typography variant="body1">
                      {certificate.courseName}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Grade
                    </Typography>
                    <Typography variant="body1">
                      {certificate.grade}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Blockchain Verification
                    </Typography>
                  </Grid>

                  {certificate.blockchainId ? (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Blockchain ID
                        </Typography>
                        <Typography variant="body1">
                          #{certificate.blockchainId}
                        </Typography>
                      </Grid>

                      {certificate.transactionHash && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Transaction Hash
                          </Typography>
                          <MuiLink
                            href={getBlockExplorerUrl(certificate.transactionHash, 'tx')}
                            target="_blank"
                            rel="noopener"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                              {certificate.transactionHash}
                            </Typography>
                            <OpenInNew fontSize="small" />
                          </MuiLink>
                        </Grid>
                      )}

                      {certificate.ipfsHash && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            IPFS Metadata Hash
                          </Typography>
                          <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                            {certificate.ipfsHash}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Alert severity="success" icon={<CheckCircle />}>
                          This certificate has been verified on the blockchain and is authentic.
                        </Alert>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="warning">
                        Certificate exists in the system but has not been recorded on the blockchain yet.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </>
  );
};
