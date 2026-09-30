export const serializeTeacher = (teacher) => {
  if (!teacher) return null;
  return {
    id: teacher.id,
    employeeCode: teacher.employeeCode,
    name: teacher.name,
    email: teacher.email,
    designation: teacher.designation,
    department: teacher.departmentCode,
    departmentName: teacher.department?.name || teacher.departmentCode,
    avatar: teacher.avatar || teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    unreadNotifications: teacher.unreadNotifications || 0,
    isActive: teacher.isActive
  };
};
