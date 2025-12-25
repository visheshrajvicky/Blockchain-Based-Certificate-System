import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  OpenInNew,
  Delete as DeleteIcon,
  ContentCopy,
  Download,
  Verified
} from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PageContentHeader } from '@/components/page-content-header';
import {
  useGetCertificateByIdQuery,
  useRevokeCertificateMutation
} from '../api/certificate-api';
import { getFormattedDate, DATE_TIME_24_HR_FORMAT } from '@/utils/helpers/date';
import { getBlockExplorerUrl } from '@/utils/web3/contract';

export const ViewCertificate = () => {
  const { id } = useParams<{ id: string }>();
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const { data, isLoading, isError } = useGetCertificateByIdQuery(Number(id));
  const [revokeCertificate, { isLoading: revoking }] = useRevokeCertificateMutation();

  const certificate = data?.certificate;

  console.log('Certificate data:', certificate);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      toast.error('Please provide a reason for revocation');
      return;
    }

    try {
      await revokeCertificate({ id: Number(id), reason: revokeReason }).unwrap();
      toast.success('Certificate revoked successfully');
      setRevokeDialogOpen(false);
      setRevokeReason('');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to revoke certificate');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !certificate) {
    return (
      <Alert severity="error">
        Certificate not found or error loading data.
      </Alert>
    );
  }

  return (
    <>
      <PageContentHeader heading="Certificate Details" />

      {/* Header Card with Status */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {certificate.certificateType} Certificate
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {certificate.course_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
            {certificate.is_revoked ? (
              <Chip
                icon={<Cancel />}
                label="Revoked"
                sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 600 }}
                size="medium"
              />
            ) : (
              <Chip
                icon={<Verified />}
                label="Valid & Verified"
                sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 600 }}
                size="medium"
              />
            )}
            {certificate.blockchain_id && (
              <Chip
                icon={<CheckCircle />}
                label="On Blockchain"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                size="small"
              />
            )}
          </Box>
        </Box>
        
        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Certificate Number</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
              {certificate.certificate_number}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Issue Date</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {getFormattedDate(certificate.issue_date, DATE_TIME_24_HR_FORMAT)}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Student Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Verified color="primary" />
                Student Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: '40%' }}>Name</TableCell>
                    <TableCell>{certificate.studentName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell>{certificate.studentEmail}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                    <TableCell>#{certificate.student_id}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificate Details */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                Achievement Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: '40%' }}>Certificate Type</TableCell>
                    <TableCell>{certificate.certificateType}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Course Name</TableCell>
                    <TableCell>{certificate.course_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                    <TableCell>
                      <Chip label={certificate.grade} color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                  {certificate?.description && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell>{certificate.description}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Blockchain Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                🔗 Blockchain Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {certificate?.blockchain_id ? (
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '40%' }}>Network</TableCell>
                      <TableCell>
                        <Chip label={certificate.network} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Blockchain ID</TableCell>
                      <TableCell>#{certificate.blockchain_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Contract Address</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {certificate.contract_address?.substring(0, 10)}...{certificate.contract_address?.substring(38)}
                          </Typography>
                          <Tooltip title="Copy address">
                            <IconButton size="small" onClick={() => certificate.contract_address && copyToClipboard(certificate.contract_address, 'Contract address')}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View on explorer">
                            <IconButton 
                              size="small" 
                              component="a" 
                              href={getBlockExplorerUrl(certificate.contract_address || '', 'address')}
                              target="_blank"
                            >
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Transaction Hash</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {certificate.transaction_hash?.substring(0, 10)}...{certificate.transaction_hash?.substring(62)}
                          </Typography>
                          <Tooltip title="Copy hash">
                            <IconButton size="small" onClick={() => certificate.transaction_hash && copyToClipboard(certificate.transaction_hash, 'Transaction hash')}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View on explorer">
                            <IconButton 
                              size="small" 
                              component="a" 
                              href={getBlockExplorerUrl(certificate.transaction_hash || '', 'tx')}
                              target="_blank"
                            >
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Alert severity="info">
                  Certificate not yet recorded on blockchain
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* IPFS Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', bgcolor: 'secondary.50' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                📦 IPFS Storage
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {certificate.ipfs_hash ? (
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '40%' }}>IPFS Hash (CID)</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {certificate.ipfs_hash.substring(0, 15)}...
                          </Typography>
                          <Tooltip title="Copy IPFS hash">
                            <IconButton size="small" onClick={() => certificate.ipfs_hash && copyToClipboard(certificate.ipfs_hash, 'IPFS hash')}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Metadata URL</TableCell>
                      <TableCell>
                        {certificate.ipfs_metadata_url && (
                          <>
                            <Tooltip title="View metadata">
                              <IconButton 
                                size="small" 
                                component="a" 
                                href={certificate.ipfs_metadata_url}
                                target="_blank"
                              >
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download metadata">
                              <IconButton 
                                size="small"
                                onClick={() => window.open(certificate.ipfs_metadata_url!, '_blank')}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Alert severity="info">
                  Metadata not yet uploaded to IPFS
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Issuer Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Issuer Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: '40%' }}>Issued By</TableCell>
                    <TableCell>{certificate.issuerName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Issuer ID</TableCell>
                    <TableCell>#{certificate.issuer_id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Issue Date</TableCell>
                    <TableCell>{getFormattedDate(certificate.issue_date, DATE_TIME_24_HR_FORMAT)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    <TableCell>{getFormattedDate(certificate.created_dt, DATE_TIME_24_HR_FORMAT)}</TableCell>
                  </TableRow>
                  {certificate.updated_dt && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                      <TableCell>{getFormattedDate(certificate.updated_dt, DATE_TIME_24_HR_FORMAT)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificate Type Description */}
        {certificate.certificateTypeDescription && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Certificate Type Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {certificate.certificateTypeDescription}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Revocation Information */}
        {certificate.is_revoked && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cancel /> This certificate has been revoked
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Revoked Date</Typography>
                  <Typography variant="body1">{getFormattedDate(certificate.revoked_date!, DATE_TIME_24_HR_FORMAT)}</Typography>
                </Grid>
                {certificate.revokedByName && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Revoked By</Typography>
                    <Typography variant="body1">{certificate.revokedByName}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                  <Typography variant="body1">{certificate.revoked_reason}</Typography>
                </Grid>
              </Grid>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          component={Link}
          to="/app/certificates"
          variant="outlined"
          size="large"
        >
          Back to List
        </Button>
        {!certificate.is_revoked && (
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<DeleteIcon />}
            onClick={() => setRevokeDialogOpen(true)}
          >
            Revoke Certificate
          </Button>
        )}
      </Box>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onClose={() => setRevokeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revoke Certificate</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The certificate will be marked as revoked on the blockchain.
          </Alert>
          <TextField
            fullWidth
            label="Reason for Revocation"
            multiline
            rows={4}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeDialogOpen(false)} disabled={revoking}>
            Cancel
          </Button>
          <Button
            onClick={handleRevoke}
            variant="contained"
            color="error"
            disabled={revoking || !revokeReason.trim()}
            startIcon={revoking && <CircularProgress size={20} />}
          >
            {revoking ? 'Revoking...' : 'Revoke Certificate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
