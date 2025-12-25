-- Add Certificate Management to Access Controls
-- This script adds certificate management menu items and API endpoints to the access control system

INSERT INTO access_controls(
    name,
    path,
    icon,
    parent_path,
    hierarchy_id,
    type,
    method
)
VALUES
-- Certificate parent menu
('Certificates', 'certificates_parent', 'certificate.svg', NULL, 8, 'menu-screen', NULL),

-- Certificate screens
('Certificate List', 'certificates', NULL, 'certificates_parent', 1, 'menu-screen', NULL),
('Issue Certificate', 'certificates/issue', NULL, 'certificates_parent', 2, 'menu-screen', NULL),
('Verify Certificate', 'certificates/verify', NULL, 'certificates_parent', 3, 'menu-screen', NULL),
('View Certificate', 'certificates/:id', NULL, 'certificates_parent', NULL, 'screen', NULL),

-- Certificate API endpoints
('Get all certificates', '/api/v1/certificates', NULL, 'certificates_parent', NULL, 'api', 'GET'),
('Get certificate by ID', '/api/v1/certificates/:id', NULL, 'certificates_parent', NULL, 'api', 'GET'),
('Verify certificate (public)', '/api/v1/certificates/verify/:certificateNumber', NULL, 'certificates_parent', NULL, 'api', 'GET'),
('Get certificate types', '/api/v1/certificates/types', NULL, 'certificates_parent', NULL, 'api', 'GET'),
('Issue new certificate', '/api/v1/certificates', NULL, 'certificates_parent', NULL, 'api', 'POST'),
('Update certificate blockchain data', '/api/v1/certificates/:id/blockchain', NULL, 'certificates_parent', NULL, 'api', 'PUT'),
('Revoke certificate', '/api/v1/certificates/:id/revoke', NULL, 'certificates_parent', NULL, 'api', 'POST')
ON CONFLICT DO NOTHING;

-- Grant all certificate permissions to Admin role (role_id = 1)
INSERT INTO permissions (role_id, access_control_id)
SELECT 1, id 
FROM access_controls 
WHERE parent_path = 'certificates_parent' OR path = 'certificates_parent'
ON CONFLICT DO NOTHING;
