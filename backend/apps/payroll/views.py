"""
NBSC PRIME-HRM Intelligence Hub — Payroll Views
Exposes REST endpoints for Excel payroll ingestion, automated encrypted payslip compilation,
batch management, and employee self-service payslip downloads.
"""
import os
from datetime import datetime
from django.http import FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from apps.accounts.decorators import login_required_api, role_required
from apps.audit.chain import create_block
from apps.payroll.models import PayrollBatch, PayslipRecord
from apps.payroll.services import ExcelPayrollParser, PayslipPDFGenerator, PayslipEncryptor


@csrf_exempt
def upload_payroll_excel(request):
    """
    POST /api/v1/payroll/upload/
    Uploads an Excel payroll workbook, parses lines, computes statutory deductions,
    and returns a preview or creates a DRAFT batch.
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status_code=405)

    excel_file = request.FILES.get('file')
    if not excel_file:
        return api_error("Missing required file attachment 'file'.", status_code=400)

    period_label = request.POST.get('period_label', '').strip()
    if not period_label:
        # Default to current half-month
        now = datetime.utcnow()
        half = "1–15" if now.day <= 15 else f"16–{now.day}"
        period_label = f"{now.strftime('%B')} {half}, {now.year}"

    department = request.POST.get('department', 'ALL').strip()

    try:
        parse_result = ExcelPayrollParser.parse_workbook(excel_file)
    except Exception as e:
        return api_error(f"Failed to parse payroll Excel workbook: {str(e)}", status_code=400)

    # Generate a unique batch_id
    now_str = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    batch_id = f"PAY-{now_str}"

    uploader_email = 'admin@nbsc.edu.ph'
    if hasattr(request, 'user') and request.user:
        uploader_email = getattr(request.user, 'email', uploader_email)

    # Persist draft batch
    batch = PayrollBatch(
        batch_id=batch_id,
        period_label=period_label,
        department=department,
        total_gross=parse_result['total_gross'],
        total_deductions=parse_result['total_deductions'],
        total_net=parse_result['total_net'],
        employee_count=parse_result['total_rows'],
        uploaded_by=uploader_email,
        status='DRAFT'
    )
    batch.save()

    # Create individual un-rendered payslip records
    created_records = []
    for r in parse_result['records']:
        rec = PayslipRecord(
            batch=batch,
            employee_id=r['employee_id'],
            full_name=r['full_name'],
            department=r['department'],
            position=r['position'],
            salary_grade=r['salary_grade'],
            email=r['email'],
            date_of_birth=r['date_of_birth'],
            basic_pay=r['basic_pay'],
            pera=r['pera'],
            overtime=r['overtime'],
            allowances=r['allowances'],
            gross_pay=r['gross_pay'],
            gsis=r['gsis'],
            philhealth=r['philhealth'],
            pagibig=r['pagibig'],
            withholding_tax=r['withholding_tax'],
            loans=r['loans'],
            lates=r['lates'],
            total_deductions=r['total_deductions'],
            net_pay=r['net_pay']
        )
        rec.save()
        created_records.append(rec.to_dict())

    return api_success(
        data={
            'batch': batch.to_dict(),
            'matched_count': parse_result['matched_count'],
            'total_rows': parse_result['total_rows'],
            'records_preview': created_records[:10]  # Preview first 10
        },
        message="Payroll workbook parsed successfully. Batch created in DRAFT status."
    )


@csrf_exempt
def process_payroll_batch(request, batch_id):
    """
    POST /api/v1/payroll/batches/<batch_id>/process/
    Generates ReportLab PDFs for each employee, applies 128-bit AES encryption with password,
    updates batch status to PROCESSED, and records cryptographic block in audit chain.
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status_code=405)

    batch = PayrollBatch.objects(batch_id=batch_id).first()
    if not batch:
        return api_error(f"Payroll batch '{batch_id}' not found.", status_code=404)

    records = PayslipRecord.objects(batch=batch)
    if not records:
        return api_error("This payroll batch contains no employee payslip records.", status_code=400)

    processed_count = 0
    for rec in records:
        # Generate ReportLab PDF stream
        pdf_buffer = PayslipPDFGenerator.generate_pdf_buffer(rec, batch.period_label)

        # Encrypt with employee password
        saved_path = PayslipEncryptor.encrypt_and_save(pdf_buffer, rec, batch.batch_id)

        rec.encrypted_pdf_path = saved_path
        rec.encrypted_pdf_filename = os.path.basename(saved_path)
        rec.save()
        processed_count += 1

    batch.status = 'PROCESSED'
    batch.processed_at = datetime.utcnow()

    # Commit to SHA-256 Audit Chain
    actor = getattr(request, 'user', None)
    try:
        audit_block = create_block(
            actor=actor,
            action='PAYROLL_BATCH_PROCESSED',
            target_id=batch.batch_id,
            payload={
                'batch_id': batch.batch_id,
                'period_label': batch.period_label,
                'employee_count': batch.employee_count,
                'total_net': batch.total_net
            }
        )
        batch.audit_block_hash = audit_block.hash
    except Exception:
        pass

    batch.save()

    return api_success(
        data={
            'batch': batch.to_dict(),
            'processed_count': processed_count
        },
        message=f"Successfully generated and encrypted {processed_count} official payslips."
    )


