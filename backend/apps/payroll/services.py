"""
NBSC PRIME-HRM Intelligence Hub — Payroll Services
Handles TRAIN Law statutory deductions, Excel workbook parsing,
ReportLab official payslip PDF generation, and pypdf AES encryption.
"""
import os
import io
from pathlib import Path
from datetime import datetime
import openpyxl
from pypdf import PdfReader, PdfWriter

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from django.conf import settings
from apps.employees.models import Employee
from apps.payroll.models import PayrollBatch, PayslipRecord


def compute_train_tax_bimonthly(taxable_income: float) -> float:
    """
    Computes withholding tax under the Philippine TRAIN Law (Republic Act No. 10963)
    for semi-monthly (bi-monthly) payroll cut-offs.
    """
    if taxable_income <= 10417.00:
        return 0.0
    elif taxable_income <= 16666.00:
        return round((taxable_income - 10417.00) * 0.15, 2)
    elif taxable_income <= 33332.00:
        return round(937.50 + (taxable_income - 16667.00) * 0.20, 2)
    elif taxable_income <= 83332.00:
        return round(4270.70 + (taxable_income - 33333.00) * 0.25, 2)
    elif taxable_income <= 333332.00:
        return round(16770.70 + (taxable_income - 83333.00) * 0.30, 2)
    else:
        return round(91770.70 + (taxable_income - 333333.00) * 0.35, 2)


def compute_statutory_deductions(basic_pay: float, employment_status: str = 'PERMANENT') -> dict:
    """
    Calculates GSIS, PhilHealth, Pag-IBIG, and Withholding Tax for a semi-monthly cut-off.
    - GSIS: 9% of basic salary for permanent/regular government employees (0 for COS/JO).
    - PhilHealth: 5% annual rate / 2 = 2.5% employee share, monthly max ₱2,500 / 2 = ₱1,250 bi-monthly.
    - Pag-IBIG: ₱100 standard bi-monthly contribution.
    - Tax: Withholding tax computed on taxable income (basic - statutory).
    """
    is_regular = employment_status.upper() in ('PERMANENT', 'TEMPORARY')

    # GSIS (9% for regular employees)
    gsis = round(basic_pay * 0.09, 2) if is_regular else 0.0

    # PhilHealth (2.5% employee share bi-monthly, max 1,250)
    philhealth = min(round(basic_pay * 0.025, 2), 1250.00) if is_regular else 0.0

    # Pag-IBIG (₱100 bi-monthly)
    pagibig = 100.00 if is_regular else 0.0

    # Taxable income
    taxable_income = max(0.0, basic_pay - (gsis + philhealth + pagibig))
    tax = compute_train_tax_bimonthly(taxable_income)

    return {
        'gsis': gsis,
        'philhealth': philhealth,
        'pagibig': pagibig,
        'withholding_tax': tax
    }


