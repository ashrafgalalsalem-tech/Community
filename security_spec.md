# Security Specification: Healthcare Leadership Community
*Powered by Saudi German Hospital Egypt*

## 1. Data Invariants & Zero-Trust Access Control (ABAC)

1. **Master Source of Truth & Membership Integrity**:
   - Every member has a status: `pending`, `approved`, `rejected`, or `suspended`.
   - New member registration MUST always default to `pending` with role `pending_member`.
   - Self-assignment or escalation to `approved_member` or `administrator` is strictly forbidden and rejected at the rule level.
   - Only verified administrators (`Ashrafgalalsalem@gmail.com` or documents in `/admins/{adminId}`) can transition status to `approved`.

2. **PII Isolation (Split Collection Architecture - Pillar 6)**:
   - Sensitive personal information (`phone`, internal notes) is isolated in `/members/{memberId}/private/info`.
   - Read access to `/members/{memberId}/private/info` is restricted strictly to `request.auth.uid == memberId` or `isAdmin()`.
   - Public/Visitor access to private info is mathematically impossible.

3. **Directory Access & Profile Consent Boundary**:
   - The Members Directory is restricted to authenticated and `approved_member` users.
   - In the directory, members are displayed ONLY if `consentDirectoryDisplay == true`.
   - Private contact details (phone, private notes) are omitted from public directory records.

4. **Attendees Gallery Privacy Dual-Key Invariant**:
   - A member can appear in a round's Attendees Gallery ONLY if:
     1. Admin has verified actual attendance: `attended == true`.
     2. Member has actively granted photo publishing consent: `consentPhotoPublish == true`.
   - Membership approval alone NEVER permits displaying photos in the gallery.

5. **Round Management & State Transitions**:
   - Round creation, editing, status changes (`draft` -> `published` -> `closed` -> `archived`) are strictly restricted to `isAdmin()`.
   - Public visitors and approved members have read-only access to rounds where `status in ['published', 'closed', 'archived']`.
   - First inaugural round is locked to 27 October 2026 unless modified by a confirmed admin.

6. **Registration & RSVPs**:
   - Only `approved_member` can create a registration in `/rounds/{roundId}/registrations/{registrationId}`.
   - `memberId` in the registration MUST strictly match `request.auth.uid`.
   - Duplicate registrations are prevented; members can only cancel their own registration.

7. **Leadership Insights & Discussions Moderation**:
   - Approved topics and approved comments are publicly readable (allowing public dissemination of executive healthcare thought leadership).
   - Only authenticated `approved_member` users can submit topics or comments.
   - Submitted topics default to `pending_review` status; public visitors never see unapproved, rejected, or hidden topics.
   - Topics require admin approval before publication.
   - Like/Dislike reactions: Exactly one reaction document per member per topic `/topics/{topicId}/reactions/{memberId}` with atomic toggle.

8. **Admin Bootstrap Integrity**:
   - Root administrator email is `Ashrafgalalsalem@gmail.com` requiring `request.auth.token.email_verified == true`.
   - Secondary administrators must have an existing document in `/admins/{uid}` created by an existing administrator.

---

## 2. The "Dirty Dozen" Adversarial Payloads

Below are 12 malicious payloads designed to test and break laws of identity, integrity, and authorization:

1. **Payload 1: Self-Escalation to Administrator on Registration**
   ```json
   {
     "id": "attacker_123",
     "fullName": "Malicious User",
     "role": "administrator",
     "status": "approved",
     "professionalEmail": "attacker@fake.com"
   }
   ```
   *Expected Result*: `PERMISSION_DENIED` (New users can only create role: 'pending_member' and status: 'pending').

2. **Payload 2: Shadow Update with Ghost Field Injection**
   ```json
   {
     "fullName": "Dr. Valid Doctor",
     "isSuperAdmin": true,
     "bypassModeration": true
   }
   ```
   *Expected Result*: `PERMISSION_DENIED` (`affectedKeys().hasOnly(...)` rejects ghost fields).

