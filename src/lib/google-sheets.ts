import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
// import fs from 'fs';
// import path from 'path';

// Load service account credentials from environment variable
let serviceAccountKey: any;
let jwtClient: JWT;
let sheets: any;

// Only initialize if we're in a runtime environment (not during build)
if (typeof window === 'undefined' && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    
    // Create JWT client
    jwtClient = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Create Google Sheets API client
    sheets = google.sheets({ version: 'v4', auth: jwtClient });
  } catch (error) {
    console.error('Error parsing Google service account JSON:', error);
  }
}

export interface FormResponse {
  timestamp: string;
  email: string;
  [key: string]: any;
}

export async function fetchFormResponses(spreadsheetId: string, range: string = 'A:Z'): Promise<FormResponse[]> {
  try {
    if (!jwtClient || !sheets) {
      throw new Error('Google Sheets client not initialized');
    }

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
    const formResponses: FormResponse[] = dataRows.map((row: any[]) => {
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
    if (!jwtClient || !sheets) {
      throw new Error('Google Sheets client not initialized');
    }

    await jwtClient.authorize();
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map((sheet: any) => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
      })),
    };
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    throw error;
  }
} 