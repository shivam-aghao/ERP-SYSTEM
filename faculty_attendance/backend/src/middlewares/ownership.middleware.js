import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';

export const checkCardOwnership = async (req, res, next) => {
  try {
    const cardId = req.params.cardId || req.params.id;
    const teacherId = req.teacher.id;

    const card = await prisma.teacherClassCard.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw new ApiError(404, 'Class card not found');
    }

    if (card.teacherId !== teacherId) {
      throw new ApiError(403, 'Forbidden: You do not own this class card');
    }

    req.card = card;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkSessionOwnership = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.params.id;
    const teacherId = req.teacher.id;

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new ApiError(404, 'Attendance session not found');
    }

    if (session.teacherId !== teacherId) {
      throw new ApiError(403, 'Forbidden: You do not own this attendance session');
    }

    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};
