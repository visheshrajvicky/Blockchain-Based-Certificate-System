import { api, Tag } from '@/api';

export interface Certificate {
  id: number;
  student_id: number;
  certificate_type_id: number;
  course_name: string;
  grade: string;
  issue_date: string;
  issuer_id: number;
  blockchain_id: number | null;
  transaction_hash: string | null;
  contract_address: string | null;
  network: string | null;
  ipfs_hash: string | null;
  ipfs_metadata_url: string | null;
  certificate_number: string;
  description: string | null;
  is_revoked: boolean;
  revoked_date: string | null;
  revoked_by: number | null;
  revoked_reason: string | null;
  created_dt: string;
  updated_dt: string | null;
  studentName: string;
  studentEmail: string;
  certificateType: string;
  certificateTypeDescription: string | null;
  issuerName: string;
  revokedByName: string | null;
  // Aliases for camelCase compatibility
  certificateNumber: string;
  courseName: string;
  issueDate: string;
  blockchainId: number | null;
  transactionHash: string | null;
  ipfsHash: string | null;
  isRevoked: boolean;
  revokedDate: string | null;
  revokedReason: string | null;
}

export interface CertificateType {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface IssueCertificateRequest {
  studentId: number;
  certificateTypeId: number;
  courseName: string;
  grade: string;
  issueDate?: string;
  description?: string;
}

export interface UpdateBlockchainDataRequest {
  blockchainId: number;
  transactionHash: string;
  ipfsHash: string;
  ipfsMetadataUrl: string;
}

export interface VerifyCertificateResponse {
  isValid: boolean;
  certificate: {
    certificateNumber: string;
    studentName: string;
    courseName: string;
    grade: string;
    issueDate: string;
    certificateType: string;
    issuerName: string;
    isRevoked: boolean;
    revokedDate: string | null;
    revokedReason: string | null;
    blockchainId: number | null;
    transactionHash: string | null;
    ipfsHash: string | null;
  };
}

export const certificateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCertificates: builder.query<{ certificates: Certificate[] }, { studentId?: number; certificateTypeId?: number; isRevoked?: boolean }>({
      query: (params) => {
        const queryString = new URLSearchParams();
        if (params.studentId) queryString.append('studentId', params.studentId.toString());
        if (params.certificateTypeId) queryString.append('certificateTypeId', params.certificateTypeId.toString());
        if (params.isRevoked !== undefined) queryString.append('isRevoked', params.isRevoked.toString());
        
        return `/certificates?${queryString.toString()}`;
      },
      providesTags: (result) =>
        result?.certificates?.map(({ id }) => ({ type: Tag.CERTIFICATES as const, id })) || [{ type: Tag.CERTIFICATES as const }]
    }),

    getCertificateById: builder.query<{ certificate: Certificate }, number>({
      query: (id) => `/certificates/${id}`,
      providesTags: (_result, _error, id) => [{ type: Tag.CERTIFICATES as const, id }]
    }),

    verifyCertificate: builder.query<VerifyCertificateResponse, string>({
      query: (certificateNumber) => `/certificates/verify/${certificateNumber}`
    }),

    getCertificateTypes: builder.query<{ types: CertificateType[] }, void>({
      query: () => `/certificates/types`
    }),

    issueCertificate: builder.mutation<{ 
      message: string; 
      certificateId: number; 
      certificateNumber: string;
      metadata: {
        certificateNumber: string;
        studentId: number;
        studentName: string;
        studentEmail: string;
        certificateTypeId: number;
        courseName: string;
        grade: string;
        issueDate: string;
        issuerId: number;
        issuerName: string;
        description: string;
        network: string;
        contractAddress: string;
      };
      blockchainConfig: {
        contractAddress: string;
        network: string;
        chainId: number;
        rpcUrl: string;
      };
    }, IssueCertificateRequest>({
      query: (payload) => ({
        url: `/certificates`,
        method: 'POST',
        body: payload
      }),
      invalidatesTags: [{ type: Tag.CERTIFICATES as const }]
    }),

    updateCertificateBlockchainData: builder.mutation<{ message: string }, { id: number; data: UpdateBlockchainDataRequest }>({
      query: ({ id, data }) => ({
        url: `/certificates/${id}/blockchain`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: Tag.CERTIFICATES as const, id }]
    }),

    revokeCertificate: builder.mutation<{ message: string }, { id: number; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/certificates/${id}/revoke`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: Tag.CERTIFICATES as const, id }]
    })
  })
});

export const {
  useGetCertificatesQuery,
  useGetCertificateByIdQuery,
  useLazyVerifyCertificateQuery,
  useGetCertificateTypesQuery,
  useIssueCertificateMutation,
  useUpdateCertificateBlockchainDataMutation,
  useRevokeCertificateMutation
} = certificateApi;