class ExcelPayrollParser:
    """
    Ingests and parses payroll Excel workbooks (.xlsx), mapping rows to NBSC personnel.
    """
    @staticmethod
    def parse_workbook(file_stream) -> dict:
        """
        Parses an openpyxl workbook and returns a structured dictionary of payslip rows.
        """
        wb = openpyxl.load_workbook(file_stream, data_only=True)
        sheet = wb.active

        rows = list(sheet.iter_rows(values_only=True))
        if not rows or len(rows) < 2:
            raise ValueError("The uploaded Excel workbook contains no data rows.")

        # Header normalization
        raw_headers = [str(cell).strip().lower() if cell is not None else '' for cell in rows[0]]
        header_map = {}
        for idx, h in enumerate(raw_headers):
            if 'id' in h or 'employee' in h:
                header_map['employee_id'] = idx
            elif 'name' in h:
                header_map['name'] = idx
            elif 'dept' in h or 'department' in h or 'institute' in h:
                header_map['department'] = idx
            elif 'basic' in h or 'salary' in h:
                header_map['basic_pay'] = idx
            elif 'pera' in h:
                header_map['pera'] = idx
            elif 'overtime' in h or 'ot' in h:
                header_map['overtime'] = idx
            elif 'allowance' in h:
                header_map['allowances'] = idx
            elif 'loan' in h:
                header_map['loans'] = idx
            elif 'late' in h or 'tardiness' in h:
                header_map['lates'] = idx
            elif 'dob' in h or 'birth' in h:
                header_map['dob'] = idx

        parsed_records = []
        warnings = []

        for row_idx, row in enumerate(rows[1:], start=2):
            if not any(row):
                continue

            emp_id = str(row[header_map['employee_id']]).strip() if 'employee_id' in header_map and row[header_map['employee_id']] else f"NBSC-TEMP-{row_idx}"
            name = str(row[header_map['name']]).strip() if 'name' in header_map and row[header_map['name']] else f"Employee {emp_id}"
            dept = str(row[header_map['department']]).strip() if 'department' in header_map and row[header_map['department']] else 'ADMIN'

            # Try looking up existing employee record
            existing_emp = None
            try:
                existing_emp = Employee.objects(employee_id=emp_id).first()
            except Exception:
                pass

            basic_pay = 0.0
            if 'basic_pay' in header_map and row[header_map['basic_pay']]:
                try:
                    basic_pay = float(row[header_map['basic_pay']])
                except (ValueError, TypeError):
                    basic_pay = 0.0
            elif existing_emp and existing_emp.monthly_salary:
                # Default to half-month pay
                basic_pay = round(existing_emp.monthly_salary / 2.0, 2)

            pera = 1000.00
            if 'pera' in header_map and row[header_map['pera']] is not None:
                try:
                    pera = float(row[header_map['pera']])
                except (ValueError, TypeError):
                    pera = 1000.00

            overtime = 0.0
            if 'overtime' in header_map and row[header_map['overtime']]:
                try:
                    overtime = float(row[header_map['overtime']])
                except (ValueError, TypeError):
                    overtime = 0.0

            allowances = 0.0
            if 'allowances' in header_map and row[header_map['allowances']]:
                try:
                    allowances = float(row[header_map['allowances']])
                except (ValueError, TypeError):
                    allowances = 0.0

            loans = 0.0
            if 'loans' in header_map and row[header_map['loans']]:
                try:
                    loans = float(row[header_map['loans']])
                except (ValueError, TypeError):
                    loans = 0.0

            lates = 0.0
            if 'lates' in header_map and row[header_map['lates']]:
                try:
                    lates = float(row[header_map['lates']])
                except (ValueError, TypeError):
                    lates = 0.0

            dob_str = '01011990'
            if 'dob' in header_map and row[header_map['dob']]:
                val = row[header_map['dob']]
                if isinstance(val, datetime):
                    dob_str = val.strftime('%m%d%Y')
                else:
                    digits = ''.join(filter(str.isdigit, str(val)))
                    if len(digits) == 8:
                        dob_str = digits

            # Auto-calculate TRAIN law statutory deductions
            stat = existing_emp.employment_status if existing_emp else 'PERMANENT'
            statutory = compute_statutory_deductions(basic_pay, employment_status=stat)

            gross_pay = round(basic_pay + pera + overtime + allowances, 2)
            total_deductions = round(
                statutory['gsis'] + statutory['philhealth'] + statutory['pagibig'] + statutory['withholding_tax'] + loans + lates, 2
            )
            net_pay = round(gross_pay - total_deductions, 2)

            pos = existing_emp.position if existing_emp else 'Faculty / Staff'
            sg = existing_emp.salary_grade if existing_emp else 12
            emp_email = existing_emp.email if existing_emp else f"{emp_id.lower()}@nbsc.edu.ph"

            parsed_records.append({
                'employee_id': emp_id,
                'full_name': existing_emp.full_name if existing_emp else name,
                'department': existing_emp.department if existing_emp else dept,
                'position': pos,
                'salary_grade': sg,
                'email': emp_email,
                'date_of_birth': dob_str,
                'basic_pay': basic_pay,
                'pera': pera,
                'overtime': overtime,
                'allowances': allowances,
                'gross_pay': gross_pay,
                'gsis': statutory['gsis'],
                'philhealth': statutory['philhealth'],
                'pagibig': statutory['pagibig'],
                'withholding_tax': statutory['withholding_tax'],
                'loans': loans,
                'lates': lates,
                'total_deductions': total_deductions,
                'net_pay': net_pay,
                'matched': existing_emp is not None
            })

        return {
            'total_rows': len(parsed_records),
            'matched_count': sum(1 for r in parsed_records if r['matched']),
            'total_gross': round(sum(r['gross_pay'] for r in parsed_records), 2),
            'total_deductions': round(sum(r['total_deductions'] for r in parsed_records), 2),
            'total_net': round(sum(r['net_pay'] for r in parsed_records), 2),
            'records': parsed_records,
            'warnings': warnings
        }