def list_payroll_batches(request):
    """
    GET /api/v1/payroll/batches/
    Retrieves all payroll batches in reverse chronological order.
    """
    batches = PayrollBatch.objects.order_by('-created_at')

    # If empty, generate a sample batch for demo
    if batches.count() == 0:
        sample_batch = _create_demo_payroll_batch()
        batches = [sample_batch]

    return api_success(
        data=[b.to_dict() for b in batches],
        message="Payroll batches retrieved."
    )


def get_payroll_batch_detail(request, batch_id):
    """
    GET /api/v1/payroll/batches/<batch_id>/
    Retrieves details of a specific payroll batch including its employee payslips.
    """
    batch = PayrollBatch.objects(batch_id=batch_id).first()
    if not batch:
        return api_error(f"Payroll batch '{batch_id}' not found.", status_code=404)

    records = PayslipRecord.objects(batch=batch)
    return api_success(
        data={
            'batch': batch.to_dict(),
            'records': [r.to_dict() for r in records]
        },
        message="Payroll batch details retrieved."
    )


def get_my_payslips(request):
    """
    GET /api/v1/payroll/my-payslips/
    Retrieves payslips for the currently authenticated employee.
    If unauthenticated or no records found, returns demo records for faculty view.
    """
    user_email = None
    if hasattr(request, 'user') and request.user:
        user_email = getattr(request.user, 'email', None)

    records = []
    if user_email:
        records = list(PayslipRecord.objects(email=user_email).order_by('-created_at'))

    # If no records or unauthenticated demo, return recent payslips from latest batch
    if not records:
        latest_batch = PayrollBatch.objects.order_by('-created_at').first()
        if not latest_batch:
            latest_batch = _create_demo_payroll_batch()
        records = list(PayslipRecord.objects(batch=latest_batch)[:5])

    return api_success(
        data=[r.to_dict() for r in records],
        message="Employee payslips retrieved."
    )


