import type { Repository } from 'typeorm';
import type { CertificatesService } from '../../certificates/services/certificates.service';
import { Chapter } from '../../entities/chapter.entity';
import { Course } from '../../entities/course.entity';
import { Progress } from '../../entities/progress.entity';
import { Quiz } from '../../entities/quiz.entity';
import { QuizAttempt } from '../../entities/quiz-attempt.entity';
import { QuizAttemptAnswer } from '../../entities/quiz-attempt-answer.entity';
import { QuizOption } from '../../entities/quiz-option.entity';
import { QuizQuestion } from '../../entities/quiz-question.entity';

export type QuizzesServiceDependencies = {
  chapterRepository: Repository<Chapter>;
  courseRepository: Repository<Course>;
  progressRepository: Repository<Progress>;
  quizRepository: Repository<Quiz>;
  quizQuestionRepository: Repository<QuizQuestion>;
  quizOptionRepository: Repository<QuizOption>;
  quizAttemptRepository: Repository<QuizAttempt>;
  quizAttemptAnswerRepository: Repository<QuizAttemptAnswer>;
  certificatesService: CertificatesService;
};
