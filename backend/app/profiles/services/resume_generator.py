import io
import os
from datetime import date
from typing import Any
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import docx.opc.constants
import docx.oxml.shared

PRIMARY_COLOR = RGBColor(0, 136, 168)  # Cyan/Teal heading color from template (#0088A8)
TEXT_DARK = RGBColor(20, 24, 33)  # Deep black/navy text color (#141821)
TEXT_MUTED = RGBColor(70, 80, 95)  # Muted subtext color


def add_hyperlink(paragraph, text, url):
    """Adds a clickable hyperlink to a paragraph."""
    part = paragraph.part
    r_id = part.relate_to(
        url, docx.opc.constants.RELATIONSHIP_TYPE.HYPERLINK, is_external=True
    )
    hyperlink = docx.oxml.shared.OxmlElement("w:hyperlink")
    hyperlink.set(docx.oxml.shared.qn("r:id"), r_id)
    new_run = docx.oxml.shared.OxmlElement("w:r")
    rPr = docx.oxml.shared.OxmlElement("w:rPr")
    c = docx.oxml.shared.OxmlElement("w:color")
    c.set(docx.oxml.shared.qn("w:val"), "0000EE")
    rPr.append(c)
    u = docx.oxml.shared.OxmlElement("w:u")
    u.set(docx.oxml.shared.qn("w:val"), "single")
    rPr.append(u)
    new_run.append(rPr)
    new_run.text = text
    hyperlink.append(new_run)
    r = paragraph.add_run()
    r._r.append(hyperlink)
    return hyperlink


def format_date_range(start_date: Any, end_date: Any) -> str:
    """Format start and end dates into 'Mon YYYY - Mon YYYY' or 'Present'."""

    def _format_single(d: Any) -> str:
        if not d:
            return ""
        if isinstance(d, date):
            return d.strftime("%b %Y")
        if isinstance(d, str):
            try:
                parts = d.split("-")
                if len(parts) >= 2:
                    year, month = int(parts[0]), int(parts[1])
                    temp = date(year, month, 1)
                    return temp.strftime("%b %Y")
            except Exception:
                return str(d)
        return str(d)

    start_str = _format_single(start_date)
    end_str = _format_single(end_date) if end_date else "Present"

    if start_str and end_str:
        return f"{start_str} - {end_str}"
    if start_str:
        return start_str
    if end_str and end_str != "Present":
        return end_str
    return ""


def add_section_header(doc: docx.Document, title: str):
    """Add an uppercase, bold, teal section header with a solid black bottom rule."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True

    run = p.add_run(title.upper())
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = PRIMARY_COLOR

    # Bottom border rule in XML
    pPr = p._p.get_or_add_pPr()
    pBdr = parse_xml(
        f"<w:pBdr {nsdecls('w')}>"
        f'<w:bottom w:val="single" w:sz="6" w:space="2" w:color="000000"/>'
        f"</w:pBdr>"
    )
    pPr.append(pBdr)


def add_two_column_line(
    doc: docx.Document,
    left_text: str,
    right_text: str,
    is_bold_left: bool = False,
    is_bold_right: bool = False,
    space_before: int = 4,
    space_after: int = 1,
):
    """Add a line with left-aligned text and right-aligned text across page width."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True

    # 7.3 inches text width (8.5 - 2*0.6)
    p.paragraph_format.tab_stops.add_tab_stop(Inches(7.3), WD_TAB_ALIGNMENT.RIGHT)

    left_run = p.add_run(left_text)
    left_run.font.name = "Calibri"
    left_run.font.size = Pt(10)
    left_run.font.bold = is_bold_left
    left_run.font.color.rgb = TEXT_DARK

    if right_text:
        p.add_run("\t")
        right_run = p.add_run(right_text)
        right_run.font.name = "Calibri"
        right_run.font.size = Pt(10)
        right_run.font.bold = is_bold_right
        right_run.font.color.rgb = TEXT_DARK


def add_bullet_point(doc: docx.Document, text: str, prefix_bold: str = ""):
    """Add a clean, tight bullet point."""
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.left_indent = Inches(0.25)

    if prefix_bold:
        b_run = p.add_run(prefix_bold)
        b_run.font.name = "Calibri"
        b_run.font.size = Pt(9.5)
        b_run.font.bold = True
        b_run.font.color.rgb = TEXT_DARK

    run = p.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(9.5)
    run.font.color.rgb = TEXT_DARK


