-- Normalized HR schema
CREATE TABLE IF NOT EXISTS upload_jobs (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  uploader TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  period_start TEXT,
  period_end TEXT,
  metadata TEXT,
  row_count INTEGER,
  processed_rows INTEGER,
  failed_rows INTEGER,
  error_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS upload_errors (
  id TEXT PRIMARY KEY,
  upload_id TEXT REFERENCES upload_jobs(id) ON DELETE CASCADE,
  sheet TEXT,
  row INTEGER,
  column TEXT,
  message TEXT,
  sample TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  department_code TEXT UNIQUE,
  name TEXT NOT NULL,
  head_id TEXT,
  parent_department_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_number TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  department_id TEXT REFERENCES departments(id),
  department_code TEXT,
  job_title TEXT,
  grade TEXT,
  manager_employee_number TEXT,
  hire_date DATE,
  exit_date DATE,
  status TEXT,
  gender TEXT,
  birthdate DATE,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS leave_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  employee_number TEXT,
  leave_type TEXT,
  start_date DATE,
  end_date DATE,
  working_days REAL,
  status TEXT,
  reason TEXT,
  source_reference TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id),
  UNIQUE(employee_number, start_date, end_date)
);
CREATE INDEX IF NOT EXISTS idx_leave_employee_period ON leave_records(employee_number,start_date,end_date);

CREATE TABLE IF NOT EXISTS training_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  employee_number TEXT,
  course_name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT,
  cost REAL,
  provider TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS sickbay_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  employee_number TEXT,
  date DATE,
  hours_off REAL,
  reason TEXT,
  approved_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS onboarding_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  employee_number TEXT,
  onboard_date DATE,
  activity TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS exit_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES employees(id),
  employee_number TEXT,
  exit_date DATE,
  reason TEXT,
  notice_period INTEGER,
  last_working_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS vacancies (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES departments(id),
  department_code TEXT,
  vacancy_code TEXT,
  cadre TEXT,
  status TEXT,
  posted_date DATE,
  filled_date DATE,
  cost_per_hire REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS statutory_compliance (
  id TEXT PRIMARY KEY,
  item TEXT,
  due_date DATE,
  status TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);

CREATE TABLE IF NOT EXISTS engagement_metrics (
  id TEXT PRIMARY KEY,
  period TEXT,
  metric_name TEXT,
  value REAL,
  department_id TEXT REFERENCES departments(id),
  department_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id),
  UNIQUE(period, metric_name, department_code)
);
CREATE INDEX IF NOT EXISTS idx_engagement_period_metric ON engagement_metrics(period,metric_name);

CREATE TABLE IF NOT EXISTS cost_per_hire (
  id TEXT PRIMARY KEY,
  department_id TEXT REFERENCES departments(id),
  department_code TEXT,
  employee_id TEXT REFERENCES employees(id),
  employee_number TEXT,
  hire_date DATE,
  recruitment_cost REAL,
  onboard_cost REAL,
  total_cost REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_file TEXT,
  upload_id TEXT REFERENCES upload_jobs(id)
);
