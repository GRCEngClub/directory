---
name: "David O’Neal"
github: "doneal78"
specializations:
  - "Vulnerability Management"
  - "Security Operations"
  - "Identity & Access Management"
  - "Security Automation"
  - "Compliance as Code"
title: "IT Risk & GRC | Compliance as Code | Certified GRC Engineer (CGE-AUD)"
location: "Cabot, AR"
linkedin: "https://www.linkedin.com/in/david-oneal/"
blog: "https://davidoneal.dev"
frameworks:
  - "NIST 800-53"
  - "SOC 2"
  - "ISO 27001 (Lead Auditor training)"
languages:
  - "Python"
  - "Terraform"
  - "OPA/Rego"
  - "Bash"
  - "GitHub Actions"
  - "OSCAL"
  - "AWS (Security Hub, Config, CloudTrail, IAM)"
available_for:
  - "mentoring"
  - "consulting"
  - "open-source"
  - "hiring"
  - "freelance"
  - "collaboration"
projects:
  - name: "GRC Engineering Pipeline"
    url: "https://github.com/doneal78/grc-engineering-pipeline"
    description: "A CI/CD pipeline that enforces NIST 800-53 controls (SC-28, AC-3, CM-6, AU-3) on AWS S3. Terraform builds it, Rego policies test it before deployment, GitHub Actions blocks non-compliant pull requests, Cosign signs the evidence, and OSCAL maps every control to its evidence. 6 of 6 tests passing."
  - name: "SOC 2 Evidence Pipeline"
    url: "https://github.com/doneal78/grc-soc2-pipeline"
    description: "Pulls AWS Security Hub and Config results, maps 457 findings across seven SOC 2 criteria, and writes an Excel evidence workbook."
  - name: "Terraform Compliance Baseline"
    url: "https://github.com/doneal78/grc-terraform-baseline"
    description: "Python scanner and Terraform baseline for a personal AWS lab account. Moved the lab from 40% AT RISK to 78% NEEDS IMPROVEMENT after remediation. Companion checker: https://github.com/doneal78/grc-compliance-checker"
  - name: "OSCAL System Security Plan"
    url: "https://github.com/doneal78/grc-oscal-ssp"
    description: "21 NIST 800-53 Rev 5 controls, with the authorization boundary, network architecture, and data flow."
  - name: "GRC Assurance Engine"
    url: "https://github.com/doneal78/grc-assurance-engine"
    description: "Flask app for vendor and AI-tool risk assessments with inherent and residual risk scoring, evidence freshness checks, NIST 800-53 mapping, and a risk register. Live demo: https://grc-assurance.davidoneal.dev"
---

## About Me

I spent nearly three years as a SOC analyst at Bank OZK, about five months handling patching and access management at Arkansas DPS, and then moved to an MSSP as a cybersecurity consultant and later a project manager. Across all of it, I kept finding myself more interested in building the processes and tools than running them day to day.

That clicked most as a consultant. I was writing risk classifications, SOPs, and remediation documentation that clients used for audits, and I kept thinking about how much of that evidence work was still manual when it didn't need to be. So I started building.

My GRC engineering portfolio on GitHub came out of that: a CI/CD pipeline that enforces NIST 800-53 controls with Terraform, OPA/Rego, GitHub Actions, Cosign, and OSCAL; a SOC 2 evidence pipeline that pulls from AWS Security Hub and Config; a Python scanner and Terraform baseline that took my AWS lab account from 40% to 78% compliance; an OSCAL System Security Plan; and a vendor and AI-tool risk assessment app. I also do the weekly GRC Engineering Club challenges and write a LinkedIn newsletter, From Alerts to Evidence, about this work.

Compliance work doesn't have to be as slow and manual as it still is at most organizations. Policy as code, automated evidence collection, and compliance as code through Terraform aren't exotic ideas anymore. They just aren't widely used yet, and that's the gap I want to work in.

I'm looking for GRC Engineer, compliance automation, and GRC analyst roles, full-time or contract. I'm also open to collaborating with anyone here working on similar problems.

## Experience Highlights

Tuned phishing detection rules across Proofpoint, Microsoft Defender, and Cisco SEG at Bank OZK, cutting false positives by 40%

Investigated 30+ phishing, malware, BEC, and DLP incidents a week in a bank SOC, closing phishing cases in under 20 minutes

Reviewed vendor risk for new applications and software employees requested at a bank that followed SOC 2

Cut critical remediation from several weeks to under 72 hours across 279+ client endpoints at Legato Security, through risk-based prioritization and a standardized patching framework

Kept patch compliance above 95% across 500+ endpoints at Arkansas DPS, prioritizing with CISA KEV, vendor advisories, and Patch Tuesday

Managed security service delivery across 10+ enterprise client accounts as a Project Manager at an MSSP

Earned the Certified GRC Engineer, Auditor Specialty (CGE-AUD) through the GRC Engineering Club

## Get in Touch

LinkedIn DM is the fastest way to reach me: linkedin.com/in/david-oneal. Email works too: onealdavide@gmail.com
