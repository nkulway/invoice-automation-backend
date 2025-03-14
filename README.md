# Invoice Automation Backend

Invoice Automation Backend is a NestJS-based application designed to automate restaurant invoice processing. The system leverages AWS Textract to extract relevant invoice data (vendor, total amount, invoice date, line items, and bill-to address) from invoice images stored in S3, and then stores the parsed data in a PostgreSQL database.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

## Features

- **Invoice Processing:**  
  Create and retrieve invoices via REST API endpoints.

- **AWS Textract Integration:**  
  Process invoice images stored in S3 to extract structured data.

- **Custom Parser:**  
  Extract only the relevant fields (vendor, total, date, line items, and bill-to address) while ignoring extraneous details (geometry, bounding boxes, confidence scores).

- **Database Storage:**  
  Store the parsed invoice data in PostgreSQL with TypeORM.

- **Modular Design:**  
  Built with NestJS to ensure easy extensibility and maintainability.

## Prerequisites

- **Node.js** (>= v22.14.0)
- **npm**
- **PostgreSQL** (local instance or via Docker)
- **AWS Account** (for AWS Textract and S3 integration)

## Installation and Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/nkulway/invoice-automation-backend.git
   cd invoice-automation-backend
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Setup Your Database:**
- If you're using Docker, you can run a local Postgres instance


## Running the Application

- To run the application in development mode with hot-reloading:
   ```bash
   npm run start:dev
   ```


## API Endpoints
- **POST /invoices**
  - Create a new invoice by providing a JSON payload with fields like vendor, totalAmount, invoiceDate, s3Bucket, and documentKey.

- **GET /invoices**
  - Get a list of all invoices.

- **GET /invoices/:id**
  - Get a specific invoice by Id.


## Project Structure
```plaintext
invoice-automation-backend/
├── src/
│   ├── invoices/
│   │   ├── controllers/
│   │   │   └── invoices.controller.ts
│   │   ├── dto/
│   │   │   └── create-invoice.dto.ts
│   │   ├── entities/
│   │   │   ├── invoice.entity.ts
│   │   │   └── invoice-line-item.entity.ts
│   │   ├── services/
│   │   │   └── invoices.service.ts
│   │   └── invoices.module.ts
│   ├── textract/
│   │   ├── services/
│   │   │   ├── textract.service.ts
│   │   │   └── textract-parser.service.ts
│   │   ├── textract.module.ts
│   │   └── textract-parser.service.spec.ts
│   ├── app.module.ts
│   ├── main.ts
│   └── ...other files
├── test/
├── .env
├── package.json
└── README.md

