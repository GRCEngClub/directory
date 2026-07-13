---
name: "David O’Neal"
github: "doneal78"
specializations:
  - "Cloud Security"
  - "Identity & Access Management"
  - "Security Operations"
  - "Vulnerability Management"
  - "Security Automation"
title: "Cybersecurity | GRC Engineer | Security Automation"
location: "Cabot, AR"
linkedin: "https://www.linkedin.com/in/david-oneal/"
blog: "https://gitlab.com/doneal78-group/grc-engineering-portfolio"
frameworks:
  - "ISO 27001"
  - "NIST 800-53"
  - "NIST CSF"
  - "NIST RMF"
  - "SOC 2"
languages:
  - "Bash"
  - "OPA/Rego"
  - "Python"
  - "Terraform"
available_for:
  - "mentoring"
  - "consulting"
  - "open-source"
  - "hiring"
  - "freelance"
  - "collaboration"
projects:
  - name: "Terraform Compliance Baseline"
    url: "https://gitlab.com/doneal78-group/grc-engineering-portfolio"
    description: "Deployed IAM password policy, CloudTrail, and four AWS Config managed rules via Terraform. Took a real AWS account compliance score from 40% AT RISK to 78% NEEDS IMPROVEMENT after remediation."
  - name: "AWS Config Compliance Checker"
    url: "https://gitlab.com/doneal78-group/grc-engineering-portfolio"
    description: "Python/boto3 script that queries live AWS resources and scores S3 and IAM configurations against NIST 800-53 and SOC 2 requirements. Produces a findings report with pass/fail per control."
  - name: "OPA Rego Policy Suite"
    url: "https://gitlab.com/doneal78-group/grc-engineering-portfolio"
    description: "Three Rego policies covering SC-28 (data at rest), AC-3 (least privilege), and CM-6 (configuration management). 6/6 tests passing, verified against real infrastructure. Built as the Week 2 GRC Engineering Club challenge."
  - name: "GRC Automation Toolset"
    url: "https://gitlab.com/doneal78-group/grc-engineering-portfolio"
    description: "Four Python tools: a CLI control mapper that crosswalks NIST 800-53, ISO 27001, and SOC 2; a Flask risk register web app; a compliance evidence collector that pulls artifacts from APIs and file systems; and an AI policy generator using a local LLM through Ollama."
  - name: "OracleRecon Shield"
    url: "https://oracle-recon-insight.lovable.app"
    description: "AI-powered cybersecurity risk assessment tool for small businesses. Runs a 25-question assessment across six security domains and generates a risk grade with prioritized recommendations using the Gemini API."
---

## About Me

I spent three years as a SOC analyst at Bank OZK and about a year doing IT security compliance work at Arkansas DPS before moving into an MSSP as a cybersecurity consultant and later project manager. Across all of it I kept finding myself more interested in building the processes and tools than in running them day to day. The NIST 800-53 compliance work at DPS is where that clicked most clearly. Mapping controls, collecting evidence, documenting gaps, I kept thinking about how much of it was still being done manually when it did not need to be.
So I started building. The GRC Engineering Portfolio on my GitLab is what came out of that: six tools in Python and Terraform, a control mapper CLI, risk register web app, compliance evidence collector, AI policy generator, AWS compliance checker, and a Terraform baseline that moved a real account from 40% to 78% compliance. I am working through AJ Yawn's GRC Engineering for AWS as my primary technical reference and doing the weekly GRC Engineering Club challenges alongside the portfolio work.
The thing I keep coming back to is that compliance work does not have to be as slow and manual as it still is at most organizations. Policy-as-Code, automated evidence collection, compliance-as-code through Terraform, none of these are exotic ideas anymore. They are just not widely implemented yet. That is the gap I want to work in and the reason this community specifically made sense to me.
Currently looking for a GRC Engineer or Security Automation role where the primary output is building tools and automating controls rather than managing advisory relationships. Open to collaboration with anyone else in the community working on similar problems.

## Experience Highlights

- Tuned phishing detection rules across Proofpoint, Microsoft Defender, and Cisco SEG at Bank OZK, cutting false positives by 40% and giving the team cleaner signal on real threats
- Investigated 30+ security incidents per week in a financial-sector SOC, keeping average phishing response times under 20 minutes while maintaining all SLAs
- Implemented NIST 800-53 control assessments and compiled audit documentation for state IT systems at Arkansas Department of Public Safety
- Cut critical vulnerability remediation timelines from several weeks to under 72 hours through workflow redesign and patch automation at Legato Security
- Built a Terraform compliance baseline that moved an AWS account from 40% AT RISK to 78% compliance
- Managed security operations delivery across 10+ enterprise accounts as Project Manager at an MSSP

## Get in Touch

LinkedIn DM is the fastest way to reach me: linkedin.com/in/david-oneal. Email works too: onealdavide@gmail.com
