-- Create info_requests table to store lead generation data
CREATE TABLE IF NOT EXISTS info_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  message TEXT,
  timeline VARCHAR(100),
  facility_id VARCHAR(255) NOT NULL,
  facility_name VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_info_requests_facility_id ON info_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_info_requests_status ON info_requests(status);
CREATE INDEX IF NOT EXISTS idx_info_requests_created_at ON info_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_info_requests_email ON info_requests(email);

-- Add RLS policies (Row Level Security)
ALTER TABLE info_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" ON info_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_info_requests_updated_at
  BEFORE UPDATE ON info_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE info_requests IS 'Stores information requests from users interested in facilities';
