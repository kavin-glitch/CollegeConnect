import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ylxzfwmabfifxpeudqyp.supabase.co";

const supabaseKey = "sb_publishable_H5_PZBiF7QyQn-oiPNVCOQ_-0vf4w4d";

export const supabase = createClient(supabaseUrl, supabaseKey);