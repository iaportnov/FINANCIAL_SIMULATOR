import { Navigate, Route, Routes } from "react-router-dom";

import { CoursesPage } from "../features/courses/CoursesPage";
import { LessonPage } from "../features/courses/LessonPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { MapPage } from "../features/progression/MapPage";
import { QuizPage } from "../features/quizzes/QuizPage";
import { TrainerPage } from "../features/trainer/TrainerPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/lessons/:lessonId" element={<LessonPage />} />
      <Route path="/quizzes/:quizId" element={<QuizPage />} />
      <Route path="/trainer/:taskId" element={<TrainerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
