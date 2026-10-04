# PRIVACY NOTICE

**Decision Echo · Data protection under the GDPR**

**Last updated: October 4, 2026**

## 1. CONTROLLER

The controller responsible for Decision Echo is:

**Silestis Labs UG (haftungsbeschränkt)**

Dachauer Straße 264

80992 Munich, Germany

**Email:** [hello@silestis.com](mailto:hello@silestis.com)

For questions about personal data or to exercise your rights, contact us at this address.

## 2. HOW DECISION ECHO PROCESSES YOUR DATA

Decision Echo captures an expert's workflow and explanations, creates an expert-reviewed Work Map and coaches a learner through a new case. We process the screen content and voice you share, transcripts, visual events, decisions, reasons, guardrails, evidence references and learner responses needed for these functions.

You choose the screen, window or tab to share and grant microphone access. Before starting, we inform you that external AI services process shared content and ask you to acknowledge that you are authorized to share it. This acknowledgement does not replace any approval required by your organization or constitute consent on behalf of other people whose data appears on screen. Without screen or microphone access, the corresponding capture and voice functions are unavailable.

We process information necessary to provide the service you request on the basis of Article 6(1)(b) GDPR. Where processing relies on a separate consent, Article 6(1)(a) GDPR applies and that consent may be withdrawn for the future. Only share information you are authorized to use. For confidential company information or personal data, check your organization's policy and obtain any required internal approval before starting. Use fictional task data for the hackathon demo; real voices, account identifiers and technical logs may still be personal data.

**Off record:** You can stop screen and voice sharing at any time. Off record stops new screen and microphone capture and automatic screen observation, rejects queued or stale captures and requires an explicit action to resume. It does not delete information already processed or prevent processing you explicitly request afterwards, such as compiling a Work Map, checking a plan or saving it. It cannot recall information already received by an external provider.

**Limited text redaction; no screenshot masking:** Decision Echo applies custom pattern-based redaction to selected text fields, including submitted questions and answers, to replace detected email addresses, telephone numbers, IBANs and payment-card numbers. Detection is limited and can miss personal data. Other text and conversation context may remain unredacted. The current build does not use Presidio, perform OCR-based personal-data detection or mask screenshot pixels. Shared screenshots can therefore contain readable personal or confidential information when uploaded to Cloudflare and sent to the configured screen-understanding provider. Do not share information you are not authorized to disclose.

**Review and deletion:** You can review captured screen evidence. The current build supports deleting an entire session through “Permanently delete current session” when capture is stopped and the app permits deletion. This removes the session's managed evidence, screenshot assets, answers and Work Map from the application's active session storage. Deleting individual screenshots is not currently available. “Forget this tab's sessions” only removes browser-held access and does not delete server data. Contact us if you cannot access a session or need help with deletion.

Deletion cannot undo disclosure that has already occurred, erase downloaded exports or automatically delete separate provider records, logs or backups. Information already received by external providers is subject to their applicable service arrangements and retention rules.

**Session retention:** The current build does not automatically delete sessions after 30 days or distinguish saved and unsaved data for expiry. Session data, including screenshots and submitted answers, remains in application storage until the session is deleted through the app or removed by the operator. Ending capture, closing a tab or losing its access token does not delete server data. No maximum automatic retention period is currently implemented. Contact us to request deletion or information about the handling of your session. Provider logs, backups and exported copies have separate retention arrangements.

## 3. SERVER LOGS AND HOSTING

We use Cloudflare to host and deliver Decision Echo and protect the service. In handling web requests, technical data may include your IP address, request time, requested resource, browser and device information, and error or security details.

We process this information to deliver the website, diagnose faults and protect against misuse. The legal basis is Article 6(1)(f) GDPR, reflecting our legitimate interest in a reliable and secure service. Technical logs are retained for as long as needed for these purposes; security-incident information may be kept until the incident has been resolved and any relevant claims or legal obligations have been addressed. The session retention rule does not define the lifetime of Cloudflare's separate service logs.

Provider information: [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/).

## 4. CONTACT AND DEMO RECORDINGS

If you contact us, we process your contact details and message to respond. The legal basis is Article 6(1)(b) GDPR for contractual enquiries and Article 6(1)(f) GDPR for other requests, based on our legitimate interest in answering them. We retain correspondence until the enquiry and relevant follow-up are complete, or longer where required by legal obligations or the handling of claims.

A tutoring session is not automatically a public demonstration. Sharing an identifiable demonstration with hackathon judges or publishing it is a separate purpose and requires the appropriate information and authorization. Deleting a Decision Echo session does not automatically remove copies exported by a participant or submitted to an event organizer. Their further use and retention depend on the respective recipient and purpose.

## 5. COOKIES AND LOCAL STORAGE

Decision Echo does not set application cookies or use localStorage or IndexedDB in the web app. It uses sessionStorage for session identifiers, access tokens and a tab-local catalog that restores access to sessions and skills after a reload. Clearing that storage removes browser access, not the underlying server session. Removing or blocking necessary storage can prevent recovery and other functions. External services and hosting infrastructure may have their own storage practices.

Optional analytics or marketing technologies require separate information and, where legally required, your consent before activation. The Before you share acknowledgement is not a cookie or marketing consent. External services you open separately have their own cookie and privacy information.

