export const ROLES = {
  FACULTY: 'faculty',
  HOD: 'hod',
  ADMIN: 'admin',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

export const SESSION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  LOCKED: 'locked',
};

export const ASSESSMENT_TYPES = ['IA1', 'IA2', 'MSE', 'ESE', 'PRACTICAL'];

export const DEPARTMENTS = ['CSE', 'IT', 'EE', 'MECH', 'ENTC', 'ASH'];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};
