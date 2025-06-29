import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Load service account credentials
const serviceAccountPath = path.join(process.cwd(), 'refreshing-park-454420-u2-55ad31703fbb.json');
const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Create JWT client
const jwtClient = new JWT({
  email: serviceAccountKey.client_email,
  key: serviceAccountKey.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Create Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth: jwtClient });

export interface FormResponse {
  timestamp: string;
  email: string;
  [key: string]: any;
}

export async function fetchFormResponses(spreadsheetId: string, range: string = 'A:Z'): Promise<FormResponse[]> {
  try {
    // Authorize the client
    await jwtClient.authorize();

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in spreadsheet');
      return [];
    }

    // Assume first row contains headers
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Convert rows to objects
    const formResponses: FormResponse[] = dataRows.map((row) => {
      const response: FormResponse = {
        timestamp: '',
        email: '',
      };

      headers.forEach((header: string, index: number) => {
        const value = row[index] || '';
        if (header.toLowerCase().includes('timestamp')) {
          response.timestamp = value;
        } else if (header.toLowerCase().includes('email')) {
          response.email = value;
        } else {
          response[header] = value;
        }
      });

      return response;
    });

    return formResponses;
  } catch (error) {
    console.error('Error fetching form responses:', error);
    throw error;
  }
}

export async function getSpreadsheetInfo(spreadsheetId: string) {
  try {
    await jwtClient.authorize();
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
      })),
    };
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    throw error;
  }
} 