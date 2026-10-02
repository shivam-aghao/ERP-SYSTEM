import { prisma } from '../config/db.js';

export const Teacher = prisma.teacher;
export const Department = prisma.department;
export const ClassModel = prisma.class;
export const Subject = prisma.subject;
export const TeacherClassCard = prisma.teacherClassCard;
export const Student = prisma.student;
export const AttendanceSession = prisma.attendanceSession;
export const AttendanceRecord = prisma.attendanceRecord;
export const Notification = prisma.notification;

export default {
  Teacher,
  Department,
  Class: ClassModel,
  Subject,
  TeacherClassCard,
  Student,
  AttendanceSession,
  AttendanceRecord,
  Notification
};
