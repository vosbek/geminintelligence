-- Migration Script: Add Company Name Fields
-- Run this script on existing installations to add company_name fields

-- Add company name columns to ai_tools table
ALTER TABLE ai_tools 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS legal_company_name VARCHAR(255);

-- Update existing tools with their company names
UPDATE ai_tools SET 
    company_name = 'Anysphere', 
    legal_company_name = 'Anysphere Inc.'
WHERE name = 'Cursor';

UPDATE ai_tools SET 
    company_name = 'Anthropic', 
    legal_company_name = 'Anthropic PBC'
WHERE name = 'Claude';

UPDATE ai_tools SET 
    company_name = 'Microsoft', 
    legal_company_name = 'Microsoft Corporation'
WHERE name = 'GitHub Copilot';

UPDATE ai_tools SET 
    company_name = 'Replit', 
    legal_company_name = 'Replit Inc.'
WHERE name = 'Replit';

UPDATE ai_tools SET 
    company_name = 'Augment', 
    legal_company_name = 'Augment Code Inc.'
WHERE name = 'Augment';

UPDATE ai_tools SET 
    company_name = 'Zed Industries', 
    legal_company_name = 'Zed Industries Inc.'
WHERE name = 'Zed';

-- Verify the migration
SELECT name, company_name, legal_company_name FROM ai_tools;