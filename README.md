# NirmaN (নির্মাণ)

NirmaN is a professional construction management platform designed for land-share projects. It bridges the gap between project admins and shareholders by providing real-time financial tracking, progress updates, and document management.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS + Shadcn/UI
- **Validation**: Zod
- **Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- A Supabase project

### 2. Installation
```bash
git clone https://github.com/itsmeshawon/nirman-app.git
cd nirman-app
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database Setup (Supabase SQL Editor)
Run the following SQL in your Supabase SQL editor to set up the schema, RLS policies, and storage.

#### Enable RLS & Policies
```sql
-- Profiles: Everyone can read their own, Super Admin can read all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- Projects: Members can view their project
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view project" ON projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_admins WHERE project_id = id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM shareholders WHERE project_id = id AND user_id = auth.uid())
);

-- Expenses: Admin can manage, members can view PUBLISHED
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage expenses" ON expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM project_admins WHERE project_id = expenses.project_id AND user_id = auth.uid())
);
CREATE POLICY "Members can view published expenses" ON expenses FOR SELECT USING (
  status = 'PUBLISHED' AND
  (EXISTS (SELECT 1 FROM shareholders WHERE project_id = expenses.project_id AND user_id = auth.uid()))
);

-- Payments: Admin can manage, shareholders can view OWN
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM project_admins WHERE project_id = (SELECT project_id FROM shareholders WHERE id = payments.shareholder_id) AND user_id = auth.uid())
);
CREATE POLICY "Shareholders can view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM shareholders WHERE id = payments.shareholder_id AND user_id = auth.uid())
);

-- Documents: Admin can manage, members can view
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage documents" ON project_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM project_admins WHERE project_id = project_documents.project_id AND user_id = auth.uid())
);
CREATE POLICY "Members can view documents" ON project_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_admins WHERE project_id = project_documents.project_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM shareholders WHERE project_id = project_documents.project_id AND user_id = auth.uid())
);
```

#### Storage Configuration
Create the following buckets in Supabase Storage with "Public" accessibility (controlled via RLS):
- `expense-proofs`
- `activity-media`
- `project-documents`
- `payment-proofs`

Run these Storage Policies:
```sql
-- Project Documents Bucket
CREATE POLICY "Project Admins can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-documents' AND (
    EXISTS (SELECT 1 FROM project_admins WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Project members can read documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'project-documents' AND (
    EXISTS (SELECT 1 FROM project_admins WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM shareholders WHERE user_id = auth.uid())
  )
);
```

### 5. Seed Data
```bash
npx tsx scripts/seed.ts
```

### 6. Run Development Server
```bash
npm run dev
```

## Security Standards
- **Validation**: All API inputs are validated using Zod schemas in `src/lib/validations.ts`.
- **Role-Based Access**: RLS ensures that shareholders cannot access financial data of other users or private project details.
- **Audit Logging**: All critical actions (Creation, Deletion, Status Changes) are tracked in the `audit_logs` table.

## Bangladesh Formatting
NirmaN strictly follows Bangladeshi standards:
- **Currency**: `৳12,50,000` (Lakh/Crore format).
- **Date**: `DD MMM YYYY` (e.g., 15 Jan 2026).
- **Phone**: `+880 XXXX-XXXXXX`.
