import { prisma } from '../config/db.js';

export class CardService {
  static async resolveEntities({ department, classId, subject, teacherId }) {
    let dept = await prisma.department.findFirst({
      where: {
        OR: [
          { id: department },
          { code: department },
          { name: { contains: department, mode: 'insensitive' } },
        ],
      },
    });

    if (!dept) {
      dept = await prisma.department.findFirst({ where: { code: 'CSE' } });
      if (!dept) {
        dept = await prisma.department.create({
          data: { code: department || 'GEN', name: department || 'General' },
        });
      }
    }

    let cls = await prisma.class.findFirst({
      where: {
        AND: [
          { departmentId: dept.id },
          {
            OR: [
              { id: classId },
              { name: classId },
              { name: { contains: classId, mode: 'insensitive' } },
            ],
          },
        ],
      },
    });

    if (!cls) {
      cls = await prisma.class.findFirst({
        where: {
          OR: [
            { id: classId },
            { name: classId },
          ],
        },
      });
    }

    if (!cls) {
      cls = await prisma.class.create({
        data: {
          departmentId: dept.id,
          name: classId,
          year: 2,
          division: 'A',
          semester: 3,
          strength: 60,
        },
      });
    }

    let subjectCode = subject;
    let subjectName = subject;
    if (subject.includes(' - ')) {
      const parts = subject.split(' - ');
      subjectCode = parts[0].trim();
      subjectName = parts.slice(1).join(' - ').trim();
    }

    let subj = await prisma.subject.findFirst({
      where: {
        OR: [
          { id: subject },
          { code: subjectCode },
          { code: subject },
          { name: subjectName },
        ],
      },
    });

    if (!subj) {
      subj = await prisma.subject.create({
        data: {
          departmentId: dept.id,
          code: subjectCode,
          name: subjectName,
          semester: cls ? cls.semester : 3,
        },
      });
    }

    return { dept, cls, subj };
  }

  static async getCardsByTeacher(teacherId) {
    const cards = await prisma.classCard.findMany({
      where: { teacherId },
      include: {
        department: true,
        class: {
          include: {
            students: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return cards.map((card) => {
      const studentCount = card.class.students?.length || card.class.strength || 60;
      return {
        id: card.id,
        teacherId: card.teacherId,
        department: card.department.code,
        departmentId: card.department.id,
        departmentName: card.department.name,
        classId: card.class.name,
        classDbId: card.class.id,
        className: card.class.name,
        subject: `${card.subject.code} - ${card.subject.name}`,
        subjectCode: card.subject.code,
        subjectName: card.subject.name,
        subjectId: card.subject.id,
        subjectType: card.subject.type,
        strength: studentCount,
        studentCount: studentCount,
        createdAt: card.createdAt,
      };
    });
  }

  static async createCard(teacherId, payload) {
    const { department, classId, subject } = payload;
    const { dept, cls, subj } = await this.resolveEntities({ department, classId, subject, teacherId });

    const existing = await prisma.classCard.findFirst({
      where: {
        teacherId,
        departmentId: dept.id,
        classId: cls.id,
        subjectId: subj.id,
      },
    });

    if (existing) {
      const err = new Error('A card for this department, class, and subject already exists.');
      err.statusCode = 409;
      err.code = 'CARD_EXISTS';
      throw err;
    }

    const card = await prisma.classCard.create({
      data: {
        teacherId,
        departmentId: dept.id,
        classId: cls.id,
        subjectId: subj.id,
      },
      include: {
        department: true,
        class: true,
        subject: true,
      },
    });

    return {
      id: card.id,
      teacherId: card.teacherId,
      department: card.department.code,
      departmentId: card.department.id,
      classId: card.class.name,
      classDbId: card.class.id,
      className: card.class.name,
      subject: `${card.subject.code} - ${card.subject.name}`,
      subjectCode: card.subject.code,
      subjectName: card.subject.name,
      subjectId: card.subject.id,
      strength: card.class.strength,
      studentCount: card.class.strength,
      createdAt: card.createdAt,
    };
  }

  static async updateCard(teacherId, cardId, payload) {
    const card = await prisma.classCard.findUnique({
      where: { id: cardId },
    });

    if (!card || card.teacherId !== teacherId) {
      const err = new Error('Card not found');
      err.statusCode = 404;
      err.code = 'CARD_NOT_FOUND';
      throw err;
    }

    const department = payload.department || card.departmentId;
    const classId = payload.classId || card.classId;
    const subject = payload.subject || card.subjectId;

    const { dept, cls, subj } = await this.resolveEntities({ department, classId, subject, teacherId });

    const updated = await prisma.classCard.update({
      where: { id: cardId },
      data: {
        departmentId: dept.id,
        classId: cls.id,
        subjectId: subj.id,
      },
      include: {
        department: true,
        class: true,
        subject: true,
      },
    });

    return {
      id: updated.id,
      teacherId: updated.teacherId,
      department: updated.department.code,
      classId: updated.class.name,
      subject: `${updated.subject.code} - ${updated.subject.name}`,
      subjectCode: updated.subject.code,
      subjectName: updated.subject.name,
      strength: updated.class.strength,
      studentCount: updated.class.strength,
    };
  }

  static async deleteCard(teacherId, cardId) {
    const card = await prisma.classCard.findUnique({
      where: { id: cardId },
    });

    if (!card || card.teacherId !== teacherId) {
      const err = new Error('Card not found');
      err.statusCode = 404;
      err.code = 'CARD_NOT_FOUND';
      throw err;
    }

    await prisma.classCard.delete({
      where: { id: cardId },
    });

    return true;
  }

  static async checkCardDuplicate(teacherId, department, classId, subjectCode) {
    const dept = await prisma.department.findFirst({
      where: { OR: [{ id: department }, { code: department }] },
    });
    if (!dept) return false;

    const cls = await prisma.class.findFirst({
      where: { AND: [{ departmentId: dept.id }, { OR: [{ id: classId }, { name: classId }] }] },
    });
    if (!cls) return false;

    const subj = await prisma.subject.findFirst({
      where: { OR: [{ id: subjectCode }, { code: subjectCode }] },
    });
    if (!subj) return false;

    const existing = await prisma.classCard.findFirst({
      where: {
        teacherId,
        departmentId: dept.id,
        classId: cls.id,
        subjectId: subj.id,
      },
    });

    return Boolean(existing);
  }
}
