import { Box, Button, Paper, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import { useMemo } from 'react';
import { PageContentHeader } from '@/components/page-content-header';
import { useGetCertificatesQuery } from '../api/certificate-api';
import { Certificate } from '../api/certificate-api';
import { DATE_TIME_24_HR_FORMAT, getFormattedDate } from '@/utils/helpers/date';

export const ListCertificates = () => {
  const { data, isLoading, isError } = useGetCertificatesQuery({});

  const columns: MRT_ColumnDef<Certificate>[] = useMemo(
    () => [
      {
        accessorKey: 'certificateNumber',
        header: 'Certificate #',
        size: 150
      },
      {
        accessorKey: 'studentName',
        header: 'Student Name'
      },
      {
        accessorKey: 'certificateType',
        header: 'Type'
      },
      {
        accessorKey: 'courseName',
        header: 'Course Name'
      },
      {
        accessorKey: 'grade',
        header: 'Grade',
        size: 80
      },
      {
        accessorKey: 'issueDate',
        header: 'Issue Date',
        Cell: ({ cell }) => getFormattedDate(cell.getValue<string>(), DATE_TIME_24_HR_FORMAT)
      },
      {
        accessorKey: 'isRevoked',
        header: 'Status',
        Cell: ({ cell }) => (
          <Typography
            variant="body2"
            sx={{
              color: cell.getValue<boolean>() ? 'error.main' : 'success.main',
              fontWeight: 'bold'
            }}
          >
            {cell.getValue<boolean>() ? 'Revoked' : 'Valid'}
          </Typography>
        )
      },
      {
        accessorKey: 'blockchainId',
        header: 'Blockchain',
        Cell: ({ cell }) => (
          <Typography variant="body2">
            {cell.getValue<number>() ? `#${cell.getValue<number>()}` : '-'}
          </Typography>
        )
      }
    ],
    []
  );

  const table = useMaterialReactTable({
    data: data?.certificates || [],
    columns,
    state: {
      isLoading,
      density: 'compact'
    },
    enableDensityToggle: false,
    getRowId: (row) => row?.id?.toString() || '',
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          component={Link}
          to={`/app/certificates/${row.original.id}`}
          size="small"
          variant="outlined"
        >
          View
        </Button>
      </Box>
    ),
    renderEmptyRowsFallback: () => (
      <Box sx={{ textAlign: 'center', fontStyle: 'italic', my: 3 }}>
        {isError ? 'Error loading certificates' : 'No certificates found'}
      </Box>
    )
  });

  return (
    <>
      <PageContentHeader heading="Certificate Management" />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          component={Link}
          to="/app/certificates/issue"
          variant="contained"
          startIcon={<Add />}
        >
          Issue Certificate
        </Button>
      </Box>
      <Box sx={{ width: '100%', display: 'table', tableLayout: 'fixed' }} component={Paper}>
        <MaterialReactTable table={table} />
      </Box>
    </>
  );
};
