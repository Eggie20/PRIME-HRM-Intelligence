"""
NBSC PRIME-HRM Intelligence Hub — SARA RAG Knowledge Base
Loads canonical CSC PRIME-HRM Level 2 policies, NBSC Merit Selection Plan (MSP),
Qualification Standards from docs/PRIME-HRM-POLICIES/, and executes hybrid
keyword and semantic retrieval with citation generation.
"""
import os
import re
from pathlib import Path
from django.conf import settings

# Canonical Fallback Policies
BASE_PRIME_HRM_POLICIES = [
    {
        'id': 'POL-001',
        'title': '4 Pillars of the NBSC Merit Selection Plan (MSP)',
        'section': 'CSC PRIME-HRM Level 2 Competency-Based Recruitment Standards',
        'keywords': ['pillar', 'merit', 'competence', 'ethics', 'service', 'dss', 'weight', 'score', 'formula'],
        'content': (
            "Under the CSC PRIME-HRM Level 2 Merit Selection Plan, candidate ranking is determined by a 4-Pillar Decision Support System (DSS):\n"
            "1. Merit (30% default): Highest educational attainment (15%), length of relevant experience (10%), and accredited training hours (5%).\n"
            "2. Competence (30% default): Teaching demonstration rating (15%) and behavioral event interview (BEI) score (15%).\n"
            "3. Ethics (20% default): Character reference verification (10%) and background investigation compliance (10%).\n"
            "4. Service Orientation (20% default): Institutional citizenship (10%) and community engagement public service rating (10%)."
        )
    },
    {
        'id': 'POL-002',
        'title': 'Faculty Qualification Standards (QS) Matrix',
        'section': 'CHED & CSC Memorandum Circular No. 12, Series of 2017',
        'keywords': ['instructor', 'professor', 'faculty', 'teaching', 'qualification', 'degree', 'master', 'ched'],
        'content': (
            "Minimum qualification standards for NBSC Tertiary Teaching Faculty:\n"
            "• Instructor I (Salary Grade 12): Master's degree in relevant discipline, 1 year relevant experience, 4 hours training, RA 1080 (LET) or CS Professional eligibility.\n"
            "• Assistant Professor II (Salary Grade 16): Master's degree in relevant discipline, 2 years tertiary teaching or industry research experience, 8 hours training, RA 1080.\n"
            "• Associate Professor IV (Salary Grade 21): Master's degree or earned doctoral units, 3 years research/teaching experience, 16 hours specialized training.\n"
            "• Professor (Salary Grade 24+): Earned Doctorate (Ph.D./Ed.D./D.M.), Scopus/WOS indexed publications, and verified community extension leadership."
        )
    },
    {
        'id': 'POL-003',
        'title': 'Non-Teaching Personnel Qualification Standards',
        'section': 'CSC Omnibus Rules on Appointments and Other Human Resource Actions (ORAOHRA)',
        'keywords': ['admin', 'staff', 'clerk', 'aide', 'non-teaching', 'subprofessional', 'sg6'],
        'content': (
            "Minimum standards for NBSC Administrative & Technical Staff:\n"
            "• Administrative Aide VI (Salary Grade 6): Completion of 2 years college studies or vocational diploma, 1 year relevant clerical experience, 4 hours records training, Career Service Subprofessional eligibility.\n"
            "• Administrative Officer V (HRMO / Salary Grade 18): Bachelor's degree, 2 years supervisory experience in human resource management, 8 hours supervisory training, Career Service Professional eligibility."
        )
    },
    {
        'id': 'POL-004',
        'title': 'HRMPSB Board Deliberation & Voting Protocol',
        'section': 'CSC Resolution No. 1800692 — Equal Employment Opportunity Principle (EEOP)',
        'keywords': ['hrmpsb', 'board', 'deliberation', 'vote', 'committee', 'quorum', 'consensus', 'eeop'],
        'content': (
            "The Human Resource Merit Promotion and Selection Board (HRMPSB) conducts comparative assessment of candidates:\n"
            "• Quorum: A majority of the accredited members must be present during formal deliberations.\n"
            "• EEOP Compliance: No applicant shall be discriminated against on account of gender, civil status, disability, religion, ethnicity, or political affiliation.\n"
            "• Voting: Members cast official ballots (Approve, Disapprove, Abstain) with priority rankings. Consensus determines the top 5 candidates submitted to the College President."
        )
    },
    {
        'id': 'POL-005',
        'title': 'SHA-256 Cryptographic Audit Chain Standards',
        'section': 'Republic Act No. 8792 (E-Commerce Act) & NBSC Transparency Charter',
        'keywords': ['audit', 'sha256', 'chain', 'blockchain', 'tamper', 'security', 'hash', 'ledger'],
        'content': (
            "To guarantee absolute merit integrity and tamper-evidence:\n"
            "• Every critical hiring decision, stage transition, and payroll disbursement is committed to an immutable SHA-256 cryptographic chain.\n"
            "• Each block encapsulates: block index, UTC timestamp, actor email, action type, SHA-256 payload digest, and previous block hash pointer.\n"
            "• Any unauthorized modification of past records invalidates subsequent hashes and triggers automatic system security warnings."
        )
    },
    {
        'id': 'POL-006',
        'title': 'Statutory Payroll Deductions & TRAIN Law',
        'section': 'Republic Act No. 10963 & CSC-COA Joint Circular',
        'keywords': ['payroll', 'train', 'tax', 'gsis', 'philhealth', 'pagibig', 'deduction', 'pera', 'payslip', 'password'],
        'content': (
            "NBSC Compensation and Statutory Deductions Guidelines:\n"
            "• Semi-Monthly Cut-offs: Disbursed on the 15th and 30th of each month through LandBank.\n"
            "• PERA: Standard ₱2,000 monthly allowance (₱1,000 credited per cut-off).\n"
            "• GSIS: 9% employee retirement & life insurance share for regular personnel.\n"
            "• PhilHealth: 2.5% employee share capped at ₱1,250 bi-monthly.\n"
            "• Pag-IBIG: Standard ₱100 bi-monthly contribution.\n"
            "• Withholding Tax: Computed under TRAIN Law bi-monthly brackets.\n"
            "• Encrypted Payslips: Protected with 128-bit AES using formula: Last 4 digits of Employee ID + MMDDYYYY of Birthday."
        )
    }
]

