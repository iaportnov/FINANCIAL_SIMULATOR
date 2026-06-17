import { apiFetch } from "../../shared/api/client";

export interface CoursePublic {
  id: number;
  slug: string;
  title: string;
  description: string;
  order_index: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface LessonPublic {
  id: number;
  slug: string;
  title: string;
  content_md: string;
}

export const fetchCourses = () => apiFetch<Page<CoursePublic>>("/courses");

export const fetchLesson = (lessonId: number) => apiFetch<LessonPublic>(`/lessons/${lessonId}`);