3. **Payload 3: PII Harvest via Blanket Read on Private Info**
   `GET /members/victim_uid/private/info` by authenticated user `attacker_uid`
   *Expected Result*: `PERMISSION_DENIED` (Private info requires `request.auth.uid == victim_uid` or `isAdmin()`).

4. **Payload 4: Gallery Photo Injection Without Confirmed Attendance**
   ```json
   {
     "roundId": "round_inaugural_2026",
     "memberId": "unattended_member",
     "attended": false,
     "consentPhotoPublish": true,
     "memberPhotoUrl": "https://cdn.example.com/photo.jpg"
   }
   ```
   *Expected Result*: Read access from public gallery query rejected because `attended == true` is required.

5. **Payload 5: Gallery Photo Exposure Without Consent**
   ```json
   {
     "roundId": "round_inaugural_2026",
     "memberId": "privacy_conscious_doctor",
     "attended": true,
     "consentPhotoPublish": false,
     "memberPhotoUrl": "https://cdn.example.com/private_dr.jpg"
   }
   ```
   *Expected Result*: Read access to gallery record rejected because `consentPhotoPublish == true` is required.

6. **Payload 6: Unapproved Member Posting Topic Directly as Approved**
   ```json
   {
     "title": "Bypass Clinical Governance",
     "category": "Healthcare Innovation",
     "body": "Unvetted topic...",
     "status": "approved",
     "authorId": "pending_member_uid"
   }
   ```
   *Expected Result*: `PERMISSION_DENIED` (Non-admins can only submit with status: 'pending_review' and must be 'approved_member').

7. **Payload 7: Visitor Attempting to React or Post Comments**
   `POST /topics/topic_1/reactions/reaction_123` with `request.auth == null`
   *Expected Result*: `PERMISSION_DENIED` (Visitors have zero write/react access).

8. **Payload 8: Identity Spoofing in Round Registration**
   ```json
   {
     "roundId": "round_inaugural_2026",
     "memberId": "innocent_cmo_uid",
     "status": "registered"
   }
   ```
   Submitted with auth credentials of `different_user_uid`.
   *Expected Result*: `PERMISSION_DENIED` (`incoming().memberId == request.auth.uid` validation fails).

9. **Payload 9: Unverified Email Spoofing Admin Access**
   Auth token: `email: "Ashrafgalalsalem@gmail.com"`, `email_verified: false`
   *Expected Result*: `PERMISSION_DENIED` (Admin check requires `email_verified == true`).

10. **Payload 10: ID Poisoning Attack with 2KB Path Variable**
    `GET /members/AAAAAAAAAAAAAAAA...[2048 chars].../`
    *Expected Result*: `PERMISSION_DENIED` (`isValidId()` constrains ID string size to <= 128 chars and regex `^[a-zA-Z0-9_\-]+$`).

11. **Payload 11: Terminal State Modification on Completed Attendance**
    Updating verified CME credits or attendance record after event archiving by non-admin.
    *Expected Result*: `PERMISSION_DENIED` (Only `isAdmin()` can update attendance records).

12. **Payload 12: Client Bypassing Moderation on Topic Edit**
    Author attempting to edit topic status from `rejected` or `hidden` back to `approved`.
    *Expected Result*: `PERMISSION_DENIED` (Author can only update title and body while topic is pending, never status).

---

## 3. Test Runner Specification

The test suite validates:
- Visitors: Can read published rounds, approved topics, approved comments. Rejection on directory, private profiles, registrations, reactions.
- Pending Members: Can read own profile, submit consent updates. Rejection on round registration, topic submission, directory browse.
- Approved Members: Can browse directory (only consented members), RSVP to rounds, submit topics for review, comment, like/dislike. Rejection on admin operations (approving other members, editing rounds, verifying attendance).
- Admins: Can perform all CRUD operations, verify attendance, approve/reject members, export attendee rosters.
