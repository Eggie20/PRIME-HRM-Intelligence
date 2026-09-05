"""
NBSC PRIME-HRM Intelligence Hub — Payroll Models
Defines schemas for payroll batches and encrypted itemized payslip records.
"""
from datetime import datetime
import mongoengine as me


class PayrollBatch(me.Document):
    """
    Represents a single bi-monthly or monthly payroll cycle.
    """
    STATUS_CHOICES = ('DRAFT', 'PROCESSED', 'DISTRIBUTED')

    batch_id = me.StringField(required=True, unique=True, max_length=60)
    period_label = me.StringField(required=True, max_length=100)
    start_date = me.DateTimeField(null=True)
    end_date = me.DateTimeField(null=True)
    department = me.StringField(default='ALL', max_length=50)

    total_gross = me.FloatField(default=0.0)
    total_deductions = me.FloatField(default=0.0)
    total_net = me.FloatField(default=0.0)
    employee_count = me.IntField(default=0)

    uploaded_by = me.StringField(default='admin@nbsc.edu.ph', max_length=150)
    status = me.StringField(choices=STATUS_CHOICES, default='DRAFT')

    created_at = me.DateTimeField(default=datetime.utcnow)
    processed_at = me.DateTimeField(null=True)
    audit_block_hash = me.StringField(null=True, max_length=64)

    meta = {
        'collection': 'payroll_batches',
        'indexes': [
            'batch_id',
            'status',
            '-created_at'
        ]
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'batch_id': self.batch_id,
            'period_label': self.period_label,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'department': self.department,
            'total_gross': round(self.total_gross, 2),
            'total_deductions': round(self.total_deductions, 2),
            'total_net': round(self.total_net, 2),
            'employee_count': self.employee_count,
            'uploaded_by': self.uploaded_by,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'audit_block_hash': self.audit_block_hash
        }


class PayslipRecord(me.Document):
    """
    Itemized payslip record with TRAIN law statutory deductions and encrypted PDF path.
    """
    batch = me.ReferenceField(PayrollBatch, required=True, reverse_delete_rule=me.CASCADE)
    employee_id = me.StringField(required=True, max_length=50)
    full_name = me.StringField(required=True, max_length=150)
    department = me.StringField(default='', max_length=50)
    position = me.StringField(default='', max_length=150)
    salary_grade = me.IntField(default=12)
    email = me.StringField(default='', max_length=150)
    date_of_birth = me.StringField(default='01011990', max_length=8)  # Format MMDDYYYY

    # Itemized Earnings
    basic_pay = me.FloatField(default=0.0)
    pera = me.FloatField(default=1000.0)  # Standard half-month PERA
    overtime = me.FloatField(default=0.0)
    allowances = me.FloatField(default=0.0)
    gross_pay = me.FloatField(default=0.0)

    # Itemized Deductions (Statutory & Others)
    gsis = me.FloatField(default=0.0)
    philhealth = me.FloatField(default=0.0)
    pagibig = me.FloatField(default=100.0)
    withholding_tax = me.FloatField(default=0.0)
    loans = me.FloatField(default=0.0)
    lates = me.FloatField(default=0.0)
    total_deductions = me.FloatField(default=0.0)

    # Net Take-home Pay
    net_pay = me.FloatField(default=0.0)

    # Encryption & File Artifacts
    encrypted_pdf_filename = me.StringField(null=True, max_length=255)
    encrypted_pdf_path = me.StringField(null=True, max_length=500)
    is_downloaded = me.BooleanField(default=False)
    first_downloaded_at = me.DateTimeField(null=True)

    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'payslip_records',
        'indexes': [
            'batch',
            'employee_id',
            'email',
            'department'
        ]
    }

    def compute_totals(self):
        """Calculates gross pay, total deductions, and net pay."""
        self.gross_pay = round(self.basic_pay + self.pera + self.overtime + self.allowances, 2)
        self.total_deductions = round(
            self.gsis + self.philhealth + self.pagibig + self.withholding_tax + self.loans + self.lates, 2
        )
        self.net_pay = round(self.gross_pay - self.total_deductions, 2)

    def get_encryption_password(self) -> str:
        """
        NBSC Standard formula: Last 4 digits of Employee ID + MMDDYYYY of Birthday.
        E.g., ID "NBSC-2024-0001", DOB "1985-04-12" -> "000104121985".
        """
        clean_id = ''.join(filter(str.isalnum, self.employee_id))
        last_4_id = clean_id[-4:] if len(clean_id) >= 4 else clean_id.zfill(4)
        dob_digits = ''.join(filter(str.isdigit, self.date_of_birth))
        if len(dob_digits) != 8:
            dob_digits = '01011990'
        return f"{last_4_id}{dob_digits}"

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'batch_id': self.batch.batch_id if self.batch else None,
            'period_label': self.batch.period_label if self.batch else None,
            'employee_id': self.employee_id,
            'full_name': self.full_name,
            'department': self.department,
            'position': self.position,
            'salary_grade': self.salary_grade,
            'email': self.email,
            'date_of_birth': self.date_of_birth,
            'earnings': {
                'basic_pay': self.basic_pay,
                'pera': self.pera,
                'overtime': self.overtime,
                'allowances': self.allowances
            },
            'deductions': {
                'gsis': self.gsis,
                'philhealth': self.philhealth,
                'pagibig': self.pagibig,
                'withholding_tax': self.withholding_tax,
                'loans': self.loans,
                'lates': self.lates
            },
            'gross_pay': self.gross_pay,
            'total_deductions': self.total_deductions,
            'net_pay': self.net_pay,
            'is_downloaded': self.is_downloaded,
            'first_downloaded_at': self.first_downloaded_at.isoformat() if self.first_downloaded_at else None,
            'has_pdf': bool(self.encrypted_pdf_path)
        }