class ResumeGeneratorService:
    """Generates a professional DOCX resume matching the specified clean tech template."""

    @staticmethod
    def generate_docx(profile_data: dict, user_email: str = "") -> io.BytesIO:
        doc = docx.Document()

        # Set 0.6 inch margins for modern single/dual page layout
        for section in doc.sections:
            section.top_margin = Inches(0.5)
            section.bottom_margin = Inches(0.5)
            section.left_margin = Inches(0.6)
            section.right_margin = Inches(0.6)

        # Set default font
        doc.styles["Normal"].font.name = "Calibri"
        doc.styles["Normal"].font.size = Pt(10)

        # Extract profile details
        first_name = (profile_data.get("first_name") or "").strip()
        last_name = (profile_data.get("last_name") or "").strip()
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            email_handle = (
                user_email.split("@")[0] if user_email else "Student Candidate"
            )
            parts = [
                p.capitalize() for p in email_handle.replace("_", ".").split(".") if p
            ]
            full_name = " ".join(parts) if parts else "Student Candidate"

        grad_year = profile_data.get("graduation_year")

        # -------------------------------------------------------------
        # 1. HEADER: Candidate Name & Contact Info
        # -------------------------------------------------------------
        name_p = doc.add_paragraph()
        name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        name_p.paragraph_format.space_before = Pt(0)
        name_p.paragraph_format.space_after = Pt(2)
        name_run = name_p.add_run(full_name)
        name_run.font.name = "Calibri"
        name_run.font.size = Pt(20)
        name_run.font.bold = True
        name_run.font.color.rgb = TEXT_DARK

        # Contact line with icons
        contact_p = doc.add_paragraph()
        contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact_p.paragraph_format.space_before = Pt(0)
        contact_p.paragraph_format.space_after = Pt(6)

        email_val = (profile_data.get("email") or user_email or "").strip()
        phone_val = (profile_data.get("phone_number") or "").strip()
        linkedin_val = (profile_data.get("linkedin_url") or "").strip()
        github_val = (profile_data.get("github_url") or "").strip()
        leetcode_val = (profile_data.get("leetcode_url") or "").strip()

        assets_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
        email_icon_path = os.path.join(assets_dir, "email_icon.png")
        phone_icon_path = os.path.join(assets_dir, "phone_icon.jpg")
        linkedin_icon_path = os.path.join(assets_dir, "linkedin_icon.png")
        github_icon_path = os.path.join(assets_dir, "github_icon.jpg")

        items_to_add = []
        if phone_val:
            items_to_add.append(("phone", phone_val, phone_icon_path))
        if email_val:
            items_to_add.append(("email", email_val, email_icon_path))
        if linkedin_val:
            items_to_add.append(("linkedin", linkedin_val, linkedin_icon_path))
        if github_val:
            items_to_add.append(("github", github_val, github_icon_path))
        if leetcode_val:
            items_to_add.append(("leetcode", leetcode_val, None))

        for idx, (kind, val, icon_path) in enumerate(items_to_add):
            if idx > 0:
                sep_run = contact_p.add_run("   |   ")
                sep_run.font.name = "Calibri"
                sep_run.font.size = Pt(9.5)
                sep_run.font.color.rgb = TEXT_MUTED

            if icon_path and os.path.exists(icon_path):
                try:
                    img_run = contact_p.add_run()
                    img_run.add_picture(icon_path, width=Pt(10), height=Pt(10))
                    sp_run = contact_p.add_run(" ")
                    sp_run.font.size = Pt(9.5)
                except Exception:
                    pass

            text_run = contact_p.add_run(val)
            text_run.font.name = "Calibri"
            text_run.font.size = Pt(9.5)
            text_run.font.color.rgb = TEXT_MUTED

        # -------------------------------------------------------------
        # OBJECTIVE SECTION (Only if bio is provided by candidate)
        # -------------------------------------------------------------
        bio_text = (profile_data.get("bio") or "").strip()
        if bio_text:
            add_section_header(doc, "Objective")
            obj_p = doc.add_paragraph()
            obj_p.paragraph_format.space_before = Pt(4)
            obj_p.paragraph_format.space_after = Pt(4)
            obj_run = obj_p.add_run(bio_text)
            obj_run.font.name = "Calibri"
            obj_run.font.size = Pt(9.5)
            obj_run.font.color.rgb = TEXT_DARK

        # -------------------------------------------------------------
        # 2. WORK EXPERIENCE
        # -------------------------------------------------------------
        employment = profile_data.get("employment_history") or []
        if employment:
            add_section_header(doc, "Work Experience")
            for emp in employment:
                company = emp.get("company_name", "").strip() or "Company"
                title = emp.get("title", "").strip() or "Role"
                date_str = format_date_range(emp.get("start_date"), emp.get("end_date"))
                location = emp.get("location", "").strip()

                # Line 1: Company Name (Bold)
                add_two_column_line(
                    doc,
                    company,
                    location,
                    is_bold_left=True,
                    space_before=4,
                    space_after=1,
                )
                # Line 2: Title & Dates
                add_two_column_line(
                    doc,
                    title,
                    date_str,
                    is_bold_left=False,
                    space_before=0,
                    space_after=2,
                )

                desc = emp.get("description") or ""
                if desc:
                    lines = [
                        line.strip().lstrip("•-*").strip()
                        for line in desc.split("\n")
                        if line.strip()
                    ]
                    for line_item in lines:
                        add_bullet_point(doc, line_item)

        # -------------------------------------------------------------
        # 3. EDUCATION
        # -------------------------------------------------------------
        education_list = profile_data.get("education") or []
        tenth_pct = profile_data.get("tenth_percentage")
        twelfth_pct = profile_data.get("twelfth_diploma_percentage")
        has_dept_or_grad = bool(profile_data.get("department") or grad_year)

        if (
            education_list
            or has_dept_or_grad
            or tenth_pct is not None
            or twelfth_pct is not None
        ):
            add_section_header(doc, "Education")

            if education_list:
                for edu in education_list:
                    inst = (
                        edu.get("institution_name", "").strip()
                        or "S.B. Jain Institute of Technology, Management & Research"
                    )
                    degree = edu.get("degree", "").strip() or "Bachelor of Technology"
                    field = edu.get("field_of_study", "").strip()
                    gpa = edu.get("gpa")
                    pct = edu.get("percentage")
                    date_str = format_date_range(
                        edu.get("start_date"), edu.get("end_date")
                    )

                    degree_full = f"{degree} in {field}" if field else degree
                    if pct is not None:
                        degree_full += f" - {pct}%"
                    elif gpa is not None:
                        degree_full += f" - {gpa} GPA"

                    # Line 1: Institution (Bold)
                    add_two_column_line(
                        doc, inst, "", is_bold_left=True, space_before=4, space_after=1
                    )
                    # Line 2: Degree, Marks, Date Range
                    add_two_column_line(
                        doc,
                        degree_full,
                        date_str,
                        is_bold_left=False,
                        space_before=0,
                        space_after=2,
                    )

                    desc = edu.get("description") or ""
                    if desc:
                        lines = [
                            line.strip().lstrip("•-*").strip()
                            for line in desc.split("\n")
                            if line.strip()
                        ]
                        for line_item in lines:
                            add_bullet_point(doc, line_item)
            elif has_dept_or_grad:
                # Real profile department and grad year
                inst = (
                    "S.B. Jain Institute of Technology, Management & Research, Nagpur"
                )
                dept_name = profile_data.get("department")
                degree_full = (
                    f"Bachelor of Technology in {dept_name}"
                    if dept_name
                    else "Bachelor of Technology"
                )
                year_label = f"Class of {grad_year}" if grad_year else ""
                add_two_column_line(
                    doc, inst, "", is_bold_left=True, space_before=4, space_after=1
                )
                add_two_column_line(
                    doc,
                    degree_full,
                    year_label,
                    is_bold_left=False,
                    space_before=0,
                    space_after=2,
                )

            if tenth_pct is not None or twelfth_pct is not None:
                add_two_column_line(
                    doc,
                    "Prior Education",
                    "",
                    is_bold_left=True,
                    space_before=4,
                    space_after=1,
                )
                if twelfth_pct is not None:
                    add_bullet_point(doc, f"12th / Diploma: {twelfth_pct}%")
                if tenth_pct is not None:
                    add_bullet_point(doc, f"10th Standard: {tenth_pct}%")

        # -------------------------------------------------------------
        # 4. PROJECTS
        # -------------------------------------------------------------
        projects = profile_data.get("projects") or []
        if projects:
            add_section_header(doc, "Projects")
            for proj in projects:
                p_title = proj.get("title") or proj.get("name") or "Key Project"
                tech_stack = proj.get("tech_stack") or []
                highlights = proj.get("highlights") or []
                p_desc = proj.get("description") or ""
                p_url = (
                    proj.get("project_url") or proj.get("github_url") or proj.get("url")
                )

                # Project Title (Bold)
                p_para = doc.add_paragraph()
                p_para.paragraph_format.space_before = Pt(4)
                p_para.paragraph_format.space_after = Pt(1)
                p_para.paragraph_format.keep_with_next = True
                p_run = p_para.add_run(p_title)
                p_run.font.name = "Calibri"
                p_run.font.size = Pt(10)
                p_run.font.bold = True
                p_run.font.color.rgb = TEXT_DARK

                if p_url:
                    link_p = doc.add_paragraph(style="List Bullet")
                    link_p.paragraph_format.space_before = Pt(1)
                    link_p.paragraph_format.space_after = Pt(1.5)
                    link_p.paragraph_format.left_indent = Inches(0.25)
                    bold_run = link_p.add_run("Link: ")
                    bold_run.font.name = "Calibri"
                    bold_run.font.size = Pt(9.5)
                    bold_run.font.bold = True
                    bold_run.font.color.rgb = TEXT_DARK
                    add_hyperlink(link_p, p_url, p_url)

                if highlights:
                    for hl in highlights:
                        if isinstance(hl, str) and hl.strip():
                            add_bullet_point(doc, hl.strip().lstrip("•-*").strip())
                elif p_desc:
                    for line in p_desc.split("\n"):
                        if line.strip():
                            add_bullet_point(doc, line.strip().lstrip("•-*").strip())

                if tech_stack:
                    add_bullet_point(
                        doc, f"Technologies used: {', '.join(tech_stack)}."
                    )

        # -------------------------------------------------------------
        # 5. SKILLS (Rendered strictly from profile)
        # -------------------------------------------------------------
        raw_skills = profile_data.get("skills")

        if isinstance(raw_skills, dict) and any(
            isinstance(v, list) and len(v) > 0 for v in raw_skills.values()
        ):
            add_section_header(doc, "Skills")
            for category, skill_list in raw_skills.items():
                if isinstance(skill_list, list) and skill_list:
                    cat_name = category.strip()
                    skills_str = ", ".join(
                        str(s).strip() for s in skill_list if str(s).strip()
                    )
                    add_bullet_point(doc, skills_str, prefix_bold=f"{cat_name}: ")
        elif isinstance(raw_skills, list) and len(raw_skills) > 0:
            all_skills = [str(s).strip() for s in raw_skills if str(s).strip()]
            if all_skills:
                add_section_header(doc, "Skills")
                add_bullet_point(
                    doc,
                    ", ".join(all_skills) + ".",
                    prefix_bold="Technical Skills: ",
                )

        # -------------------------------------------------------------
        # 6. CERTIFICATIONS
        # -------------------------------------------------------------
        certs = profile_data.get("certifications") or []
        if certs:
            add_section_header(doc, "Certifications")
            for cert in certs:
                if isinstance(cert, dict):
                    c_name = (
                        cert.get("name")
                        or cert.get("title")
                        or "Professional Certification"
                    )
                    c_issuer = cert.get("issuer")
                    c_text = f"{c_name} - {c_issuer}" if c_issuer else c_name
                    add_bullet_point(doc, c_text)
                elif isinstance(cert, str):
                    add_bullet_point(doc, cert)

        output_stream = io.BytesIO()
        doc.save(output_stream)
        output_stream.seek(0)
        return output_stream
