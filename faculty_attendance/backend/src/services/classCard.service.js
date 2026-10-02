import { prisma } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { serializeClassCard } from '../serializers/classCard.serializer.js';

export class ClassCardService {
  static async getTeacherCards(teacherId) {
    const cards = await prisma.teacherClassCard.findMany({
      where: { teacherId },
      include: {
        department: true,
        class: true,
        subject: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return cards.map(serializeClassCard);
  }

  static async createCard(teacherId, { department, departmentCode, classId, classCode, subjectCode }) {
    const dept = departmentCode || department;
    const cls = classCode || classId;

    const departmentExists = await prisma.department.findUnique({ where: { code: dept } });
    if (!departmentExists) throw new ApiError(404, `Department ${dept} not found`);

    const classExists = await prisma.class.findUnique({
      where: { departmentCode_code: { departmentCode: dept, code: cls } }
    });
    if (!classExists) throw new ApiError(404, `Class ${cls} in ${dept} not found`);

    const subjectExists = await prisma.subject.findUnique({
      where: { departmentCode_code: { departmentCode: dept, code: subjectCode } }
    });
    if (!subjectExists) throw new ApiError(404, `Subject ${subjectCode} in ${dept} not found`);

    const existing = await prisma.teacherClassCard.findUnique({
      where: {
        teacherId_departmentCode_classCode_subjectCode: {
          teacherId,
          departmentCode: dept,
          classCode: cls,
          subjectCode
        }
      }
    });

    if (existing) {
      throw new ApiError(409, 'Duplicate card: You already have this class card configured');
    }

    const newCard = await prisma.teacherClassCard.create({
      data: {
        teacherId,
        departmentCode: dept,
        classCode: cls,
        subjectCode
      },
      include: {
        department: true,
        class: true,
        subject: true
      }
    });

    return serializeClassCard(newCard);
  }

  static async deleteCard(cardId, teacherId) {
    const card = await prisma.teacherClassCard.findUnique({
      where: { id: cardId }
    });

    if (!card) throw new ApiError(404, 'Class card not found');
    if (card.teacherId !== teacherId) throw new ApiError(403, 'Forbidden: Not your class card');

    await prisma.teacherClassCard.delete({
      where: { id: cardId }
    });

    return { message: 'Class card removed successfully' };
  }
}
