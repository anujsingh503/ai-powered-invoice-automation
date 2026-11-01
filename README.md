# AI-Powered Intelligent Invoice Processing & Approval Automation

An intelligent invoice automation system built using **n8n, Google Gemini AI, and Supabase**. The system extracts invoice data from PDF files, stores structured information, and automates invoice approval workflows through a web-based dashboard.

## Project Overview

This project automates the invoice processing lifecycle, reducing manual data entry and improving invoice management efficiency.

Users can upload invoice PDFs, automatically extract important invoice details using AI, view processed invoices, and approve or reject them through the dashboard.

## Technologies Used

- **n8n** – Workflow automation
- **Google Gemini AI** – Invoice data extraction
- **Supabase** – Database and data storage
- **Webhooks** – Frontend and backend integration
- **HTML, CSS, JavaScript** – User interface
- **REST APIs** – Application communication

## Key Features

- PDF invoice upload through a web interface.
- AI-powered invoice data extraction.
- Extraction of invoice number, vendor details, dates, taxes, totals, and line items.
- Automatic invoice storage in Supabase.
- Dynamic invoice dashboard.
- Invoice approval and rejection functionality.
- Real-time status updates.
- Error logging using a dedicated Error Handling workflow.
- User-friendly error messages for failed operations.

## Four-Level Error Handling

1. Invalid PDF – Clear error message for invalid files.
2. Gemini API Failure – Workflow error capture.
3. Supabase Failure – Database error logging.
4. Approval API Failure – Status update failure message.

## Workflow Architecture

**PDF Upload → Text Extraction → Gemini AI → Data Processing → Supabase → Invoice Dashboard → Approval / Rejection**

## Project Structure

```text
ai-powered-invoice-automation/
├── workflows/
├── screenshots/
├── frontend/
└── README.md
```

## Setup Instructions

1. Install and run n8n.
2. Configure Google Gemini API credentials.
3. Configure Supabase credentials and database tables.
4. Import the n8n workflow JSON files.
5. Configure frontend webhook URLs.
6. Run the application and upload a sample invoice PDF.
7. Test invoice extraction, dashboard updates, and approval operations.

## Security

API keys, access tokens, database passwords, and confidential invoice documents are not included in this repository.

## Author

Anuj Singh