def download_payslip_pdf(request, payslip_id):
    """
    GET /api/v1/payroll/payslips/<id>/download/
    Streams the password-protected encrypted PDF to the client.
    """
    rec = PayslipRecord.objects(id=payslip_id).first()
    if not rec:
        # Check by employee_id as fallback
        rec = PayslipRecord.objects(employee_id=payslip_id).first()

    if not rec:
        return api_error(f"Payslip record '{payslip_id}' not found.", status_code=404)

    # If PDF is not yet rendered or file missing, render & encrypt on the fly
    if not rec.encrypted_pdf_path or not os.path.exists(rec.encrypted_pdf_path):
        batch_label = rec.batch.period_label if rec.batch else "Current Period"
        batch_id = rec.batch.batch_id if rec.batch else "BATCH-DEMO"
        pdf_buffer = PayslipPDFGenerator.generate_pdf_buffer(rec, batch_label)
        saved_path = PayslipEncryptor.encrypt_and_save(pdf_buffer, rec, batch_id)
        rec.encrypted_pdf_path = saved_path
        rec.encrypted_pdf_filename = os.path.basename(saved_path)
        rec.save()

    rec.is_downloaded = True
    if not rec.first_downloaded_at:
        rec.first_downloaded_at = datetime.utcnow()
    rec.save()

    filename = rec.encrypted_pdf_filename or f"NBSC_Payslip_{rec.employee_id}.pdf"
    file_handle = open(rec.encrypted_pdf_path, 'rb')
    response = FileResponse(file_handle, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


def _create_demo_payroll_batch():
    """Generates an initial demo payroll batch with NBSC faculty if DB is empty."""
    batch = PayrollBatch(
        batch_id='PAY-2026-09-A',
        period_label='September 1–15, 2026',
        department='ALL',
        uploaded_by='admin@nbsc.edu.ph',
        status='PROCESSED',
        processed_at=datetime.utcnow()
    )
    batch.save()

    sample_roster = [
        {
            'id': 'NBSC-2024-0001', 'name': 'Dr. Jovelyn G. Delosa', 'dept': 'ADMIN',
            'pos': 'College President', 'sg': 26, 'email': 'admin@nbsc.edu.ph',
            'basic': 55000.00, 'dob': '04121980'
        },
        {
            'id': 'NBSC-2024-0002', 'name': 'Genevieve Marie E. Bolanio', 'dept': 'ITE',
            'pos': 'Associate Professor V', 'sg': 22, 'email': 'hrmpsb@nbsc.edu.ph',
            'basic': 29000.00, 'dob': '08251985'
        },
        {
            'id': 'NBSC-2024-0003', 'name': 'Dr. Julius S. Gabinete', 'dept': 'ICS',
            'pos': 'Associate Professor IV', 'sg': 21, 'email': 'depthead.ics@nbsc.edu.ph',
            'basic': 27000.00, 'dob': '11141982'
        },
        {
            'id': 'NBSC-2024-0005', 'name': 'Mark Anthony Reyes', 'dept': 'ICS',
            'pos': 'Instructor I', 'sg': 12, 'email': 'reyes.mark@nbsc.edu.ph',
            'basic': 14582.50, 'dob': '06181995'
        }
    ]

    total_gross = 0.0
    total_ded = 0.0
    total_net = 0.0

    for s in sample_roster:
        # Statutory
        stat = compute_statutory_deductions(s['basic'], 'PERMANENT')
        gross = s['basic'] + 1000.00  # basic + pera
        ded = stat['gsis'] + stat['philhealth'] + stat['pagibig'] + stat['withholding_tax']
        net = round(gross - ded, 2)

        rec = PayslipRecord(
            batch=batch,
            employee_id=s['id'],
            full_name=s['name'],
            department=s['dept'],
            position=s['pos'],
            salary_grade=s['sg'],
            email=s['email'],
            date_of_birth=s['dob'],
            basic_pay=s['basic'],
            pera=1000.00,
            gross_pay=gross,
            gsis=stat['gsis'],
            philhealth=stat['philhealth'],
            pagibig=stat['pagibig'],
            withholding_tax=stat['withholding_tax'],
            total_deductions=ded,
            net_pay=net
        )

        # Generate & encrypt PDF immediately
        pdf_buf = PayslipPDFGenerator.generate_pdf_buffer(rec, batch.period_label)
        saved_path = PayslipEncryptor.encrypt_and_save(pdf_buf, rec, batch.batch_id)
        rec.encrypted_pdf_path = saved_path
        rec.encrypted_pdf_filename = os.path.basename(saved_path)
        rec.save()

        total_gross += gross
        total_ded += ded
        total_net += net

    batch.total_gross = round(total_gross, 2)
    batch.total_deductions = round(total_ded, 2)
    batch.total_net = round(total_net, 2)
    batch.employee_count = len(sample_roster)
    batch.save()

    return batch
