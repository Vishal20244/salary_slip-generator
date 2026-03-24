// ======================== MAIN APPLICATION STATE ========================
let employeesMaster = [];
let filteredEmployees = [];
let slipCount = 0;
let currentSlipEmp = null;
let currentWagesMonth = "";

// ======================== HELPER: ESCAPE HTML ========================
function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ======================== UPDATE STATS & RENDER TABLE ========================
function updateStats() {
    const total = employeesMaster.length;
    const payrollSum = employeesMaster.reduce((s, e) => s + (e.netPayFinal || 0), 0);
    document.getElementById('totalEmployees').innerText = total;
    document.getElementById('totalPayroll').innerHTML = `₹${payrollSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    document.getElementById('slipsGenerated').innerText = slipCount;
    document.getElementById('lastUpdated').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    renderTable();
}

// ======================== ADVANCED COLUMN MAPPING ========================
function extractEmployee(row) {
    const keys = Object.keys(row).map(k => String(k).trim());
    const getVal = (aliases) => {
        for (let a of aliases) {
            let exact = keys.find(k => k === a);
            if (exact && row[exact] !== undefined && row[exact] !== "") return row[exact];
            let partial = keys.find(k => k.toLowerCase().includes(a.toLowerCase()));
            if (partial && row[partial] !== undefined && row[partial] !== "") return row[partial];
        }
        return "";
    };

    let epf = getVal(['EPF UAN Number', 'EPF/UAN', 'UAN', 'EPF Number', 'EPF UAN']);
    let name = getVal(['Employee Name', 'Employee Name Father/Husband Name', 'Name of the Workman']);
    if (!name && row["Employee Name\nFather/Husband Name"]) name = row["Employee Name\nFather/Husband Name"];
    let desig = getVal(['Designation', 'Role']);
    let wagesMonth = getVal(['Wages Month', 'Wage Month', 'Month', 'Salary Month']);
    let days = parseFloat(getVal(['No. of Days Worked', 'Days Worked', 'Working Days'])) || 0;
    let basic = parseFloat(getVal(['Basic', 'Basic Wages', 'Basic Pay'])) || 0;
    let da = parseFloat(getVal(['DA', 'Dearness Allowance'])) || 0;
    let otHours = parseFloat(getVal(['Overtime hours worked', 'Overtime Hours', 'OT Hours', 'Overtime hrs', 'OT Hrs'])) || 0;
    let otPay = parseFloat(getVal(['Overtime Payments', 'Overtime Payment', 'OT Payment', 'Overtime Pay'])) || 0;
    let hra = parseFloat(getVal(['HRA', 'House Rent Allowance'])) || 0;
    let conv = parseFloat(getVal(['Convey All.', 'Conveyance Allowance', 'Conveyance'])) || 0;
    let bonus = parseFloat(getVal(['BONUS', 'Special BONUS', 'bonus'])) || 0;
    let pf = parseFloat(getVal(['PF', 'Provident Fund'])) || 0;
    let pt = parseFloat(getVal(['P. Tax', 'PT', 'Professional Tax'])) || 0;
    let lwf = parseFloat(getVal(['Labour Welfare Fund', 'LWF'])) || 0;
    let canteen = parseFloat(getVal(['Canteen', 'Canteen Charges'])) || 0;
    let advance = parseFloat(getVal(['Advance', 'Advance Leave', 'Loan Recovery'])) || 0;
    let netFromCol = parseFloat(getVal(['Net Payment', 'Net Amount Paid', 'Net Pay', 'Net Salary'])) || 0;

    const totalEarn = basic + da + otPay + hra + conv + bonus;
    const totalDed = pf + pt + lwf + canteen + advance;
    let finalNet = netFromCol > 0 ? netFromCol : (totalEarn - totalDed);
    if (finalNet < 0) finalNet = 0;

    if ((!name || name === "") && (!epf || epf === "")) return null;

    return {
        epfUAN: epf || `PAM${Math.floor(Math.random() * 9000) + 1000}`,
        employeeName: (name || "Worker").trim(),
        designation: desig || "Staff",
        daysWorked: days,
        overtimeHours: otHours,
        wagesMonth: wagesMonth || "",
        basic, da, otPay, hra, conv, bonus, totalEarnings: totalEarn,
        pf, pt, lwf, canteen, advance, totalDeductions: totalDed,
        netPayFinal: finalNet
    };
}

// ======================== PROCESS EXCEL/CSV ========================
function processExcel(data, type) {
    let workbook = type === 'csv' ? XLSX.read(data, { type: 'string', raw: true }) : XLSX.read(data, { type: 'array' });
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) throw new Error("Empty sheet");

    let employees = [];
    let globalWagesMonth = "";

    for (let r of rows) {
        let emp = extractEmployee(r);
        if (emp && emp.employeeName !== "Worker") {
            if (emp.wagesMonth && !globalWagesMonth) globalWagesMonth = emp.wagesMonth;
            employees.push(emp);
        }
    }

    if (employees.length === 0) {
        let rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
            let str = String(rawRows[i]?.join(" ")).toLowerCase();
            if ((str.includes("epf") || str.includes("uan")) && (str.includes("employee") || str.includes("name"))) {
                headerIdx = i; break;
            }
        }
        if (headerIdx !== -1) {
            let headers = rawRows[headerIdx];
            for (let i = headerIdx + 1; i < rawRows.length; i++) {
                let rowObj = {};
                for (let j = 0; j < headers.length; j++) if (headers[j]) rowObj[String(headers[j]).trim()] = rawRows[i][j] || "";
                let emp = extractEmployee(rowObj);
                if (emp && emp.employeeName !== "Worker") {
                    if (emp.wagesMonth && !globalWagesMonth) globalWagesMonth = emp.wagesMonth;
                    employees.push(emp);
                }
            }
        }
    }

    if (employees.length === 0) throw new Error("No employee data found. Ensure columns: EPF UAN, Employee Name, Basic, Overtime hours etc.");

    employeesMaster = employees;
    filteredEmployees = [...employeesMaster];
    slipCount = 0;

    if (globalWagesMonth) {
        currentWagesMonth = globalWagesMonth;
    } else {
        const now = new Date();
        currentWagesMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    updateStats();
    document.getElementById('fileInfo').innerHTML = `<div class="success-msg"><i class="fas fa-check-circle"></i> Loaded ${employeesMaster.length} employees | Overtime captured | Wages Month: ${currentWagesMonth}</div>`;
}

// ======================== RENDER TABLE WITH SEARCH ========================
function renderTable() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    filteredEmployees = term ? employeesMaster.filter(e => e.employeeName.toLowerCase().includes(term) || e.epfUAN.toLowerCase().includes(term) || e.designation.toLowerCase().includes(term)) : [...employeesMaster];
    let tbody = document.getElementById('tableBody');
    if (filteredEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No matching records</td></tr>';
        document.getElementById('visibleCount').innerText = `0 of ${employeesMaster.length}`;
        return;
    }
    let html = '';
    for (let e of filteredEmployees) {
        html += `<tr>
                    <td>${escapeHtml(e.epfUAN)}</td>
                    <td><strong>${escapeHtml(e.employeeName)}</strong></td>
                    <td>${escapeHtml(e.designation)}</td>
                    <td>${e.daysWorked || 0}</td>
                    <td>${e.overtimeHours || 0}</td>
                    <td>₹${e.netPayFinal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td><button class="btn-slip" data-uid="${escapeHtml(e.epfUAN)}"><i class="fas fa-print"></i> Salary Slip</button></td>
                </tr>`;
    }
    tbody.innerHTML = html;
    document.getElementById('visibleCount').innerText = `${filteredEmployees.length} of ${employeesMaster.length}`;
    document.querySelectorAll('.btn-slip').forEach(btn => btn.addEventListener('click', () => {
        let uid = btn.getAttribute('data-uid');
        let emp = employeesMaster.find(x => x.epfUAN === uid);
        if (emp) {
            slipCount++;
            document.getElementById('slipsGenerated').innerText = slipCount;
            showSalarySlip(emp);
        }
    }));
}

// ======================== FULL SALARY SLIP HTML (COMPLETE WITH SIGNATURE & GENERATED DATE) ========================
function generateFullSlipHTML(emp) {
    let displayWagesMonth = emp.wagesMonth && emp.wagesMonth.trim() !== "" ? emp.wagesMonth : currentWagesMonth;
    const generatedDate = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const otDisplay = (emp.overtimeHours || 0) > 0 ? `${emp.overtimeHours} hrs` : '0 hrs';

    return `
        <div class="salary-slip-full">
            <div class="slip-header-section">
                <div class="company-name">PAMIR POWER INDIA PVT LTD</div>
                <div class="company-address">Shere Punjab Chowk, Adityapur, Jamshedpur, Jharkhand - 831013</div>
            </div>
            <div class="slip-title">SALARY SLIP</div>
            
            <div class="emp-info-grid">
                <div class="info-item"><span class="info-label">Employee Name:</span><span>${escapeHtml(emp.employeeName)}</span></div>
                <div class="info-item"><span class="info-label">EPF / UAN Number:</span><span>${escapeHtml(emp.epfUAN)}</span></div>
                <div class="info-item"><span class="info-label">Designation:</span><span>${escapeHtml(emp.designation)}</span></div>
                <div class="info-item"><span class="info-label">Days Worked:</span><span>${emp.daysWorked || 0} days</span></div>
                <div class="info-item"><span class="info-label">Overtime Hours:</span><span>${otDisplay}</span></div>
                <div class="info-item"><span class="info-label">Wages Month:</span><span>${escapeHtml(displayWagesMonth)}</span></div>
            </div>
            
            <div class="earnings-deductions">
                <div class="earnings-box">
                    <div class="box-title">EARNINGS (₹)</div>
                    <div class="salary-row"><span>Basic Wages</span><span>₹${(emp.basic || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Dearness Allowance (DA)</span><span>₹${(emp.da || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>House Rent Allowance (HRA)</span><span>₹${(emp.hra || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Overtime Payment</span><span>₹${(emp.otPay || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Conveyance Allowance</span><span>₹${(emp.conv || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Bonus</span><span>₹${(emp.bonus || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row total-row-salary"><span>TOTAL EARNINGS</span><span>₹${(emp.totalEarnings || 0).toLocaleString('en-IN')}</span></div>
                </div>
                <div class="deductions-box">
                    <div class="box-title">DEDUCTIONS (₹)</div>
                    <div class="salary-row"><span>Provident Fund (PF)</span><span>₹${(emp.pf || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Professional Tax (PT)</span><span>₹${(emp.pt || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Labour Welfare Fund (LWF)</span><span>₹${(emp.lwf || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Canteen / Other Charges</span><span>₹${(emp.canteen || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row"><span>Advance / Loan Recovery</span><span>₹${(emp.advance || 0).toLocaleString('en-IN')}</span></div>
                    <div class="salary-row total-row-salary"><span>TOTAL DEDUCTIONS</span><span>₹${(emp.totalDeductions || 0).toLocaleString('en-IN')}</span></div>
                </div>
            </div>
            
            <div class="net-pay-section">
                <span class="net-label">NET PAYABLE</span>
                <span class="net-amount">₹ ${emp.netPayFinal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div class="signature-section">
                <div class="sign-box">
                    <div class="sign-line"></div>
                    <div>Employee Signature</div>
                    <div style="font-size:0.65rem; margin-top:5px;">(Received payment)</div>
                </div>
                <div class="sign-box">
                    <div class="sign-line"></div>
                    <div>Authorized Signatory (Employer)</div>
                    <div style="font-size:0.65rem; margin-top:5px;">For Pamir Power India Pvt Ltd</div>
                </div>
            </div>
            
            <div class="generated-info">
                Generated: ${generatedDate} | This is a computer-generated salary slip
            </div>
        </div>`;
}

// ======================== MODAL CONTROLS ========================
function showSalarySlip(emp) {
    currentSlipEmp = emp;
    const slipBody = document.getElementById('slipBody');
    slipBody.innerHTML = generateFullSlipHTML(emp);
    document.getElementById('slipModal').classList.add('active');
    // Ensure scroll works and full content visible
    slipBody.style.overflowY = 'auto';
}

function closeModalFn() {
    document.getElementById('slipModal').classList.remove('active');
    currentSlipEmp = null;
}

// ======================== DOWNLOAD HTML ========================
function downloadHTML() {
    if (!currentSlipEmp) return;
    let slipHtml = generateFullSlipHTML(currentSlipEmp);
    let fullDoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SalarySlip_${currentSlipEmp.employeeName}</title><style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{background:#eef2f5;padding:2rem;font-family:'Segoe UI',Arial,sans-serif;}
            .salary-slip-full{max-width:900px;margin:0 auto;background:white;padding:2rem;border:1px solid #ddd;box-shadow:0 2px 12px rgba(0,0,0,0.1);}
            .slip-header-section{text-align:center;border-bottom:3px solid #c0392b;padding-bottom:18px;margin-bottom:20px;}
            .company-name{font-size:2rem;font-weight:800;color:#c0392b;}
            .company-address{font-size:0.8rem;color:#555;margin-top:5px;}
            .slip-title{text-align:center;font-weight:700;background:#f0e6e0;padding:10px;margin:18px 0;font-size:1.3rem;}
            .emp-info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;background:#fafaf5;padding:18px;border:1px solid #e0d6cf;}
            .info-item{display:flex;justify-content:space-between;border-bottom:1px dotted #ccc;padding:8px 0;}
            .info-label{font-weight:600;color:#c0392b;}
            .earnings-deductions{display:flex;gap:30px;margin:25px 0;}
            .earnings-box,.deductions-box{flex:1;border:1px solid #e0d6cf;padding:16px;}
            .box-title{font-weight:800;border-bottom:2px solid #c0392b;margin-bottom:15px;text-align:center;}
            .salary-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dotted #f0e0d8;}
            .total-row-salary{font-weight:800;border-top:2px solid #c0392b;margin-top:10px;padding-top:10px;}
            .net-pay-section{background:#f0e6e0;padding:18px 25px;margin:25px 0;display:flex;justify-content:space-between;}
            .net-label{font-weight:800;color:#c0392b;font-size:1.3rem;}
            .net-amount{font-size:1.8rem;font-weight:800;}
            .signature-section{display:flex;justify-content:space-between;margin-top:40px;padding-top:25px;border-top:2px dashed #aaa;}
            .sign-box{text-align:center;width:45%;}
            .sign-line{border-top:1px solid #333;margin-top:45px;padding-top:8px;}
            .generated-info{text-align:center;font-size:0.7rem;color:#777;margin-top:30px;padding-top:15px;border-top:1px solid #eee;}
            @media(max-width:700px){.earnings-deductions{flex-direction:column;}.emp-info-grid{grid-template-columns:1fr;}}
        </style></head><body>${slipHtml}</body></html>`;
    let blob = new Blob([fullDoc], { type: 'text/html' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `SalarySlip_${currentSlipEmp.employeeName.replace(/\s/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ======================== DOWNLOAD PDF ========================
function downloadPDF() {
    if (!currentSlipEmp) return;
    let element = document.createElement('div');
    element.innerHTML = generateFullSlipHTML(currentSlipEmp);
    element.style.background = '#fff';
    element.style.padding = '10px';
    element.style.fontFamily = "'Segoe UI', Arial";
    let opt = {
        margin: [0.1, 0.1, 0.1, 0.1],
        filename: `SalarySlip_${currentSlipEmp.employeeName.replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}

// ======================== FILE HANDLERS ========================
function handleFile(file) {
    if (file.size > 10 * 1024 * 1024) { alert("Max file size 10MB"); return; }
    let ext = file.name.split('.').pop().toLowerCase();
    let reader = new FileReader();
    reader.onload = function (ev) {
        try {
            if (ext === 'csv') processExcel(ev.target.result, 'csv');
            else if (['xlsx', 'xls'].includes(ext)) processExcel(new Uint8Array(ev.target.result), 'excel');
            else alert("Please upload .xlsx, .xls or .csv file");
        } catch (err) { alert("Error: " + err.message); }
    };
    if (ext === 'csv') reader.readAsText(file, "UTF-8");
    else reader.readAsArrayBuffer(file);
}

// ======================== INIT EVENT LISTENERS ========================
document.addEventListener('DOMContentLoaded', () => {
    const drop = document.getElementById('dropZone');
    const fileInp = document.getElementById('fileInput');
    const searchInput = document.getElementById('searchInput');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const downloadHTMLBtn = document.getElementById('downloadHTMLSlipBtn');
    const downloadPDFBtn = document.getElementById('downloadPDFSlipBtn');
    const slipModal = document.getElementById('slipModal');

    if (drop) {
        drop.addEventListener('click', () => fileInp.click());
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = '#e67e22'; });
        drop.addEventListener('dragleave', () => drop.style.borderColor = '#c0392b');
        drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.borderColor = '#c0392b'; if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
    }
    if (fileInp) {
        fileInp.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });
    }
    if (searchInput) {
        searchInput.addEventListener('input', () => renderTable());
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModalFn);
    }
    if (downloadHTMLBtn) {
        downloadHTMLBtn.addEventListener('click', downloadHTML);
    }
    if (downloadPDFBtn) {
        downloadPDFBtn.addEventListener('click', downloadPDF);
    }
    if (slipModal) {
        slipModal.addEventListener('click', (e) => { if (e.target === slipModal) closeModalFn(); });
    }

    updateStats();
    const defaultMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!currentWagesMonth) currentWagesMonth = defaultMonth;
});
