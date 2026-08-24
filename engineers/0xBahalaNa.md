---
name: Luigi Carpio
github: 0xBahalaNa
specializations:
  - Compliance Automation
  - Cloud Security
  - Identity & Access Management
  - Third-Party Risk
  - Audit & Assurance
languages:
  - Python
  - Bash
  - Terraform
  - OSCAL
  - SQL

title: GRC Engineer
location: California

linkedin: https://linkedin.com/in/luigi-carpio
website: https://luigicarpio.dev
blog: https://luigicarpio.dev
credly: https://www.credly.com/users/luigi-carpio/badges

frameworks:
  - CJIS
  - FedRAMP
  - NIST 800-53
  - SOC 2
  - ISO 27001

certifications:
  - CGE-P
  - SSCP
  - CySA+
  - PenTest+
  - Security+
  - Network+
  - A+
  - Project+
  - ITIL 4 Foundations
  - Linux LPI Essentials

available_for:
  - collaboration
  - freelance
  - hiring
  - open-source

projects:
  - name: OSCAL Evidence Pipeline
    url: https://github.com/0xBahalaNa/oscal-evidence-pipeline
    description: Transforms compliance findings into OSCAL Assessment Results JSON for FedRAMP 20x and CJIS v6.1 evidence workflows. Bridges collector output to machine-readable assessment artifacts auditors and continuous monitoring pipelines can consume.

  - name: AWS Compliance as Code
    url: https://github.com/0xBahalaNa/aws-compliance-as-code
    description: Preventive compliance controls as SCPs and CloudFormation — audit log protection (AU-9), SSH boundary enforcement with condition logic (SC-7), S3 encryption requirements (SC-28), and secure-by-default resource deployment. Mapped across CJIS v6.1, FedRAMP High, and NIST 800-53.

  - name: Evidence Warehouse
    url: https://github.com/0xBahalaNa/evidence-warehouse
    description: "dbt and DuckDB staging models over collector output, with completeness and reconciliation tests as the control layer: a silently failing collector fails the build. Findings land against a per-source contract and resolve to one queryable mart with lineage from source through staging. Treats audit evidence as a data product. v1.0 shipped August 2026."

  - name: IAM Access Review
    url: https://github.com/0xBahalaNa/iam-access-review
    description: "A user access review run as a data pipeline. Six identity extracts land in SQLite and reconcile against HR as the population of record, then SQL control checks find terminated-but-active accounts, orphaned and dormant access, ownerless groups, and direct assignments. A recursive CTE flattens nested groups so privileged reach is the effective answer rather than the direct-membership one. Emits an auditor-ready evidence packet with SHA-256 input hashes that regenerates byte-identical. SOX ITGC framing, crosswalked to AC-2, AC-6(7), and SOC 2 CC6. v1.0 shipped August 2026."

  - name: SOC 2 / ISO 27001 / NIST 800-53 Crosswalk
    url: https://github.com/0xBahalaNa/soc2-iso-27001-nist-800-53-rev-5-crosswalk
    description: SOC 2 TSC pivot mapped to NIST 800-53 Rev 5 and ISO 27001:2022 Annex A from a single YAML source. Emits markdown, JSON, and CSV with a --check CI gate to keep the crosswalk consistent.

  - name: Vendor Security Due Diligence
    url: https://github.com/0xBahalaNa/vendor-security-due-diligence
    description: Vendor security due-diligence crosswalk covering SOC 2 CC9 and ISO 27001:2022 A.5.19–A.5.23, plus a risk scorer for third-party assessment workflows.

  - name: Security Questionnaire Responder
    url: https://github.com/0xBahalaNa/security-questionnaire-responder
    description: Drafts grounded answers to customer security questionnaires from a version-controlled SOC 2 / ISO 27001 control corpus, and abstains, loudly, when it can't.

  - name: CGE-P Capstone
    url: https://github.com/0xBahalaNa/cge-p-capstone
    description: "Graded CGE-P capstone, CMMC Level 2 mapped to NIST 800-171 Rev 3. Wraps an inherited application in four governance layers without changing it: a Terraform baseline, an OPA suite that blocks regressions at the pull request, a pipeline that signs and vaults evidence on merge, and an OSCAL component definition an assessor can follow from control claim to signed artifact."
---

## About Me

I'm a GRC Engineer focused on compliance automation for public safety technology. My background spans Identity Governance and Administration (IGA) in financial services — privileged access monitoring, user access reviews, RBAC analysis, and security grids — and compliance-focused technical support at public safety technology companies operating in CJIS and FedRAMP High environments serving federal, state, and local agencies.

That combination shaped how I think about compliance: not as a checkbox exercise, but as something that should be engineered into systems. Working in a FedRAMP High environment every day while supporting customers who handle criminal justice information gave me a front-row seat to the operational reality of frameworks like CJIS, FedRAMP, and NIST 800-53, how controls actually work in production, not just on paper.

I build AWS and Python compliance automation at the intersection of CJIS and FedRAMP, now centered on GRC Engineering × Data Engineering × Identity Governance — treating audit evidence as a data product, with dbt and DuckDB pipelines over collector output. Shipped work includes OSCAL tooling for FedRAMP 20x, Terraform modules for Infrastructure-as-Code, and commercial framework coverage across SOC 2 and ISO 27001; federal depth stays the differentiator. Next focus is OPA/Rego for policy-as-code.

## Experience Highlights

I build AWS compliance automation tools that map to CJIS v6.1, FedRAMP High, and NIST 800-53 controls, covering evidence collection, event-driven monitoring, auto-remediation, policy-as-code scanning, and preventive guardrails via CloudFormation and SCPs. I also build SQL pipelines over audit evidence — completeness and reconciliation tests as the control layer — with a UAR/IGA framing grounded in privileged access and access-review work. I identified and fixed six bugs in published GRC Engineering source code during implementation. My IGA background (privileged access monitoring, RBAC analysis, user access reviews) gives me practical grounding in the AC, IA, and AU control families I build tooling against.

https://github.com/0xBahalaNa

## Get in Touch

Feel free to reach out if you want to discuss cloud security, GRC Engineering, public safety technology, or Python!

https://linkedin.com/in/luigi-carpio