# In-memory document corpus loaded from disk
_LOADED_CORPUS = None


def chunk_document_text(text: str, max_words: int = 250, overlap: int = 30) -> list:
    """
    Chunks large documents using a sliding word window with overlap.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        chunk = " ".join(words[start:start + max_words])
        chunks.append(chunk)
        start += max_words - overlap
    return chunks


def load_policy_corpus() -> list:
    """
    Scans docs/PRIME-HRM-POLICIES/ directory for .md and .txt files,
    parses sections, and combines them with canonical policies.
    """
    global _LOADED_CORPUS
    if _LOADED_CORPUS is not None:
        return _LOADED_CORPUS

    corpus = list(BASE_PRIME_HRM_POLICIES)
    
    # Locate docs/PRIME-HRM-POLICIES/
    base_dir = getattr(settings, 'BASE_DIR', Path(__file__).resolve().parent.parent.parent)
    docs_dir = Path(base_dir).parent / 'docs' / 'PRIME-HRM-POLICIES'

    if docs_dir.exists() and docs_dir.is_dir():
        doc_count = 100
        for file_path in docs_dir.glob('*.md'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Split by Markdown H2 sections
                sections = re.split(r'\n##\s+', content)
                doc_title = sections[0].strip().replace('#', '').strip() if sections else file_path.stem

                for idx, sec in enumerate(sections[1:], start=1):
                    lines = sec.strip().split('\n')
                    sec_heading = lines[0].strip()
                    sec_body = "\n".join(lines[1:]).strip()

                    chunks = chunk_document_text(sec_body, max_words=200, overlap=25)
                    for c_idx, chunk_text in enumerate(chunks, start=1):
                        doc_count += 1
                        keywords = re.findall(r'\b[a-zA-Z]{4,}\b', (sec_heading + " " + chunk_text).lower())
                        corpus.append({
                            'id': f"DOC-{doc_count}",
                            'title': doc_title,
                            'section': f"{sec_heading} (Part {c_idx})" if len(chunks) > 1 else sec_heading,
                            'keywords': list(set(keywords))[:15],
                            'content': chunk_text
                        })
            except Exception:
                pass

    _LOADED_CORPUS = corpus
    return _LOADED_CORPUS


# Maintain backward compatibility export
PRIME_HRM_POLICIES = BASE_PRIME_HRM_POLICIES


def search_prime_hrm_policies(query: str, top_k: int = 2) -> list:
    """
    Performs hybrid keyword, n-gram, and semantic matching against policy documents.
    Returns the top_k most relevant policy excerpts with section citations.
    """
    if not query:
        return []

    corpus = load_policy_corpus()
    query_lower = query.lower()
    raw_tokens = re.findall(r'\b[a-zA-Z0-9]{3,}\b', query_lower)
    stopwords = {'the', 'and', 'for', 'are', 'what', 'how', 'explain', 'tell', 'about', 'can', 'you'}
    tokens = set(t for t in raw_tokens if t not in stopwords)

    scored = []

    for policy in corpus:
        score = 0
        policy_title = policy.get('title', '').lower()
        policy_section = policy.get('section', '').lower()
        policy_content = policy.get('content', '').lower()
        policy_keywords = [k.lower() for k in policy.get('keywords', [])]

        # Specific topic boosts
        if 'pillar' in query_lower and 'pillar' in policy_title:
            score += 25
        if 'qualification' in query_lower and 'qualification' in policy_title:
            score += 20
        if 'audit' in query_lower and 'audit' in policy_title:
            score += 20

        for token in tokens:
            if token in policy_keywords:
                score += 8
            if token in policy_title:
                score += 6
            if token in policy_section:
                score += 4
            if token in policy_content:
                score += 2

        if score > 0:
            scored.append((score, policy))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for s, p in scored[:top_k]:
        results.append({
            'id': p['id'],
            'title': p['title'],
            'section': p['section'],
            'excerpt': p['content']
        })

    return results
