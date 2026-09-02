/**
 * Google Apps Script for Arysec HR Onboarding Integration
 * 
 * Deploy this script as a Web App in Google Apps Script under the Google account
 * that has access to the target Google Drive and Google Sheet.
 * 
 * Deployment Settings:
 * - Execute as: Me (your Google account)
 * - Who has access: Anyone (required for backend webhook calls)
 * 
 * Script Properties Configuration (under Project Settings -> Script Properties):
 * - HR_API_SECRET: Set this to a secure random string (must match HR_API_SECRET in .env)
 * - HR_GOOGLE_SHEET_ID: The ID of your Google Sheet: "Master Employee & Intern Records - Arysec"
 * - HR_SUBMISSIONS_FOLDER_ID: The ID of your Drive folder: "Submissions"
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Empty request body.' }, 400);
    }

    const jsonString = e.postData.contents;
    const requestData = JSON.parse(jsonString);
    
    // 1. Authenticate with Secret
    const properties = PropertiesService.getScriptProperties();
    const serverSecret = properties.getProperty('HR_API_SECRET');
    const clientSecret = requestData.secret;
    
    if (!serverSecret || clientSecret !== serverSecret) {
      return jsonResponse({ success: false, error: 'Unauthorized: Invalid API secret.' }, 401);
    }
    
    const action = requestData.action;
    
    if (action === 'register') {
      return handleRegister(requestData, properties);
    } else if (action === 'uploadFile') {
      return handleUploadFile(requestData, properties);
    } else {
      return jsonResponse({ success: false, error: 'Invalid action.' }, 400);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

function doGet(e) {
  return jsonResponse({
    success: true,
    service: 'Arysec HR Onboarding Webhook',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}

function handleRegister(data, properties) {
  const sheetId = data.sheetId || properties.getProperty('HR_GOOGLE_SHEET_ID');
  const parentFolderId = data.parentFolderId || properties.getProperty('HR_SUBMISSIONS_FOLDER_ID');
  
  if (!sheetId) return jsonResponse({ success: false, error: 'Missing Sheet ID.' }, 400);
  if (!parentFolderId) return jsonResponse({ success: false, error: 'Missing Submissions Folder ID.' }, 400);
  
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getActiveSheet();
  
  const personalEmail = (data.personalEmail || '').trim().toLowerCase();
  if (!personalEmail) {
    return jsonResponse({ success: false, error: 'Personal email is required for registration.' }, 400);
  }
  
  // 1. Check duplicate personal email in sheet
  const values = sheet.getDataRange().getValues();
  if (values.length > 1) {
    const headers = values[0].map(h => normalizeHeader(h));
    const emailIndex = headers.findIndex(h => ['personalemail', 'email', 'personalemailaddress', 'emailaddress', 'candidateemail', 'contactemail'].includes(h));
    const recordIdIndex = headers.findIndex(h => ['recordid', 'id', 'candidateid', 'employeeid', 'internid'].includes(h));
    const folderUrlIndex = headers.findIndex(h => ['drivefolder', 'folderurl', 'drivelink', 'folderlink', 'googledrivefolder', 'candidatefolder', 'rootfolder'].includes(h));
    
    if (emailIndex !== -1) {
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][emailIndex]).trim().toLowerCase() === personalEmail) {
          // Found duplicate - preserve existing record, submission date, status, folder
          let existingFolderUrl = folderUrlIndex !== -1 ? String(values[i][folderUrlIndex]) : '';
          // Strip HYPERLINK formula wrapper if present
          const hlMatch = existingFolderUrl.match(/HYPERLINK\("([^"]+)"/i);
          if (hlMatch) existingFolderUrl = hlMatch[1];

          return jsonResponse({
            success: true,
            duplicate: true,
            recordId: recordIdIndex !== -1 ? String(values[i][recordIdIndex]) : '',
            folderUrl: existingFolderUrl,
            message: 'A record with this personal email address already exists.'
          });
        }
      }
    }
  }
  
  // 2. Generate Record ID: EMP-YYYY-XXX for Employee, INT-YYYY-XXX for Intern
  const type = (data.type || 'employee').trim().toLowerCase();
  const isEmp = type === 'employee';
  const classification = isEmp ? 'Employee' : 'Intern';
  const prefix = isEmp ? 'EMP' : 'INT';
  const year = new Date().getFullYear();
  let maxNum = 0;
  
  if (values.length > 1) {
    const headers = values[0].map(h => normalizeHeader(h));
    const recordIdIndex = headers.findIndex(h => ['recordid', 'id', 'candidateid', 'employeeid', 'internid'].includes(h));
    if (recordIdIndex !== -1) {
      const pattern = new RegExp('^' + prefix + '-' + year + '-(\\d+)$');
      for (let i = 1; i < values.length; i++) {
        const match = String(values[i][recordIdIndex]).trim().match(pattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
  }
  
  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(3, '0');
  const recordId = `${prefix}-${year}-${paddedNum}`;
  
  // 3. Create Candidate Drive Folder
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const candidateFolderName = `${data.name} (${recordId})`;
  const candidateFolder = parentFolder.createFolder(candidateFolderName);
  const candidateFolderId = candidateFolder.getId();
  const candidateFolderUrl = candidateFolder.getUrl();
  
  // 4. Create standard subfolders
  const subfolders = [
    'Profile Photo',
    'Resume',
    'Identity Documents',
    'Address Documents',
    'Education Documents',
    'Employment Documents',
    'Bank Documents',
    'Other Documents'
  ];
  subfolders.forEach(name => {
    candidateFolder.createFolder(name);
  });
  
  // 5. Append candidate info to Google Sheet
  const headers = values[0];
  const newRow = new Array(headers.length).fill('');
  const now = new Date();
  
  // Map fields dynamically based on sheet column names
  for (let c = 0; c < headers.length; c++) {
    const norm = normalizeHeader(headers[c]);
    if (['submissiondate', 'submissiontimestamp', 'timestamp', 'dateofsubmission', 'datesubmitted', 'submittedat'].includes(norm)) {
      newRow[c] = now;
    } else if (['status', 'onboardingstatus', 'workflowstatus', 'recordstatus'].includes(norm)) {
      newRow[c] = 'Submitted';
    } else if (['drivefolder', 'drivelink', 'folderlink', 'googledrivefolder', 'candidatefolder', 'rootfolder', 'googledrive'].includes(norm)) {
      newRow[c] = '=HYPERLINK("' + candidateFolderUrl + '", "📁 Open Folder")';
    } else if (norm === 'folderurl') {
      newRow[c] = candidateFolderUrl;
    } else if (['recordid', 'id', 'candidateid', 'employeeid', 'internid'].includes(norm)) {
      newRow[c] = recordId;
    } else if (['recordtype', 'type', 'employeeintern', 'employeeorintern', 'onboardingtype', 'classification', 'category', 'employmenttype', 'profiletype', 'candidatetype', 'roletype', 'applicanttype'].includes(norm)) {
      newRow[c] = classification;
    } else if (['fullname', 'name', 'candidatename'].includes(norm)) {
      newRow[c] = data.name;
    } else if (['personalemail', 'email', 'personalemailaddress', 'emailaddress'].includes(norm)) {
      newRow[c] = personalEmail;
    } else if (['phone', 'phonenumber', 'contact', 'contactnumber'].includes(norm)) {
      newRow[c] = data.phone;
    } else if (['joiningdate', 'dateofjoining', 'proposedjoiningdate'].includes(norm)) {
      newRow[c] = data.joiningDate || '';
    } else if (norm === 'department') {
      newRow[c] = data.department || '';
    } else if (['position', 'role', 'title'].includes(norm)) {
      newRow[c] = data.position || '';
    } else if (data[norm] !== undefined) {
      newRow[c] = data[norm];
    } else {
      // Direct matching check for stripped keys
      let matched = false;
      for (const key of Object.keys(data)) {
        if (normalizeHeader(key) === norm) {
          newRow[c] = data[key];
          matched = true;
          break;
        }
      }
    }
  }
  
  sheet.appendRow(newRow);
  
  return jsonResponse({
    success: true,
    duplicate: false,
    recordId: recordId,
    folderUrl: candidateFolderUrl,
    folderId: candidateFolderId
  });
}

function handleUploadFile(data, properties) {
  const parentFolderId = data.folderId; // Candidate folder ID
  const subfolderName = data.subfolderName; // e.g. "Resume"
  const fileName = data.fileName;
  const base64Data = data.base64Data;
  const mimeType = data.mimeType || 'application/octet-stream';
  
  if (!parentFolderId) return jsonResponse({ success: false, error: 'Missing folder ID.' }, 400);
  if (!subfolderName) return jsonResponse({ success: false, error: 'Missing subfolder name.' }, 400);
  if (!base64Data) return jsonResponse({ success: false, error: 'Missing base64 data.' }, 400);
  
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  const subfolders = parentFolder.getFoldersByName(subfolderName);
  
  let targetFolder = parentFolder;
  if (subfolders.hasNext()) {
    targetFolder = subfolders.next();
  } else {
    // If not found, create it dynamically
    targetFolder = parentFolder.createFolder(subfolderName);
  }
  
  const decoded = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(decoded, mimeType, fileName);
  const file = targetFolder.createFile(blob);
  
  return jsonResponse({
    success: true,
    fileUrl: file.getUrl()
  });
}

function normalizeHeader(header) {
  return String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function jsonResponse(data, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
