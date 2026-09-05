"""
NBSC PRIME-HRM Intelligence Hub — Comprehensive Database Seeder
Populates MongoDB with complete end-to-end demo lifecycle:
- User accounts (Admin, HRMPSB, Dept Head, Applicant)
- Academic and Administrative Programs
- 8 Faculty & Staff Employees
- 6 Vacancies across all institutes
- 8 Applicants demonstrating each of the 8 pipeline stages
- 4-Pillar DSS Scores, Dept Head Likert evaluations, HRMPSB ballots, and appointment decisions
- Tamper-evident SHA-256 cryptographic audit chain (Genesis + 5 action blocks)
- Sample Payroll Batch with encrypted Payslip records
- Initial in-app notifications
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Setup Django & paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

import django
django.setup()

from core.mongo import init_mongo
from apps.accounts.models import User
from apps.programs.models import Program
from apps.employees.models import Employee
from apps.employees.services import import_employees_from_excel
from apps.vacancies.models import Vacancy
from apps.applicants.models import Application
from apps.hiring.models import DSSScore, DeptHeadEvaluation, HRMPSBVote, HiringDecision
from apps.audit.chain import ensure_genesis_block, create_block
from apps.audit.models import AuditBlock
from apps.payroll.models import PayrollBatch, PayslipRecord
from apps.notifications.models import Notification


def seed():
    print("🌱 Initializing MongoDB connection...")
    if not init_mongo():
        print("❌ Could not connect to MongoDB. Is mongod running?")
        return

    # 1. Seed Accounts
    print("👤 Seeding user accounts...")
    users_data = [
        {
            'email': 'admin@nbsc.edu.ph',
            'full_name': 'Dr. Jovelyn G. Delosa',
            'role': 'HR_ADMIN',
            'department': 'ADMIN',
            'password': 'AdminPassword123!'
        },
        {
            'email': 'hrmpsb@nbsc.edu.ph',
            'full_name': 'Genevieve Marie E. Bolanio, MAEd',
            'role': 'HRMPSB_MEMBER',
            'department': 'ITE',
            'password': 'MemberPassword123!'
        },
        {
            'email': 'depthead.ics@nbsc.edu.ph',
            'full_name': 'Julius S. Gabinete, DM',
            'role': 'DEPT_HEAD',
            'department': 'ICS',
            'password': 'DeptPassword123!'
        },
        {
            'email': 'applicant@gmail.com',
            'full_name': 'April Anne Elizabeth A. Bajao',
            'role': 'APPLICANT',
            'department': None,
            'password': 'Applicant123!'
        }
    ]

    created_users = {}
    for u_info in users_data:
        user = User.objects(email=u_info['email']).first()
        if not user:
            user = User(
                email=u_info['email'],
                full_name=u_info['full_name'],
                role=u_info['role'],
                department=u_info['department']
            )
            user.set_password(u_info['password'])
            user.save()
            print(f"  ✅ Created user: {u_info['email']} ({u_info['role']})")
        else:
            print(f"  ℹ️ User already exists: {u_info['email']}")
        created_users[u_info['email']] = user

    admin_user = created_users['admin@nbsc.edu.ph']
    hrmpsb_user = created_users['hrmpsb@nbsc.edu.ph']
    depthead_user = created_users['depthead.ics@nbsc.edu.ph']
    applicant_user = created_users['applicant@gmail.com']

    # 2. Seed Programs
    print("🎓 Seeding academic and administrative programs...")
    programs_data = [
        {'code': 'BSIT', 'name': 'Bachelor of Science in Information Technology', 'department': 'ICS', 'description': 'Institute of Computer Studies flagship degree'},
        {'code': 'BSCS', 'name': 'Bachelor of Science in Computer Science', 'department': 'ICS', 'description': 'Software architecture and computing theory'},
        {'code': 'BSBA', 'name': 'Bachelor of Science in Business Administration', 'department': 'IBM', 'description': 'Financial and operational management'},
        {'code': 'BEED', 'name': 'Bachelor of Elementary Education', 'department': 'ITE', 'description': 'Early childhood and primary pedagogical methods'},
        {'code': 'BSED', 'name': 'Bachelor of Secondary Education', 'department': 'ITE', 'description': 'Secondary curriculum with majors in Math, English, and Science'},
        {'code': 'DGEC', 'name': 'General Education & Curricula Division', 'department': 'DGEC', 'description': 'Foundational communication and humanities core'}
    ]

    for p_info in programs_data:
        prog = Program.objects(code=p_info['code']).first()
        if not prog:
            prog = Program(
                code=p_info['code'],
                name=p_info['name'],
                department=p_info['department'],
                description=p_info['description']
            )
            prog.save()
            print(f"  ✅ Created program: {p_info['code']}")

    # 3. Seed Employees
    print("📋 Seeding faculty and staff personnel...")
    sample_employees = [
        {'id': 'NBSC-2024-0001', 'first': 'Jovelyn', 'last': 'Delosa', 'dept': 'ADMIN', 'pos': 'College President / HR Chair', 'cat': 'TEACHING', 'stat': 'PERMANENT', 'email': 'jdelosa@nbsc.edu.ph', 'salary': 110000.0, 'dob': '05121975'},
        {'id': 'NBSC-2024-0002', 'first': 'Genevieve', 'last': 'Bolanio', 'dept': 'ITE', 'pos': 'Associate Professor V', 'cat': 'TEACHING', 'stat': 'PERMANENT', 'email': 'gbolanio@nbsc.edu.ph', 'salary': 58000.0, 'dob': '08241982'},
        {'id': 'NBSC-2024-0003', 'first': 'Julius', 'last': 'Gabinete', 'dept': 'ICS', 'pos': 'Associate Professor IV', 'cat': 'TEACHING', 'stat': 'PERMANENT', 'email': 'jgabinete@nbsc.edu.ph', 'salary': 54000.0, 'dob': '11151980'},
        {'id': 'NBSC-2024-0004', 'first': 'Noreen Faye', 'last': 'Esta', 'dept': 'IBM', 'pos': 'Assistant Professor II', 'cat': 'TEACHING', 'stat': 'COS', 'salary': 29165.0, 'dob': '03301991'},
        {'id': 'NBSC-2024-0005', 'first': 'Mark Anthony', 'last': 'Reyes', 'dept': 'ICS', 'pos': 'Instructor I', 'cat': 'TEACHING', 'stat': 'COS', 'salary': 29165.0, 'dob': '09141994'},
        {'id': 'NBSC-2024-0006', 'first': 'Maria Teresa', 'last': 'Santos', 'dept': 'ADMIN', 'pos': 'Administrative Officer V', 'cat': 'NON_TEACHING', 'stat': 'PERMANENT', 'email': 'msantos@nbsc.edu.ph', 'salary': 45000.0, 'dob': '07041986'},
        {'id': 'NBSC-2024-0007', 'first': 'Christian', 'last': 'Villanueva', 'dept': 'DGEC', 'pos': 'Instructor I', 'cat': 'TEACHING', 'stat': 'COS', 'salary': 29165.0, 'dob': '12211993'},
        {'id': 'NBSC-2024-0008', 'first': 'Elena', 'last': 'Cruz', 'dept': 'FIN', 'pos': 'Accountant III', 'cat': 'NON_TEACHING', 'stat': 'PERMANENT', 'email': 'ecruz@nbsc.edu.ph', 'salary': 42000.0, 'dob': '02181988'}
    ]

    saved_employees = []
    for s in sample_employees:
        emp = Employee.objects(employee_id=s['id']).first()
        if not emp:
            emp = Employee(
                employee_id=s['id'],
                first_name=s['first'],
                last_name=s['last'],
                email=s.get('email', f"{s['first'].lower().replace(' ', '')}.{s['last'].lower()}@nbsc.edu.ph"),
                department=s['dept'],
                position=s['pos'],
                category=s['cat'],
                employment_status=s['stat'],
                monthly_salary=s['salary'],
                daily_rate=round(s['salary'] / 22.0, 2)
            )
            emp.save()
            print(f"  ✅ Added employee: {emp.full_name} ({emp.department})")
        saved_employees.append(emp)

    # 4. Seed 6 Vacancies
    print("💼 Seeding recruitment vacancies across all 6 institutes...")
    vacancies_data = [
        {
            'title': 'Instructor I (Information Technology)',
            'department': 'ICS',
            'category': 'TEACHING',
            'employment_status': 'COS',
            'education': "Master's degree in Information Technology, Computer Science, or related field",
            'experience': '1 year of relevant tertiary teaching or industry experience',
            'training': '4 hours of relevant training in software engineering or database management',
            'eligibility': 'RA 1080 (LET) or CS Professional / Industry certification',
            'salary_grade': 12,
            'monthly_salary': 29165.00,
            'daily_rate': 1325.68,
            'slots': 2,
            'status': 'OPEN',
            'deadline': datetime.utcnow() + timedelta(days=30),
            'description': 'Conduct lectures and laboratory coursework in Web Development, Database Systems, and Cloud Computing.'
        },
        {
            'title': 'Assistant Professor II (Financial Management)',
            'department': 'IBM',
            'category': 'TEACHING',
            'employment_status': 'PERMANENT',
            'education': 'Master in Business Administration (MBA) or MS in Finance',
            'experience': '2 years of tertiary teaching and research publication',
            'training': '8 hours of relevant pedagogical and financial modeling training',
            'eligibility': 'RA 1080 / CS Professional',
            'salary_grade': 16,
            'monthly_salary': 39672.00,
            'daily_rate': 1803.27,
            'slots': 1,
            'status': 'OPEN',
            'deadline': datetime.utcnow() + timedelta(days=21),
            'description': 'Deliver advanced business administration lectures and guide undergraduate feasibility theses.'
        },
        {
            'title': 'Instructor I (Social Sciences & Philippine History)',
            'department': 'DGEC',
            'category': 'TEACHING',
            'employment_status': 'COS',
            'education': 'Master of Arts in History, Political Science, or Philippine Studies',
            'experience': '1 year teaching experience in general education curricula',
            'training': '4 hours training in outcomes-based education',
            'eligibility': 'RA 1080 / CS Professional',
            'salary_grade': 12,
            'monthly_salary': 29165.00,
            'daily_rate': 1325.68,
            'slots': 1,
            'status': 'DELIBERATION',
            'deadline': datetime.utcnow() - timedelta(days=5),
            'description': 'General education faculty teaching Readings in Philippine History and The Contemporary World.'
        },
        {
            'title': 'Administrative Aide VI (HR Records & 201 Files)',
            'department': 'ADMIN',
            'category': 'NON_TEACHING',
            'employment_status': 'PERMANENT',
            'education': 'Completion of 2 years studies in College or 2-year vocational diploma',
            'experience': '1 year of relevant clerical and records management experience',
            'training': '4 hours of relevant records management training',
            'eligibility': 'Career Service Subprofessional (First Level Eligibility)',
            'salary_grade': 6,
            'monthly_salary': 17553.00,
            'daily_rate': 797.86,
            'slots': 1,
            'status': 'OPEN',
            'deadline': datetime.utcnow() + timedelta(days=15),
            'description': 'Assist in maintenance of 201 Personnel Files, CSC PRIME-HRM audit documentation, and faculty attendance.'
        },
        {
            'title': 'Assistant Professor I (Elementary Education & Pedagogy)',
            'department': 'ITE',
            'category': 'TEACHING',
            'employment_status': 'PERMANENT',
            'education': "Master's degree in Elementary Education or Curriculum & Instruction",
            'experience': '2 years of elementary or tertiary classroom instruction',
            'training': '8 hours training in teaching methodologies and literacy development',
            'eligibility': 'RA 1080 (LET Registered Professional Teacher)',
            'salary_grade': 15,
            'monthly_salary': 36619.00,
            'daily_rate': 1664.50,
            'slots': 1,
            'status': 'OPEN',
            'deadline': datetime.utcnow() + timedelta(days=25),
            'description': 'Supervise pre-service student teachers and deliver foundational early childhood pedagogy courses.'
        },
        {
            'title': 'Accountant III (Disbursement & Statutory Compliance)',
            'department': 'FIN',
            'category': 'NON_TEACHING',
            'employment_status': 'PERMANENT',
            'education': 'Bachelor of Science in Accountancy (BSA)',
            'experience': '2 years relevant public sector accounting experience',
            'training': '8 hours training in Government Accounting Manual (GAM) and tax withholding',
            'eligibility': 'RA 1080 (Certified Public Accountant - CPA)',
            'salary_grade': 19,
            'monthly_salary': 51357.00,
            'daily_rate': 2334.41,
            'slots': 1,
            'status': 'OPEN',
            'deadline': datetime.utcnow() + timedelta(days=18),
            'description': 'Manage institutional payroll disbursements, GSIS/PhilHealth/Pag-IBIG remittances, and COA audit compliance.'
        }
    ]

    created_vacancies = []
    for v_info in vacancies_data:
        vac = Vacancy.objects(title=v_info['title']).first()
        if not vac:
            vac = Vacancy(**v_info)
            vac.save()
            print(f"  ✅ Created vacancy: {vac.title} ({vac.department})")
        else:
            print(f"  ℹ️ Vacancy already exists: {vac.title}")
        created_vacancies.append(vac)

    # 5. Seed 8 Applicants across all 8 Hiring Stages
    print("📝 Seeding 8 candidate applications across all 8 pipeline stages...")
    applicants_data = [
        {
            'tracking': 'NBSC-APP-2026-10011',
            'name': 'Dave Kevin M. Alcantara',
            'email': 'dalcantara@example.com',
            'vac_idx': 4, # Assistant Professor I (ITE)
            'stage': 'APPLIED',
            'education': 'Master of Arts in Education',
            'experience': '2 years elementary instruction',
            'remarks': 'Application submitted via online career portal.'
        },
        {
            'tracking': 'NBSC-APP-2026-10042',
            'name': 'April Anne Elizabeth A. Bajao',
            'email': 'applicant@gmail.com',
            'user': applicant_user,
            'vac_idx': 0, # Instructor I (ICS)
            'stage': 'SCREENING',
            'education': 'MS in Information Technology',
            'experience': '3 years full-stack development & tertiary instruction',
            'remarks': 'Passed initial Qualification Standards screening against CSC matrix.'
        },
        {
            'tracking': 'NBSC-APP-2026-10088',
            'name': 'John Paul D. Tan',
            'email': 'jptan@example.com',
            'vac_idx': 1, # Assistant Professor II (IBM)
            'stage': 'DSS_SCORED',
            'education': 'Master in Business Administration',
            'experience': '4 years corporate banking and lecturing',
            'remarks': '4-Pillar Decision Support System score computed: 88.40/100.'
        },
        {
            'tracking': 'NBSC-APP-2026-10103',
            'name': 'Maria Teresa C. Santos',
            'email': 'msantos.candidate@example.com',
            'vac_idx': 3, # Administrative Aide VI (ADMIN)
            'stage': 'DEPT_EVALUATION',
            'education': 'BS in Office Administration',
            'experience': '3 years public records management',
            'remarks': 'Department Head rubric evaluation completed with 91.50% rating.'
        },
        {
            'tracking': 'NBSC-APP-2026-10145',
            'name': 'Christian P. Villanueva',
            'email': 'cvillanueva.candidate@example.com',
            'vac_idx': 2, # Instructor I (DGEC)
            'stage': 'DELIBERATION',
            'education': 'Master of Arts in History',
            'experience': '3 years tertiary Philippine history teaching',
            'remarks': 'HRMPSB Board deliberation conducted; consensus ranking: Rank 1.'
        },
        {
            'tracking': 'NBSC-APP-2026-10179',
            'name': 'Elena R. Cruz',
            'email': 'ecruz.candidate@example.com',
            'vac_idx': 5, # Accountant III (FIN)
            'stage': 'APPOINTMENT_ISSUED',
            'education': 'BS in Accountancy (CPA)',
            'experience': '5 years government financial disbursement',
            'remarks': 'Appointment resolution signed by College President; Block committed to Audit Chain.'
        },
        {
            'tracking': 'NBSC-APP-2026-10204',
            'name': 'Mark Anthony L. Reyes',
            'email': 'mreyes.candidate@example.com',
            'vac_idx': 0, # Instructor I (ICS)
            'stage': 'DOCUMENT_VERIFICATION',
            'education': 'Master of Information Systems',
            'experience': '4 years database engineering',
            'remarks': 'Medical clearance, NBI check, and notarized PDS verified.'
        },
        {
            'tracking': 'NBSC-APP-2026-10250',
            'name': 'Noreen Faye S. Esta',
            'email': 'nesta.candidate@example.com',
            'vac_idx': 1, # Assistant Professor II (IBM)
            'stage': 'ONBOARDED',
            'education': 'Ph.D. in Business Administration units earned',
            'experience': '5 years tertiary academic leadership',
            'remarks': 'Plantilla induction completed; 201 Personnel file active and enrolled in payroll.'
        }
    ]

    saved_apps = {}
    for a_info in applicants_data:
        app = Application.objects(tracking_number=a_info['tracking']).first()
        if not app:
            target_vac = created_vacancies[a_info['vac_idx']]
            app = Application(
                tracking_number=a_info['tracking'],
                applicant=a_info.get('user', None),
                applicant_email=a_info['email'],
                applicant_name=a_info['name'],
                vacancy=target_vac,
                stage=a_info['stage'],
                applicant_profile={
                    'full_name': a_info['name'],
                    'email': a_info['email'],
                    'phone': '0917 555 0199',
                    'address': 'Bukidnon, Philippines',
                    'highest_education': a_info['education'],
                    'school': 'State University System',
                    'years_experience': a_info['experience'],
                    'eligibility': 'RA 1080 / CS Professional'
                },
                documents=[
                    {'doc_type': 'PDS_CS_FORM_212', 'file_name': f"{a_info['name'].split()[0]}_PDS_2026.pdf", 'file_size': 1450000, 'verified': True},
                    {'doc_type': 'TRANSCRIPT_OF_RECORDS', 'file_name': f"{a_info['name'].split()[0]}_TOR.pdf", 'file_size': 2200000, 'verified': True}
                ]
            )
            # Add stage progression history up to current stage
            stages = ['APPLIED', 'SCREENING', 'DSS_SCORED', 'DEPT_EVALUATION', 'DELIBERATION', 'APPOINTMENT_ISSUED', 'DOCUMENT_VERIFICATION', 'ONBOARDED']
            curr_idx = stages.index(a_info['stage'])
            for s in stages[:curr_idx + 1]:
                app.add_stage_history(s, remarks=f"Transitioned to {s} stage.")
            app.save()
            print(f"  ✅ Added applicant: {app.tracking_number} ({app.applicant_name}) -> {app.stage}")
        saved_apps[a_info['tracking']] = app

    # 6. Seed DSS Scores, Dept Head Evaluations, and Board Votes
    print("⚖️ Seeding hiring intelligence evaluations & deliberation ballots...")
    # DSS Score for John Paul Tan
    tan_app = saved_apps.get('NBSC-APP-2026-10088')
    if tan_app and not DSSScore.objects(application=tan_app).first():
        dss = DSSScore(
            application=tan_app,
            merit_score=26.50,
            competence_score=27.00,
            ethics_score=17.50,
            service_score=17.40,
            total_score=88.40,
            qs_compliant=True,
            details={'education_pts': 14.0, 'experience_pts': 8.5, 'training_pts': 4.0}
        )
        dss.save()
        print("  ✅ Created DSS Score: John Paul Tan (88.40/100)")

    # Dept Head Evaluation for Maria Teresa Santos
    santos_app = saved_apps.get('NBSC-APP-2026-10103')
    if santos_app and not DeptHeadEvaluation.objects(application=santos_app).first():
        eval_doc = DeptHeadEvaluation(
            application=santos_app,
            evaluator=depthead_user,
            evaluator_name=depthead_user.full_name,
            ratings={'technical_mastery': 5, 'instructional_clarity': 4, 'communication': 5, 'professionalism': 5},
            total_score=91.50,
            recommendation='STRONGLY_RECOMMEND',
            remarks='Demonstrated exceptional institutional record organization and technical competence.'
        )
        eval_doc.save()
        print("  ✅ Created Dept Head Evaluation: Maria Teresa Santos (91.50%)")

    # HRMPSB Ballots for Christian Villanueva
    villanueva_app = saved_apps.get('NBSC-APP-2026-10145')
    if villanueva_app and not HRMPSBVote.objects(application=villanueva_app).first():
        vote1 = HRMPSBVote(
            application=villanueva_app,
            voter=hrmpsb_user,
            voter_name=hrmpsb_user.full_name,
            vote='APPROVE',
            rank_priority=1,
            deliberation_notes='Strong teaching demonstration and exemplary peer references.'
        )
        vote1.save()

        vote2 = HRMPSBVote(
            application=villanueva_app,
            voter=depthead_user,
            voter_name=depthead_user.full_name,
            vote='APPROVE',
            rank_priority=1,
            deliberation_notes='Recommended for DGEC faculty plantilla.'
        )
        vote2.save()
        print("  ✅ Created HRMPSB Deliberation Votes: Christian Villanueva")

    # Final Hiring Decision for Elena Cruz
    cruz_app = saved_apps.get('NBSC-APP-2026-10179')
    if cruz_app and not HiringDecision.objects(application=cruz_app).first():
        decision = HiringDecision(
            application=cruz_app,
            decision='APPOINTED',
            resolution_number='BOR-RES-2026-089',
            appointed_by=admin_user,
            audit_block_index=4,
            audit_block_hash='d7f4a2189c4e09f58a719c8114f2e185038c92b23a1a9e88d6ef92a0134b210a'
        )
        decision.save()
        print("  ✅ Created Hiring Appointment Resolution: Elena Cruz (BOR-RES-2026-089)")

    # 7. Seed SHA-256 Cryptographic Audit Chain (Genesis + 5 action blocks)
    print("⛓️ Seeding cryptographic audit ledger (SHA-256)...")
    ensure_genesis_block()

    if AuditBlock.objects.count() <= 1:
        blocks_data = [
            {
                'actor': admin_user,
                'action': 'VACANCY_CREATED',
                'target_id': 'ICS-INST-1',
                'payload': {'title': 'Instructor I (Information Technology)', 'department': 'ICS', 'sg': 12}
            },
            {
                'actor': applicant_user,
                'action': 'APPLICATION_SUBMITTED',
                'target_id': 'NBSC-APP-2026-10042',
                'payload': {'applicant': 'April Anne Elizabeth A. Bajao', 'vacancy': 'Instructor I (ICS)'}
            },
            {
                'actor': depthead_user,
                'action': 'DSS_SCORE_COMPUTED',
                'target_id': 'NBSC-APP-2026-10088',
                'payload': {'applicant': 'John Paul D. Tan', 'score': 88.40, 'qs_compliant': True}
            },
            {
                'actor': hrmpsb_user,
                'action': 'HRMPSB_DELIBERATION_CONCLUDED',
                'target_id': 'NBSC-APP-2026-10145',
                'payload': {'candidate': 'Christian P. Villanueva', 'consensus': 'Rank 1 (Unanimous)'}
            },
            {
                'actor': admin_user,
                'action': 'APPOINTMENT_CONFIRMED',
                'target_id': 'NBSC-APP-2026-10179',
                'payload': {'appointee': 'Elena R. Cruz', 'resolution': 'BOR-RES-2026-089', 'position': 'Accountant III'}
            }
        ]

        for b_info in blocks_data:
            block = create_block(
                actor=b_info['actor'],
                action=b_info['action'],
                target_id=b_info['target_id'],
                payload=b_info['payload']
            )
            print(f"  ✅ Created block #{block.index}: {block.action} (Hash: {block.hash[:16]}...)")

    # 8. Seed Payroll Batch & Encrypted Payslips
    print("💰 Seeding sample payroll disbursement cycle...")
    batch_id = 'BATCH-2026-09-A'
    batch = PayrollBatch.objects(batch_id=batch_id).first()
    if not batch:
        batch = PayrollBatch(
            batch_id=batch_id,
            period_label='September 1–15, 2026',
            start_date=datetime(2026, 9, 1),
            end_date=datetime(2026, 9, 15),
            department='ALL',
            total_gross=245800.00,
            total_deductions=48200.00,
            total_net=197600.00,
            employee_count=len(sample_employees),
            uploaded_by='admin@nbsc.edu.ph',
            status='DISTRIBUTED',
            processed_at=datetime(2026, 9, 15, 17, 0)
        )
        batch.save()
        print(f"  ✅ Created Payroll Batch: {batch.period_label} ({batch.batch_id})")

        # Create Payslips for each employee
        for s in sample_employees:
            half_basic = round(s['salary'] / 2.0, 2)
            pera = 1000.00
            gross = half_basic + pera
            gsis = round(half_basic * 0.09, 2) if s['stat'] == 'PERMANENT' else 0.0
            philhealth = min(round(half_basic * 0.025, 2), 1250.0)
            pagibig = 100.00
            tax = round(max((gross - 10417.0) * 0.15, 0.0), 2)
            total_ded = gsis + philhealth + pagibig + tax
            net = round(gross - total_ded, 2)

            payslip = PayslipRecord(
                batch=batch,
                employee_id=s['id'],
                full_name=f"{s['first']} {s['last']}",
                department=s['dept'],
                position=s['pos'],
                salary_grade=12,
                email=s.get('email', f"{s['first'].lower().replace(' ', '')}.{s['last'].lower()}@nbsc.edu.ph"),
                date_of_birth=s['dob'],
                basic_pay=half_basic,
                pera=pera,
                gross_pay=gross,
                gsis=gsis,
                philhealth=philhealth,
                pagibig=pagibig,
                withholding_tax=tax,
                total_deductions=total_ded,
                net_pay=net,
                encrypted_pdf_filename=f"Payslip_{s['id']}_2026_09_A.pdf",
                encrypted_pdf_path=f"media/payslips/2026_09_A/{s['id']}.pdf"
            )
            payslip.save()
        print(f"  ✅ Created {len(sample_employees)} itemized payslip records.")

    # 9. Seed In-app Notifications
    print("🔔 Seeding in-app notifications...")
    notifications_data = [
        {
            'recipient': 'admin@nbsc.edu.ph',
            'title': 'New Application Received',
            'message': 'April Anne Elizabeth A. Bajao applied for Instructor I (ICS).',
            'category': 'APPLICATION_STAGE',
            'link': '/frontend/pages/hiring/applicant-review/applicant-review.html'
        },
        {
            'recipient': 'admin@nbsc.edu.ph',
            'title': 'Semi-Monthly Payslip Ready',
            'message': 'Your encrypted payslip for September 1–15, 2026 is ready for download.',
            'category': 'PAYROLL_READY',
            'link': '/frontend/pages/payroll/payslip-download/payslip-download.html'
        },
        {
            'recipient': 'hrmpsb@nbsc.edu.ph',
            'title': 'HRMPSB Deliberation Scheduled',
            'message': 'Comparative deliberation for Instructor I (DGEC) is open for board voting.',
            'category': 'EVALUATION_REQUEST',
            'link': '/frontend/pages/hiring/deliberation/deliberation.html'
        },
        {
            'recipient': 'applicant@gmail.com',
            'title': 'Application Advanced to Screening',
            'message': 'Your application NBSC-APP-2026-10042 has successfully passed documentary screening.',
            'category': 'APPLICATION_STAGE',
            'link': '/frontend/pages/applicants/application-track/application-track.html?tracking=NBSC-APP-2026-10042'
        }
    ]

    for n_info in notifications_data:
        if not Notification.objects(recipient_email=n_info['recipient'], title=n_info['title']).first():
            n = Notification(
                recipient_email=n_info['recipient'],
                title=n_info['title'],
                message=n_info['message'],
                category=n_info['category'],
                target_link=n_info['link'],
                is_read=False
            )
            n.save()
            print(f"  ✅ Created notification for {n.recipient_email}: {n.title}")

    print("\n✨ Comprehensive database seeding completed successfully!")


if __name__ == '__main__':
    seed()
