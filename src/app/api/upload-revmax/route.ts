import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

// Use environment variables for the real deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Must use service role key to bypass RLS in the API

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!pdfFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Read text from PDF
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;

    // 2. Mock extraction function (Replace with real AI extraction or regex logic)
    const extractedJSON = extractDataToJSON(rawText);

    // If supabase URL/Key is not set yet, just return dummy success
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        message: 'Upload simulated successfully (Supabase keys not yet configured)',
        data: extractedJSON,
      }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Save to Supabase
    const { data, error } = await supabase
      .from('revmax_reports')
      .insert([
        {
          property_name: 'Lub d Patong', // This should be extracted from file
          report_month: 'April 2026',    // This should be extracted from file
          str_data: extractedJSON.strData,
          snapshot_data: extractedJSON.snapshotData,
          accounts_data: extractedJSON.accountsData,
          rooms_data: extractedJSON.roomsData,
          conclusion_data: extractedJSON.conclusionData
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Upload and parsing successful', data }, { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function extractDataToJSON(rawText: string) {
  // A mock parsing logic for demonstration.
  // Real logic would use Regex or OpenAI/Gemini API inside this route.
  return {
    strData: { occ: "75%", adr: "$120", revpar: "$90" },
    snapshotData: { totalRevenue: "$45,000", period: "Mtd" },
    accountsData: { topCorp: "Google", topOta: "Booking.com" },
    roomsData: { available: 100, sold: 75, complimentary: 2 },
    conclusionData: { summary: "Good performance compared to last month." }
  };
}
