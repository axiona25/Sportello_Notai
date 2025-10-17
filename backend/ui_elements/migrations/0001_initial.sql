-- Create elements table
CREATE TABLE IF NOT EXISTS elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    
    -- SVG or Image data
    svg_content TEXT,
    image_url TEXT,
    
    -- Dimensions
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    
    -- Colors
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    
    -- Metadata
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for type and location
CREATE INDEX idx_elements_type ON elements(type);
CREATE INDEX idx_elements_location ON elements(location);
CREATE INDEX idx_elements_is_active ON elements(is_active);

-- Insert the Digital Notary underline element
INSERT INTO elements (
    name,
    type,
    description,
    svg_content,
    width,
    height,
    primary_color,
    location,
    is_active
) VALUES (
    'Digital Notary Underline',
    'decorative',
    'Curved line decoration under Digital Notary logo in sidebar',
    '<svg width="79" height="7" viewBox="0 0 79 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 6C10 1 20 1 39.5 1C59 1 69 1 78 6" stroke="#4FADFF" strokeWidth="2" strokeLinecap="round"/></svg>',
    79,
    7,
    '#4FADFF',
    'sidebar.logo',
    TRUE
) ON CONFLICT (name) DO UPDATE SET
    svg_content = EXCLUDED.svg_content,
    width = EXCLUDED.width,
    height = EXCLUDED.height,
    primary_color = EXCLUDED.primary_color,
    updated_at = CURRENT_TIMESTAMP;

-- Comment on table
COMMENT ON TABLE elements IS 'UI Elements storage - logos, icons, decorative elements';
COMMENT ON COLUMN elements.svg_content IS 'SVG markup for vector elements';
COMMENT ON COLUMN elements.image_url IS 'Image URL or path for bitmap elements';
COMMENT ON COLUMN elements.location IS 'Where element is used (e.g., sidebar.logo)';

