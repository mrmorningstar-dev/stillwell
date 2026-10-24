# Stillwell care website

The India-focused expansion adds 50 public routes: therapy service pages, psychiatry, medication information, condition guides, resources, help, a provider directory, and test consultation/professional/referral forms. Route count is defined in `dist/care-site.js`.

## Administrator workflow

Sign in at `/admin` with an existing authorized account. The blog editor remains available. Use **Providers** to create a profile, record credentials and registration, verify the clinician, and publish. Unchecking Publish hides the profile immediately from public database reads and server-rendered pages. No sample clinicians are published.

Use **Enquiries** to review the latest 500 test submissions and update their status to new, reviewing, contacted, or closed. These statuses do not trigger messages. Refresh retrieves submissions received since the page loaded. All forms explicitly state testing mode and request test contact details, not health records.

## Data access

`supabase/care-platform.sql` was applied to project `ldwpuzcvjpuclcukboyq`. It adds providers and care_requests with row-level security. Anonymous visitors can read only active, verified providers. Public insert access to enquiries is restricted to the intended submission columns; public users cannot read enquiries or select their own status or test flag. Only site_admins can manage providers and read or update enquiries. No service-role key is used.

## Boundaries before live clinical use

- All enquiries remain test submissions. No appointment scheduling, payment, patient chat, video session, or prescription delivery is implemented.
- The assessment page links to external screening tools and offers a private, unscored reflection. It does not implement or validate a diagnostic assessment.
- Supply actual clinicians, confirmed fees, contact channels, service operating details, approved clinical content, and final business/privacy terms before clinical launch.
- Add delivery, server-side abuse prevention, retention/deletion processes, and an appropriate clinical consent/records workflow before collecting real care enquiries. The current honeypot is a usability deterrent, not robust rate limiting.
- Google sign-in remains deferred. Email/password is available. Supabase advises enabling leaked-password protection in Auth settings.
- Medicare, TRICARE and NYC Teenspace are clearly labelled separate US programs; no coverage or affiliation is claimed in India.

## Validation

Run `npm run build`, `node --test tests/cms.test.mjs tests/care.test.mjs`, and `node --test tests/care-access.test.mjs`. Live access tests need network access; they use only the public publishable key and do not create users or read private enquiries.

Content sources are linked on condition and medicine pages (NIMH, NHS, and MedlinePlus). Text is general educational material; clinical review by the service remains a launch prerequisite.

## Deployment verification

The live deployment passed 12 automated tests and 60 URL/asset checks. Browser verification covered desktop/mobile navigation, topic search, the guardian check, consultation and professional form submission, administrator enquiry status updates with reload persistence, private provider creation/editing with reload persistence, and the private reflection flow. The private test provider returned HTTP 404 to visitors and was removed after testing. Two closed test enquiries remain for review.