class PayslipPDFGenerator:
    """
    Generates standard official NBSC salary disbursement payslips via ReportLab.
    """
    @staticmethod
    def generate_pdf_buffer(record: PayslipRecord, period_label: str) -> io.BytesIO:
        """
        Creates an in-memory PDF stream for an individual employee payslip.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Styles
        style_inst_title = ParagraphStyle(
            'InstTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F1B2D'),
            alignment=1
        )
        style_sub_title = ParagraphStyle(
            'SubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#64748B'),
            alignment=1
        )
        style_doc_title = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#D4A843'),
            alignment=1
        )
        style_label = ParagraphStyle(
            'Label',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#475569')
        )
        style_val = ParagraphStyle(
            'Val',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0F1B2D')
        )
        style_table_h = ParagraphStyle(
            'TableH',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=11,
            textColor=colors.white
        )
        style_table_c = ParagraphStyle(
            'TableC',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#1E293B')
        )
        style_table_amt = ParagraphStyle(
            'TableAmt',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#1E293B'),
            alignment=2
        )

        elements = []

        # 1. Header
        elements.append(Paragraph("NORTHERN BUKIDNON STATE COLLEGE", style_inst_title))
        elements.append(Paragraph("PRIME-HRM Level 2 Certified • Kihare, Manolo Fortich, Bukidnon • www.nbsc.edu.ph", style_sub_title))
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"OFFICIAL PAYSLIP & SALARY DISBURSEMENT VOUCHER", style_doc_title))
        elements.append(Paragraph(f"Pay Period: <b>{period_label}</b>", style_sub_title))
        elements.append(Spacer(1, 10))

        # 2. Employee Info Grid
        info_data = [
            [
                Paragraph("<b>Employee ID:</b>", style_label), Paragraph(record.employee_id, style_val),
                Paragraph("<b>Department:</b>", style_label), Paragraph(record.department, style_val)
            ],
            [
                Paragraph("<b>Full Name:</b>", style_label), Paragraph(record.full_name, style_val),
                Paragraph("<b>Position:</b>", style_label), Paragraph(record.position, style_val)
            ],
            [
                Paragraph("<b>Email:</b>", style_label), Paragraph(record.email, style_val),
                Paragraph("<b>Salary Grade:</b>", style_label), Paragraph(f"SG {record.salary_grade}", style_val)
            ]
        ]
        info_table = Table(info_data, colWidths=[80, 180, 80, 200])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 12))

        # 3. Side-by-side Earnings & Deductions
        earnings_rows = [
            ("Basic Salary (Semi-Monthly)", f"PHP {record.basic_pay:,.2f}"),
            ("PERA (Personal Economic Relief)", f"PHP {record.pera:,.2f}"),
            ("Overtime Pay", f"PHP {record.overtime:,.2f}"),
            ("Allowances & Honoraria", f"PHP {record.allowances:,.2f}"),
        ]
        deductions_rows = [
            ("GSIS Life & Retirement (9%)", f"PHP {record.gsis:,.2f}"),
            ("PhilHealth Employee Share", f"PHP {record.philhealth:,.2f}"),
            ("Pag-IBIG Fund Contribution", f"PHP {record.pagibig:,.2f}"),
            ("Withholding Tax (TRAIN Law)", f"PHP {record.withholding_tax:,.2f}"),
            ("Institutional Loans / Deductions", f"PHP {record.loans:,.2f}"),
            ("Tardiness / Absences", f"PHP {record.lates:,.2f}"),
        ]

        table_data = [
            [
                Paragraph("ITEMIZED EARNINGS", style_table_h),
                Paragraph("AMOUNT", style_table_h),
                Paragraph("STATUTORY & OTHER DEDUCTIONS", style_table_h),
                Paragraph("AMOUNT", style_table_h)
            ]
        ]

        max_rows = max(len(earnings_rows), len(deductions_rows))
        for i in range(max_rows):
            e_desc, e_amt = earnings_rows[i] if i < len(earnings_rows) else ("", "")
            d_desc, d_amt = deductions_rows[i] if i < len(deductions_rows) else ("", "")
            table_data.append([
                Paragraph(e_desc, style_table_c),
                Paragraph(e_amt, style_table_amt),
                Paragraph(d_desc, style_table_c),
                Paragraph(d_amt, style_table_amt)
            ])

        # Subtotals row
        table_data.append([
            Paragraph("<b>TOTAL GROSS COMPENSATION</b>", style_table_c),
            Paragraph(f"<b>PHP {record.gross_pay:,.2f}</b>", style_table_amt),
            Paragraph("<b>TOTAL DEDUCTIONS</b>", style_table_c),
            Paragraph(f"<b>PHP {record.total_deductions:,.2f}</b>", style_table_amt)
        ])

        breakdown_table = Table(table_data, colWidths=[170, 95, 180, 95])
        breakdown_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#0F1B2D')),
            ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#1E293B')),
            ('BACKGROUND', (0, -1), (1, -1), colors.HexColor('#EFF6FF')),
            ('BACKGROUND', (2, -1), (3, -1), colors.HexColor('#FEF2F2')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(breakdown_table)
        elements.append(Spacer(1, 10))

        # 4. Net Pay Callout Banner
        net_data = [
            [
                Paragraph("<font size=10><b>NET TAKE-HOME PAY</b></font><br/><font size=7 color='#64748B'>Directly Credited to LandBank Payroll Account</font>", style_label),
                Paragraph(f"<font size=14 color='#0F1B2D'><b>PHP {record.net_pay:,.2f}</b></font>", style_table_amt)
            ]
        ]
        net_table = Table(net_data, colWidths=[360, 180])
        net_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF08A')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#D4A843')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(net_table)
        elements.append(Spacer(1, 15))

        # 5. Signatures and Footnotes
        footer_data = [
            [
                Paragraph("<b>Prepared By:</b><br/><br/><br/><b>ELENA CRUZ, CPA</b><br/><font size=7 color='#64748B'>Accountant III / Payroll Officer</font>", style_label),
                Paragraph("<b>Certified Correct:</b><br/><br/><br/><b>MARIA TERESA SANTOS</b><br/><font size=7 color='#64748B'>Administrative Officer V (HRMO)</font>", style_label),
                Paragraph("<b>Approved for Payment:</b><br/><br/><br/><b>JOVELYN G. DELOSA, Ph.D.</b><br/><font size=7 color='#64748B'>College President</font>", style_label)
            ]
        ]
        footer_table = Table(footer_data, colWidths=[180, 180, 180])
        footer_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#CBD5E1')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(footer_table)
        elements.append(Spacer(1, 8))

        legal_notice = (
            "<font size=6 color='#94A3B8'>"
            "NOTICE: This document is an official electronic record of Northern Bukidnon State College. "
            "Generated under Republic Act 8792 (Electronic Commerce Act of 2000) and CSC PRIME-HRM Level 2 Guidelines. "
            "Confidentiality protected under Republic Act 10173 (Data Privacy Act of 2012). Encrypted with AES-128."
            "</font>"
        )
        elements.append(Paragraph(legal_notice, style_sub_title))

        doc.build(elements)
        buffer.seek(0)
        return buffer


class PayslipEncryptor:
    """
    Encrypts generated PDF documents using standard 128-bit AES encryption with employee passwords.
    """
    @staticmethod
    def encrypt_and_save(pdf_buffer: io.BytesIO, record: PayslipRecord, batch_id: str) -> str:
        """
        Encrypts in-memory PDF buffer with employee password and writes to disk.
        Returns the absolute filepath.
        """
        user_password = record.get_encryption_password()
        admin_password = getattr(settings, 'PAYSLIP_ADMIN_KEY', 'NBSC-SuperSecretAdmin-2026')

        reader = PdfReader(pdf_buffer)
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        writer.encrypt(user_password=user_password, owner_password=admin_password)

        # Storage directory
        media_root = Path(settings.MEDIA_ROOT) if hasattr(settings, 'MEDIA_ROOT') else Path(__file__).resolve().parent.parent.parent / 'media'
        payslips_dir = media_root / 'payslips' / batch_id
        payslips_dir.mkdir(parents=True, exist_ok=True)

        filename = f"payslip_{record.employee_id}_{batch_id}.pdf"
        dest_path = payslips_dir / filename

        with open(dest_path, 'wb') as f:
            writer.write(f)

        return str(dest_path)
