// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/*
  SQL Migration: Rename project_address to project_name
  
  Run this in Supabase Dashboard → SQL Editor:
  
  ALTER TABLE quotations
  RENAME COLUMN project_address TO project_name;
  
  UPDATE quotations
  SET updated_at = NOW()
  WHERE project_name IS NOT NULL;
*/
