export const serializeClassCard = (card) => {
  if (!card) return null;
  return {
    id: card.id,
    teacher_id: card.teacherId,
    department: card.departmentCode,
    department_name: card.department?.name || card.departmentCode,
    class: card.classCode,
    class_name: card.class?.name || card.classCode,
    subject_code: card.subjectCode,
    subject_name: card.subject?.name || card.subjectCode,
    subject_type: card.subject?.type || 'Theory',
    created_at: card.createdAt
  };
};
