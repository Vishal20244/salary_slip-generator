# Pamir Payroll & Salary Slip System

A modern, client-side web application for managing employee payroll and generating professional salary slips. Built with vanilla HTML, CSS, and JavaScript – no server required.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-web-brightgreen)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [How to Use](#how-to-use)
- [File Structure](#file-structure)
- [Data Format](#data-format)
- [Export Options](#export-options)
- [Browser Support](#browser-support)
- [Customization](#customization)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Overview

The **Pamir Payroll System** is a lightweight, offline-capable payroll management tool designed for small businesses, HR departments, and freelancers. It allows users to:

- Add, edit, and delete employee records
- Calculate net salary after deductions and allowances
- Generate individual salary slips with professional formatting
- Export all data to Excel (XLSX) or CSV
- Download salary slips as PDF files
- Import employee data from Excel files

All processing happens locally in the browser – no data is sent to any server, ensuring privacy and security.

---

## ✨ Features

### Core Functionality
| Feature | Description |
|---------|-------------|
| **Employee Management** | Add new employees with full details (ID, name, department, basic salary, allowances, deductions) |
| **Real-time Calculations** | Automatic computation of net salary = Basic + Allowances - Deductions |
| **Salary Slip Generation** | Generate individual PDF salary slips with company branding and detailed breakdown |
| **Bulk Export** | Export complete payroll data to Excel (.xlsx) or CSV |
| **Bulk Import** | Import employee list from Excel files with automatic validation |
| **Data Persistence** | All data saved in browser's localStorage – survives page refresh |
| **Responsive Design** | Works seamlessly on desktop, tablet, and mobile devices |
| **Company Branding** | Customizable company name, logo icon, and header styling |

### Salary Slip Details
Each salary slip includes:
- Employee ID & Full Name
- Department & Designation
- Pay Period (Month/Year)
- Basic Salary
- Allowances (House Rent, Transport, Medical, etc.)
- Total Allowances
- Deductions (Tax, Insurance, Loan, etc.)
- Total Deductions
- **Net Salary (in words)**
- Authorized signatory section
- QR-style decorative element for authenticity

---

## 🖥️ Live Demo

You can access the live application here:  
**[Pamir Payroll System Demo](https://pamir-payrolls.netlify.app/)** *live*

---

## 📸 Screenshots

| Dashboard View | Salary Slip Modal |
|----------------|-------------------|
| ![Dashboard](https://via.placeholder.com/400x250?text=Employee+List+View) | ![Salary Slip](https://via.placeholder.com/400x250?text=Salary+Slip+PDF) |

*Screenshots to be added after deployment*

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure and semantic markup |
| **CSS3** | Responsive styling, gradients, animations |
| **JavaScript (ES6+)** | Business logic, DOM manipulation, calculations |
| **SheetJS (XLSX)** | Excel import/export functionality |
| **html2pdf.js** | Client-side PDF generation for salary slips |
| **Font Awesome 6** | Icons and visual enhancements |
| **LocalStorage API** | Client-side data persistence |

---

## 📦 Installation & Setup

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No server, database, or internet connection required after initial load

### Quick Start

1. **Clone or download the repository**
   ```bash
   git clone https://github.com/Vishal20244/salary_slip-generator.git
   cd pamir-payroll-system