## 6. AI, VOICE AND CONNECTED SERVICES

### ELEVENLABS

We use ElevenLabs for the voice interviewer and tutor, speech recognition and voice output. ElevenLabs receives your microphone audio and the conversation context needed for these functions, which can include transcripts, questions, expert explanations and relevant Work Map content.

**Limits of text redaction:** Original microphone audio is sent to ElevenLabs without personal-data masking. Redaction applied to selected submitted text fields does not undo earlier audio or transcript processing by the voice-agent service, and not all conversation context is redacted. Do not speak information you are not authorized to share. Stop sharing or use Off record before discussing sensitive information.

Provider information: [ElevenLabs Privacy Policy](https://elevenlabs.io/privacy-policy).

### OPENAI

We use OpenAI to compile Work Maps and provide visual coaching for learner practice. It receives relevant expert answers, rules, evidence references, Work Map context, planning information and learner responses. Visual coaching can also send shared screenshots to OpenAI. Where selected as the observation provider, OpenAI also interprets expert-session screenshots. Images are not masked; text redaction is limited to the selected fields described above. Requests set the API's response-storage option to false; this does not guarantee zero provider retention or remove separate provider logs.

Provider information: [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy/).

### GOOGLE CLOUD / VERTEX AI

The hosted demo currently uses Gemini through Google Cloud Vertex AI for expert-session screen observation. Google receives shared screenshots and an instruction to interpret visible work and suggest a screen-specific question. Task information visible in those screenshots is part of that transfer. Screenshots are not masked and may contain personal or confidential information. This processing is separate from OpenAI Work Map compilation and learner visual coaching.

Provider information: [Google Cloud Privacy Notice (service data)](https://cloud.google.com/terms/cloud-privacy-notice) and [Google Cloud Data Processing Addendum (customer data)](https://cloud.google.com/terms/data-processing-addendum). The applicable account agreements and configuration determine the handling of customer content; the service-data notice alone does not describe all processing of uploaded screenshots.

### NOTION

The hosted hackathon demo uses a self-contained Notion-style planner with fictional data. Its edits remain a local draft until an explicitly approved sandbox save; it does not write to a Notion workspace.

If a separately configured live Notion integration is used, the information you enter there is processed under your Notion workspace's arrangements. A connected Decision Echo workflow uses the authorized task and planning information, such as task names, assignees, time windows, deadlines and confirmation status, to support planning and review. Only connect or share workspace information you are authorized to use.

Notion automatically saves edits, including drafts. Decision Echo's Save plan control checks and confirms a binding plan; it does not prevent Notion's earlier draft autosave. Deleting data from Decision Echo does not automatically delete the original entry in Notion or revoke access granted through your Notion workspace.

### PROVIDER RETENTION AND INTERNATIONAL PROCESSING

Cloudflare, Google Cloud, OpenAI and ElevenLabs operate international services. Processing may take place outside the European Economic Area, including in the United States. Provider retention is separate from deletion in Decision Echo and depends on the service and account configuration. We do not promise zero provider retention or that all information is processed exclusively within the EEA.

Transfers requiring safeguards must use an applicable adequacy decision or appropriate safeguards under the GDPR, such as Standard Contractual Clauses. Contact [hello@silestis.com](mailto:hello@silestis.com) for information about the safeguards applicable to your processing and how to obtain a copy where available. The linked provider policies explain their general processing; they do not replace this notice about Decision Echo.

## 7. YOUR RIGHTS

Subject to the applicable conditions, you have the following rights:

- Access to your personal data — Article 15 GDPR.
- Rectification — Article 16 GDPR.
- Erasure — Article 17 GDPR.
- Restriction of processing — Article 18 GDPR.
- Data portability — Article 20 GDPR.
- Objection to processing — Article 21 GDPR, where applicable.
- Withdrawal of consent — Article 7(3) GDPR, where processing relies on consent.

Withdrawal applies to future processing and does not affect processing lawfully carried out before withdrawal. To exercise your rights, contact [hello@silestis.com](mailto:hello@silestis.com).

### RIGHT TO COMPLAIN

You may complain to a data protection supervisory authority, particularly where you live or work or where you consider an infringement has occurred. For our Munich-based company, the relevant authority is the [Bavarian State Office for Data Protection Supervision (BayLDA)](https://www.lda.bayern.de/de/index.html).

### AUTOMATED ASSISTANCE

Decision Echo provides AI-generated explanations and coaching. Experts review and confirm Work Maps, and learners remain responsible for reviewing their plans. AI output can be incomplete or incorrect. The hackathon demonstration uses fictional cases and is not intended for decisions with legal or similarly significant effects on real people.

## 8. TRANSPORT SECURITY

Decision Echo uses HTTPS/TLS to protect data in transit. Encrypted transport does not mean processing is local or that stored information is automatically anonymous. Use only the official application endpoints and do not include credentials or secrets in shared content.

## 9. CHANGES TO THIS NOTICE

We update this notice when the service or its processing changes. The date above identifies this version. Material changes are communicated through the service where appropriate.

Questions about data protection: [hello@silestis.com](mailto:hello@silestis.com).
